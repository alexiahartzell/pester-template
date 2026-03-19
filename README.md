# pester

AI-powered daily task manager. Captures tasks fast, lets the AI sort out your day.

## Setup

1. Clone this repo to `~/pester`
2. Run `bash scripts/install.sh`
3. Edit `~/.pester/config.yaml`:
   - Set `anthropic_api_key` for AI features
   - Set `slack_webhook_url` for Slack notifications
4. Open `http://localhost:8742`

## Usage

- **Capture:** Type in the bar at the top, hit enter. Goes to inbox.
- **Standup:** Click "Standup" to process inbox and get a daily plan.
- **Plans changed:** Click "Plans changed" to reshuffle your day.
- **Review:** Click "Review" at end of day to clean up.
- **Edit tasks:** Click any task row to expand and edit.
- **Summary cards:** Click Inbox / This Week / Projects to expand views.

## Files

- `~/pester/` — the app (git repo)
- `~/.pester/tasks.db` — your tasks
- `~/.pester/config.yaml` — configuration
- `~/.pester/pester.log` — server logs

## Stop / Start

```bash
# Stop
launchctl unload ~/Library/LaunchAgents/com.alexia.pester.plist

# Start
launchctl load ~/Library/LaunchAgents/com.alexia.pester.plist
```

## Uninstall

```bash
bash ~/pester/scripts/uninstall.sh
```
