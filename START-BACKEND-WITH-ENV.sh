#!/bin/bash
cd /Users/manavmht/Documents/HOS

# Export all .env variables
set -a
source .env
set +a

echo "✅ Environment loaded:"
echo "  AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:15}..."
echo "  SES_SENDER_EMAIL: $SES_SENDER_EMAIL"
echo "  DATABASE_URL: $DATABASE_URL"
echo ""

# Activate venv and start
source .venv/bin/activate
rm -f dev.db
echo "Starting backend..."
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
