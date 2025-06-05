# to track events and errors within the system for debugging or auditing

from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False)  # e.g., 'error', 'info'
    message = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
