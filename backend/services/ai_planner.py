from datetime import date, datetime
from typing import Optional

import anthropic

from backend.config import get_config_value
from backend.models import TaskResponse, TaskStatus


def _get_client() -> anthropic.Anthropic:
    api_key = get_config_value("anthropic_api_key")
    if not api_key:
        raise RuntimeError("anthropic_api_key not set in ~/.pester/config.yaml")
    return anthropic.Anthropic(api_key=api_key)


def _tasks_to_context(tasks: list[TaskResponse]) -> str:
    lines = []
    for t in tasks:
        parts = [f"[{t.id}] {t.title}"]
        if t.due:
            parts.append(f"due:{t.due}")
        if t.priority:
            parts.append(f"priority:{t.priority.value}")
        if t.source:
            parts.append(f"from:{t.source}")
        if t.project:
            parts.append(f"project:{t.project}")
        if t.task_type:
            parts.append(f"type:{t.task_type}")
        if t.status:
            parts.append(f"status:{t.status.value}")
        lines.append(" | ".join(parts))
    return "\n".join(lines)


def process_inbox(inbox_tasks: list[TaskResponse]) -> str:
    client = _get_client()
    task_text = _tasks_to_context(inbox_tasks)

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            "You are a task management assistant for a computational physics grad student. "
            "Categorize each inbox task: infer project, source, task_type (quick/deep work/reading), "
            "and suggest a priority and deadline if obvious. "
            "Respond with a JSON array of objects, each with: "
            "id, title, suggested_project, suggested_source, suggested_task_type, suggested_priority (high/medium/low), "
            "suggested_due (YYYY-MM-DD or null), reasoning (one sentence). "
            "Only return the JSON array, no other text."
        ),
        messages=[{"role": "user", "content": f"Categorize these inbox tasks:\n{task_text}"}],
    )
    return response.content[0].text


def plan_day(active_tasks: list[TaskResponse], done_today_count: int) -> str:
    client = _get_client()
    task_text = _tasks_to_context(active_tasks)
    today = date.today().isoformat()

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            "You are a task management assistant for a computational physics grad student. "
            "Generate a prioritized daily checklist from the active tasks. Rules:\n"
            "- Tasks due today or overdue go first.\n"
            "- Mix in 1-2 quick wins early for momentum if the day is heavy.\n"
            "- If no reading has been done recently, suggest a reading block.\n"
            "- Flag if there are too many tasks and suggest what to defer.\n"
            "- Respond with a JSON object: {plan: [{id, title, reason}], deferred: [{id, title, reason}], note: string|null}. "
            "The plan array is the ordered checklist. Only return JSON."
        ),
        messages=[{
            "role": "user",
            "content": f"Today is {today}. Tasks done today: {done_today_count}. Active tasks:\n{task_text}",
        }],
    )
    return response.content[0].text


def reprioritize(active_tasks: list[TaskResponse], current_plan: list[dict], context: str) -> str:
    client = _get_client()
    task_text = _tasks_to_context(active_tasks)
    today = date.today().isoformat()

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            "You are a task management assistant. The user's plans changed and they need a new daily plan. "
            "Respond with the same JSON format: {plan: [{id, title, reason}], deferred: [{id, title, reason}], note: string|null}. "
            "Only return JSON."
        ),
        messages=[{
            "role": "user",
            "content": (
                f"Today is {today}. Here's what changed: {context}\n\n"
                f"Current active tasks:\n{task_text}"
            ),
        }],
    )
    return response.content[0].text


def generate_review(planned_tasks: list[dict], all_tasks: list[TaskResponse]) -> str:
    client = _get_client()
    task_text = _tasks_to_context(all_tasks)

    planned_summary = "\n".join(
        f"[{t['id']}] {t['title']}" for t in planned_tasks
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            "You are a task management assistant. Generate an evening review. "
            "For each planned task, note if it was completed or not. "
            "For uncompleted tasks, suggest: move to tomorrow, drop, or reschedule. "
            "Respond with JSON: {completed: [{id, title}], uncompleted: [{id, title, suggestion, reason}], summary: string}. "
            "Only return JSON."
        ),
        messages=[{
            "role": "user",
            "content": (
                f"Today's plan was:\n{planned_summary}\n\n"
                f"Current task states:\n{task_text}"
            ),
        }],
    )
    return response.content[0].text
