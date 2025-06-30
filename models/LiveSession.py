from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from database import Base
from datetime import datetime
import enum
from sqlalchemy.orm import relationship

# Enum pour le statut de la session
class SessionStatus(str, enum.Enum):
    PENDING = "PENDING"  # Session créée mais pas encore lancée
    ACTIVE = "ACTIVE"    # Session lancée par l'organisateur
    ENDED = "ENDED"      # Session terminée

class LiveSession(Base):
    __tablename__ = "live_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_title = Column(String(200), nullable=False)
    session_time = Column(DateTime, nullable=False)
    conference_id = Column(Integer, ForeignKey('conferences.id'), nullable=False)
    organizer_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Organisateur qui lance la session
    status = Column(Enum(SessionStatus), default=SessionStatus.PENDING, nullable=False)
    started_at = Column(DateTime, nullable=True)  # Quand la session a été lancée
    ended_at = Column(DateTime, nullable=True)    # Quand la session s'est terminée
    is_active = Column(Boolean, default=False)    # Session actuellement active

    # Relationships
    conference = relationship("Conference")
    organizer = relationship("User")
