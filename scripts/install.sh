#!/bin/bash
set -e

USERNAME="$(whoami)"
PESTER_DIR="$HOME/pester"
DATA_DIR="$HOME/.pester"
PLIST_NAME="com.${USERNAME}.pester.plist"
AGENTS_DIR="$HOME/Library/LaunchAgents"
TODAY="$(date +%Y-%m-%d)"

echo "=== pester setup ==="
echo ""

# --- Check prerequisites ---

PYTHON_CMD=""
for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then
        PYTHON_CMD="$(command -v "$cmd")"
        break
    fi
done
if [ -z "$PYTHON_CMD" ]; then
    echo "ERROR: Python 3 not found. Install Python 3.10+ first."
    exit 1
fi
echo "Found Python: $PYTHON_CMD"

if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js not found. Install Node.js 18+ first."
    exit 1
fi
echo "Found Node: $(command -v node)"

if ! command -v claude &>/dev/null; then
    echo ""
    echo "WARNING: Claude Code CLI not found."
    echo "  The AI features require Claude Code. Install it:"
    echo "  https://docs.anthropic.com/en/docs/claude-code"
    echo ""
    read -p "Continue without Claude Code? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "Found Claude Code: $(command -v claude)"
fi

# --- Data directory ---

mkdir -p "$DATA_DIR"

# --- Config ---

if [ ! -f "$DATA_DIR/config.yaml" ]; then
    echo ""
    echo "--- Slack setup (optional) ---"
    echo "To get Slack notifications, you need an incoming webhook URL."
    echo "  1. Go to https://api.slack.com/apps"
    echo "  2. Create New App -> From scratch"
    echo "  3. Go to Incoming Webhooks -> toggle On"
    echo "  4. Add New Webhook to Workspace -> pick a channel"
    echo "  5. Copy the webhook URL"
    echo ""
    read -p "Paste your Slack webhook URL (or press Enter to skip): " SLACK_URL

    cat > "$DATA_DIR/config.yaml" << EOF
# pester configuration
slack_webhook_url: "${SLACK_URL}"
server_port: 8742
hours_start_date: "${TODAY}"
EOF
    echo "Created config at $DATA_DIR/config.yaml"
else
    echo "Config already exists at $DATA_DIR/config.yaml"
fi

# --- CLAUDE.md ---

if [ ! -f "$PESTER_DIR/CLAUDE.md" ]; then
    if [ -f "$PESTER_DIR/CLAUDE.md.template" ]; then
        cp "$PESTER_DIR/CLAUDE.md.template" "$PESTER_DIR/CLAUDE.md"
        echo ""
        echo "Created CLAUDE.md from template."
        echo "  -> IMPORTANT: Edit $PESTER_DIR/CLAUDE.md with your personal details"
        echo "     (projects, advisor, group members, schedule)"
        echo "     This is what teaches the AI about your workflow."
    fi
else
    echo "CLAUDE.md already exists"
fi

# --- Python dependencies ---

echo ""
echo "Installing Python dependencies..."
cd "$PESTER_DIR"
"$PYTHON_CMD" -m pip install -r requirements.txt -q

# --- Frontend ---

echo "Building frontend..."
cd "$PESTER_DIR/frontend"
npm install --silent
npm run build

# --- Launch agent ---

echo "Setting up launch agent..."
PYTHON_DIR="$(dirname "$PYTHON_CMD")"

cat > "$AGENTS_DIR/$PLIST_NAME" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.${USERNAME}.pester</string>
    <key>ProgramArguments</key>
    <array>
        <string>${PYTHON_CMD}</string>
        <string>-m</string>
        <string>uvicorn</string>
        <string>backend.main:app</string>
        <string>--port</string>
        <string>8742</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${PESTER_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${DATA_DIR}/pester.log</string>
    <key>StandardErrorPath</key>
    <string>${DATA_DIR}/pester.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>${PYTHON_DIR}:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

mkdir -p "$AGENTS_DIR"
launchctl unload "$AGENTS_DIR/$PLIST_NAME" 2>/dev/null || true
launchctl load "$AGENTS_DIR/$PLIST_NAME"

echo ""
echo "=== pester is installed and running ==="
echo ""
echo "  Open http://localhost:8742"
echo ""
echo "  Next steps:"
echo "  1. Edit $PESTER_DIR/CLAUDE.md with your details"
echo "  2. Add tasks and hit 'Process new' to try the AI"
echo ""
echo "  Stop:      launchctl unload ~/Library/LaunchAgents/$PLIST_NAME"
echo "  Start:     launchctl load ~/Library/LaunchAgents/$PLIST_NAME"
echo "  Uninstall: bash $PESTER_DIR/scripts/uninstall.sh"
