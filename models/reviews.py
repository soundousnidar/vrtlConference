from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"))  # Clé étrangère vers 'users'
    abstract_id = Column(Integer, ForeignKey("abstracts.id"))
    rating = Column(Integer)
    comment = Column(String)

    # Relation vers 'User'
    reviewer = relationship("User", back_populates="reviews")
    abstract = relationship("Abstract", back_populates="reviews")
