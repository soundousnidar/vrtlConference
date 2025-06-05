from database import Base, engine
from models.users import User
from models.conferences import Conference
from models.reviewer_invitations import ReviewerInvitation
from models.reviewers import Reviewer
from models.reviews import Review
from models.abstracts import Abstract

def create_tables():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    create_tables() 