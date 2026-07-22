#!/usr/bin/env bash

# VisionAssist.AI - Stop All Services (macOS / Linux)

echo "Stopping VisionAssist.AI services..."

# Kill backend on port 8000
BACKEND_PID=$(lsof -ti :8000 2>/dev/null)
if [ -n "$BACKEND_PID" ]; then
    kill -9 $BACKEND_PID 2>/dev/null
    echo "✅ Backend (port 8000) stopped."
else
    echo "ℹ️  Backend was not running."
fi

# Kill frontend on port 5173
FRONTEND_PID=$(lsof -ti :5173 2>/dev/null)
if [ -n "$FRONTEND_PID" ]; then
    kill -9 $FRONTEND_PID 2>/dev/null
    echo "✅ Frontend (port 5173) stopped."
else
    echo "ℹ️  Frontend was not running."
fi

echo ""
echo "All services stopped. Goodbye!"
