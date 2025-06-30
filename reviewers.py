from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from models import reviewers, users, conferences, abstracts
from models.reviews import Review, ReviewDecision  # Import ReviewDecision
from models.abstracts import Abstract, AbstractStatus, PresentationType, AbstractOut
from database import get_db
from utils.email import send_email
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import aliased
import secrets
from models.reviewer_invitations import ReviewerInvitation, InvitationStatus
from jose import JWTError, jwt
from models.users import User
from typing import List
import random
import string


# Define a Pydantic model for the input data
class ReviewerInvitationCreate(BaseModel):
    email: str
    conference_id: int

class ReviewCreate(BaseModel):
    abstract_id: int
    comment: str
    decision: ReviewDecision

class ReviewUpdate(BaseModel):
    comment: str
    decision: ReviewDecision

class AssignReviewerRequest(BaseModel):
    reviewer_id: int

router = APIRouter()

SECRET_KEY = "123456789"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide.")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide.")

# Invite Reviewer (as before)
@router.post("/reviewers/invite")
def invite_reviewer(
    data: ReviewerInvitationCreate, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)
):
    # Recherche ou création du user par email
    user = db.query(users.User).filter_by(email=data.email).first()
    if not user:
        # Crée un user avec un mot de passe aléatoire
        random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        user = users.User(
            email=data.email,
            fullname=data.email.split('@')[0],
            hashed_password=random_password,
            role=users.UserRole.REVIEWER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    accept_token = secrets.token_urlsafe(32)
    print("Création invitation reviewer pour:", user.id, data.conference_id)
    invitation = ReviewerInvitation(
        invited_by_id=current_user.id,
        invitee_id=user.id,
        email=data.email,
        conference_id=data.conference_id,
        accept_token=accept_token
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    # Lien d'acceptation
    accept_link = f"http://localhost:8080/accept-invitation?token={accept_token}&conference_id={data.conference_id}"
    message = f"Hello,\nYou are invited to be a reviewer for conference {data.conference_id}.\nAccept: {accept_link}"
    send_email(to=data.email, subject="Reviewer Invitation", body=message)
    return invitation

# Accept Invitation by token
@router.get("/reviewer-invitations/accept/{token}")
def accept_invitation_by_token(token: str, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    print(f"=== DEBUG: Accepting invitation with token: {token} ===")
    print(f"Current user: {current_user.email} (ID: {current_user.id})")
    
    invitation = db.query(ReviewerInvitation).filter_by(accept_token=token).first()
    print(f"Invitation found: {invitation is not None}")
    
    if not invitation:
        print("ERROR: Invitation not found")
        raise HTTPException(status_code=404, detail="Invitation not found or token invalid")
    
    print(f"Invitation details: invitee_id={invitation.invitee_id}, invitee_email={invitation.invitee_email}")
    
    # Vérifier que l'utilisateur connecté correspond à l'invitation
    if invitation.invitee_id is None:
        print("Invitation.invitee_id is None, checking email match")
        # Si invitee_id est NULL, on vérifie l'email et on lie l'invitation
        if invitation.invitee_email != current_user.email:
            print(f"ERROR: Email mismatch. Invitation email: {invitation.invitee_email}, Current user email: {current_user.email}")
            raise HTTPException(status_code=403, detail="Cette invitation ne vous est pas destinée")
        print("Email matches, linking invitation to current user")
        invitation.invitee_id = current_user.id
        db.commit()
    elif invitation.invitee_id != current_user.id:
        print(f"ERROR: User ID mismatch. Invitation user ID: {invitation.invitee_id}, Current user ID: {current_user.id}")
        raise HTTPException(status_code=403, detail="Cette invitation ne vous est pas destinée")
    
    if invitation.status != InvitationStatus.accepted:
        print("Updating invitation status to accepted")
        invitation.status = InvitationStatus.accepted
        db.commit()
    
    # Ajoute le user connecté comme reviewer
    print(f"Ajout reviewer: {current_user.id}, {invitation.conference_id}")
    existing = db.query(reviewers.Reviewer).filter_by(
        user_id=current_user.id,
        conference_id=invitation.conference_id
    ).first()
    if not existing:
        print("Creating new reviewer entry")
        reviewer = reviewers.Reviewer(user_id=current_user.id, conference_id=invitation.conference_id)
        db.add(reviewer)
        db.commit()
        print("Reviewer entry created successfully")
    else:
        print("Reviewer entry already exists")
    
    print("=== DEBUG: Invitation accepted successfully ===")
    return {"message": "You are now a reviewer for this conference."}

# List Abstracts (as before)
@router.get("/reviewers/{conference_id}/abstracts", response_model=List[AbstractOut])
def list_assigned_abstracts_for_reviewers(conference_id: int, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    # Only reviewers of this conference can access
    reviewer_link = db.query(reviewers.Reviewer).filter_by(user_id=current_user.id, conference_id=conference_id).first()
    if not reviewer_link:
        raise HTTPException(status_code=403, detail="You are not a reviewer for this conference.")
    # Return all abstracts for this conference with status 'assigned'
    assigned_abstracts = db.query(abstracts.Abstract).filter(
        abstracts.Abstract.conference_id == conference_id,
        abstracts.Abstract.status == (AbstractStatus.assigned if hasattr(AbstractStatus, 'assigned') else 'assigned')
    ).all()
    return assigned_abstracts

# Create Review
@router.post("/reviews/")
def create_review(
    review_data: ReviewCreate, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)
):
    target_abstract = db.query(Abstract).filter(Abstract.id == review_data.abstract_id).first()
    if not target_abstract:
        raise HTTPException(status_code=404, detail="Abstract not found.")

    # Autoriser tout reviewer de la conférence à reviewer
    conference = target_abstract.conference
    reviewer_link = db.query(reviewers.Reviewer).filter_by(user_id=current_user.id, conference_id=conference.id).first()
    if not reviewer_link:
        raise HTTPException(status_code=403, detail="You are not a reviewer for this conference.")

    # Check if the reviewer has already submitted a review for this abstract
    existing_review = db.query(Review).filter_by(
        reviewer_id=current_user.id,
        abstract_id=review_data.abstract_id
    ).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already submitted a review for this abstract.")

    review_entry = Review(
        reviewer_id=current_user.id,
        abstract_id=review_data.abstract_id,
        comment=review_data.comment,
        decision=review_data.decision
    )
    db.add(review_entry)
    db.commit()
    db.refresh(review_entry)

    all_reviews = db.query(Review).filter(Review.abstract_id == review_data.abstract_id).all()

    if len(all_reviews) >= 2:
        accepted_count = sum(1 for r in all_reviews if r.decision == ReviewDecision.ACCEPTED)

        if accepted_count == 2:
            target_abstract.status = AbstractStatus.accepted
            target_abstract.presentation_type = PresentationType.ORAL
        elif accepted_count == 1:
            target_abstract.status = AbstractStatus.accepted
            target_abstract.presentation_type = PresentationType.E_POSTER
        else:
            target_abstract.status = AbstractStatus.rejected
            target_abstract.presentation_type = None

        db.commit()
        db.refresh(target_abstract)

    return review_entry

# Read Review (by reviewer)
@router.get("/reviews/{review_id}")
def read_review(review_id: int, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    review = db.query(Review).filter_by(id=review_id, reviewer_id=current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found or you do not have access to it.")
    return review

# Update Review (by reviewer)
@router.put("/reviews/{review_id}")
def update_review(
    review_id: int, review_data: ReviewUpdate, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)
):
    review_entry = db.query(Review).filter_by(id=review_id, reviewer_id=current_user.id).first()
    if not review_entry:
        raise HTTPException(status_code=404, detail="Review not found or you do not have access to it.")
    
    review_entry.comment = review_data.comment
    review_entry.decision = review_data.decision
    db.commit()

    target_abstract = db.query(Abstract).filter(Abstract.id == review_entry.abstract_id).first()
    all_reviews = db.query(Review).filter(Review.abstract_id == review_entry.abstract_id).all()

    if len(all_reviews) >= 2:
        accepted_count = sum(1 for r in all_reviews if r.decision == ReviewDecision.ACCEPTED)
        
        if accepted_count == 2:
            target_abstract.status = AbstractStatus.accepted
            target_abstract.presentation_type = PresentationType.ORAL
        elif accepted_count == 1:
            target_abstract.status = AbstractStatus.accepted
            target_abstract.presentation_type = PresentationType.E_POSTER
        else:
            target_abstract.status = AbstractStatus.rejected
            target_abstract.presentation_type = None
            
        db.commit()

    db.refresh(review_entry)
    return review_entry

# Delete Review (by reviewer)
@router.delete("/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    review_entry = db.query(Review).filter_by(id=review_id, reviewer_id=current_user.id).first()
    if not review_entry:
        raise HTTPException(status_code=404, detail="Review not found or you do not have access to it.")
    
    db.delete(review_entry)
    db.commit()
    return {"message": "Review deleted successfully"}

@router.post("/abstracts/{abstract_id}/assign-reviewer", status_code=201)
def assign_reviewer_to_abstract(
    abstract_id: int,
    request: AssignReviewerRequest,
    db: Session = Depends(get_db),
    current_user: users.User = Depends(get_current_user)
):
    # 1. Fetch the abstract and its conference
    target_abstract = db.query(abstracts.Abstract).filter(abstracts.Abstract.id == abstract_id).first()
    if not target_abstract:
        raise HTTPException(status_code=404, detail="Abstract not found.")

    # 2. Check if the current user is the organizer of the conference
    conference = target_abstract.conference
    if not conference or conference.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the conference organizer can assign reviewers.")

    # 3. Fetch the user to be assigned as a reviewer
    reviewer_to_assign = db.query(users.User).filter(users.User.id == request.reviewer_id).first()
    if not reviewer_to_assign:
        raise HTTPException(status_code=404, detail="Reviewer user not found.")
    if reviewer_to_assign.role != users.UserRole.REVIEWER:
        raise HTTPException(status_code=400, detail="The assigned user must have the 'REVIEWER' role.")
    
    # 4. Check if the reviewer is already assigned
    if reviewer_to_assign in target_abstract.assigned_reviewers:
        raise HTTPException(status_code=400, detail="Reviewer already assigned to this abstract.")

    # 5. Check reviewer assignment limit (max 2)
    if len(target_abstract.assigned_reviewers) >= 2:
        raise HTTPException(status_code=400, detail="An abstract cannot be assigned to more than two reviewers.")

    # 6. Create the assignment
    target_abstract.assigned_reviewers.append(reviewer_to_assign)
    db.commit()

    return {"message": f"Reviewer {reviewer_to_assign.fullname} assigned to abstract '{target_abstract.title}'."}

@router.get("/conferences/{conference_id}/reviewers")
def get_conference_reviewers(conference_id: int, db: Session = Depends(get_db)):
    reviewer_links = db.query(reviewers.Reviewer).filter_by(conference_id=conference_id).all()
    reviewer_ids = [r.user_id for r in reviewer_links]
    reviewer_users = db.query(users.User).filter(users.User.id.in_(reviewer_ids)).all()
    return [
        {
            "id": u.id,
            "fullname": u.fullname,
            "email": u.email
        }
        for u in reviewer_users
    ]

@router.get("/reviewers/{reviewer_id}/abstracts")
def list_abstracts_for_reviewer(reviewer_id: int, conference_id: int, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    # Only allow the reviewer themselves or the organizer of the conference
    reviewer_user = db.query(users.User).filter(users.User.id == reviewer_id).first()
    if not reviewer_user:
        raise HTTPException(status_code=404, detail="Reviewer not found.")

    conference = db.query(conferences.Conference).filter(conferences.Conference.id == conference_id).first()
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found.")

    is_organizer = (conference.organizer_id == current_user.id)
    is_reviewer = (current_user.id == reviewer_id)
    if not (is_organizer or is_reviewer):
        raise HTTPException(status_code=403, detail="Not authorized.")

    assigned_abstracts_query = db.query(abstracts.Abstract).join(
        abstracts.abstract_reviewer_assignment
    ).filter(
        abstracts.abstract_reviewer_assignment.c.reviewer_id == reviewer_id,
        abstracts.Abstract.conference_id == conference_id
    )
    abstracts_list = assigned_abstracts_query.all()
    return abstracts_list

@router.post("/abstracts/{abstract_id}/reviews")
def create_review_for_abstract(
    abstract_id: int,
    comment: str = Body(...),
    decision: ReviewDecision = Body(...),
    db: Session = Depends(get_db),
    current_user: users.User = Depends(get_current_user)
):
    # On réutilise la logique de create_review
    target_abstract = db.query(Abstract).filter(Abstract.id == abstract_id).first()
    if not target_abstract:
        raise HTTPException(status_code=404, detail="Abstract not found.")

    # Autoriser tout reviewer de la conférence à reviewer
    conference = target_abstract.conference
    reviewer_link = db.query(reviewers.Reviewer).filter_by(user_id=current_user.id, conference_id=conference.id).first()
    if not reviewer_link:
        raise HTTPException(status_code=403, detail="You are not a reviewer for this conference.")

    # Check if the reviewer has already submitted a review for this abstract
    existing_review = db.query(Review).filter_by(
        reviewer_id=current_user.id,
        abstract_id=abstract_id
    ).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already submitted a review for this abstract.")

    review_entry = Review(
        reviewer_id=current_user.id,
        abstract_id=abstract_id,
        comment=comment,
        decision=decision
    )
    db.add(review_entry)
    db.commit()
    db.refresh(review_entry)

    all_reviews = db.query(Review).filter(Review.abstract_id == abstract_id).all()

    if len(all_reviews) >= 2:
        accepted_count = sum(1 for r in all_reviews if r.decision == ReviewDecision.ACCEPTED)

        if accepted_count == 2:
            target_abstract.status = AbstractStatus.accepted
            target_abstract.presentation_type = PresentationType.ORAL
        elif accepted_count == 1:
            target_abstract.status = AbstractStatus.accepted
            target_abstract.presentation_type = PresentationType.E_POSTER
        else:
            target_abstract.status = AbstractStatus.rejected
            target_abstract.presentation_type = None

        db.commit()
        db.refresh(target_abstract)

    return review_entry

@router.get("/reviewer/my-reviews")
def get_my_review_for_abstract(abstract_id: int, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    review = db.query(Review).filter_by(reviewer_id=current_user.id, abstract_id=abstract_id).first()
    if not review:
        return {"review": None}
    return {
        "review": {
            "id": review.id,
            "comment": review.comment,
            "decision": review.decision.value if hasattr(review.decision, 'value') else review.decision
        }
    }
