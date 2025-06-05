from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base
from datetime import datetime

class LiveSession(Base):
    __tablename__ = "live_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_title = Column(String(200), nullable=False)
    session_time = Column(DateTime, nullable=False)
    conference_id = Column(Integer, ForeignKey('conferences.id'), nullable=False)

    # Relationships
    conference = relationship("Conference")
