# Environment Notes: Lokarta (Come Into The Light)

## 1. Overview & Stack Ratification

This document specifies the technical runtime environment, toolchain versions, and architectural assumptions for **Lokarta: Come Into The Light**, ratifying the technical stack defined in `concept.md` and detailed in `features/briefs/*.md`.

### Core Technology Stack
- **Backend**: Python 3.11+ with FastAPI, Pydantic v2, Uvicorn (ASGI), and SQLite (via `aiosqlite` / `sqlite3`).
- **Frontend**: Node.js (v18+) with TypeScript, Vite bundler, and HTML5 2D Canvas / PixiJS for tile rendering.
- **Persistence**: File-based SQLite database for character progression, inventory storage, and floor clear state.

---

## 2. Runtime & Dependency Specifications

### Python (Backend & Tooling)
- **Interpreter**: Python 3.11+ recommended (minimum supported: Python 3.9+).
- **Virtual Environment**: Isolated virtual environment created at `.venv/`.
- **Core Dependencies** (`requirements.txt`):
  - `fastapi` (>=0.115.0): High-performance asynchronous web framework for REST API endpoints.
  - `uvicorn[standard]` (>=0.30.0): ASGI server implementation for development and production.
  - `pydantic` (>=2.8.0): Data validation and settings management using Python type annotations.
  - `aiosqlite` (>=0.20.0): Asynchronous SQLite driver for non-blocking database queries.
  - `httpx` (>=0.27.0): Async HTTP client for integration testing with `fastapi.testclient.TestClient`.
  - `pytest` (>=8.2.0) & `pytest-asyncio` (>=0.24.0): Unit and asynchronous test runner.

### Node.js & TypeScript (Frontend)
- **Node Runtime**: Node.js v18.0.0+ (LTS or current) and `npm` v9.0.0+.
- **Frontend Framework**: TypeScript with Vite for fast HMR and client bundle builds.
- **Location**: Frontend application lives in `./frontend/`.

---

## 3. Network & Service Ports

| Service | Protocol / Port | Purpose | Default URL |
| :--- | :--- | :--- | :--- |
| **FastAPI Backend** | HTTP / TCP 8000 | Dungeon seed distribution & REST persistence | `http://127.0.0.1:8000` |
| **Backend API Docs** | HTTP / TCP 8000 | Interactive OpenAPI / Swagger documentation | `http://127.0.0.1:8000/docs` |
| **Frontend Dev Server**| HTTP / TCP 5173 | Vite HMR development server for SPA client | `http://localhost:5173` |

### CORS Configuration
Because the frontend and backend operate as decoupled services during development, the FastAPI backend must configure `fastapi.middleware.cors.CORSMiddleware` to allow cross-origin requests from `http://localhost:5173` and `http://127.0.0.1:5173`.

---

## 4. Setup, Execution & Testing Workflow

### 1. Automated Environment Provisioning
Run the automated installation script from the repository root:
```bash
./install.sh
```
This will:
1. Locate a compatible Python 3 interpreter.
2. Initialize `.venv` and install all Python dependencies from `requirements.txt`.
3. Detect `npm` and install frontend dependencies if `frontend/package.json` exists.
4. Ensure the `./tmp/` scratch directory exists.

### 2. Running the Application
Launch both backend and frontend services concurrently with:
```bash
./run.sh
```
- Logs are redirected to `tmp/backend.log` and `tmp/frontend.log`.
- Pressing `Ctrl+C` triggers graceful termination of all child processes.

### 3. Running Backend Tests
```bash
source .venv/bin/activate
pytest
```

---

## 5. Storage, Logging & Conventions

- **Database Location**: Default SQLite database is located at `backend/lokarta.db` (gitignored).
- **Temporary Files & Logs**: All ephemeral logs, test outputs, and server stdout/stderr must write to `./tmp/` (which is gitignored except for `tmp/.gitkeep`).
- **No System-Level Clutter**: All runtime artifacts remain contained within the repository worktree (`.venv/`, `node_modules/`, `tmp/`).

---

## 6. Known Assumptions & Downstream Guidance

1. **Stage 5 (Architect)**: Design data schemas (Character, Inventory, Dungeon Floor) using Pydantic models and SQLite table definitions adhering to:
   - Four playable vocations: Magician, Archer, Fighter, Paladin.
   - Unified multi-container inventory: 10-slot Action Bar (keys 1–0), 6-slot Backpack grid, and Paperdoll equipment slots.
   - 40×40 floor format, dynamic lighting radius, monster archetypes, and physical ground tile item stacks (`tile.items`).
   - Fate Grant progression system and card draft reward structures.
2. **Stage 6 (Backend Engineer)**: Implement `backend/main.py` exposing:
   - `GET /api/dungeons/{id}`: 40×40 dungeon floor manifest, tiles, lights, monsters, and ground loot.
   - `GET /api/characters/{id}`: Character profile, vocation, stats, and saved inventory layout.
   - `POST /api/character/save`: Save full character progression (vocation, level, stats, 10 action slots, 6 backpack slots, equipment).
   - `POST /api/dungeon/sync`: Synchronize cleared dungeon state and inventory upon reaching exit stairs.
3. **Stage 7 (Frontend Engineer)**: Scaffold and build the Vite + TypeScript application in `frontend/`, providing:
   - 60 FPS 2D canvas grid renderer and dynamic light-masking overlay.
   - 10 Hz tick engine, input handling (WASD / Arrows / Hotkeys 1–0 / Pointer interaction), monster AI, and combat resolution.
   - Modular desktop HUD (10-slot Action Bar, 6-slot Backpack, Paperdoll panel, Health/Mana pools, Scrolling Message Log).

