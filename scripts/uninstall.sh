#!/bin/bash
set -e

PLIST_NAME="com.alexia.pester.plist"
AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "Stopping pester..."
launchctl unload "$AGENTS_DIR/$PLIST_NAME" 2>/dev/null || true
rm -f "$AGENTS_DIR/$PLIST_NAME"

echo "pester stopped and launch agent removed."
echo "Data is still at ~/.pester/ — delete manually if you want."
