from fastapi import APIRouter, Form, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from models.users import User
from models.conferences import Conference
from models.abstracts import Abstract, Author, abstract_authors, AbstractStatus, AbstractOut
from database import get_db
from datetime import datetime, timezone
from typing import List
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
import json
from fastapi.responses import StreamingResponse
import io

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, "123456789", algorithms=["HS256"])
        print("Decoded JWT payload:", payload)  # DEBUG LOG
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return user

@router.post("/submit-abstract")
async def submit_abstract(
    title: str = Form(...),
    summary: str = Form(...),
    authors: str = Form(...),  # Peut être un nom simple ou un JSON
    keywords: str = Form(...),
    conference_id: int = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Rendre flexible le format des auteurs
        try:
            authors_data = json.loads(authors)
            # Si c'est un dict (un seul auteur), on le met dans une liste
            if isinstance(authors_data, dict):
                authors_data = [authors_data]
        except json.JSONDecodeError:
            # Si ce n'est pas du JSON, on considère que c'est un nom simple
            # On tente de séparer prénom/nom si possible
            parts = authors.strip().split()
            if len(parts) == 1:
                authors_data = [{"first_name": parts[0], "last_name": ""}]
            elif len(parts) >= 2:
                authors_data = [{"first_name": parts[0], "last_name": " ".join(parts[1:])}]
            else:
                raise HTTPException(status_code=400, detail="Format des auteurs invalide")

        # Only check if conference exists and deadline
        conference = db.query(Conference).filter(Conference.id == conference_id).first()
        if not conference:
            raise HTTPException(status_code=404, detail="Conférence introuvable")

        # Check deadline
        if datetime.now().date() > conference.deadline:
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
            file_filename=file_name,
            user_id=current_user.id
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

@router.get("/abstracts/{abstract_id}/download")
def download_abstract_file(abstract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    abstract = db.query(Abstract).filter(Abstract.id == abstract_id).first()
    if not abstract:
        raise HTTPException(status_code=404, detail="Abstract not found.")
    if not abstract.file_data or not abstract.file_filename:
        raise HTTPException(status_code=404, detail="No file uploaded for this abstract.")

    # Restriction d'accès : organisateur, reviewers assignés, ou auteur
    is_organizer = abstract.conference.organizer_id == current_user.id
    is_reviewer = False
    if hasattr(abstract, 'assigned_reviewers'):
        is_reviewer = any(r.id == current_user.id for r in abstract.assigned_reviewers)
    else:
        # fallback si la relation n'est pas chargée
        reviewer_links = db.execute(
            """
            SELECT reviewer_id FROM abstract_reviewer_assignment WHERE abstract_id = :aid
            """, {"aid": abstract_id}
        ).fetchall()
        is_reviewer = any(row[0] == current_user.id for row in reviewer_links)
    is_author = abstract.user_id == current_user.id

    if not (is_organizer or is_reviewer or is_author):
        raise HTTPException(status_code=403, detail="Vous n'avez pas accès à ce fichier.")

    # Guess content type
    if abstract.file_filename.lower().endswith('.pdf'):
        content_type = 'application/pdf'
    elif abstract.file_filename.lower().endswith('.docx'):
        content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else:
        content_type = 'application/octet-stream'
    return StreamingResponse(io.BytesIO(abstract.file_data),
                            media_type=content_type,
                            headers={
                                'Content-Disposition': f'attachment; filename="{abstract.file_filename}"'
                            })

@router.get("/organizer/{conference_id}/abstracts", response_model=List[AbstractOut])
def get_abstracts_for_organizer(conference_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conference = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conference:
        raise HTTPException(status_code=404, detail="Conférence introuvable")
    if conference.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas l'organisateur de cette conférence.")
    abstracts = db.query(Abstract).filter(Abstract.conference_id == conference_id).all()
    
    results = []
    for a in abstracts:
        abstract_data = AbstractOut.from_orm(a)
        abstract_data.file_uploaded = bool(a.file_filename)
        results.append(abstract_data)
        
    return results

@router.get("/{abstract_id}/reviews")
def get_reviews_for_abstract(abstract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print(f"==> get_reviews_for_abstract called with user: {getattr(current_user, 'id', None)}")
    target_abstract = db.query(Abstract).filter(Abstract.id == abstract_id).first()

    if not target_abstract:
        raise HTTPException(status_code=404, detail="Abstract not found.")

    # Security check: only the organizer should see all reviews.
    if target_abstract.conference.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to view these reviews.")

    reviews_data = []
    for review in target_abstract.reviews:
        reviews_data.append({
            "id": review.id,
            "comment": review.comment,
            "decision": review.decision.value, # Return the string value of the enum
            "reviewer": {
                "fullname": review.reviewer.fullname
            }
        })

    return {
        "abstract_title": target_abstract.title,
        "reviews": reviews_data
    }

@router.post("/{abstract_id}/assign")
def assign_abstract_to_all_reviewers(abstract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_abstract = db.query(Abstract).filter(Abstract.id == abstract_id).first()
    if not target_abstract:
        raise HTTPException(status_code=404, detail="Abstract not found.")
    conference = target_abstract.conference
    if not conference or conference.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the conference organizer can assign abstracts.")
    target_abstract.status = AbstractStatus.assigned if hasattr(AbstractStatus, 'assigned') else 'assigned'
    db.commit()
    return {"message": f"Abstract '{target_abstract.title}' assigned to all reviewers."}

@router.post("/{abstract_id}/refuse")
def refuse_abstract(abstract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_abstract = db.query(Abstract).filter(Abstract.id == abstract_id).first()
    if not target_abstract:
        raise HTTPException(status_code=404, detail="Abstract not found.")
    conference = target_abstract.conference
    if not conference or conference.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the conference organizer can refuse abstracts.")
    target_abstract.status = AbstractStatus.rejected if hasattr(AbstractStatus, 'rejected') else 'rejected'
    db.commit()
    return {"message": f"Abstract '{target_abstract.title}' refused (rejected)."}

