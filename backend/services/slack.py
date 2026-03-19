import httpx

from backend.config import get_config_value


def post_message(text: str, blocks: list[dict] | None = None) -> bool:
    webhook_url = get_config_value("slack_webhook_url")
    if not webhook_url:
        return False

    payload = {"text": text}
    if blocks:
        payload["blocks"] = blocks

    try:
        resp = httpx.post(webhook_url, json=payload, timeout=10)
        return resp.status_code == 200
    except httpx.RequestError:
        return False


def format_plan_message(plan: dict, port: int = 8742) -> str:
    lines = ["*Your plan for today:*\n"]
    for i, task in enumerate(plan.get("plan", []), 1):
        lines.append(f"{i}. {task.get('title', 'Untitled')}")
    if plan.get("note"):
        lines.append(f"\n_{plan['note']}_")
    if plan.get("deferred"):
        lines.append("\n*Deferred:*")
        for task in plan["deferred"]:
            lines.append(f"  - {task.get('title', 'Untitled')}: {task.get('reason', '')}")
    lines.append(f"\n<http://localhost:{port}|Open pester>")
    return "\n".join(lines)


def format_review_message(review: dict, port: int = 8742) -> str:
    lines = []
    if review.get("summary"):
        lines.append(f"*End of day:* {review['summary']}\n")
    if review.get("completed"):
        lines.append("*Done:*")
        for t in review["completed"]:
            lines.append(f"  - {t.get('title', '')}")
    if review.get("uncompleted"):
        lines.append("\n*Not done:*")
        for t in review["uncompleted"]:
            lines.append(f"  - {t.get('title', '')}: {t.get('suggestion', '')}")
    lines.append(f"\n<http://localhost:{port}|Open pester>")
    return "\n".join(lines)
