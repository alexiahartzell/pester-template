from datetime import date

from apscheduler.schedulers.background import BackgroundScheduler

from backend.config import get_config_value
from backend.db import SessionLocal
from backend.models import Task, TaskStatus
from backend.services.slack import post_message
from backend.services.notifier import notify

scheduler = BackgroundScheduler()


def _send(text: str):
    if not post_message(text):
        notify("pester", text)


def morning_nudge():
    _send("Your morning standup is waiting. Open pester to plan your day.")


def evening_nudge():
    _send("Time to review your day. Open pester to wrap up.")


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


def start_scheduler():
    morning_time = get_config_value("morning_nudge_time", "09:00")
    evening_time = get_config_value("evening_review_time", "17:30")

    m_hour, m_min = morning_time.split(":")
    e_hour, e_min = evening_time.split(":")

    scheduler.add_job(morning_nudge, "cron", hour=int(m_hour), minute=int(m_min), id="morning_nudge")
    scheduler.add_job(evening_nudge, "cron", hour=int(e_hour), minute=int(e_min), id="evening_nudge")
    scheduler.add_job(overdue_check, "cron", hour=12, minute=0, id="overdue_check")
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown(wait=False)
