from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models.users import User
from jose import JWTError, jwt
import os
from typing import Optional
import traceback
from datetime import datetime
from datetime import datetime, timezone 
from models.reviews import Review
from models.abstracts import Abstract

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
        
        # Force le chargement des reviews faites par l'utilisateur et leurs relations
        user_with_reviews = db.query(User).options(
            joinedload(User.reviews).joinedload(Review.abstract).joinedload(Abstract.conference)
        ).filter(User.id == current_user.id).first()

        # Reviews FAITES par l'utilisateur
        reviews = []
        for review in user_with_reviews.reviews:
            abstract = review.abstract
            conference = abstract.conference if abstract else None
            reviews.append({
                "id": review.id,
                "abstract_id": review.abstract_id,
                "decision": review.decision,
                "comment": review.comment,
                "rating": getattr(review, "rating", None),
                "abstract": {
                    "id": abstract.id if abstract else None,
                    "title": abstract.title if abstract else None,
                    "conference": {
                        "id": conference.id if conference else None,
                        "title": conference.title if conference else None
                    } if conference else None
                } if abstract else None
            })

        # Abstracts soumis par l'utilisateur
        abstracts = [{
            "id": abstract.id,
            "title": abstract.title,
            "summary": abstract.summary,
            "keywords": abstract.keywords,
            "status": abstract.status,
            "submitted_at": abstract.submitted_at.isoformat() if abstract.submitted_at else None,
            "conference": {
                "id": abstract.conference.id if abstract.conference else None,
                "title": abstract.conference.title if abstract.conference else None
            } if abstract.conference else None
        } for abstract in current_user.submitted_abstracts]

        # Conférences organisées
        conferences = []
        if hasattr(current_user, 'conferences'):
            conferences = [{
                "id": conf.id,
                "title": conf.title,
                "deadline": conf.deadline.isoformat() if conf.deadline else None,
                "venue": conf.venue,
                "thematic": conf.thematic,
                "status": "active" if conf.deadline and conf.deadline > datetime.now().date() else "past"
            } for conf in current_user.conferences]

        # Reviews REÇUES sur les abstracts de l'utilisateur
        received_reviews = []
        for abstract in current_user.submitted_abstracts:
            reviews_list = []
            for review in getattr(abstract, "reviews", []):
                reviews_list.append({
                    "id": review.id,
                    "decision": review.decision,
                    "comment": review.comment,
                    "rating": getattr(review, "rating", None),
                    "reviewer": {
                        "id": review.reviewer.id if review.reviewer else None,
                        "fullname": review.reviewer.fullname if review.reviewer else None,
                        "email": review.reviewer.email if review.reviewer else None
                    } if review.reviewer else None
                })
            received_reviews.append({
                "abstract_id": abstract.id,
                "title": abstract.title,
                "conference": {
                    "id": abstract.conference.id if abstract.conference else None,
                    "title": abstract.conference.title if abstract.conference else None
                } if abstract.conference else None,
                "reviews": reviews_list
            })

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
            "last_name": current_user.last_name,
            "received_reviews": received_reviews,  # Pour le frontend si besoin
            "abstracts_reviews": received_reviews  # Pour compatibilité avec l'existant
        }
        print(f"Profile data prepared successfully")  # Debug log
        return response_data
    except Exception as e:
        print(f"Error in get_profile: {str(e)}")  # Debug log
        print(f"Full traceback: {traceback.format_exc()}")  # Debug log
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération du profil")
