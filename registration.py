from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.registration import Registration
from models.conferences import Conference
from models.users import User
from database import get_db
from datetime import datetime
from auth import get_current_user
from models.payment import Payment
from models.reviewers import Reviewer

router = APIRouter()

@router.post("/conferences/{conference_id}/register")
def register_for_conference(conference_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Vérifie que la conférence existe
    conference = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conference:
        raise HTTPException(status_code=404, detail="Conférence introuvable")

    # Vérifie si l'utilisateur est déjà inscrit
    existing = db.query(Registration).filter_by(user_id=current_user.id, conference_id=conference_id).first()
    if existing:
        return {"message": "Déjà inscrit", "registration_id": existing.id, "status": existing.status}

    # Crée l'inscription
    registration = Registration(
        user_id=current_user.id,
        conference_id=conference_id,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return {"message": "Inscription créée", "registration_id": registration.id, "status": registration.status}

@router.get("/conferences/{conference_id}/is-registered")
def is_registered(conference_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Vérifie si l'utilisateur est organisateur
    conference = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conference:
        raise HTTPException(status_code=404, detail="Conférence introuvable")
    if current_user.id == conference.organizer_id:
        return {"registered": True, "status": "organizer"}
    # Vérifie si l'utilisateur est reviewer
    reviewer = db.query(Reviewer).filter_by(user_id=current_user.id, conference_id=conference_id).first()
    if reviewer:
        return {"registered": True, "status": "reviewer"}
    # Vérifie si l'utilisateur est inscrit normalement
    existing = db.query(Registration).filter_by(user_id=current_user.id, conference_id=conference_id).first()
    if existing:
        return {"registered": True, "status": existing.status}
    return {"registered": False}

@router.get("/registrations/me")
def get_my_registrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    regs = db.query(Registration).filter_by(user_id=current_user.id).all()
    result = []
    for reg in regs:
        conf = reg.conference
        payments = db.query(Payment).filter_by(user_id=current_user.id, conference_id=conf.id).all()
        result.append({
            "registration_id": reg.id,
            "conference": {
                "id": conf.id,
                "title": conf.title,
                "fees": conf.fees,
                "deadline": conf.deadline,
            },
            "status": reg.status,
            "created_at": reg.created_at,
            "updated_at": reg.updated_at,
            "payments": [
                {"amount": p.amount, "status": p.payment_status, "paid_at": p.paid_at} for p in payments
            ]
        })
    return result
