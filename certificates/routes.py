from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from certificates.generator import generate_certificate
from certificates.utils import get_cert_filename
from fastapi.responses import StreamingResponse
from models.certificate import Certificate
from models.users import User
from models.conferences import Conference
from typing import Optional
import jwt
from jwt.exceptions import ExpiredSignatureError, PyJWTError

router = APIRouter()

# Configuration JWT (identique à celle de ton backend)
SECRET_KEY = "123456789"
ALGORITHM = "HS256"

# ✅ Fonction interne pour extraire le user depuis le token
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="Non authentifié")

    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")

        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

        return user

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalide")


# 🔐 Route pour récupérer les certificats du user connecté
@router.get("/my-certificates")
def get_my_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    certs = db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
    return [
        {
            "id": cert.id,
            "conference_id": cert.conference_id,
            "user_id": cert.user_id,
            "cert_type": cert.certificate_type,
            "issued_at": cert.issued_at.isoformat()
        }
        for cert in certs
    ]


# 🧾 Route pour générer un certificat
@router.get("/generate/{conference_id}/{user_id}/{cert_type}")
def generate_certificate_api(
    conference_id: int,
    user_id: int,
    cert_type: str,
    db: Session = Depends(get_db)
):
    try:
        pdf = generate_certificate(conference_id, user_id, cert_type, db)

        return StreamingResponse(
            pdf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={cert_type}_certificate.pdf"}
        )
    except Exception as e:
        print("🔥 Erreur lors de la génération du certificat :", e)
        raise HTTPException(status_code=500, detail="Erreur interne")
