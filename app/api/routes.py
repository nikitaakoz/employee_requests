from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.models.database import Request, Employee, get_db
from app.schemas.request import RequestCreate, RequestUpdate, RequestResponse, RequestFilter
from app.services.request_service import RequestService

router = APIRouter(prefix="/requests", tags=["Заявки"])

@router.post("/", response_model=RequestResponse)
def create_request(request: RequestCreate, db: Session = Depends(get_db)):
    return RequestService.create_request(db, request)

@router.patch("/{request_id}/status")
def update_status(request_id: int, new_status: str, db: Session = Depends(get_db)):
    return RequestService.update_status(db, request_id, new_status)

@router.patch("/{request_id}/assignee")
def update_assignee(request_id: int, new_assignee_id: int, db: Session = Depends(get_db)):
    return RequestService.update_assignee(db, request_id, new_assignee_id)

@router.get("/")
def get_requests(
    status: str = None,
    assignee_id: int = None,
    department: str = None,
    is_overdue: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    filters = RequestFilter(
        status=status,
        assignee_id=assignee_id,
        department=department,
        is_overdue=is_overdue
    )
    requests = RequestService.get_filtered_requests(db, filters, skip, limit)
    
    # Преобразуем в словарь с данными сотрудников
    result = []
    for req in requests:
        result.append({
            "id": req.id,
            "number": req.number,
            "description": req.description,
            "due_date": req.due_date,
            "created_at": req.created_at,
            "status": req.status,
            "author_id": req.author_id,
            "assignee_id": req.assignee_id,
            "author_name": req.author.full_name if req.author else f"ID {req.author_id}",
            "assignee_name": req.assignee.full_name if req.assignee else f"ID {req.assignee_id}"
        })
    return result

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    return RequestService.get_reports(db)

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    """Получить список уникальных подразделений"""
    departments = db.query(Employee.department).distinct().order_by(Employee.department).all()
    return [dept[0] for dept in departments]