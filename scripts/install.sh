#!/bin/bash
set -e

PESTER_DIR="$HOME/pester"
DATA_DIR="$HOME/.pester"
PLIST_NAME="com.alexia.pester.plist"
AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "Setting up pester..."

mkdir -p "$DATA_DIR"

if [ ! -f "$DATA_DIR/config.yaml" ]; then
    cat > "$DATA_DIR/config.yaml" << 'EOF'
# pester configuration
# Ollama must be running locally on port 11434
ollama_model: "llama3.1:8b"
slack_webhook_url: ""
morning_nudge_time: "09:00"
evening_review_time: "17:30"
server_port: 8742
EOF
    echo "Created default config at $DATA_DIR/config.yaml"
    echo "  -> Make sure Ollama is running (ollama serve)"
    echo "  -> Set your slack_webhook_url to enable Slack notifications"
fi

echo "Installing Python dependencies..."
cd "$PESTER_DIR"
pip install -r requirements.txt -q

echo "Building frontend..."
cd "$PESTER_DIR/frontend"
npm install
npm run build

echo "Installing launch agent..."
mkdir -p "$AGENTS_DIR"
cp "$PESTER_DIR/$PLIST_NAME" "$AGENTS_DIR/$PLIST_NAME"
launchctl unload "$AGENTS_DIR/$PLIST_NAME" 2>/dev/null || true
launchctl load "$AGENTS_DIR/$PLIST_NAME"

echo ""
echo "pester is installed and running."
echo "  -> Open http://localhost:8742 in your browser"
echo "  -> Make sure Ollama is running with: ollama serve"
echo "  -> Edit $DATA_DIR/config.yaml to configure settings"
