#!/bin/bash

# Setup script for AI Analysis Feature

echo "======================================"
echo "AI Analysis Feature Setup"
echo "======================================"
echo ""

# Check if Gemini API key is set
if grep -q "GEMINI_API_KEY=\"your_gemini_api_key_here\"" .env 2>/dev/null || ! grep -q "GEMINI_API_KEY" .env 2>/dev/null; then
  echo "⚠️  Gemini API Key not configured!"
  echo ""
  echo "To use the AI Analysis feature, you need a Gemini API key:"
  echo ""
  echo "1. Visit: https://makersuite.google.com/app/apikey"
  echo "2. Sign in with your Google account"
  echo "3. Click 'Create API Key'"
  echo "4. Copy the generated key"
  echo "5. Add it to your .env file:"
  echo "   GEMINI_API_KEY=your_actual_api_key_here"
  echo ""
  read -p "Do you have a Gemini API key ready? (y/n): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Gemini API key: " API_KEY
    
    if [ -f .env ]; then
      if grep -q "GEMINI_API_KEY" .env; then
        # Replace existing key
        if [[ "$OSTYPE" == "darwin"* ]]; then
          sed -i '' "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=\"$API_KEY\"/" .env
        else
          sed -i "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=\"$API_KEY\"/" .env
        fi
        echo "✅ Updated GEMINI_API_KEY in .env"
      else
        # Add new key
        echo "GEMINI_API_KEY=\"$API_KEY\"" >> .env
        echo "✅ Added GEMINI_API_KEY to .env"
      fi
    else
      echo "❌ .env file not found!"
      exit 1
    fi
  else
    echo ""
    echo "Please get a Gemini API key first, then run this script again."
    exit 1
  fi
else
  echo "✅ Gemini API Key is configured"
fi

echo ""
echo "======================================"
echo "Running Test..."
echo "======================================"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules/@google/generative-ai" ]; then
  echo "Installing @google/generative-ai..."
  npm install @google/generative-ai
  echo ""
fi

# Check if server is running
SERVER_RUNNING=$(curl -s http://localhost:5001/health 2>/dev/null)

if [ -z "$SERVER_RUNNING" ]; then
  echo "⚠️  Server is not running!"
  echo ""
  echo "Please start the server in another terminal:"
  echo "  npm run dev"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✅ Server is running"
echo ""

# Run the actual test
./test-ai-analysis.sh
