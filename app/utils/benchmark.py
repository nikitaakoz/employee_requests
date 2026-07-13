import sys
import os
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import text
from app.models.database import SessionLocal

def run_benchmark():
    print("Запуск бенчмарка производительности...")
    with SessionLocal() as session:
        # 1. Находим любого исполнителя, у которого есть просроченные заявки "В работе"
        print("Поиск подходящего исполнителя для теста...")
        result = session.execute(text("""
            SELECT assignee_id FROM requests 
            WHERE status = 'В работе' AND due_date < CURRENT_DATE 
            LIMIT 1;
        """))
        row = result.fetchone()
        
        if not row:
            print("Ошибка: не найдено просроченных заявок в статусе 'В работе'.")
            return
            
        assignee_id = row[0]
        print(f"Тестовый исполнитель ID: {assignee_id}")

        # 2. Целевой запрос из ТЗ
        query = text("""
            SELECT id, number, due_date FROM requests 
            WHERE assignee_id = :assignee_id 
            AND status = 'В работе' 
            AND due_date < CURRENT_DATE 
            ORDER BY due_date;
        """)
        
        # Замер времени выполнения запроса
        start_time = time.perf_counter()
        session.execute(query, {"assignee_id": assignee_id})
        end_time = time.perf_counter()
        
        print(f"\nВремя выполнения запроса (БЕЗ индексов): {end_time - start_time:.4f} сек.")

        # 3. Получаем план выполнения (EXPLAIN ANALYZE)
        print("\nПлан выполнения запроса (EXPLAIN ANALYZE):")
        explain_query = text("""
            EXPLAIN ANALYZE
            SELECT id, number, due_date FROM requests 
            WHERE assignee_id = :assignee_id 
            AND status = 'В работе' 
            AND due_date < CURRENT_DATE 
            ORDER BY due_date;
        """)
        explain_result = session.execute(explain_query, {"assignee_id": assignee_id})
        for explain_row in explain_result.fetchall():
            print(explain_row[0])

if __name__ == "__main__":
    run_benchmark()