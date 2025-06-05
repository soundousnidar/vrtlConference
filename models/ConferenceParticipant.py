from sqlalchemy import Table, Column, Integer, ForeignKey
from database import Base

class ConferenceParticipant(Base):
    __tablename__ = "conference_participants"
    
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    conference_id = Column(Integer, ForeignKey('conferences.id'), primary_key=True)
