#!/bin/bash
cd "$(dirname "$0")"

# Add local Node installation to PATH if present
[ -d "$HOME/.local/bin" ] && export PATH="$HOME/.local/bin:$PATH"

# Install npm deps if needed
if [ -d "client" ] && [ ! -d "client/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd client && npm install && cd ..
fi

# Build frontend if not yet built
if [ -d "client" ] && [ ! -d "static/assets" ]; then
    echo "Building frontend..."
    cd client && npm run build && cd ..
    echo ""
fi

# Legacy: vendor scripts if needed (for fallback)
if [ ! -f "vendor/react.js" ]; then
    echo "First time setup — downloading legacy vendor files..."
    python3 setup.py
    echo ""
fi

echo "Starting Superhero Forge..."
python3 app.py
