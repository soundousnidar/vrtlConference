from sqlalchemy import Column, Integer, String, Date, Float, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# Enum pour spécifier le lieu (en ligne ou présentiel)
class VenueEnum(str, enum.Enum):
    ONLINE = "ONLINE"
    IN_PERSON = "IN_PERSON"

class Conference(Base):
    __tablename__ = "conferences"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    deadline = Column(Date, nullable=False)
    important_date = Column(Date, nullable=False)
    fees = Column(Float, nullable=False)
    venue = Column(Enum(VenueEnum), nullable=False)
    thematic = Column(JSON, nullable=False)  # Store as JSON array
    image = Column(String, nullable=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relation avec l'organisateur 
    organizer = relationship("User", back_populates="organized_conferences")
    
    # Relation avec les abstracts
    abstracts = relationship("Abstract", back_populates="conference")

    # Relation avec les invitations de reviewers
    reviewer_invitations = relationship("ReviewerInvitation", back_populates="conference")

    # Relation avec les reviewers
    reviewers = relationship("Reviewer", back_populates="conference")
