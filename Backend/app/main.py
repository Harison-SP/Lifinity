import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from app.routes import habit, planner, habit_maintenance, weekly_planner, system, ai, auth
from app.auth_utils import get_current_user

app = FastAPI()

def get_allowed_origins() -> list[str]:
    configured = os.getenv("ALLOWED_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost:4200",  # Angular default port
        "http://localhost:1234",  # Current running port
        "http://127.0.0.1:4200",
        "http://127.0.0.1:1234",
        "https://lifinity-beta.vercel.app",
    ]

allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compress responses > 500 bytes (~70% size reduction for JSON)
app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(habit.router, prefix="/habits", tags=["habits"], dependencies=[Depends(get_current_user)])
app.include_router(planner.router, dependencies=[Depends(get_current_user)])
app.include_router(habit_maintenance.router, dependencies=[Depends(get_current_user)])
app.include_router(weekly_planner.router, prefix="/weekly-planner", tags=["weekly-planner"], dependencies=[Depends(get_current_user)])
app.include_router(system.router, dependencies=[Depends(get_current_user)])
app.include_router(ai.router, dependencies=[Depends(get_current_user)])
app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/")
async def root():
    return {"message": "Welcome to the Habit Tracker API"}

@app.get("/health")
async def health():
    """Lightweight health check endpoint for keep-alive pinging (prevents Render cold starts)."""
    return {"status": "ok"}

