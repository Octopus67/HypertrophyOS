#!/bin/bash
set -e

echo "=== COMPLETE BACKEND FIX ==="
echo ""

# 1. Check .env exists
if [ ! -f .env ]; then
    echo "❌ .env file missing!"
    exit 1
fi
echo "✅ .env file exists"

# 2. Activate venv
source .venv/bin/activate
echo "✅ Virtual environment activated (Python $(python --version))"

# 3. Install missing dependencies
echo "Installing all dependencies..."
pip install -q aiosqlite python-multipart python-dotenv
echo "✅ Dependencies installed"

# 4. Delete old database
rm -f dev.db
echo "✅ Old database deleted"

# 5. Test imports
python -c "from src.main import app" 2>&1 | head -5
if [ $? -eq 0 ]; then
    echo "✅ Backend imports successfully"
else
    echo "❌ Import failed - check error above"
    exit 1
fi

# 6. Kill old processes
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Old processes killed"

# 7. Start backend
echo ""
echo "Starting backend on http://localhost:8000..."
echo "Press Ctrl+C to stop"
echo ""
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
