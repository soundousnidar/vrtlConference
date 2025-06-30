import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models.payment import Payment
from models.registration import Registration
from models.users import User
from database import get_db
from auth import get_current_user
from datetime import datetime

router = APIRouter()

# ⚠️ Remplace par ta vraie clé Stripe test (ne jamais commit une vraie clé en prod !)
stripe.api_key = "sk_test_51Ree1eR3efBz7SaJgD619wSwNszOxETo3n5hiWYvDAboPZMjx6apP0eZtLMozvqiQmctzjMll4JRAh5YOfLn7NaP00SkbikjMn"

@router.post("/payments/create-session")
def create_payment_session(registration_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    registration = db.query(Registration).filter_by(id=registration_id, user_id=current_user.id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Inscription non trouvée")
    if registration.status == "paid":
        raise HTTPException(status_code=400, detail="Déjà payé")

    # Pour l'exemple, récupère le montant depuis la conférence
    conference = registration.conference
    amount = int(conference.fees * 100)  # Stripe attend des centimes

    # Crée la session Stripe
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "mad",
                "product_data": {
                    "name": conference.title,
                },
                "unit_amount": amount,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"http://localhost:8080/conferences/{conference.id}?payment=success",
        cancel_url=f"http://localhost:8080/conferences/{conference.id}?payment=cancelled",
        metadata={
            "registration_id": registration.id,
            "user_id": current_user.id,
            "conference_id": conference.id
        }
    )
    return {"checkout_url": session.url}

@router.post("/payments/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    # Utilise la clé Stripe webhook depuis la variable d'environnement pour la sécurité
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_15e55f75f32590927e5df1273103c544cbc0d74938e04c1618b0137fdd527f36")
    event = None
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
        print(f"✅ Webhook received: {event['type']}")
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        return {"status": "error", "message": str(e)}

    # Gère le paiement réussi
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        registration_id = session['metadata'].get('registration_id')
        user_id = session['metadata'].get('user_id')
        conference_id = session['metadata'].get('conference_id')
        amount = session['amount_total'] / 100
        payment_intent = session.get('payment_intent')

        print(f"💰 Payment completed - Registration ID: {registration_id}, User ID: {user_id}, Amount: {amount}")

        # Met à jour l'inscription
        registration = db.query(Registration).filter_by(id=registration_id).first()
        if registration:
            print(f"📝 Updating registration {registration_id} from '{registration.status}' to 'paid'")
            registration.status = 'paid'
            registration.updated_at = datetime.utcnow()
            db.commit()
            print(f"✅ Registration {registration_id} updated successfully")
        else:
            print(f"❌ Registration {registration_id} not found!")

        # Crée un paiement
        payment = Payment(
            amount=amount,
            payment_method='stripe',
            payment_status='completed',
            paid_at=datetime.utcnow(),
            user_id=user_id,
            conference_id=conference_id
        )
        db.add(payment)
        db.commit()
        print(f"✅ Payment record created for user {user_id}, conference {conference_id}")

    return {"status": "success"} 