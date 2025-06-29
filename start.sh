#!/bin/bash

# AI Avatar Generator Startup Script

echo "🎭 Starting AI Avatar Generator with Lip-Sync Capabilities..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements.txt

# Start backend server
echo "🚀 Starting backend server..."
cd backend
export FLASK_APP=app.py
export FLASK_ENV=development
export DEBUG=True

# Start Flask server in background
python app.py &
BACKEND_PID=$!

echo "✅ Backend server started (PID: $BACKEND_PID)"
echo "🌐 Frontend available at: file://$(pwd)/../frontend/index.html"
echo "🔗 Backend API at: http://localhost:5000"
echo ""
echo "📝 To stop the server, run: kill $BACKEND_PID"
echo "📋 Or press Ctrl+C to stop"

# Wait for user interrupt
trap "kill $BACKEND_PID; echo 'Server stopped.'; exit" INT
wait $BACKEND_PID
