#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BROWSER_DIR="$SCRIPT_DIR/browser-edition"
PORT="${PORT:-3000}"

if [ ! -d "$BROWSER_DIR" ]; then
    echo "[-] Error: browser-edition directory not found at $BROWSER_DIR"
    exit 1
fi

SERVER_PID=""

cleanup() {
    echo ""
    echo "=== Shutting down Lokarta Browser Edition ==="
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "[+] Stopping static server (PID $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "[+] Server stopped."
}

trap cleanup INT TERM EXIT

echo "=========================================================="
echo "    🏰 Lokarta: Come Into The Light - Browser Edition   "
echo "=========================================================="
echo "[+] Starting zero-backend static HTTP server on port $PORT..."
echo "[+] Serving directory: $BROWSER_DIR"

if command -v python3 >/dev/null 2>&1; then
    echo "[+] Using Python 3 http.server..."
    python3 -m http.server -d "$BROWSER_DIR" "$PORT" &
    SERVER_PID=$!
elif command -v npx >/dev/null 2>&1; then
    echo "[+] Using npx serve..."
    npx serve "$BROWSER_DIR" -l "$PORT" &
    SERVER_PID=$!
elif command -v python >/dev/null 2>&1; then
    echo "[+] Using Python 2 SimpleHTTPServer..."
    (cd "$BROWSER_DIR" && python -m SimpleHTTPServer "$PORT") &
    SERVER_PID=$!
else
    echo "[-] Error: No suitable static HTTP server found (checked python3, npx, python)."
    echo "[i] Please install Python 3 or Node.js to launch the browser edition."
    exit 1
fi

echo ""
echo "=== Lokarta Browser Edition is live! ==="
echo "  👉 Open in your browser: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server."

wait "$SERVER_PID"
