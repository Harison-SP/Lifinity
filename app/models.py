from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HabitBase(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: str = "Daily"
    # New Fields for Habit Type & Targets
    type: str = "yes_no"  # "yes_no", "measurable"
    targetValue: float = 0
    targetUnit: str = ""
    targetComparator: str = ">="  # ">=", "<=", "=="

    # New Fields for Advanced Frequency
    frequencyType: str = "daily"  # "daily", "specific_days", "interval", "count_per_period"
    frequencyDays: List[int] = Field(default_factory=list)  # Replaces targetDays for specific days
    frequencyInterval: int = 1  # Every X days
    frequencyCount: int = 1  # X times...
    frequencyPeriod: int = 7  # ...per Y days (default week)
    
    # Date & Time
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    timeBlockStart: Optional[str] = None
    timeBlockEnd: Optional[str] = None

    # Deprecated but kept for backward compatibility (will map to new fields)
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
    
    type: Optional[str] = None
    targetValue: Optional[float] = None
    targetUnit: Optional[str] = None
    targetComparator: Optional[str] = None

    frequencyType: Optional[str] = None
    frequencyDays: Optional[List[int]] = None
    frequencyInterval: Optional[int] = None
    frequencyCount: Optional[int] = None
    frequencyPeriod: Optional[int] = None

    startDate: Optional[str] = None
    endDate: Optional[str] = None
    timeBlockStart: Optional[str] = None
    timeBlockEnd: Optional[str] = None
    
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
    value: Optional[float] = 1.0 # Default to 1.0 for yes/no, actual value for measurable
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
    startDate: Optional[str] = None # YYYY-MM-DD
    endDate: Optional[str] = None   # YYYY-MM-DD
    color: Optional[str] = None

class PlannerGoalCreate(PlannerGoalBase):
    pass

class PlannerGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tasks: Optional[List[str]] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    color: Optional[str] = None

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
