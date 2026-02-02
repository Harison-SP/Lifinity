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

class HabitLogBase(BaseModel):
    habit_id: str
    completed_at: datetime # UTC timestamp
    value: Optional[float] = None
    notes: Optional[str] = None

class HabitLogCreate(HabitLogBase):
    pass

class HabitLog(HabitLogBase):
    id: str
    
    class Config:
        from_attributes = True

class HeatmapItem(BaseModel):
    date: str
    level: int

class DayFrequency(BaseModel):
    day_name: str
    count: int
    percentage: int

class TrendItem(BaseModel):
    period: str # e.g. "Week 1", "Jan", etc.
    rate: int

class HabitStats(BaseModel):
    total_completions: int
    completion_rate: int
    heatmap: List[HeatmapItem]
    weekly_frequency: List[DayFrequency]
    completion_trend: List[TrendItem]

# Planner Models
class PlannerGoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    period: str  # "yearly", "monthly", "weekly"
    year: Optional[int] = None
    month: Optional[int] = None  # 1-12
    week: Optional[int] = None  # Week number of the year
    status: str = "active"  # "active", "completed", "archived"
    tasks: List[str] = Field(default_factory=list)  # List of task descriptions

class PlannerGoalCreate(PlannerGoalBase):
    pass

class PlannerGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tasks: Optional[List[str]] = None

class PlannerGoal(PlannerGoalBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class PlannerTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str  # YYYY-MM-DD format
    start_time: Optional[str] = None  # HH:MM format
    end_time: Optional[str] = None  # HH:MM format
    status: str = "pending"  # "pending", "in_progress", "completed"
    priority: Optional[str] = None  # "low", "medium", "high"
    category: Optional[str] = None

class PlannerTaskCreate(PlannerTaskBase):
    pass

class PlannerTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None

class PlannerTask(PlannerTaskBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
