from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = "postgresql://postgres:123456789@localhost/virtual_conference_db1"
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as connection:
        # Add conference_count column if it doesn't exist
        connection.execute(text("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='conference_count'
                ) THEN 
                    ALTER TABLE users ADD COLUMN conference_count INTEGER DEFAULT 0;
                END IF;
            END $$;
        """))
        connection.commit()

if __name__ == "__main__":
    migrate()
    print("Migration completed successfully!") 