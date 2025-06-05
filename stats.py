from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.abstracts import Abstract
from models.users import User, UserRole
from models.conferences import Conference

router = APIRouter()

@router.get("/")
def get_stats(db: Session = Depends(get_db)):
    abstracts_count = db.query(Abstract).count()
    reviewers_count = db.query(User).filter(User.role == UserRole.reviewer).count()
    invitations_count = 0  # temporaire si pas encore de modèle Invitation

    deadline = db.query(Conference).order_by(desc(Conference.id)).first()

    return {
        "abstracts": abstracts_count,
        "reviewers": reviewers_count,
        "invitations": invitations_count,
        "deadline": deadline.deadline.isoformat() if deadline else None
    }
