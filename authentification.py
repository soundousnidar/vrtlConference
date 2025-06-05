from fastapi import APIRouter, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from models.users import User
from database import get_db
from datetime import datetime, timedelta
from jose import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional

router = APIRouter()

# Clé secrète pour signer le JWT (à changer en production et garder confidentielle)
SECRET_KEY = "123456789"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
RESET_TOKEN_EXPIRE_MINUTES = 15

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/login")
async def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Adresse email incorrecte")

    if not bcrypt.verify(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")

    # Générer le token d'accès
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "fullname": user.fullname,
            "email": user.email,
            # ici tu peux mettre une route pour récupérer la photo si tu en as une
            # "photo_url": f"/users/{user.id}/photo
        }
    }

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_USER ="sundusnidar@gmail.com"
SMTP_PASSWORD = "wzja gtwm lttz molj"

def send_reset_email(to_email: str, reset_link: str):
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Réinitialisation de votre mot de passe"
        message["From"] = SMTP_USER
        message["To"] = to_email

        text = (
            f"Bonjour,\n\n"
            f"Voici le lien pour réinitialiser votre mot de passe : {reset_link}\n\n"
            f"Si vous n'avez pas demandé cette réinitialisation, ignorez cet email."
        )
        html = f"""
        <html>
          <body>
            <p>Bonjour,<br><br>
               Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :<br>
               <a href="{reset_link}">Réinitialiser mon mot de passe</a><br><br>
               Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
          </body>
        </html>
        """

        message.attach(MIMEText(text, "plain"))
        message.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, message.as_string())

        print(f"Email de réinitialisation envoyé à {to_email}")

    except Exception as e:
        # Log error without breaking flow, pour plus de robustesse
        print(f"Erreur lors de l'envoi de l'email à {to_email} : {e}")


@router.post("/forgot-password")
async def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Ne pas révéler l'existence ou non de l'email
        return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}

    reset_token_expires = timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    reset_token = create_access_token(
        data={"sub": user.email, "action": "reset_password"},
        expires_delta=reset_token_expires
    )

    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

    send_reset_email(user.email, reset_link)

    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
async def reset_password(
    token: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        action: str = payload.get("action")

        if email is None or action != "reset_password":
            raise HTTPException(status_code=400, detail="Token invalide.")

        # Option de vérifier si le token est dans la liste noire ici.
        if is_token_blacklisted(token):
            raise HTTPException(status_code=400, detail="Token révoqué.")

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token expiré.")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Token invalide.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")

    # Hacher le nouveau mot de passe
    hashed_password = bcrypt.hash(new_password)
    user.hashed_password = hashed_password
    db.commit()

    return {"message": "Mot de passe réinitialisé avec succès."}


blacklist = set()

@router.post("/logout")
async def logout(token: str = Form(...)):
    blacklist.add(token)  # Ajoute le token à la liste noire
    return {"message": "Déconnexion réussie."}

def is_token_blacklisted(token: str):
    return token in blacklist
