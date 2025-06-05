from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, LargeBinary, Enum, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class AbstractStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"

# Table d'association entre Abstract et Author
abstract_authors = Table(
    'abstract_authors',
    Base.metadata,
    Column('abstract_id', Integer, ForeignKey('abstracts.id'), primary_key=True),
    Column('author_id', Integer, ForeignKey('authors.id'), primary_key=True),
    Column('author_order', Integer),  
    Column('role', String(100))       
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
    logs = Column(Text, nullable=True)

    file_data = Column(LargeBinary, nullable=True)
    file_filename = Column(String, nullable=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey('users.id'))
    conference_id = Column(Integer, ForeignKey('conferences.id'))

    # Relationships
    author = relationship("User", back_populates="submitted_abstracts")
    conference = relationship("Conference", back_populates="abstracts")
    authors = relationship("Author", secondary=abstract_authors, back_populates="abstracts")
    reviews = relationship("Review", back_populates="abstract")
    
class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=True)
    affiliation = Column(String(200), nullable=True)

    abstracts = relationship("Abstract", secondary=abstract_authors, back_populates="authors")
    



