from sqlalchemy import Column, Integer, String, Enum, LargeBinary, Boolean
from database import Base
import enum
from sqlalchemy.orm import relationship
from models.reviews import Review 

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    ORGANIZER = "ORGANIZER"
    REVIEWER = "REVIEWER"
    AUTHOR = "AUTHOR"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    fullname = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    photo_data = Column(LargeBinary, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.AUTHOR)
    first_name = Column(String(50))
    last_name = Column(String(50))
    affiliation = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    conference_count = Column(Integer, default=0)  # Track number of conferences created

    # Relationships
    submitted_abstracts = relationship("Abstract", back_populates="user")
    reviews = relationship("Review", back_populates="reviewer")
    conferences = relationship("Conference", back_populates="organizer")
    sent_invitations = relationship(
        "ReviewerInvitation",
        foreign_keys="ReviewerInvitation.invited_by_id",
        back_populates="invited_by"
    )
    received_invitations = relationship(
        "ReviewerInvitation",
        foreign_keys="ReviewerInvitation.invitee_id",
        back_populates="invitee"
    )
    reviewer_roles = relationship("Reviewer", back_populates="user")
    assigned_abstracts = relationship(
        "Abstract",
        secondary="abstract_reviewer_assignment",
        back_populates="assigned_reviewers"
    )
