#!/bin/bash
set -e

# Superhero Forge — Universal Setup Script
# Works on macOS and Linux

cd "$(dirname "$0")"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo ""
    echo "  ERROR: Python 3 not found"
    echo ""
    echo "  Superhero Forge requires Python 3.9 or higher."
    echo ""
    echo "  macOS:  brew install python3"
    echo "  Linux:  sudo apt install python3 python3-pip"
    echo ""
    exit 1
fi

echo ""
echo "  Running Superhero Forge Setup..."
echo ""

python3 install.py
