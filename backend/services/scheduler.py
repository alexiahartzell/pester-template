import json
from datetime import date, datetime
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler

from backend.config import get_config_value
from backend.db import SessionLocal
from backend.models import Task, TaskStatus
from backend.services.slack import post_message
from backend.services.notifier import notify

scheduler = BackgroundScheduler()
_STATE_PATH = Path.home() / ".pester" / "nudge_state.json"
_HOURS_PATH = Path.home() / ".pester" / "hours.json"
_HOURS_LOG_PATH = Path.home() / ".pester" / "hours_log.json"


def _send(text: str):
    if not post_message(text):
        notify("pester", text)


def _missed_review_yesterday() -> bool:
    """True if no review was run yesterday."""
    from datetime import timedelta
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    try:
        state = json.loads(_STATE_PATH.read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return False
    return state.get("date") == yesterday and "review" not in state


def _already_sent_today(key: str) -> bool:
    today = date.today().isoformat()
    try:
        state = json.loads(_STATE_PATH.read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        state = {}
    return state.get("date") == today and key in state


def _mark_sent(key: str):
    today = date.today().isoformat()
    try:
        state = json.loads(_STATE_PATH.read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        state = {}
    if state.get("date") != today:
        state = {"date": today}
    state[key] = True
    _STATE_PATH.write_text(json.dumps(state))


def morning_nudge():
    _send("Time to plan your day. Open pester to get started.")


def overdue_check():
    db = SessionLocal()
    try:
        today = date.today()
        overdue = db.query(Task).filter(
            Task.status == TaskStatus.active,
            Task.due != None,
            Task.due < today,
        ).all()
        if overdue:
            count = len(overdue)
            titles = ", ".join(t.title for t in overdue[:3])
            msg = f"You have {count} overdue task{'s' if count > 1 else ''}: {titles}"
            if count > 3:
                msg += f" (+{count - 3} more)"
            _send(msg)
    finally:
        db.close()


# --- Hours tracking ---

HOURS_START_DATE = date(2026, 3, 22)  # Start tracking Sunday 2026-03-22


def record_start():
    """Record the server start time as the day's work start."""
    today = date.today()
    if today < HOURS_START_DATE:
        return
    data = _load_hours()
    if data.get("date") != today.isoformat():
        data = {"date": today.isoformat(), "start": datetime.now().isoformat(), "end": None, "hours": None}
    elif not data.get("start"):
        data["start"] = datetime.now().isoformat()
    _save_hours(data)


def record_end():
    """Record review time as the day's work end and compute hours."""
    today = date.today()
    if today < HOURS_START_DATE:
        return {"date": today.isoformat(), "hours": None}
    data = _load_hours()
    now = datetime.now()
    data["end"] = now.isoformat()
    if data.get("date") == today.isoformat() and data.get("start"):
        start = datetime.fromisoformat(data["start"])
        delta = now - start
        data["hours"] = round(delta.total_seconds() / 3600, 1)
    _save_hours(data)
    _log_day(data)
    return data


def _log_day(data: dict):
    """Append today's hours to the persistent log."""
    log = _load_hours_log()
    # Replace existing entry for same date
    log = [e for e in log if e.get("date") != data.get("date")]
    log.append({"date": data["date"], "hours": data.get("hours", 0), "start": data.get("start"), "end": data.get("end")})
    _HOURS_LOG_PATH.write_text(json.dumps(log))


def _load_hours_log() -> list:
    try:
        return json.loads(_HOURS_LOG_PATH.read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return []


def get_today_hours() -> dict:
    from datetime import timedelta
    today = date.today()
    if today < HOURS_START_DATE:
        return {"date": today.isoformat(), "today_hours": 0, "week_hours": 0, "avg_hours_per_week": None, "started": False, "reviewed": False}
    data = _load_hours()

    today_hours = 0.0
    if data.get("date") == today.isoformat() and data.get("start"):
        start = datetime.fromisoformat(data["start"])
        end = datetime.fromisoformat(data["end"]) if data.get("end") else datetime.now()
        today_hours = round((end - start).total_seconds() / 3600, 1)

    # Weekly total (Sun-Sat)
    week_start = today - timedelta(days=(today.weekday() + 1) % 7)
    log = _load_hours_log()
    week_hours = sum(
        e.get("hours", 0) or 0
        for e in log
        if e.get("date") and e["date"] >= week_start.isoformat() and e["date"] < today.isoformat()
    )
    # Add today
    week_hours = round(week_hours + today_hours, 1)

    # Monthly avg (last 4 weeks, Sun-Sat)
    four_weeks_ago = today - timedelta(weeks=4)
    weekly_totals: dict[str, float] = {}
    for e in log:
        if not e.get("date") or not e.get("hours"):
            continue
        d = date.fromisoformat(e["date"])
        if d < four_weeks_ago:
            continue
        ws = (d - timedelta(days=(d.weekday() + 1) % 7)).isoformat()
        weekly_totals[ws] = weekly_totals.get(ws, 0) + (e["hours"] or 0)
    # Add current week (including today)
    current_ws = week_start.isoformat()
    weekly_totals[current_ws] = week_hours

    completed_weeks = [h for ws, h in weekly_totals.items() if ws != current_ws]
    avg_hours_per_week = round(sum(completed_weeks) / len(completed_weeks), 1) if completed_weeks else None

    return {
        "date": today.isoformat(),
        "today_hours": today_hours,
        "week_hours": week_hours,
        "avg_hours_per_week": avg_hours_per_week,
        "started": bool(data.get("start") and data.get("date") == today.isoformat()),
        "reviewed": bool(data.get("end") and data.get("date") == today.isoformat()),
    }


def _load_hours() -> dict:
    try:
        return json.loads(_HOURS_PATH.read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return {}


def _save_hours(data: dict):
    _HOURS_PATH.write_text(json.dumps(data))


# --- Scheduler ---

def start_scheduler():
    scheduler.add_job(
        lambda: (overdue_check(), _mark_sent("overdue")),
        "cron", hour=12, minute=0, id="overdue_check",
    )
    scheduler.start()

    # Record work start time
    record_start()

    # Morning nudge on startup
    if not _already_sent_today("morning"):
        if _missed_review_yesterday():
            _send("You skipped yesterday's review. Open pester to wrap up before starting today.")
        morning_nudge()
        _mark_sent("morning")


def stop_scheduler():
    scheduler.shutdown(wait=False)
