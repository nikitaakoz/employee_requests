from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Замени на свои данные PostgreSQL
DATABASE_URL = "postgresql://postgres:password@localhost:5432/employee_requests"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()