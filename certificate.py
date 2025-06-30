from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import get_db
from models.certificate import Certificate
from models.ConferenceParticipant import ConferenceParticipant
from models.conferences import Conference
from models.users import User
from models.abstracts import Abstract
from models.reviews import Review
from datetime import datetime
from utils.email_sender import generate_certificate_pdf
from auth import get_current_user

router = APIRouter()

@router.get("/certificates/{conference_id}/{cert_type}")
def get_certificate(conference_id: int, cert_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cert_type = cert_type.lower()
    conference = db.query(Conference).filter_by(id=conference_id).first()
    if not conference:
        raise HTTPException(status_code=404, detail="Conférence introuvable")

    presentation_title = None
    reviewer_name = None
    review_count = None

    # Vérification selon le type de certificat
    if cert_type == "participation":
        participant = db.query(ConferenceParticipant).filter_by(user_id=current_user.id, conference_id=conference_id).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Vous n'avez pas participé à cette conférence.")
    elif cert_type == "presentation":
        # Présentateur = a un abstract accepté dans cette conférence
        abstract = db.query(Abstract).filter_by(user_id=current_user.id, conference_id=conference_id, status="accepted").first()
        if not abstract:
            raise HTTPException(status_code=403, detail="Aucune présentation acceptée pour cette conférence.")
        presentation_title = abstract.title
    elif cert_type == "reviewer":
        # Reviewer = a fait au moins une review pour cette conférence
        abstracts = db.query(Abstract).filter_by(conference_id=conference_id).all()
        abstract_ids = [a.id for a in abstracts]
        reviews = db.query(Review).filter(Review.reviewer_id==current_user.id, Review.abstract_id.in_(abstract_ids)).all()
        if not reviews:
            raise HTTPException(status_code=403, detail="Vous n'avez pas évalué de résumé pour cette conférence.")
        reviewer_name = current_user.fullname
        review_count = len(reviews)
    else:
        raise HTTPException(status_code=400, detail="Type de certificat inconnu.")

    # Récupérer les informations de l'organisateur
    organizer_name = None
    if conference.organizer:
        organizer_name = conference.organizer.fullname

    # Générer un code unique pour le certificat
    certificate_id = f"CERT-{conference_id}-{current_user.id}-{cert_type.upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Générer le PDF avec toutes les informations
    pdf_buffer = generate_certificate_pdf(
        user_name=current_user.fullname,
        conference_title=conference.title,
        cert_type=cert_type,
        date=datetime.now().strftime('%d/%m/%Y'),
        reviewer_name=reviewer_name,
        presentation_title=presentation_title,
        conference_deadline=conference.deadline.strftime('%d/%m/%Y') if conference.deadline else None,
        conference_important_date=conference.important_date.strftime('%d/%m/%Y') if conference.important_date else None,
        venue=conference.venue.value if conference.venue else None,
        organizer_name=organizer_name,
        certificate_id=certificate_id,
        review_count=review_count
    )

    # Enregistrer dans la table Certificate
    cert = Certificate(
        certificate_type=cert_type,
        user_id=current_user.id,
        conference_id=conference_id
    )
    db.add(cert)
    db.commit()

    # Retourner le PDF
    return Response(pdf_buffer.read(), media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=certificat_{cert_type}_{conference_id}.pdf"
    }) 