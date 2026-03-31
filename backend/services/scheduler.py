import json
from datetime import date, datetime, timedelta
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

def _get_hours_start_date() -> date:
    from backend.config import get_config_value
    val = get_config_value("hours_start_date")
    if val:
        return date.fromisoformat(str(val))
    return date.today()


def _close_out_previous_day():
    """If there's an open period from a previous day, close it and log."""
    data = _load_hours()
    today = date.today().isoformat()
    if not data.get("date") or data["date"] == today:
        return
    periods = data.get("periods", [])
    # Close any open period
    for p in periods:
        if not p.get("end"):
            # Cap at end of that day
            end_of_day = data["date"] + "T23:59:59"
            p["end"] = end_of_day
    data["periods"] = periods
    _save_hours(data)
    _log_day(data)


def _calc_total(periods: list) -> float:
    """Sum hours across all periods."""
    total = 0.0
    for p in periods:
        if not p.get("start"):
            continue
        start = datetime.fromisoformat(p["start"])
        end = datetime.fromisoformat(p["end"]) if p.get("end") else datetime.now()
        total += (end - start).total_seconds() / 3600
    return round(total, 1)


def record_start():
    """Auto-called on boot. Starts a new period for today."""
    today = date.today()
    if today < _get_hours_start_date():
        return
    data = _load_hours()
    if data.get("date") != today.isoformat():
        _close_out_previous_day()
        data = {"date": today.isoformat(), "periods": [{"start": datetime.now().isoformat(), "end": None}]}
    else:
        periods = data.get("periods", [])
        # Only add a new period if there isn't an open one
        if not periods or periods[-1].get("end"):
            periods.append({"start": datetime.now().isoformat(), "end": None})
            data["periods"] = periods
    _save_hours(data)


def clock_out():
    """Close the current open period."""
    today = date.today()
    if today < _get_hours_start_date():
        return get_today_hours()
    data = _load_hours()
    if data.get("date") != today.isoformat():
        return get_today_hours()
    periods = data.get("periods", [])
    if periods and not periods[-1].get("end"):
        periods[-1]["end"] = datetime.now().isoformat()
    data["periods"] = periods
    _save_hours(data)
    _log_day(data)
    return get_today_hours()


def clock_in():
    """Start a new period (after clocking out)."""
    today = date.today()
    if today < _get_hours_start_date():
        return get_today_hours()
    data = _load_hours()
    if data.get("date") != today.isoformat():
        data = {"date": today.isoformat(), "periods": []}
    periods = data.get("periods", [])
    # Only if last period is closed
    if not periods or periods[-1].get("end"):
        periods.append({"start": datetime.now().isoformat(), "end": None})
    data["periods"] = periods
    _save_hours(data)
    return get_today_hours()


def update_periods(periods: list) -> dict:
    """Replace today's periods with manually edited ones."""
    today = date.today()
    data = {"date": today.isoformat(), "periods": periods}
    _save_hours(data)
    _log_day(data)
    return get_today_hours()


def _log_day(data: dict):
    """Log today's total hours."""
    log = _load_hours_log()
    periods = data.get("periods", [])
    total = _calc_total(periods)
    log = [e for e in log if e.get("date") != data.get("date")]
    log.append({"date": data["date"], "hours": total})
    _HOURS_LOG_PATH.write_text(json.dumps(log))


def _load_hours_log() -> list:
    try:
        return json.loads(_HOURS_LOG_PATH.read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return []


def get_today_hours() -> dict:
    today = date.today()
    if today < _get_hours_start_date():
        return {"date": today.isoformat(), "today_hours": 0, "week_hours": 0,
                "avg_hours_per_week": None, "clocked_in": False, "periods": []}
    data = _load_hours()

    periods = data.get("periods", []) if data.get("date") == today.isoformat() else []
    today_hours = _calc_total(periods)
    clocked_in = bool(periods and not periods[-1].get("end"))

    # Weekly total (Sun-Sat)
    week_start = today - timedelta(days=(today.weekday() + 1) % 7)
    log = _load_hours_log()
    week_hours = sum(
        e.get("hours", 0) or 0
        for e in log
        if e.get("date") and e["date"] >= week_start.isoformat() and e["date"] < today.isoformat()
    )
    week_hours = round(week_hours + today_hours, 1)

    # Monthly avg (last 4 weeks)
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
    current_ws = week_start.isoformat()
    weekly_totals[current_ws] = week_hours
    completed_weeks = [h for ws, h in weekly_totals.items() if ws != current_ws]
    avg_hours_per_week = round(sum(completed_weeks) / len(completed_weeks), 1) if completed_weeks else None

    return {
        "date": today.isoformat(),
        "today_hours": today_hours,
        "week_hours": week_hours,
        "avg_hours_per_week": avg_hours_per_week,
        "clocked_in": clocked_in,
        "periods": periods,
    }


def _load_hours() -> dict:
    try:
        return json.loads(_HOURS_PATH.read_text())
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return {}


def _save_hours(data: dict):
    _HOURS_PATH.write_text(json.dumps(data))


# --- Scheduler ---

def _daily_check():
    """Runs periodically to catch new days even if server never restarted."""
    if not _already_sent_today("morning"):
        record_start()
        if _missed_review_yesterday():
            _send("You skipped yesterday's review. Open pester to wrap up before starting today.")
        morning_nudge()
        _mark_sent("morning")


def start_scheduler():
    scheduler.add_job(
        lambda: (overdue_check(), _mark_sent("overdue")),
        "cron", hour=12, minute=0, id="overdue_check",
    )
    scheduler.add_job(
        _daily_check, "interval", minutes=15, id="daily_check",
    )
    scheduler.start()

    # Run immediately on startup too
    record_start()
    if not _already_sent_today("morning"):
        if _missed_review_yesterday():
            _send("You skipped yesterday's review. Open pester to wrap up before starting today.")
        morning_nudge()
        _mark_sent("morning")


def stop_scheduler():
    scheduler.shutdown(wait=False)
