import sys
import os
import random
from datetime import datetime, timedelta
from faker import Faker

# Добавляем корень проекта в путь для импорта
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import insert
from app.models.database import Employee, Request, RequestStatus, SessionLocal

fake = Faker('ru_RU')

def seed_employees(count=1000):
    print(f"Генерация {count} сотрудников...")
    departments = ["IT", "Бухгалтерия", "HR", "Продажи", "Логистика", "Маркетинг"]
    positions = ["Специалист", "Менеджер", "Руководитель отдела", "Аналитик", "Инженер"]
    
    employees_data = [
        {
            "full_name": fake.name(),
            "department": random.choice(departments),
            "position": random.choice(positions)
        }
        for _ in range(count)
    ]
    
    with SessionLocal() as session:
        session.execute(insert(Employee), employees_data)
        session.commit()
        
    # Получаем список ID для привязки заявок
    with SessionLocal() as session:
        employee_ids = [row[0] for row in session.query(Employee.id).all()]
        
    print(f"[OK] Сотрудники созданы. Получено {len(employee_ids)} ID.")
    return employee_ids

def seed_requests(employee_ids, count=1000000, chunk_size=50000):
    print(f"Генерация {count} заявок (пакетами по {chunk_size})...")
    statuses = [RequestStatus.NEW, RequestStatus.IN_PROGRESS, RequestStatus.COMPLETED]
    
    total_inserted = 0
    with SessionLocal() as session:
        for i in range(0, count, chunk_size):
            current_chunk = min(chunk_size, count - i)
            
            requests_data = []
            for _ in range(current_chunk):
                author_id = random.choice(employee_ids)
                assignee_id = random.choice(employee_ids)
                status = random.choice(statuses)
                
                # Логика дат для тестирования просрочки
                created_at = fake.date_time_between(start_date='-2y', end_date='now')
                
                if status == RequestStatus.COMPLETED:
                    due_date = created_at + timedelta(days=random.randint(1, 14))
                elif status == RequestStatus.IN_PROGRESS:
                    # 30% просроченных, 70% в сроке
                    if random.random() < 0.3:
                        due_date = created_at + timedelta(days=random.randint(1, 5)) # Просрочено
                    else:
                        due_date = created_at + timedelta(days=random.randint(10, 30)) # В сроке
                else: # NEW
                    due_date = created_at + timedelta(days=random.randint(3, 20))

                requests_data.append({
                    "number": f"REQ-{total_inserted + _ + 1:07d}",
                    "created_at": created_at,
                    "author_id": author_id,
                    "assignee_id": assignee_id,
                    "description": fake.text(max_nb_chars=200),
                    "due_date": due_date,
                    "status": status.value
                })
            
            session.execute(insert(Request), requests_data)
            session.commit()
            total_inserted += current_chunk
            print(f"  Вставлено: {total_inserted} / {count}")
            
    print("[OK] Все заявки успешно созданы!")

if __name__ == "__main__":
    print("Начало заполнения БД тестовыми данными...")
    emp_ids = seed_employees(1000)
    seed_requests(emp_ids, count=1000000)
    print("База данных заполнена")