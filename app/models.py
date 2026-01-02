from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HabitBase(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: str = "Daily"
    targetDays: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])
    icon: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    streak: int = 0
    bestStreak: int = 0
    completionRate: float = 0.0
    completedToday: bool = False

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    targetDays: Optional[List[int]] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    streak: Optional[int] = None
    bestStreak: Optional[int] = None
    completionRate: Optional[float] = None
    completedToday: Optional[bool] = None

class Habit(HabitBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
