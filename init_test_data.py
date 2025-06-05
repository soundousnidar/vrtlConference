from database import engine, Base, SessionLocal
from models.users import User, UserRole
from models.conferences import Conference, VenueEnum
from models.abstracts import Abstract
from models.reviews import Review
from models.certificate import Certificate
from datetime import datetime, timedelta
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_test_data():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
    
    db = SessionLocal()
    try:
        # Create test user
        test_user = User(
            email="test@example.com",
            fullname="Test User",
            first_name="Test",
            last_name="User",
            hashed_password=pwd_context.hash("testpassword"),
            role=UserRole.admin,
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print("Test user created successfully!")
        
        # Create test conference
        test_conference = Conference(
            title="Test Conference 2024",
            description="A test conference for development",
            deadline=datetime.now() + timedelta(days=30),
            important_date=datetime.now() + timedelta(days=15),
            fees=100.0,
            venue=VenueEnum.online,
            thematic=["AI", "Machine Learning", "Web Development"],
            organizer_id=test_user.id
        )
        db.add(test_conference)
        db.commit()
        print("Test conference created successfully!")
        
    except Exception as e:
        print(f"Error initializing test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_test_data() 