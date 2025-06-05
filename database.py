from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ✅ Utilise le nom du service défini dans docker-compose (souvent "db")
DATABASE_URL = "postgresql://postgres:123456789@db:5432/virtual_conference_db1"

# Crée le moteur SQLAlchemy
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base de classe pour les modèles ORM
Base = declarative_base()

# Dépendance de session pour FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
