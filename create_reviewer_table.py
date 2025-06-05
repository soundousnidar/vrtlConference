from database import engine, Base
from models.reviewer_invitations import ReviewerInvitation
from sqlalchemy import text, inspect

def create_reviewer_invitations_table():
    print("Creating reviewer_invitations table...")
    
    # Drop the table if it exists
    try:
        with engine.connect() as connection:
            connection.execute(text("DROP TABLE IF EXISTS reviewer_invitations CASCADE"))
            connection.commit()
            print("Dropped existing table")
    except Exception as e:
        print(f"Error dropping table: {str(e)}")
    
    # Create the table using SQLAlchemy model
    try:
        Base.metadata.create_all(engine)
        print("Tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {str(e)}")

if __name__ == "__main__":
    create_reviewer_invitations_table() 