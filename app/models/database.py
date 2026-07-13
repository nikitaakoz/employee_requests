from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, create_engine
from sqlalchemy.orm import relationship, declarative_base, sessionmaker
from datetime import datetime
import enum

Base = declarative_base()

# Конфигурация подключения к БД
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/employee_requests"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Статусы заявок (используем для логики в Python)
class RequestStatus(enum.Enum):
    NEW = "Новая"
    IN_PROGRESS = "В работе"
    COMPLETED = "Выполнена"

# Модель сотрудника
class Employee(Base):
    __tablename__ = 'employees'
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)
    position = Column(String(100), nullable=False)
    
    # Связи
    created_requests = relationship("Request", foreign_keys="[Request.author_id]", back_populates="author")
    assigned_requests = relationship("Request", foreign_keys="[Request.assignee_id]", back_populates="assignee")

# Модель заявки
class Request(Base):
    __tablename__ = 'requests'
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    author_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    assignee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(DateTime, nullable=False)
    
    # ИЗМЕНЕНО: тип поля status изменен с Enum на String для корректной массовой вставки
    status = Column(String(50), default=RequestStatus.NEW.value, nullable=False)
    
    # Связи
    author = relationship("Employee", foreign_keys=[author_id], back_populates="created_requests")
    assignee = relationship("Employee", foreign_keys=[assignee_id], back_populates="assigned_requests")