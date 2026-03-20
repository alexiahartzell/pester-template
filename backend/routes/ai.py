import json
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Task, TaskResponse, TaskStatus
from backend.services.ai_planner import plan_day, process_inbox, reprioritize, generate_review
from backend.services.slack import post_message, format_plan_message, format_review_message

router = APIRouter(tags=["ai"])

_PLAN_PATH = Path.home() / ".pester" / "today_plan.json"


def _load_plan() -> dict:
    if _PLAN_PATH.exists():
        try:
            return json.loads(_PLAN_PATH.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return {"date": None, "plan": [], "deferred": [], "note": None}


def _save_plan(plan: dict):
    _PLAN_PATH.write_text(json.dumps(plan))


@router.post("/standup")
def run_standup(db: Session = Depends(get_db)):
    inbox_tasks = db.query(Task).filter(Task.status == TaskStatus.inbox).all()
    inbox_suggestions = None
    if inbox_tasks:
        inbox_schemas = [TaskResponse.model_validate(t) for t in inbox_tasks]
        raw = process_inbox(inbox_schemas)
        try:
            parsed = json.loads(raw)
            # Ollama wraps arrays in an object — extract the array
            if isinstance(parsed, dict) and "tasks" in parsed:
                inbox_suggestions = parsed["tasks"]
            elif isinstance(parsed, list):
                inbox_suggestions = parsed
            else:
                inbox_suggestions = parsed
        except json.JSONDecodeError:
            inbox_suggestions = raw

    active_tasks = db.query(Task).filter(Task.status == TaskStatus.active).all()
    active_schemas = [TaskResponse.model_validate(t) for t in active_tasks]
    today = date.today()
    done_today = db.query(Task).filter(
        Task.status == TaskStatus.done,
        func.date(Task.completed_at) == today,
    ).count()

    raw_plan = plan_day(active_schemas, done_today)
    try:
        plan_data = json.loads(raw_plan)
    except json.JSONDecodeError:
        plan_data = {"plan": [], "deferred": [], "note": raw_plan}

    today_plan = {
        "date": date.today().isoformat(),
        "plan": plan_data.get("plan", []),
        "deferred": plan_data.get("deferred", []),
        "note": plan_data.get("note"),
    }
    _save_plan(today_plan)

    # Post to Slack
    post_message(format_plan_message(today_plan))

    return {
        "inbox_suggestions": inbox_suggestions,
        "plan": today_plan,
    }


class ReprioritizeRequest(BaseModel):
    context: str


@router.post("/reprioritize")
def run_reprioritize(req: ReprioritizeRequest, db: Session = Depends(get_db)):
    active_tasks = db.query(Task).filter(Task.status == TaskStatus.active).all()
    active_schemas = [TaskResponse.model_validate(t) for t in active_tasks]
    current_plan = _load_plan()

    raw = reprioritize(active_schemas, current_plan.get("plan", []), req.context)
    try:
        plan_data = json.loads(raw)
    except json.JSONDecodeError:
        plan_data = {"plan": [], "deferred": [], "note": raw}

    today_plan = {
        "date": date.today().isoformat(),
        "plan": plan_data.get("plan", []),
        "deferred": plan_data.get("deferred", []),
        "note": plan_data.get("note"),
    }
    _save_plan(today_plan)

    # Post to Slack
    post_message("Plans reshuffled.\n" + format_plan_message(today_plan))

    return {"plan": today_plan}


@router.post("/review")
def run_review(db: Session = Depends(get_db)):
    all_tasks = db.query(Task).filter(
        Task.status.in_([TaskStatus.active, TaskStatus.done])
    ).all()
    all_schemas = [TaskResponse.model_validate(t) for t in all_tasks]

    current_plan = _load_plan()
    raw = generate_review(current_plan.get("plan", []), all_schemas)
    try:
        review_data = json.loads(raw)
    except json.JSONDecodeError:
        review_data = {"summary": raw, "completed": [], "uncompleted": []}

    # Post to Slack
    post_message(format_review_message(review_data))

    return review_data


@router.get("/plan/today")
def get_today_plan():
    today = date.today().isoformat()
    current_plan = _load_plan()
    if current_plan.get("date") != today:
        return {"date": today, "plan": [], "deferred": [], "note": "No plan generated yet. Run standup first."}
    return current_plan
