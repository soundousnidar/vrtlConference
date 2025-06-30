from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, LargeBinary, Enum, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum
from pydantic import BaseModel, field_validator
from typing import List, Optional

class AbstractStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    assigned = "assigned"

class PresentationType(enum.Enum):
    ORAL = "ORAL"
    E_POSTER = "E_POSTER"

# Table d'association entre Abstract et Author
abstract_authors = Table(
    'abstract_authors',
    Base.metadata,
    Column('abstract_id', Integer, ForeignKey('abstracts.id'), primary_key=True),
    Column('author_id', Integer, ForeignKey('authors.id'), primary_key=True),
    Column('author_order', Integer),  
    Column('role', String(100))       
)

# Association table for assigning reviewers to abstracts
abstract_reviewer_assignment = Table(
    'abstract_reviewer_assignment',
    Base.metadata,
    Column('abstract_id', Integer, ForeignKey('abstracts.id'), primary_key=True),
    Column('reviewer_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class Abstract(Base):
    __tablename__ = "abstracts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    keywords = Column(String(255), nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(AbstractStatus, name="abstract_status_enum"), default=AbstractStatus.pending)
    presentation_type = Column(Enum(PresentationType, name="presentation_type_enum"), nullable=True)
    logs = Column(Text, nullable=True)

    file_data = Column(LargeBinary, nullable=True)
    file_filename = Column(String, nullable=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey('users.id'))
    conference_id = Column(Integer, ForeignKey('conferences.id'))

    # Relationships
    user = relationship("User", back_populates="submitted_abstracts")
    conference = relationship("Conference", back_populates="abstracts")
    authors = relationship("Author", secondary=abstract_authors, back_populates="abstracts")
    reviews = relationship("Review", back_populates="abstract")
    assigned_reviewers = relationship("User", secondary=abstract_reviewer_assignment, back_populates="assigned_abstracts")
    
class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=True)
    affiliation = Column(String(200), nullable=True)

    abstracts = relationship("Abstract", secondary=abstract_authors, back_populates="authors")
    

class AuthorOut(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    affiliation: Optional[str] = None

    class Config:
        from_attributes = True

class AbstractOut(BaseModel):
    id: int
    title: str
    summary: str
    keywords: str
    submitted_at: datetime
    status: AbstractStatus
    authors: List[AuthorOut] = []
    file_uploaded: bool = False

    @field_validator('status', mode='before')
    def status_to_str(cls, v):
        if isinstance(v, AbstractStatus):
            return v.value
        return v
    
    @field_validator('file_uploaded', mode='before')
    def check_file_uploaded(cls, v, values):
        # This is a bit of a placeholder since we can't access the model directly.
        # A better approach might be a resolver in the route.
        # For now, we assume the logic in the route will prepare this.
        # This validator is more for demonstrating the structure.
        # In a real scenario, you'd calculate this in the route and pass it.
        return bool(values.data.get('file_filename'))

    class Config:
        from_attributes = True



