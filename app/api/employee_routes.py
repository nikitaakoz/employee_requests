from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.models.database import Employee, get_db

router = APIRouter(prefix="/employees", tags=["Сотрудники"])

class EmployeeCreate(BaseModel):
    full_name: str
    department: str
    position: str

class EmployeeResponse(BaseModel):
    id: int
    full_name: str
    department: str
    position: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Employee).offset(skip).limit(limit).all()

@router.post("/", response_model=EmployeeResponse)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

# ВАЖНО: этот маршрут должен быть ВЫШЕ /{employee_id}
@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    """Получить список уникальных подразделений"""
    departments = db.query(Employee.department).distinct().order_by(Employee.department).all()
    return [dept[0] for dept in departments]

@router.get("/positions")
def get_positions(db: Session = Depends(get_db)):
    """Получить список уникальных должностей"""
    positions = db.query(Employee.position).distinct().order_by(Employee.position).all()
    return [pos[0] for pos in positions]

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return employee