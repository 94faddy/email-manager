#!/bin/bash
# Path: stop.sh

APPNAME="email-manager"

echo "🛑 Stopping email-manager..."

pm2 delete $APPNAME 2>/dev/null

echo "✅ PM2 processes stopped."
