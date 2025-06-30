from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Depends, Response, Header
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from models.users import User
from database import get_db
import jwt
from jwt.exceptions import PyJWTError, ExpiredSignatureError
from datetime import datetime, timedelta
from typing import Optional
import os

router = APIRouter()

# Configuration JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "123456789")  # Use environment variable or default
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Non authentifié",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
            
        return user
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

@router.post("/login", operation_id="login_auth")
async def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user or not bcrypt.verify(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    access_token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "fullname": user.fullname
        }
    }

@router.post("/register")
async def register(
    fullname: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),  
    photo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # Vérifie si les mots de passe correspondent
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Les mots de passe ne correspondent pas.")

    # Vérifie si l'email existe déjà
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    if photo and not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Format de photo non supporté.")

    # Lis les données binaires de la photo
    photo_bytes = await photo.read() if photo else None

    # Crée l'utilisateur
    new_user = User(
        fullname=fullname,
        email=email,
        hashed_password=bcrypt.hash(password),
        photo_data=photo_bytes
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Crée un token pour le nouvel utilisateur
    access_token = create_access_token({"sub": str(new_user.id)})
    
    return {
        "message": "Utilisateur enregistré avec succès",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "fullname": new_user.fullname
        }
    }

