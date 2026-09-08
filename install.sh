#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== [Lokarta Setup] Initializing Development Environment ==="

# 1. Detect Python 3 runtime
PYTHON_BIN=""
for candidate in python3.11 python3.12 python3.13 python3.14 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
        # Check that candidate version is at least Python 3.9
        ver=$("$candidate" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
        major=$("$candidate" -c 'import sys; print(sys.version_info.major)')
        minor=$("$candidate" -c 'import sys; print(sys.version_info.minor)')
        if [ "$major" -eq 3 ] && [ "$minor" -ge 9 ]; then
            PYTHON_BIN="$candidate"
            echo "[+] Found compatible Python interpreter: $PYTHON_BIN (Python $ver)"
            break
        fi
    fi
done

if [ -z "$PYTHON_BIN" ]; then
    echo "[-] Error: Python 3.9+ (Python 3.11+ recommended) is required but was not found." >&2
    exit 1
fi

# 2. Set up Python Virtual Environment
VENV_DIR="$SCRIPT_DIR/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "[+] Creating virtual environment at $VENV_DIR using $PYTHON_BIN..."
    "$PYTHON_BIN" -m venv "$VENV_DIR"
else
    echo "[+] Virtual environment already exists at $VENV_DIR."
fi

# 3. Install Python Dependencies
echo "[+] Upgrading pip and installing Python dependencies from requirements.txt..."
"$VENV_DIR/bin/pip" install --upgrade pip setuptools wheel
"$VENV_DIR/bin/pip" install -r "$SCRIPT_DIR/requirements.txt"

# 4. Check and install Node.js dependencies for Frontend
if command -v npm >/dev/null 2>&1; then
    NODE_VER=$(node -v 2>/dev/null || echo "unknown")
    NPM_VER=$(npm -v 2>/dev/null || echo "unknown")
    echo "[+] Node.js runtime detected: Node $NODE_VER, npm $NPM_VER"
    
    if [ -f "$SCRIPT_DIR/frontend/package.json" ]; then
        echo "[+] Installing frontend dependencies in ./frontend..."
        (cd "$SCRIPT_DIR/frontend" && npm install)
    else
        echo "[i] Frontend package.json not yet present (will be initialized in Stage 7 Frontend)."
    fi
else
    echo "[!] Warning: Node.js / npm not found in PATH. Node.js v18+ is required for frontend development."
fi

# 5. Ensure tmp directory exists
mkdir -p "$SCRIPT_DIR/tmp"

echo "=== [Lokarta Setup] Environment setup complete! ==="
echo "Run './run.sh' to start the application."
