from fastapi import APIRouter, Depends, HTTPException, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from models.LiveSession import LiveSession, SessionStatus
from models.conferences import Conference
from models.users import User
from database import get_db
from auth import get_current_user
from datetime import datetime
from typing import List, Optional

router = APIRouter()

# Créer une nouvelle session live
@router.post("/conferences/{conference_id}/live-sessions")
async def create_live_session(
    conference_id: int,
    session_title: str = Form(...),
    session_time: datetime = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Vérifier que l'utilisateur est l'organisateur de la conférence
        conference = db.query(Conference).filter(
            Conference.id == conference_id,
            Conference.organizer_id == current_user.id
        ).first()
        
        if not conference:
            raise HTTPException(
                status_code=403, 
                detail="Vous devez être l'organisateur de cette conférence pour créer une session live"
            )
        
        # Vérifier qu'il n'y a pas déjà une session active pour cette conférence
        active_session = db.query(LiveSession).filter(
            LiveSession.conference_id == conference_id,
            LiveSession.is_active == True
        ).first()
        
        if active_session:
            raise HTTPException(
                status_code=400,
                detail="Il y a déjà une session active pour cette conférence"
            )
        
        # Créer la nouvelle session
        live_session = LiveSession(
            session_title=session_title,
            session_time=session_time,
            conference_id=conference_id,
            organizer_id=current_user.id,
            status=SessionStatus.PENDING,
            is_active=False
        )
        
        db.add(live_session)
        db.commit()
        db.refresh(live_session)
        
        return {
            "id": live_session.id,
            "session_title": live_session.session_title,
            "session_time": live_session.session_time.isoformat(),
            "status": live_session.status,
            "is_active": live_session.is_active,
            "organizer_id": live_session.organizer_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de la session: {str(e)}")

# Lancer une session (seul l'organisateur peut le faire)
@router.post("/conferences/{conference_id}/live-sessions/{session_id}/start")
async def start_live_session(
    conference_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Vérifier que l'utilisateur est l'organisateur de la conférence
        conference = db.query(Conference).filter(
            Conference.id == conference_id,
            Conference.organizer_id == current_user.id
        ).first()
        
        if not conference:
            raise HTTPException(
                status_code=403, 
                detail="Vous devez être l'organisateur de cette conférence pour lancer une session"
            )
        
        # Récupérer la session
        live_session = db.query(LiveSession).filter(
            LiveSession.id == session_id,
            LiveSession.conference_id == conference_id,
            LiveSession.organizer_id == current_user.id
        ).first()
        
        if not live_session:
            raise HTTPException(
                status_code=404,
                detail="Session introuvable ou vous n'êtes pas autorisé à la lancer"
            )
        
        if live_session.status != SessionStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail="Cette session ne peut pas être lancée (déjà active ou terminée)"
            )
        
        # Désactiver toutes les autres sessions actives pour cette conférence
        db.query(LiveSession).filter(
            LiveSession.conference_id == conference_id,
            LiveSession.is_active == True
        ).update({"is_active": False})
        
        # Activer cette session
        live_session.status = SessionStatus.ACTIVE
        live_session.is_active = True
        live_session.started_at = datetime.utcnow()
        
        db.commit()
        db.refresh(live_session)
        
        return {
            "id": live_session.id,
            "session_title": live_session.session_title,
            "status": live_session.status,
            "is_active": live_session.is_active,
            "started_at": live_session.started_at.isoformat() if live_session.started_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors du lancement de la session: {str(e)}")

# Arrêter une session
@router.post("/conferences/{conference_id}/live-sessions/{session_id}/stop")
async def stop_live_session(
    conference_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Vérifier que l'utilisateur est l'organisateur de la conférence
        conference = db.query(Conference).filter(
            Conference.id == conference_id,
            Conference.organizer_id == current_user.id
        ).first()
        
        if not conference:
            raise HTTPException(
                status_code=403, 
                detail="Vous devez être l'organisateur de cette conférence pour arrêter une session"
            )
        
        # Récupérer la session
        live_session = db.query(LiveSession).filter(
            LiveSession.id == session_id,
            LiveSession.conference_id == conference_id,
            LiveSession.organizer_id == current_user.id
        ).first()
        
        if not live_session:
            raise HTTPException(
                status_code=404,
                detail="Session introuvable ou vous n'êtes pas autorisé à l'arrêter"
            )
        
        if live_session.status != SessionStatus.ACTIVE:
            raise HTTPException(
                status_code=400,
                detail="Cette session n'est pas active"
            )
        
        # Arrêter la session
        live_session.status = SessionStatus.ENDED
        live_session.is_active = False
        live_session.ended_at = datetime.utcnow()
        
        db.commit()
        db.refresh(live_session)
        
        return {
            "id": live_session.id,
            "session_title": live_session.session_title,
            "status": live_session.status,
            "is_active": live_session.is_active,
            "ended_at": live_session.ended_at.isoformat() if live_session.ended_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'arrêt de la session: {str(e)}")

# Obtenir la session active d'une conférence
@router.get("/conferences/{conference_id}/live-sessions/active")
async def get_active_session(
    conference_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Vérifier que la conférence existe
        conference = db.query(Conference).filter(Conference.id == conference_id).first()
        if not conference:
            raise HTTPException(status_code=404, detail="Conférence introuvable")
        
        # Récupérer la session active
        active_session = db.query(LiveSession).filter(
            LiveSession.conference_id == conference_id,
            LiveSession.is_active == True,
            LiveSession.status == SessionStatus.ACTIVE
        ).first()
        
        if not active_session:
            return {"active_session": None, "message": "Aucune session active pour cette conférence"}
        
        return {
            "active_session": {
                "id": active_session.id,
                "session_title": active_session.session_title,
                "session_time": active_session.session_time.isoformat(),
                "status": active_session.status,
                "is_active": active_session.is_active,
                "started_at": active_session.started_at.isoformat() if active_session.started_at else None,
                "organizer_id": active_session.organizer_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de la session: {str(e)}")

# Obtenir toutes les sessions d'une conférence (pour l'organisateur)
@router.get("/conferences/{conference_id}/live-sessions")
async def get_conference_sessions(
    conference_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Vérifier que l'utilisateur est l'organisateur de la conférence
        conference = db.query(Conference).filter(
            Conference.id == conference_id,
            Conference.organizer_id == current_user.id
        ).first()
        
        if not conference:
            raise HTTPException(
                status_code=403, 
                detail="Vous devez être l'organisateur de cette conférence pour voir les sessions"
            )
        
        # Récupérer toutes les sessions
        sessions = db.query(LiveSession).filter(
            LiveSession.conference_id == conference_id
        ).order_by(LiveSession.session_time.desc()).all()
        
        return {
            "sessions": [
                {
                    "id": session.id,
                    "session_title": session.session_title,
                    "session_time": session.session_time.isoformat(),
                    "status": session.status,
                    "is_active": session.is_active,
                    "started_at": session.started_at.isoformat() if session.started_at else None,
                    "ended_at": session.ended_at.isoformat() if session.ended_at else None,
                    "organizer_id": session.organizer_id
                }
                for session in sessions
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des sessions: {str(e)}")

# Vérifier si l'utilisateur peut rejoindre la session (session active et utilisateur inscrit)
@router.get("/conferences/{conference_id}/live-sessions/can-join")
async def can_join_session(
    conference_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Vérifier que la conférence existe
        conference = db.query(Conference).filter(Conference.id == conference_id).first()
        if not conference:
            raise HTTPException(status_code=404, detail="Conférence introuvable")
        
        # Vérifier s'il y a une session active
        active_session = db.query(LiveSession).filter(
            LiveSession.conference_id == conference_id,
            LiveSession.is_active == True,
            LiveSession.status == SessionStatus.ACTIVE
        ).first()
        
        if not active_session:
            return {
                "can_join": False,
                "reason": "Aucune session active pour cette conférence. L'organisateur doit lancer la session en premier."
            }
        
        # TODO: Vérifier si l'utilisateur est inscrit à la conférence
        # Pour l'instant, on autorise tous les utilisateurs connectés
        
        return {
            "can_join": True,
            "session": {
                "id": active_session.id,
                "session_title": active_session.session_title,
                "started_at": active_session.started_at.isoformat() if active_session.started_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la vérification: {str(e)}")

@router.get("/conferences/{conference_id}/live-sessions/public")
async def get_public_sessions(conference_id: int, db: Session = Depends(get_db)):
    sessions = db.query(LiveSession).filter(
        LiveSession.conference_id == conference_id
    ).order_by(LiveSession.session_time.asc()).all()
    return {
        "sessions": [
            {
                "id": session.id,
                "session_title": session.session_title,
                "session_time": session.session_time.isoformat(),
                "status": session.status,
                "is_active": session.is_active,
                "started_at": session.started_at.isoformat() if session.started_at else None,
                "ended_at": session.ended_at.isoformat() if session.ended_at else None,
                "organizer_id": session.organizer_id
            }
            for session in sessions
        ]
    }

@router.delete("/conferences/{conference_id}/live-sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_live_session(
    conference_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Vérifier que l'utilisateur est l'organisateur de la conférence
    conference = db.query(Conference).filter(
        Conference.id == conference_id,
        Conference.organizer_id == current_user.id
    ).first()
    if not conference:
        raise HTTPException(
            status_code=403,
            detail="Vous devez être l'organisateur de cette conférence pour supprimer une session live"
        )
    # Récupérer la session
    live_session = db.query(LiveSession).filter(
        LiveSession.id == session_id,
        LiveSession.conference_id == conference_id,
        LiveSession.organizer_id == current_user.id
    ).first()
    if not live_session:
        raise HTTPException(
            status_code=404,
            detail="Session introuvable ou vous n'êtes pas autorisé à la supprimer"
        )
    db.delete(live_session)
    db.commit()
    return {"detail": "Session supprimée avec succès"} 