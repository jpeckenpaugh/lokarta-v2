from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routers import characters, dungeons


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database schema and seed data
    await init_db()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title="Lokarta: Come Into The Light - API",
    description="RESTful backend service for Lokarta dungeon RPG, providing dungeon layout distribution, character seeding, and state persistence.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for Vite SPA development server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(characters.router)
app.include_router(dungeons.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "Lokarta: Come Into The Light API",
        "status": "healthy",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
