from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import date
from database import get_db
from models.abstracts import Abstract, AbstractStatus, PresentationType
from models.users import User, UserRole
from models.conferences import Conference
from models.certificate import Certificate
from models.LiveSession import LiveSession
from models.reviewers import Reviewer
from models.ConferenceParticipant import ConferenceParticipant
from models.registration import Registration

# Import pour récupérer l'utilisateur connecté
from abstracts import get_current_user


router = APIRouter()

@router.get("/{conference_id}")
async def get_stats(
    conference_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        # Vérifie que la conférence appartient bien à l'utilisateur
        conference = db.query(Conference).filter(
            Conference.id == conference_id,
            Conference.organizer_id == current_user.id
        ).first()

        if not conference:
            raise HTTPException(status_code=404, detail="Conférence non trouvée ou non autorisée.")

        # Ensuite, garde le même code pour les statistiques :
        abstracts_count = db.query(Abstract).filter(Abstract.conference_id == conference_id).count()
        reviewers_count = db.query(Reviewer).filter(Reviewer.conference_id == conference_id).count()
        participants_count = db.query(Registration).filter(Registration.conference_id == conference_id, Registration.status == 'paid').count()

        accepted_orals = db.query(Abstract).filter(
            Abstract.status == AbstractStatus.accepted,
            Abstract.conference_id == conference_id,
            Abstract.presentation_type == PresentationType.ORAL
        ).count()
        poster_accepted = db.query(Abstract).filter(
            Abstract.status == AbstractStatus.accepted,
            Abstract.conference_id == conference_id,
            Abstract.presentation_type == PresentationType.E_POSTER
        ).count()
        rejected = db.query(Abstract).filter(
            Abstract.status == AbstractStatus.rejected,
            Abstract.conference_id == conference_id
        ).count()

        cert_participants = db.query(Certificate).filter(
            Certificate.certificate_type == "participation",
            Certificate.conference_id == conference_id
        ).count()
        cert_speakers = db.query(Certificate).filter(
            Certificate.certificate_type == "presentation",
            Certificate.conference_id == conference_id
        ).count()
        cert_reviewers = db.query(Certificate).filter(
            Certificate.certificate_type == "reviewer",
            Certificate.conference_id == conference_id
        ).count()

        sessions_total = db.query(LiveSession).filter(
            LiveSession.conference_id == conference_id
        ).count()
        sessions_today = db.query(LiveSession).filter(
            func.date(LiveSession.session_time) == date.today(),
            LiveSession.conference_id == conference_id
        ).count()

        deadline = conference.deadline.isoformat() if conference.deadline else None

        return {
            "abstracts": abstracts_count,
            "reviewers": reviewers_count,
            "participants": participants_count,
            "oral_accepted": accepted_orals,
            "poster_accepted": poster_accepted,
            "rejected": rejected,
            "invitations": 0,
            "cert_participants": cert_participants,
            "cert_speakers": cert_speakers,
            "cert_reviewers": cert_reviewers,
            "sessions_total": sessions_total,
            "sessions_today": sessions_today,
            "deadline": deadline
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")
