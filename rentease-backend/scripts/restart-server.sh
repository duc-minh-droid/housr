#!/bin/bash

echo "Restarting RentEase Backend Server..."
echo ""

# Check if server.pid exists
if [ -f "server.pid" ]; then
    PID=$(cat server.pid)
    echo "Found PID file with PID: $PID"
    
    # Check if process is running
    if ps -p $PID > /dev/null 2>&1; then
        echo "Stopping server (PID: $PID)..."
        kill $PID
        sleep 2
        
        # Force kill if still running
        if ps -p $PID > /dev/null 2>&1; then
            echo "Force stopping..."
            kill -9 $PID
        fi
        
        echo "✅ Server stopped"
    else
        echo "Process not running, cleaning up PID file"
    fi
    
    rm -f server.pid
else
    echo "No PID file found, checking for running processes on port 5001..."
    
    # Try to find and kill processes on port 5001
    PIDS=$(lsof -ti:5001)
    if [ ! -z "$PIDS" ]; then
        echo "Found processes on port 5001: $PIDS"
        echo "Killing processes..."
        kill $PIDS 2>/dev/null
        sleep 2
        echo "✅ Processes stopped"
    else
        echo "No processes found on port 5001"
    fi
fi

echo ""
echo "Starting server..."
npm start > server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > server.pid

echo "✅ Server started with PID: $SERVER_PID"
echo "Waiting for server to initialize..."
sleep 3

# Test if server is responding
echo ""
echo "Testing server..."
HEALTH=$(curl -s http://localhost:5001/health)

if [ ! -z "$HEALTH" ]; then
    echo "✅ Server is running and responding!"
    echo "Response: $HEALTH"
    echo ""
    echo "Server logs are being written to server.log"
    echo "To view logs: tail -f server.log"
else
    echo "❌ Server may not be running properly"
    echo "Check server.log for errors"
fi
