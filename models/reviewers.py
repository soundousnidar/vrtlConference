from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Reviewer(Base):
    __tablename__ = "reviewers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    conference_id = Column(Integer, ForeignKey("conferences.id"))

    # Relationships
    user = relationship("User", back_populates="reviewer_roles")
    conference = relationship("Conference", back_populates="reviewers")
