from sqlalchemy import create_engine, inspect, text
from database import DATABASE_URL

def check_database():
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Get inspector
    inspector = inspect(engine)
    
    # Get all table names
    tables = inspector.get_table_names()
    print("\nTables in database:", tables)
    
    # Check conferences table structure
    if 'conferences' in tables:
        print("\nConferences table columns:")
        for column in inspector.get_columns('conferences'):
            print(f"- {column['name']}: {column['type']}")
    
    # Check users table structure
    if 'users' in tables:
        print("\nUsers table columns:")
        for column in inspector.get_columns('users'):
            print(f"- {column['name']}: {column['type']}")
    
    # Execute some test queries
    with engine.connect() as connection:
        # Count conferences
        result = connection.execute(text("SELECT COUNT(*) FROM conferences"))
        count = result.scalar()
        print(f"\nNumber of conferences: {count}")
        
        if count > 0:
            # Get conference details
            result = connection.execute(text("""
                SELECT c.*, u.email, u.fullname
                FROM conferences c 
                LEFT JOIN users u ON c.organizer_id = u.id
            """))
            conferences = result.fetchall()
            
            print("\nConference details:")
            for conf in conferences:
                print(f"\nID: {conf.id}")
                print(f"Title: {conf.title}")
                print(f"Organizer: {conf.fullname} ({conf.email})")
                print(f"Venue: {conf.venue}")
                print(f"Thematic: {conf.thematic}")
                print(f"Created at: {conf.created_at}")

if __name__ == "__main__":
    check_database() 