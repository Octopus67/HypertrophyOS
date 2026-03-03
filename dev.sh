#!/bin/bash
# Repwise Dev Servers — kills existing, spawns backend + frontend in new terminals
# Usage: ./dev.sh

DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill existing
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
sleep 1

# Backend
osascript -e "tell application \"Terminal\" to do script \"cd '$DIR' && source .venv/bin/activate && uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload\""

# Frontend — write a temp script to avoid escaping hell
cat > /tmp/repwise-frontend.sh << 'EOF'
export PATH="$HOME/.local/share/mise/installs/node/22.22.0/bin:$PATH"
cd "$1" && npx expo start --web --port 8081
EOF
chmod +x /tmp/repwise-frontend.sh
osascript -e "tell application \"Terminal\" to do script \"bash /tmp/repwise-frontend.sh '$DIR/app'\""

echo "✓ Backend → http://localhost:8000"
echo "✓ Frontend → http://localhost:8081"
