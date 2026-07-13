import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import text
from app.models.database import SessionLocal

def optimize_db():
    print("Начало оптимизации базы данных...")
    with SessionLocal() as session:
        print("Создание составного индекса idx_requests_assignee_status_due_date...")
        # Убрали CONCURRENTLY
        session.execute(text("""
            CREATE INDEX idx_requests_assignee_status_due_date 
            ON requests (assignee_id, status, due_date);
        """))
        session.commit()
        print("[OK] Индекс успешно создан!")

if __name__ == "__main__":
    optimize_db()