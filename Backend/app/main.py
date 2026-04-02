import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import habit, planner, habit_maintenance, weekly_planner, system, ai

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
    ]

allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(habit.router, prefix="/habits", tags=["habits"])
app.include_router(planner.router)
app.include_router(habit_maintenance.router)
app.include_router(weekly_planner.router, prefix="/weekly-planner", tags=["weekly-planner"])
app.include_router(system.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    return {"message": "Welcome to the Habit Tracker API"}
