from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_type = Column(String(50), nullable=False)  # e.g., 'participation', 'presentation', 'reviewer'
    issued_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    conference_id = Column(Integer, ForeignKey('conferences.id'), nullable=False)

    # Relationships
    user = relationship("User")
    conference = relationship("Conference")
