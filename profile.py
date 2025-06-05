from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models.users import User
from jose import JWTError, jwt
import os
from typing import Optional
import traceback
from datetime import datetime

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "123456789")  # Use same key as auth.py
ALGORITHM = "HS256"

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        print("No authorization header found")
        raise HTTPException(
            status_code=401,
            detail="Non authentifié",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        print(f"Authorization header: {authorization}")  # Debug log
        
        # Handle both "Bearer token" and "token" formats
        if authorization.startswith('Bearer '):
            token = authorization.replace("Bearer ", "")
        else:
            token = authorization
            
        print(f"Token to decode: {token}")  # Debug log
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            print(f"Decoded payload: {payload}")  # Debug log
        except Exception as decode_error:
            print(f"Token decode error: {str(decode_error)}")  # Debug log
            print(f"Token that failed: {token}")  # Debug log
            raise jwt.JWTError("Failed to decode token")
        
        user_id = payload.get("sub")
        if user_id is None:
            print("No user_id in payload")  # Debug log
            raise HTTPException(status_code=401, detail="Token invalide")
        
        print(f"Looking for user with ID: {user_id}")  # Debug log
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            print(f"No user found with ID: {user_id}")  # Debug log
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
            
        print(f"User found: {user.email}")  # Debug log
        return user
    except jwt.ExpiredSignatureError:
        print("Token expired")  # Debug log
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.JWTError as e:
        print(f"JWT Error: {str(e)}")  # Debug log
        print(f"Full traceback: {traceback.format_exc()}")  # Debug log
        raise HTTPException(status_code=401, detail="Token invalide")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        print(f"Full traceback: {traceback.format_exc()}")  # Debug log
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        print(f"Getting profile for user: {current_user.email}")  # Debug log
        
        # Get user's abstracts and reviews with proper serialization
        abstracts = [{
            "id": abstract.id,
            "title": abstract.title,
            "summary": abstract.summary,
            "keywords": abstract.keywords,
            "status": abstract.status,
            "submitted_at": abstract.submitted_at.isoformat() if abstract.submitted_at else None
        } for abstract in current_user.submitted_abstracts]
        
        reviews = [{
            "id": review.id,
            "abstract_id": review.abstract_id,
            "score": review.score,
            "comments": review.comments,
            "submitted_at": review.submitted_at.isoformat() if review.submitted_at else None
        } for review in current_user.reviews] if current_user.role == "REVIEWER" else []
        
        # Get user's conferences (if they are an organizer)
        conferences = []
        if hasattr(current_user, 'organized_conferences'):
            conferences = [{
                "id": conf.id,
                "title": conf.title,
                "deadline": conf.deadline.isoformat() if conf.deadline else None,
                "venue": conf.venue,
                "thematic": conf.thematic,
                "status": "active" if conf.deadline and conf.deadline.date() > datetime.now().date() else "past"
            } for conf in current_user.organized_conferences]
        
        # Initialize conference_count if it's None
        if current_user.conference_count is None:
            current_user.conference_count = len(conferences)
            db.commit()
        
        response_data = {
            "id": current_user.id,
            "fullname": current_user.fullname,
            "email": current_user.email,
            "role": current_user.role,
            "abstracts": abstracts,
            "reviews": reviews,
            "conference_count": current_user.conference_count,
            "conferences": conferences,
            "affiliation": current_user.affiliation,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name
        }
        
        print(f"Profile data prepared successfully")  # Debug log
        return response_data
        
    except Exception as e:
        print(f"Error in get_profile: {str(e)}")  # Debug log
        print(f"Full traceback: {traceback.format_exc()}")  # Debug log
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération du profil")
