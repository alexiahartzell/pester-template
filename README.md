# pester

A task manager that actually manages your tasks.

Pester doesn't just store a list — it thinks about your day. Capture tasks as fast as you can type them, then let the AI categorize, prioritize, check scope, suggest deadlines, and build you a daily plan. When you're done for the day, it reviews what happened and carries forward what didn't.

Built for researchers and grad students who juggle too many things across too many projects.

## What it does

**Capture instantly** — type a task, hit enter. That's it. No forms, no fields, no friction. Everything starts in the inbox.

**AI sorts your mess** — hit "Process new" and the AI reads your inbox, then for each task:
- Assigns a category (your research, group code, meetings, admin, etc.)
- Suggests priority, difficulty, and a deadline (hard or soft)
- Flags vague tasks and asks you to be specific ("which papers? how many?")
- Spellchecks and normalizes formatting
- Knows your projects and team — "tarun's manuscript" automatically routes to the right project and category

**Plan your day** — hit "Plan my day" and get an ordered checklist. Hard deadlines first, quick wins mixed in for momentum, and suggestions on what to defer if you're overloaded. Posts the plan to Slack so you can glance at it without opening the app.

**Track everything** — hours worked (auto-starts when your computer boots, ends when you wrap up), completion rates per category over time, weekly task distribution pie chart, and a monthly calendar view.

**Meetings have real times** — meetings get start/end time slots, not just titles. Recurring meetings auto-create the next instance when you complete one.

**Undo mistakes** — accidentally mark something done? The "Done this week" section lets you undo. Need to delete something entirely? That's there too.

**Morning nudge** — when your computer wakes up, pester sends a Slack message reminding you to plan your day. If you skipped yesterday's review, it'll nag you about that too.

## Features

- 10 task categories with color coding (solo/group × research/code/admin/meetings + coursework + mentoring)
- Hard/soft deadline tracking
- Task difficulty ratings (easy/medium/hard) with visual dot indicator
- Priority levels with pattern-coded left strips
- Drag-to-reorder task lists
- Clickable monthly calendar with category-colored dots
- Weekly pie chart of task distribution by category
- Completion percentage tracker with per-category weekly bars
- Hours worked: today, this week, rolling monthly average
- Recurring tasks (daily/weekly/biweekly/monthly)
- Start/end time slots for meetings
- Recently completed tasks with undo
- AI task splitting — flags tasks that are too broad and asks for specifics
- Morning Slack nudge on boot
- Review summaries posted to Slack with hours worked

## How it works

Pester is a local web app (FastAPI + React) that runs as a background service on your Mac. The AI runs through [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — no API keys, no local models, just your existing Claude subscription. It only calls the AI when you click a button, so it's lightweight the rest of the time.

You teach the AI about your workflow by editing a `CLAUDE.md` file with your projects, team members, schedule, and preferences. The more context you give it, the better it gets at sorting your tasks.

## Prerequisites

- **macOS** (uses launchd for the background service)
- **Python 3.10+**
- **Node.js 18+**
- **Claude Code CLI** — [install here](https://docs.anthropic.com/en/docs/claude-code)

## Setup

```bash
git clone https://github.com/alexiahartzell/pester-template.git ~/pester
cd ~/pester
bash scripts/install.sh
```

The installer walks you through everything:
1. Checks prerequisites
2. Sets up Slack notifications (optional but recommended)
3. Installs dependencies and builds the frontend
4. Creates a background service that starts on boot
5. Generates a `CLAUDE.md` template for you to customize

**After install, edit `~/pester/CLAUDE.md`** — this is the most important step. Tell the AI about your projects, team, schedule, and how you work. This is what makes pester actually useful instead of generic.

## Slack setup

Optional but recommended. You'll get morning nudges, daily plans, and review summaries in Slack.

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name it "pester", pick your workspace
3. **Incoming Webhooks** → toggle **On** → **Add New Webhook to Workspace** → pick a channel
4. Copy the webhook URL — the installer will ask for it

Tip: pin the `http://localhost:8742` link in your Slack channel for quick access.

## Usage

Open **http://localhost:8742**.

| Button | What it does |
|---|---|
| **text bar** | Capture a task instantly |
| **Process new** | AI categorizes, prioritizes, and checks your inbox tasks |
| **Plan my day** | AI generates a prioritized daily checklist |
| **Wrap up** | End-of-day review, logs hours, posts summary to Slack |

Click any task to expand and edit all fields. Drag tasks to reorder. Click calendar days to see and manage tasks by date. Click summary cards (New, This Week, Categories, Projects) to expand views.

## Customizing the AI

Edit `~/pester/CLAUDE.md` to teach the AI about:

- **Your projects** — names, descriptions, who's involved
- **Your team** — names mapped to projects and categories
- **Your schedule** — recurring meetings with times
- **Your definitions** — what "high priority" means to you, what "hard" difficulty looks like
- **Your abbreviations** — field-specific terms the AI should preserve

The AI reads this file every time you click a button. Update it as your projects evolve.

## Files

| Path | What |
|---|---|
| `~/pester/` | The app (git repo) |
| `~/pester/CLAUDE.md` | Your AI instructions (gitignored) |
| `~/.pester/tasks.db` | Your tasks |
| `~/.pester/config.yaml` | Configuration |
| `~/.pester/pester.log` | Server logs |
| `~/.pester/hours.json` | Today's work hours |
| `~/.pester/hours_log.json` | Historical hours log |

## Stop / Start / Uninstall

```bash
# Find your plist
ls ~/Library/LaunchAgents/com.*.pester.plist

# Stop
launchctl unload ~/Library/LaunchAgents/com.YOUR_USERNAME.pester.plist

# Start
launchctl load ~/Library/LaunchAgents/com.YOUR_USERNAME.pester.plist

# Uninstall (keeps your data in ~/.pester/)
bash ~/pester/scripts/uninstall.sh
```
