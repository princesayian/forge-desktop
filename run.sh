#!/bin/bash
cd "$(dirname "$0")"

# First time? Run setup
if [ ! -f "vendor/react.js" ]; then
    echo "First time setup — downloading dependencies..."
    python3 setup.py
    echo ""
    read -p "Press Enter to continue..."
fi

echo "Starting Superhero Forge..."
python3 app.py
