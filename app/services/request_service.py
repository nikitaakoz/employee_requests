from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime
from app.models.database import Request, Employee, RequestStatus
from app.schemas.request import RequestCreate, RequestUpdate, RequestFilter
from fastapi import HTTPException

class RequestService:
    @staticmethod
    def create_request(db: Session, request: RequestCreate) -> Request:
        # Генерация уникального номера
        count = db.query(Request).count()
        number = f"REQ-{count + 1:07d}"
        
        db_request = Request(
            number=number,
            created_at=datetime.utcnow(),
            status=RequestStatus.NEW.value,
            **request.model_dump()
        )
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def update_status(db: Session, request_id: int, new_status: str) -> Request:
        db_request = db.query(Request).filter(Request.id == request_id).first()
        if not db_request:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
            
        # БИЗНЕС-ПРАВИЛО: Запрет перехода из "Новая" сразу в "Выполнена"
        if db_request.status == RequestStatus.NEW.value and new_status == RequestStatus.COMPLETED.value:
            raise HTTPException(
                status_code=400, 
                detail="Нельзя перевести заявку из статуса 'Новая' сразу в 'Выполнена'. Сначала переведите в 'В работе'."
            )
            
        db_request.status = new_status
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def update_assignee(db: Session, request_id: int, new_assignee_id: int) -> Request:
        db_request = db.query(Request).filter(Request.id == request_id).first()
        if not db_request:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
            
        # Проверка существования сотрудника
        employee = db.query(Employee).filter(Employee.id == new_assignee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
            
        db_request.assignee_id = new_assignee_id
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def get_filtered_requests(db: Session, filters: RequestFilter, skip: int = 0, limit: int = 100):
        query = db.query(Request).join(Employee, Request.assignee_id == Employee.id)
        
        if filters.status:
            query = query.filter(Request.status == filters.status)
        if filters.assignee_id:
            query = query.filter(Request.assignee_id == filters.assignee_id)
        if filters.department:
            query = query.filter(Employee.department.ilike(f"%{filters.department}%"))
        if filters.is_overdue:
            query = query.filter(Request.due_date < datetime.utcnow(), Request.status != RequestStatus.COMPLETED.value)
            
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_reports(db: Session):
        # 1. Количество заявок по каждому статусу
        status_counts = db.query(Request.status, func.count(Request.id)).group_by(Request.status).all()
        
        # 2. Количество просроченных заявок
        overdue_count = db.query(func.count(Request.id)).filter(
            Request.due_date < datetime.utcnow(),
            Request.status != RequestStatus.COMPLETED.value
        ).scalar()
        
        # 3. Количество выполненных заявок по исполнителям
        completed_by_assignee = db.query(
            Employee.full_name, 
            func.count(Request.id)
        ).join(
            Request, Employee.id == Request.assignee_id
        ).filter(
            Request.status == RequestStatus.COMPLETED.value
        ).group_by(Employee.full_name).all()
        
        return {
            "by_status": {status: count for status, count in status_counts},
            "overdue_total": overdue_count,
            "completed_by_assignee": [{"name": name, "count": count} for name, count in completed_by_assignee]
        }