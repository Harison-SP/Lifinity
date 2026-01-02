from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import habit

app = FastAPI()

origins = [
    "http://localhost:4200", # Angular default port
    "*" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(habit.router, prefix="/habits", tags=["habits"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Habit Tracker API"}
