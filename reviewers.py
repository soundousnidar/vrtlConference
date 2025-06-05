from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import reviewers, users, conferences, abstracts
from database import get_db
from utils.email import send_email
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import aliased

# Define a Pydantic model for the input data
class ReviewerInvitationCreate(BaseModel):
    invitee_id: int
    conference_id: int

class ReviewCreate(BaseModel):
    abstract_id: int
    review_text: str
    rating: int  # Assume rating is an integer between 1 and 5

class ReviewUpdate(BaseModel):
    review_text: str
    rating: int

router = APIRouter()

SECRET_KEY = "123456789"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token invalide.")
        user = db.query(User).filter(User.email == email).first()
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
    invitation = reviewers.ReviewerInvitation(
        invited_by_id=current_user.id,
        invitee_id=data.invitee_id,
        conference_id=data.conference_id
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # Send email with accept/reject links
    accept_link = f"http://localhost:8000/reviewers/accept/{invitation.id}"
    reject_link = f"http://localhost:8000/reviewers/reject/{invitation.id}"
    message = f"Hello,\nYou are invited to be a reviewer for conference {data.conference_id}.\nAccept: {accept_link}\nReject: {reject_link}"
    send_email(to="invitee@example.com", subject="Reviewer Invitation", body=message)

    return invitation

# Accept Invitation (as before)
@router.get("/reviewers/accept/{invitation_id}")
def accept_invitation(invitation_id: int, db: Session = Depends(get_db)):
    invitation = db.query(reviewers.ReviewerInvitation).filter_by(id=invitation_id).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation.status = reviewers.InvitationStatus.accepted
    db.commit()

    # Add to reviewer table
    reviewer = reviewers.Reviewer(user_id=invitation.invitee_id, conference_id=invitation.conference_id)
    db.add(reviewer)
    db.commit()

    return {"message": "You are now a reviewer for this conference."}

# Reject Invitation (as before)
@router.get("/reviewers/reject/{invitation_id}")
def reject_invitation(invitation_id: int, db: Session = Depends(get_db)):
    invitation = db.query(reviewers.ReviewerInvitation).filter_by(id=invitation_id).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation.status = reviewers.InvitationStatus.rejected
    db.commit()
    return {"message": "You have declined the invitation."}

# List Abstracts (as before)
@router.get("/reviewers/{conference_id}/abstracts")
def list_abstracts(conference_id: int, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    is_reviewer = db.query(reviewers.Reviewer).filter_by(user_id=current_user.id, conference_id=conference_id).first()
    if not is_reviewer:
        raise HTTPException(status_code=403, detail="You are not a reviewer for this conference.")

    abstracts = db.query(abstracts.Abstract).filter_by(conference_id=conference_id).all()
    return abstracts

# Create Review
@router.post("/reviews/")
def create_review(
    review: ReviewCreate, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)
):
    # Check if the reviewer is assigned to the conference
    reviewer = db.query(reviewers.Reviewer).filter_by(user_id=current_user.id, conference_id=review.abstract_id).first()
    if not reviewer:
        raise HTTPException(status_code=403, detail="You are not a reviewer for this abstract.")

    review_entry = reviewers.Review(
        user_id=current_user.id,
        abstract_id=review.abstract_id,
        review_text=review.review_text,
        rating=review.rating
    )
    db.add(review_entry)
    db.commit()
    db.refresh(review_entry)
    return review_entry

# Read Review (by reviewer)
@router.get("/reviews/{review_id}")
def read_review(review_id: int, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    review = db.query(reviewers.Review).filter_by(id=review_id, user_id=current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found or you do not have access to it.")
    return review

# Update Review (by reviewer)
@router.put("/reviews/{review_id}")
def update_review(
    review_id: int, review: ReviewUpdate, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)
):
    review_entry = db.query(reviewers.Review).filter_by(id=review_id, user_id=current_user.id).first()
    if not review_entry:
        raise HTTPException(status_code=404, detail="Review not found or you do not have access to it.")
    
    review_entry.review_text = review.review_text
    review_entry.rating = review.rating
    db.commit()
    db.refresh(review_entry)
    return review_entry

# Delete Review (by reviewer)
@router.delete("/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), current_user: users.User = Depends(get_current_user)):
    review_entry = db.query(reviewers.Review).filter_by(id=review_id, user_id=current_user.id).first()
    if not review_entry:
        raise HTTPException(status_code=404, detail="Review not found or you do not have access to it.")
    
    db.delete(review_entry)
    db.commit()
    return {"message": "Review deleted successfully"}
