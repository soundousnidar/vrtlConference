from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)  # e.g., 'credit_card', 'paypal'
    payment_status = Column(String(50), nullable=False)  # e.g., 'completed', 'pending'
    paid_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    conference_id = Column(Integer, ForeignKey('conferences.id'), nullable=False)

    # Relationships
    user = relationship("User")
    conference = relationship("Conference")
