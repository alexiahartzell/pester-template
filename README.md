# pester

AI-powered daily task manager. Captures tasks fast, lets the AI sort out your day.

Uses [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as the AI backend — no API keys, no local models, just your Claude subscription.

## Prerequisites

- **macOS** (uses launchd for background service)
- **Python 3.10+** (with pip)
- **Node.js 18+** (with npm)
- **Claude Code CLI** — install from [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code)

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/pester.git ~/pester
cd ~/pester
bash scripts/install.sh
```

The installer will:
1. Check prerequisites
2. Walk you through Slack setup (optional)
3. Install dependencies and build the frontend
4. Set up a background service that starts on boot
5. Create a `CLAUDE.md` template for you to customize

After install, **edit `~/pester/CLAUDE.md`** with your details — this teaches the AI about your projects, team, and workflow.

## Slack setup

Slack notifications are optional but recommended. You'll get:
- A morning nudge when your computer starts up
- Daily plan summaries when you click "Plan my day"
- Review summaries when you wrap up

To set up:
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Name it "pester", pick your workspace
4. Go to **Incoming Webhooks** → toggle **On**
5. Click **Add New Webhook to Workspace** → pick a channel
6. Copy the webhook URL
7. The installer will ask for this, or add it to `~/.pester/config.yaml` later

## Usage

Open **http://localhost:8742** in your browser.

- **Capture** — type in the bar at the top, hit enter
- **Process new** — AI categorizes, prioritizes, and checks task granularity
- **Plan my day** — generates a prioritized daily checklist
- **Wrap up** — end-of-day review, logs hours worked
- **Click any task** — expand to edit all fields
- **Drag tasks** — reorder by dragging
- **Calendar** — click any day to see its tasks
- **Summary cards** — click to expand (New, This Week, Categories, Projects)

## Customizing the AI

Edit `~/pester/CLAUDE.md` to teach the AI about:
- Your projects and what they involve
- Team members and which projects they're on
- Your schedule and meeting times
- How you define priority and difficulty
- Abbreviations specific to your field

The more context you give, the better the AI categorizes and plans.

## Files

- `~/pester/` — the app (git repo)
- `~/pester/CLAUDE.md` — your AI instructions (gitignored)
- `~/.pester/tasks.db` — your tasks
- `~/.pester/config.yaml` — configuration
- `~/.pester/pester.log` — server logs
- `~/.pester/hours.json` — today's hours
- `~/.pester/hours_log.json` — historical hours

## Stop / Start

```bash
# Find your plist name
ls ~/Library/LaunchAgents/com.*.pester.plist

# Stop
launchctl unload ~/Library/LaunchAgents/com.YOUR_USERNAME.pester.plist

# Start
launchctl load ~/Library/LaunchAgents/com.YOUR_USERNAME.pester.plist
```

## Uninstall

```bash
bash ~/pester/scripts/uninstall.sh
```
