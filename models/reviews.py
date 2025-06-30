from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class ReviewDecision(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"))  # Clé étrangère vers 'users'
    abstract_id = Column(Integer, ForeignKey("abstracts.id"))
    comment = Column(String)
    decision = Column(Enum(ReviewDecision), nullable=False)

    # Relation vers 'User'
    reviewer = relationship("User", back_populates="reviews")
    abstract = relationship("Abstract", back_populates="reviews")
