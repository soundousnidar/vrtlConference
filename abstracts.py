from fastapi import APIRouter, Form, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from models.users import User
from models.conferences import Conference
from models.abstracts import Abstract, Author, abstract_authors
from database import get_db
from datetime import datetime, timezone
from typing import List
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
import json

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        # Just verify the token is valid
        payload = jwt.decode(token, "123456789", algorithms=["HS256"])
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Token invalide")
        return True
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

@router.post("/submit-abstract")
async def submit_abstract(
    title: str = Form(...),
    summary: str = Form(...),
    authors: str = Form(...),  # JSON string of author data
    keywords: str = Form(...),
    conference_id: int = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    is_authenticated: bool = Depends(get_current_user)
):
    try:
        # Parse authors data
        authors_data = json.loads(authors)
        
        # Only check if conference exists and deadline
        conference = db.query(Conference).filter(Conference.id == conference_id).first()
        if not conference:
            raise HTTPException(status_code=404, detail="Conférence introuvable")

        # Check deadline
        if datetime.now(timezone.utc) > conference.deadline.replace(tzinfo=timezone.utc):
            raise HTTPException(status_code=400, detail="La deadline de soumission est dépassée.")

        # Handle file upload
        if file:
            if not file.filename.lower().endswith((".pdf", ".docx")):
                raise HTTPException(status_code=400, detail="Seuls les fichiers PDF ou DOCX sont acceptés.")
            file_data = await file.read()
            file_name = file.filename
        else:
            file_data = None
            file_name = None

        # Create the abstract
        new_abstract = Abstract(
            title=title,
            summary=summary,
            keywords=keywords,
            conference_id=conference_id,
            file_data=file_data,
            file_filename=file_name
        )
        db.add(new_abstract)
        db.flush()  # Get the abstract ID

        # Simply create authors without any checks
        for author_data in authors_data:
            author = Author(
                first_name=author_data['first_name'],
                last_name=author_data['last_name'],
                email=author_data.get('email'),
                affiliation=author_data.get('affiliation')
            )
            db.add(author)
            db.flush()
            new_abstract.authors.append(author)

        db.commit()
        db.refresh(new_abstract)

        return {
            "message": "Abstract soumis avec succès.",
            "abstract_id": new_abstract.id
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Format des auteurs invalide")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Voir les abstracts soumis par l'utilisateur
@router.get("/my-abstracts", response_model=List[dict])
async def get_my_abstracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    abstracts = db.query(Abstract).filter(Abstract.user_id == current_user.id).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "summary": a.summary,
            "authors": [f"{author.first_name} {author.last_name}" for author in a.authors],
            "keywords": a.keywords,
            "submitted_at": a.submitted_at,
            "conference_id": a.conference_id,
            "file_uploaded": bool(a.file_filename)
        }
        for a in abstracts
    ]



# Modifier un abstract avant deadline
@router.put("/edit-abstract/{abstract_id}")
async def edit_abstract(
    abstract_id: int,
    title: str = Form(...),
    summary: str = Form(...),
    auteurs: List[str] = Form(...),
    keywords: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    abstract = db.query(Abstract).filter(Abstract.id == abstract_id, Abstract.user_id == current_user.id).first()

    if not abstract:
        raise HTTPException(status_code=404, detail="Abstract non trouvé.")
    if datetime.now(timezone.utc) > abstract.conference.deadline.replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="Deadline dépassée.")

    abstract.title = title
    abstract.summary = summary
    abstract.keywords = keywords

    if file:
        if not file.filename.lower().endswith((".pdf", ".docx")):
            raise HTTPException(status_code=400, detail="Seuls les fichiers PDF ou DOCX sont acceptés.")
        abstract.file_data = await file.read()
        abstract.file_filename = file.filename

    # 🔁 Mise à jour des auteurs (remplace abstract.auteur = ...)
    abstract.authors.clear()
    for full_name in auteurs:
        try:
            first_name, last_name = full_name.strip().split(" ", 1)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Nom d'auteur invalide : {full_name}")

        author = db.query(Author).filter_by(first_name=first_name, last_name=last_name).first()
        if not author:
            author = Author(first_name=first_name, last_name=last_name)
            db.add(author)
            db.flush()
        abstract.authors.append(author)

    db.commit()
    db.refresh(abstract)

    return {"message": "Abstract modifié avec succès."}

# Supprimer un abstract avant deadline
@router.delete("/delete-abstract/{abstract_id}")
async def delete_abstract(
    abstract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    abstract = db.query(Abstract).filter(Abstract.id == abstract_id, Abstract.user_id == current_user.id).first()

    if not abstract:
        raise HTTPException(status_code=404, detail="Abstract non trouvé.")

    # Vérifie la deadline
    if datetime.now(timezone.utc) > abstract.conference.deadline.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="La deadline est dépassée, suppression interdite.")

    db.delete(abstract)
    db.commit()

    return {"message": "Abstract supprimé avec succès."}

