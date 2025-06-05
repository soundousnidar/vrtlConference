from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
from database import Base

class InvitationStatus(str, PyEnum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"

class ReviewerInvitation(Base):
    __tablename__ = "reviewer_invitations"

    id = Column(Integer, primary_key=True, index=True)
    invited_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    invitee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    invitee_email = Column(String(255), nullable=False)
    conference_id = Column(Integer, ForeignKey("conferences.id", ondelete="CASCADE"))
    status = Column(Enum(InvitationStatus), default=InvitationStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    accept_token = Column(String(255), unique=True, nullable=True)
    reject_token = Column(String(255), unique=True, nullable=True)

    # Relationships
    invited_by = relationship(
        "User",
        foreign_keys=[invited_by_id],
        back_populates="sent_invitations"
    )
    invitee = relationship(
        "User",
        foreign_keys=[invitee_id],
        back_populates="received_invitations"
    )
    conference = relationship("Conference", back_populates="reviewer_invitations") 