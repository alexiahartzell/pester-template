import json
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Task, TaskResponse, TaskStatus
from backend.services.ai_planner import plan_day, process_inbox, generate_review
from backend.services.scheduler import _mark_sent, record_end, get_today_hours
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


@router.post("/process-inbox")
def run_process_inbox(db: Session = Depends(get_db)):
    inbox_tasks = db.query(Task).filter(Task.status == TaskStatus.inbox).all()
    if not inbox_tasks:
        return {"inbox_suggestions": []}
    inbox_schemas = [TaskResponse.model_validate(t) for t in inbox_tasks]
    raw = process_inbox(inbox_schemas)

    ai_suggestions = []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict) and "tasks" in parsed:
            ai_suggestions = parsed["tasks"]
        elif isinstance(parsed, list):
            ai_suggestions = parsed
    except json.JSONDecodeError:
        pass

    # Pair by position — never trust AI-returned IDs
    results = []
    for i, task in enumerate(inbox_tasks):
        suggestion = ai_suggestions[i] if i < len(ai_suggestions) and isinstance(ai_suggestions[i], dict) else {}
        results.append({
            "original_id": task.id,
            "original_title": task.title,
            "suggested_title": suggestion.get("title", task.title),
            "suggested_category": suggestion.get("suggested_category"),
            "suggested_project": suggestion.get("suggested_project"),
            "suggested_priority": suggestion.get("suggested_priority", "medium"),
            "suggested_due": suggestion.get("suggested_due"),
            "suggested_deadline_type": suggestion.get("suggested_deadline_type"),
            "suggested_start_time": suggestion.get("suggested_start_time"),
            "suggested_end_time": suggestion.get("suggested_end_time"),
            "suggested_difficulty": suggestion.get("suggested_difficulty"),
            "suggested_recurrence": suggestion.get("suggested_recurrence"),
            "reasoning": suggestion.get("reasoning", ""),
            "needs_clarification": suggestion.get("needs_clarification", False),
            "clarification_prompt": suggestion.get("clarification_prompt"),
        })

    return {"inbox_suggestions": results}


@router.post("/plan-day")
def run_plan_day(db: Session = Depends(get_db)):
    active_tasks = db.query(Task).filter(Task.status == TaskStatus.active).all()
    today = date.today()

    if active_tasks:
        active_schemas = [TaskResponse.model_validate(t) for t in active_tasks]
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
            "date": today.isoformat(),
            "plan": plan_data.get("plan", []),
            "deferred": plan_data.get("deferred", []),
            "note": plan_data.get("note"),
        }
        _save_plan(today_plan)
        post_message(format_plan_message(today_plan))
    else:
        today_plan = {
            "date": today.isoformat(),
            "plan": [],
            "deferred": [],
            "note": None,
        }
        _save_plan(today_plan)

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

    # Record work end time and compute hours
    hours_data = record_end()

    # Post to Slack
    hours_msg = ""
    if hours_data.get("hours"):
        hours_msg = f"\n*Hours worked:* {hours_data['hours']}h"
    post_message(format_review_message(review_data) + hours_msg)
    _mark_sent("review")

    return {**review_data, "hours": hours_data}


@router.get("/hours/today")
def get_hours():
    return get_today_hours()


@router.get("/plan/today")
def get_today_plan():
    today = date.today().isoformat()
    current_plan = _load_plan()
    if current_plan.get("date") != today:
        return {"date": today, "plan": [], "deferred": [], "note": "No plan generated yet. Run standup first."}
    return current_plan
