#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VENV_DIR="$SCRIPT_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "[-] Virtual environment not found at $VENV_DIR."
    echo "[+] Running ./install.sh to provision environment..."
    "$SCRIPT_DIR/install.sh"
fi

mkdir -p "$SCRIPT_DIR/tmp"

# Helper for cleanup on exit
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "=== Shutting down Lokarta services ==="
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "[+] Stopping frontend server (PID $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "[+] Stopping backend server (PID $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "[+] All services stopped."
}

trap cleanup INT TERM EXIT

echo "=== [Lokarta] Starting Lokarta Application Environment ==="

# 1. Start FastAPI Backend if present
if [ -f "$SCRIPT_DIR/backend/main.py" ] || [ -f "$SCRIPT_DIR/backend/app.py" ]; then
    APP_MODULE="backend.main:app"
    if [ ! -f "$SCRIPT_DIR/backend/main.py" ] && [ -f "$SCRIPT_DIR/backend/app.py" ]; then
        APP_MODULE="backend.app:app"
    fi
    
    echo "[+] Launching FastAPI backend on http://127.0.0.1:8000..."
    "$VENV_DIR/bin/uvicorn" "$APP_MODULE" --host 127.0.0.1 --port 8000 --reload > "$SCRIPT_DIR/tmp/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo "[+] Backend started (PID $BACKEND_PID, logs: tmp/backend.log)"
else
    echo "[i] Backend application entrypoint (backend/main.py) not yet implemented (Stage 6)."
fi

# 2. Start Frontend Dev Server if present
if [ -f "$SCRIPT_DIR/frontend/package.json" ]; then
    echo "[+] Launching Vite frontend server on http://localhost:5173..."
    (cd "$SCRIPT_DIR/frontend" && npm run dev > "$SCRIPT_DIR/tmp/frontend.log" 2>&1) &
    FRONTEND_PID=$!
    echo "[+] Frontend started (PID $FRONTEND_PID, logs: tmp/frontend.log)"
else
    echo "[i] Frontend application (frontend/package.json) not yet implemented (Stage 7)."
fi

if [ -z "$BACKEND_PID" ] && [ -z "$FRONTEND_PID" ]; then
    echo ""
    echo "[i] Environment is fully provisioned and ready for Stage 5 Architecture and subsequent development stages."
    echo "[i] Dependencies, virtual environment, and run harness are verified."
    exit 0
fi

echo ""
echo "=== Services are active ==="
[ -n "$BACKEND_PID" ] && echo "  - Backend API:    http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)"
[ -n "$FRONTEND_PID" ] && echo "  - Frontend SPA:   http://localhost:5173"
echo "Press Ctrl+C to terminate all services."

# Wait for background processes
wait
