from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class RequestBase(BaseModel):
    description: str
    due_date: datetime
    author_id: int
    assignee_id: int

class RequestCreate(RequestBase):
    pass

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None

class RequestResponse(RequestBase):
    id: int
    number: str
    created_at: datetime
    status: str

    class Config:
        from_attributes = True

class RequestFilter(BaseModel):
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    department: Optional[str] = None
    is_overdue: Optional[bool] = None