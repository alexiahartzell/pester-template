import enum
from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Date, Time, DateTime, Enum, Text, JSON
from sqlalchemy.sql import func

from backend.db import Base


class TaskStatus(str, enum.Enum):
    inbox = "inbox"
    active = "active"
    done = "done"
    dropped = "dropped"


class TaskPriority(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    project = Column(String, nullable=True)
    due = Column(Date, nullable=True)
    deadline_type = Column(String, nullable=True)  # "hard" or "soft"
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    recurrence = Column(String, nullable=True)  # "weekly", "biweekly", etc.
    difficulty = Column(String, nullable=True)  # "easy", "medium", "hard"
    priority = Column(Enum(TaskPriority), default=TaskPriority.medium)
    status = Column(Enum(TaskStatus), default=TaskStatus.inbox, nullable=False)
    task_type = Column(String, nullable=True)
    category = Column(String, nullable=True)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


# --- Pydantic schemas ---

class TaskCreate(BaseModel):
    title: str
    project: Optional[str] = None
    due: Optional[date] = None
    deadline_type: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    recurrence: Optional[str] = None
    difficulty: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: TaskStatus = TaskStatus.inbox
    task_type: Optional[str] = None
    category: Optional[str] = None
    tags: list[str] = []
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    project: Optional[str] = None
    due: Optional[date] = None
    deadline_type: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    recurrence: Optional[str] = None
    difficulty: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    task_type: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    notes: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    project: Optional[str]

    due: Optional[date]
    deadline_type: Optional[str]
    start_time: Optional[time]
    end_time: Optional[time]
    recurrence: Optional[str]
    difficulty: Optional[str]
    priority: TaskPriority
    status: TaskStatus
    task_type: Optional[str]
    category: Optional[str]
    tags: list[str]
    created_at: datetime
    completed_at: Optional[datetime]
    notes: Optional[str]

    model_config = {"from_attributes": True}
