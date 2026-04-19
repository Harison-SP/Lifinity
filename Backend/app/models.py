from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth / User Models ──────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    profile_picture: Optional[str] = None
    auth_provider: str = "email"  # "email" or "google"

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Habit Models ────────────────────────────────────────────────────────────

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
    weekdays: List[int] = Field(default_factory=list)  # Replaces targetDays and frequencyDays for specific days
    frequencyInterval: int = 1  # Every X days
    frequencyCount: int = 1  # X times...
    frequencyPeriod: int = 7  # ...per Y days (default week)
    
    # Date & Time
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    timeBlockStart: Optional[str] = None
    timeBlockEnd: Optional[str] = None
    
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
    weekdays: Optional[List[int]] = None
    frequencyInterval: Optional[int] = None
    frequencyCount: Optional[int] = None
    frequencyPeriod: Optional[int] = None

    startDate: Optional[str] = None
    endDate: Optional[str] = None
    timeBlockStart: Optional[str] = None
    timeBlockEnd: Optional[str] = None
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
    habit_name: Optional[str] = None
    completed_at: datetime # UTC timestamp
    value: Optional[float] = 1.0 # Default to 1.0 for yes/no, actual value for measurable
    notes: Optional[str] = None
    focused_minutes: Optional[int] = 0

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

# New Analytics Models
class BinaryHabitAnalytics(BaseModel):
    success_ratio: float  # Percentage
    missed_day_pattern: List[DayFrequency] # Day of week vs missed count
    recovery_time: float # Avg days to recover
    consistency_score: float # Last 7 days %

class MeasurableHabitAnalytics(BaseModel):
    average_value: float
    target_achievement_rate: float # % of days target met
    best_day: Optional[float]
    worst_day: Optional[float]
    trend_percentage: float # Vs previous period
    trend_direction: str # "up", "down", "flat"

class AnalyticsResponse(BaseModel):
    habit_id: str
    type: str
    binary_stats: Optional[BinaryHabitAnalytics] = None
    measurable_stats: Optional[MeasurableHabitAnalytics] = None
    common_stats: HabitStats # Keep existing stats as common base if needed
    period_days: int = 90


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

class DailySummaryNotes(BaseModel):
    whatIPlanned: str = ""
    whatIActuallyDid: str = ""
    winsToday: str = ""
    improvements: str = ""
    tomorrowFocus: str = ""

class DailySummaryBase(BaseModel):
    date: str  # YYYY-MM-DD
    plannedHours: float = 0.0
    actualHours: float = 0.0
    completionPercentage: float = 0.0
    mood: str = ""
    notes: DailySummaryNotes = Field(default_factory=DailySummaryNotes)

class DailySummaryCreate(DailySummaryBase):
    pass

class DailySummary(DailySummaryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
# Weekly Planner Models
class WeeklyTaskBase(BaseModel):
    text: str
    date: str  # YYYY-MM-DD format
    completed: bool = False
    task_type: str = "normal"  # "normal" or "habit"
    habit_id: Optional[str] = None  # Link to habit if task_type is "habit"
    week_start: str  # YYYY-MM-DD format - Monday of the week

class WeeklyTaskCreate(WeeklyTaskBase):
    pass

class WeeklyTaskUpdate(BaseModel):
    text: Optional[str] = None
    date: Optional[str] = None
    completed: Optional[bool] = None
    task_type: Optional[str] = None
    habit_id: Optional[str] = None

class WeeklyTask(WeeklyTaskBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class WeeklyTargetBase(BaseModel):
    text: str
    completed: bool = False
    week_start: str  # YYYY-MM-DD format - Monday of the week

class WeeklyTargetCreate(WeeklyTargetBase):
    pass

class WeeklyTargetUpdate(BaseModel):
    text: Optional[str] = None
    completed: Optional[bool] = None

class WeeklyTarget(WeeklyTargetBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class WeeklyReviewBase(BaseModel):
    week_start: str  # YYYY-MM-DD format - Monday of the week
    achieved: str = ""
    missed: str = ""
    why: str = ""
    carry_forward: str = ""

class WeeklyReviewCreate(WeeklyReviewBase):
    pass

class WeeklyReviewUpdate(BaseModel):
    achieved: Optional[str] = None
    missed: Optional[str] = None
    why: Optional[str] = None
    carry_forward: Optional[str] = None

class WeeklyReview(WeeklyReviewBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class WeeklyMetricsBase(BaseModel):
    week_start: str  # YYYY-MM-DD format - Monday of the week
    focus_hours: float = 0.0

class WeeklyMetricsCreate(WeeklyMetricsBase):
    pass

class WeeklyMetricsUpdate(BaseModel):
    focus_hours: Optional[float] = None

class WeeklyMetrics(WeeklyMetricsBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Note Models
class NoteBase(BaseModel):
    content: str
    date: str  # YYYY-MM-DD format
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    content: Optional[str] = None
    date: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None

class Note(NoteBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Monthly Reflection Models
class MonthlyReflectionBase(BaseModel):
    year: int
    month: int  # 1-12
    primary_focus: List[str] = Field(default_factory=list)  # List of habit IDs
    secondary_focus: List[str] = Field(default_factory=list)  # List of habit IDs
    targeted_goals: str = ""  # What user planned to achieve
    achieved_goals: str = ""  # What user actually achieved
    worked: str = ""  # What worked well
    failed: str = ""  # What didn't work
    improve: str = ""  # What to improve
    study_hours: float = 0.0  # Calculated from task time blocks

class MonthlyReflectionCreate(MonthlyReflectionBase):
    pass

class MonthlyReflectionUpdate(BaseModel):
    primary_focus: Optional[List[str]] = None
    secondary_focus: Optional[List[str]] = None
    targeted_goals: Optional[str] = None
    achieved_goals: Optional[str] = None
    worked: Optional[str] = None
    failed: Optional[str] = None
    improve: Optional[str] = None
    study_hours: Optional[float] = None

class MonthlyReflection(MonthlyReflectionBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Habit Note Models (Rich-text notes linked to habits)
class HabitNoteBase(BaseModel):
    habit_id: str
    title: str = ""
    content: str = ""  # HTML content from rich-text editor
    tags: List[str] = Field(default_factory=list)
    is_pinned: bool = False

class HabitNoteCreate(HabitNoteBase):
    pass

class HabitNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_pinned: Optional[bool] = None

class HabitNote(HabitNoteBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ── Learning System Models ──────────────────────────────────────────────────

class LearningSystemItem(BaseModel):
    """A single task entry inside a learning system (a day's work)."""
    title: str
    description: Optional[str] = None
    week_number: int
    day_number: int
    phase: Optional[str] = "Phase 1"
    week_focus: Optional[str] = None
    time_block_start: Optional[str] = None   # e.g. "09:00"
    time_block_end: Optional[str] = None     # e.g. "11:00"
    resource_link: Optional[str] = None

class LearningSystemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    items: List[LearningSystemItem] = Field(default_factory=list)

class LearningSystemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    items: Optional[List[LearningSystemItem]] = None

class LearningSystem(LearningSystemCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class SystemGenerateRequest(BaseModel):
    """Payload to request AI generation of a learning system."""
    topic: str
    description: Optional[str] = None
    duration_weeks: int = Field(default=4, ge=1, le=12)

class SystemInstantiate(BaseModel):
    """Payload to apply / instantiate a learning system into the habit planner."""
    system_id: str
    start_date: str          # YYYY-MM-DD
    habit_id: Optional[str] = None  # Optional parent yearly habit to attach to





