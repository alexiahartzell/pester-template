from datetime import date

import httpx

from backend.config import get_config_value
from backend.models import TaskResponse

OLLAMA_URL = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "llama3.2:3b"


def _chat(system: str, user: str) -> str:
    """Send a chat request to Ollama and return the response text."""
    model = get_config_value("ollama_model", DEFAULT_MODEL)
    resp = httpx.post(
        OLLAMA_URL,
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
            "options": {"temperature": 0.3, "num_ctx": 2048},
            "format": "json",
            "keep_alive": "5m",
        },
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["message"]["content"]


def _tasks_to_context(tasks: list[TaskResponse]) -> str:
    lines = []
    for t in tasks:
        parts = [f"[{t.id}] {t.title}"]
        if t.due:
            dl = f"due:{t.due}"
            if t.deadline_type:
                dl += f"({t.deadline_type})"
            parts.append(dl)
        if t.priority:
            parts.append(f"priority:{t.priority.value}")

        if t.project:
            parts.append(f"project:{t.project}")
        if t.task_type:
            parts.append(f"type:{t.task_type}")
        if t.status:
            parts.append(f"status:{t.status.value}")
        lines.append(" | ".join(parts))
    return "\n".join(lines)


CATEGORIES = [
    "my research", "group research",
    "my code", "group code",
    "my admin", "group admin",
    "my meetings", "group meetings",
    "coursework", "mentoring",
]


def _inbox_to_context(tasks: list[TaskResponse]) -> str:
    """Numbered list (1-based) for inbox processing — no DB IDs exposed to AI."""
    lines = []
    for i, t in enumerate(tasks, 1):
        lines.append(f"{i}. {t.title}")
    return "\n".join(lines)


def process_inbox(inbox_tasks: list[TaskResponse]) -> str:
    task_text = _inbox_to_context(inbox_tasks)

    return _chat(
        system=(
            "You are a task management assistant for a computational physics grad student. "
            "For each inbox task:\n"
            "0. Fix spelling and grammar. Rewrite the title in all-lowercase style unless it contains "
            "abbreviations (e.g. 'DFT', 'PI', 'GPU') or proper nouns. Keep it concise.\n"
            "1. Assign a category from this list: " + ", ".join(CATEGORIES) + ".\n"
            "2. Infer project and suggest priority (high/medium/low) and due date if obvious. "
            "If the category is 'my meetings' or 'group meetings', the title MUST start with a time "
            "(e.g. '2pm advisor check-in', '10am group meeting'). If the user did not include a time, "
            "you MUST set needs_clarification to true and set clarification_prompt to ask what time the meeting is. "
            "Do NOT accept a meeting without a time.\n"
            "Every task MUST have a due date and a deadline_type. "
            "deadline_type is 'hard' (immovable — submission, presentation, meeting) or 'soft' (aspirational — self-imposed, flexible). "
            "If the user didn't specify a deadline, suggest a reasonable soft deadline based on the task. "
            "Always set needs_clarification to true and ask if your suggested deadline is right, "
            "and whether it should be hard or soft.\n"
            "3. Check granularity: each task should be roughly 1-2 hours of concrete work. "
            "If a task is too vague or too broad (e.g. 'read all the papers', 'converge these models', "
            "'finish the project', 'work on research'), set 'needs_clarification' to true and write a "
            "'clarification_prompt' — a short question asking the user to be more specific about what "
            "exactly they need to do. For example: 'which papers? how many?' or 'which models and what convergence criteria?'. "
            "Do NOT guess subtasks. Just ask. "
            "If the task is already concrete and reasonably scoped, leave needs_clarification as false.\n\n"
            "Respond with a JSON object with key 'tasks' containing an array. Each object has: "
            "title, suggested_category, suggested_project, "
            "suggested_priority (high/medium/low), suggested_due (YYYY-MM-DD or null), "
            "suggested_deadline_type ('hard', 'soft', or null), "
            "reasoning (one sentence), needs_clarification (boolean), "
            "clarification_prompt (string or null — include deadline questions here if no due date). "
            "IMPORTANT: Return tasks in the EXACT same order they are listed. Do not reorder, skip, or merge tasks. "
            "Only return JSON."
        ),
        user=f"Today's date is {date.today().isoformat()}. Categorize and check granularity of these inbox tasks:\n{task_text}",
    )


def plan_day(active_tasks: list[TaskResponse], done_today_count: int) -> str:
    task_text = _tasks_to_context(active_tasks)
    today = date.today().isoformat()

    return _chat(
        system=(
            "You are a task management assistant for a computational physics grad student. "
            "Generate a prioritized daily checklist from the active tasks. Rules:\n"
            "- Hard deadline tasks due today or overdue go first, then soft deadline tasks.\n"
            "- Mix in 1-2 quick wins early for momentum if the day is heavy.\n"
            "- Flag if there are too many tasks and suggest what to defer.\n"
            "- Respond with a JSON object: {plan: [{id, title, reason}], deferred: [{id, title, reason}], note: string|null}. "
            "The plan array is the ordered checklist. Only return JSON."
        ),
        user=f"Today is {today}. Tasks done today: {done_today_count}. Active tasks:\n{task_text}",
    )



def generate_review(planned_tasks: list[dict], all_tasks: list[TaskResponse]) -> str:
    task_text = _tasks_to_context(all_tasks)

    planned_summary = "\n".join(
        f"[{t['id']}] {t['title']}" for t in planned_tasks
    )

    return _chat(
        system=(
            "You are a task management assistant. Generate an evening review. "
            "For each planned task, note if it was completed or not. "
            "For uncompleted tasks, suggest: move to tomorrow, drop, or reschedule. "
            "Respond with JSON: {completed: [{id, title}], uncompleted: [{id, title, suggestion, reason}], summary: string}. "
            "Only return JSON."
        ),
        user=(
            f"Today's plan was:\n{planned_summary}\n\n"
            f"Current task states:\n{task_text}"
        ),
    )
