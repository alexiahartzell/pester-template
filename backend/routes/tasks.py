from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Task, TaskCreate, TaskUpdate, TaskResponse, TaskStatus

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status: Optional[TaskStatus] = None,
    project: Optional[str] = None,
    source: Optional[str] = None,
    due_before: Optional[date] = None,
    due_after: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Task)
    if status:
        q = q.filter(Task.status == status)
    if project:
        q = q.filter(Task.project == project)
    if source:
        q = q.filter(Task.source == source)
    if due_before:
        q = q.filter(Task.due <= due_before)
    if due_after:
        q = q.filter(Task.due >= due_after)
    return q.order_by(Task.due.asc().nullslast(), Task.created_at.desc()).all()


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, updates: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = updates.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] == TaskStatus.done:
        update_data["completed_at"] = datetime.now()
    for key, value in update_data.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    today = date.today()
    week_end = today + timedelta(days=7)
    inbox_count = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.inbox).scalar()
    week_count = db.query(func.count(Task.id)).filter(
        Task.status == TaskStatus.active,
        Task.due != None,
        Task.due <= week_end,
    ).scalar()
    overdue_count = db.query(func.count(Task.id)).filter(
        Task.status == TaskStatus.active,
        Task.due != None,
        Task.due < today,
    ).scalar()
    done_today_count = db.query(func.count(Task.id)).filter(
        Task.status == TaskStatus.done,
        func.date(Task.completed_at) == today,
    ).scalar()
    projects_count = db.query(func.count(func.distinct(Task.project))).filter(
        Task.status == TaskStatus.active,
        Task.project != None,
    ).scalar()
    return {
        "inbox": inbox_count,
        "this_week": week_count,
        "overdue": overdue_count,
        "done_today": done_today_count,
        "projects": projects_count,
    }
