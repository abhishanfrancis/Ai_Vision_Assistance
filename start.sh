#!/bin/bash

# Ai-Visual Assistance System - Local Launcher

echo "Starting AI Vision Assistance System..."

# Kill existing processes on default ports
lsof -ti :8000 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

echo "Checking Backend Dependencies..."
cd backend
python3 -m pip install -r requirements.txt
python3 -m pip install bcrypt==3.1.7 # Specific fix for passlib compatibility

echo "Launching Backend (Port 8000)..."
python3 main.py &
BACKEND_PID=$!

echo "Checking Frontend Dependencies..."
cd ../frontend
npm install
echo "Launching Frontend (Port 5173)..."
npm run dev -- --host --port 5173 &
FRONTEND_PID=$!

function cleanup {
  echo ""
  echo "Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit
}

trap cleanup SIGINT

echo "------------------------------------------------"
echo "VisionAssist System is launching!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "-----------------------------------------------"
echo "ADMIN LOGIN: admin / admin123"-
echo "------------------------------------------------"
echo "Please grant camera permissions when prompted."
echo "Keep this window open to maintain the system."

wait
