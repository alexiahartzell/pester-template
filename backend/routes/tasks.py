from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Task, TaskCreate, TaskUpdate, TaskResponse, TaskStatus

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _next_recurrence_date(current_due: date, recurrence: str) -> date:
    if recurrence == "daily":
        return current_due + timedelta(days=1)
    elif recurrence == "weekly":
        return current_due + timedelta(weeks=1)
    elif recurrence == "biweekly":
        return current_due + timedelta(weeks=2)
    elif recurrence == "monthly":
        month = current_due.month % 12 + 1
        year = current_due.year + (1 if month == 1 else 0)
        day = min(current_due.day, 28)
        return current_due.replace(year=year, month=month, day=day)
    return current_due + timedelta(weeks=1)


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status: Optional[TaskStatus] = None,
    project: Optional[str] = None,
    category: Optional[str] = None,
    due_before: Optional[date] = None,
    due_after: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Task)
    if status:
        q = q.filter(Task.status == status)
    if project:
        q = q.filter(Task.project == project)
    if category:
        q = q.filter(Task.category == category)
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
    if "status" in update_data:
        if update_data["status"] == TaskStatus.done:
            update_data["completed_at"] = datetime.now()
        elif update_data["status"] == TaskStatus.active:
            update_data["completed_at"] = None
    for key, value in update_data.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)

    # Auto-create next instance for recurring tasks
    if task.status == TaskStatus.done and task.recurrence and task.due:
        next_due = _next_recurrence_date(task.due, task.recurrence)
        next_task = Task(
            title=task.title,
            project=task.project,
            due=next_due,
            deadline_type=task.deadline_type,
            start_time=task.start_time,
            end_time=task.end_time,
            recurrence=task.recurrence,
            priority=task.priority,
            status=TaskStatus.active,
            task_type=task.task_type,
            category=task.category,
            tags=task.tags,
            notes=task.notes,
        )
        db.add(next_task)
        db.commit()

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
    # Sun-Sat week
    week_start = today - timedelta(days=today.weekday() + 1 if today.weekday() != 6 else 0)
    week_end = week_start + timedelta(days=6)
    inbox_count = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.inbox).scalar()
    week_count = db.query(func.count(Task.id)).filter(
        Task.status == TaskStatus.active,
        Task.due != None,
        Task.due >= week_start,
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
    categories_count = db.query(func.count(func.distinct(Task.category))).filter(
        Task.status == TaskStatus.active,
        Task.category != None,
    ).scalar()
    return {
        "inbox": inbox_count,
        "this_week": week_count,
        "overdue": overdue_count,
        "done_today": done_today_count,
        "projects": projects_count,
        "categories": categories_count,
    }


@router.get("/completion")
def get_completion(weeks: int = Query(default=4, ge=1, le=52), db: Session = Depends(get_db)):
    today = date.today()
    start = today - timedelta(weeks=weeks)

    # Get all resolved tasks (done or dropped) within the window
    resolved = db.query(Task).filter(
        Task.status.in_([TaskStatus.done, TaskStatus.dropped]),
        Task.completed_at != None,
        func.date(Task.completed_at) >= start,
    ).all()

    # Group by category and week
    from collections import defaultdict
    cat_weeks: dict[str, dict[str, dict]] = defaultdict(lambda: defaultdict(lambda: {"done": 0, "total": 0}))
    overall_weeks: dict[str, dict] = defaultdict(lambda: {"done": 0, "total": 0})

    for t in resolved:
        cat = t.category or "uncategorized"
        # Week start (Monday)
        d = t.completed_at.date()
        week_start = (d - timedelta(days=(d.weekday() + 1) % 7)).isoformat()

        cat_weeks[cat][week_start]["total"] += 1
        overall_weeks[week_start]["total"] += 1
        if t.status == TaskStatus.done:
            cat_weeks[cat][week_start]["done"] += 1
            overall_weeks[week_start]["done"] += 1

    def build_weeks(data: dict[str, dict]) -> list[dict]:
        result = []
        for week in sorted(data.keys()):
            d, t = data[week]["done"], data[week]["total"]
            result.append({"week": week, "done": d, "total": t, "pct": round(d / t * 100) if t else 0})
        return result

    categories = {cat: build_weeks(weeks_data) for cat, weeks_data in sorted(cat_weeks.items())}
    overall = build_weeks(overall_weeks)

    # Overall totals
    total_done = sum(w["done"] for w in overall)
    total_all = sum(w["total"] for w in overall)

    return {
        "categories": categories,
        "overall": overall,
        "total_pct": round(total_done / total_all * 100) if total_all else 0,
        "total_done": total_done,
        "total_resolved": total_all,
    }


@router.get("/distribution")
def get_distribution(db: Session = Depends(get_db)):
    """Task counts by category for the current Sun-Sat week."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday() + 1 if today.weekday() != 6 else 0)
    week_end = week_start + timedelta(days=6)

    # Active + done tasks due this week
    tasks = db.query(Task).filter(
        Task.status.in_([TaskStatus.active, TaskStatus.done]),
        Task.due != None,
        Task.due >= week_start,
        Task.due <= week_end,
    ).all()

    from collections import Counter
    counts: Counter = Counter()
    for t in tasks:
        counts[t.category or "uncategorized"] += 1

    total = sum(counts.values())
    slices = [
        {"category": cat, "count": count, "pct": round(count / total * 100) if total else 0}
        for cat, count in counts.most_common()
    ]
    return {"week_start": week_start.isoformat(), "total": total, "slices": slices}
