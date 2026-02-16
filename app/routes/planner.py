from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from app.models import (
    PlannerGoal, PlannerGoalCreate, PlannerGoalUpdate,
    PlannerTask, PlannerTaskCreate, PlannerTaskUpdate,
    Note, NoteCreate, NoteUpdate,
    MonthlyReflection, MonthlyReflectionCreate, MonthlyReflectionUpdate,
    HabitNote, HabitNoteCreate, HabitNoteUpdate
)
from app.database import db, habit_collection, habit_log_collection, note_collection, monthly_reflection_collection, habit_note_collection

router = APIRouter(prefix="/planner", tags=["planner"])

# Helper function to convert ObjectId to string
def goal_helper(goal) -> dict:
    serialized = {k: v for k, v in goal.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized

def task_helper(task) -> dict:
    serialized = {k: v for k, v in task.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized

def habit_helper(habit) -> dict:
    """Convert habit document to dict with proper serialization"""
    serialized = {k: v for k, v in habit.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized

# Goals endpoints (using habits collection with period-based categorization)
@router.get("/goals", response_model=List[PlannerGoal])
async def get_goals(
    period: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    week: Optional[int] = None
):
    """
    Get planner goals from the habits collection.
    Goals are habits with startDate and endDate that span across periods.
    """
    query = {}
    
    # Filter habits that have both startDate and endDate (goal-like habits)
    query["startDate"] = {"$exists": True, "$ne": None}
    query["endDate"] = {"$exists": True, "$ne": None}
    
    # Additional filters if provided
    if year:
        # Find habits that overlap with the specified year
        year_start = f"{year}-01-01"
        year_end = f"{year}-12-31"
        query["$or"] = [
            {"startDate": {"$lte": year_end}, "endDate": {"$gte": year_start}}
        ]
    
    goals = []
    for habit in habit_collection.find(query):
        # Convert habit to goal format
        goal_data = habit_helper(habit)
        
        # Map habit fields to goal fields
        goal = {
            "id": goal_data.get("id"),
            "title": goal_data.get("name"),
            "description": goal_data.get("description"),
            "period": period or "yearly",
            "year": year,
            "month": month,
            "week": week,
            "status": "active",  # Could map from habit status if needed
            "tasks": [],  # Habits don't have sub-tasks
            "startDate": goal_data.get("startDate"),
            "endDate": goal_data.get("endDate"),
            "color": goal_data.get("color"),
            "created_at": goal_data.get("created_at")
        }
        goals.append(goal)
    
    return goals

@router.post("/goals", response_model=PlannerGoal)
async def create_goal(goal: PlannerGoalCreate):
    """
    Create a new goal by creating a habit with date ranges.
    """
    # Convert goal to habit format
    habit_data = {
        "name": goal.title,
        "description": goal.description,
        "frequency": "Custom",
        "type": "yes_no",
        "targetValue": 0,
        "targetUnit": "",
        "targetComparator": ">=",
        "frequencyType": goal.period or "custom",
        "weekdays": [],
        "frequencyInterval": 1,
        "frequencyCount": 1,
        "frequencyPeriod": 7,
        "startDate": goal.startDate,
        "endDate": goal.endDate,
        "timeBlockStart": None,
        "timeBlockEnd": None,
        "icon": "star",
        "color": goal.color or "#ec5b13",
        "category": "General",
        "streak": 0,
        "bestStreak": 0,
        "completionRate": 0,
        "completedToday": False,
        "created_at": datetime.utcnow(),
        "_isGoal": True  # Marker to identify this as a goal
    }
    
    result = habit_collection.insert_one(habit_data)
    created_habit = habit_collection.find_one({"_id": result.inserted_id})
    
    # Convert back to goal format
    goal_data = habit_helper(created_habit)
    return {
        "id": goal_data.get("id"),
        "title": goal_data.get("name"),
        "description": goal_data.get("description"),
        "period": goal.period,
        "year": goal.year,
        "month": goal.month,
        "week": goal.week,
        "status": "active",
        "tasks": [],
        "startDate": goal_data.get("startDate"),
        "endDate": goal_data.get("endDate"),
        "color": goal_data.get("color"),
        "created_at": goal_data.get("created_at")
    }

@router.get("/goals/{goal_id}", response_model=PlannerGoal)
async def get_goal(goal_id: str):
    """Get a specific goal by ID"""
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")
    
    habit = habit_collection.find_one({"_id": ObjectId(goal_id)})
    if not habit:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal_data = habit_helper(habit)
    return {
        "id": goal_data.get("id"),
        "title": goal_data.get("name"),
        "description": goal_data.get("description"),
        "period": "yearly",
        "status": "active",
        "tasks": [],
        "startDate": goal_data.get("startDate"),
        "endDate": goal_data.get("endDate"),
        "color": goal_data.get("color"),
        "created_at": goal_data.get("created_at")
    }

@router.put("/goals/{goal_id}", response_model=PlannerGoal)
async def update_goal(goal_id: str, goal_update: PlannerGoalUpdate):
    """Update a goal"""
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")
    
    # Convert goal updates to habit updates
    update_data = {}
    if goal_update.title is not None:
        update_data["name"] = goal_update.title
    if goal_update.description is not None:
        update_data["description"] = goal_update.description
    if goal_update.startDate is not None:
        update_data["startDate"] = goal_update.startDate
    if goal_update.endDate is not None:
        update_data["endDate"] = goal_update.endDate
    if goal_update.color is not None:
        update_data["color"] = goal_update.color
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = habit_collection.update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    updated_habit = habit_collection.find_one({"_id": ObjectId(goal_id)})
    goal_data = habit_helper(updated_habit)
    
    return {
        "id": goal_data.get("id"),
        "title": goal_data.get("name"),
        "description": goal_data.get("description"),
        "period": "yearly",
        "status": "active",
        "tasks": [],
        "startDate": goal_data.get("startDate"),
        "endDate": goal_data.get("endDate"),
        "color": goal_data.get("color"),
        "created_at": goal_data.get("created_at")
    }

@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    """Delete a goal"""
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")
    
    result = habit_collection.delete_one({"_id": ObjectId(goal_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return {"message": "Goal deleted successfully"}

# Tasks endpoints (using habits collection with daily categorization)
@router.get("/tasks", response_model=List[PlannerTask])
async def get_tasks(date: Optional[str] = None):
    """
    Get planner tasks from habits collection.
    Tasks are daily habits with specific time blocks.
    """
    query = {}
    
    if date:
        # Find habits that have timeBlockStart and timeBlockEnd for the specific date
        # Or habits that are active on this date
        query["$or"] = [
            {
                "timeBlockStart": {"$exists": True, "$ne": None},
                "timeBlockEnd": {"$exists": True, "$ne": None}
            },
            {
                "startDate": {"$lte": date},
                "endDate": {"$gte": date}
            }
        ]
    else:
        # Get all habits with time blocks
        query["timeBlockStart"] = {"$exists": True, "$ne": None}
    
    tasks = []
    for habit in habit_collection.find(query):
        # Convert habit to task format
        task_data = habit_helper(habit)
        
        task = {
            "id": task_data.get("id"),
            "title": task_data.get("name"),
            "description": task_data.get("description"),
            "date": date or task_data.get("startDate", ""),
            "start_time": task_data.get("timeBlockStart"),
            "end_time": task_data.get("timeBlockEnd"),
            "status": "completed" if task_data.get("completedToday") else "pending",
            "priority": "medium",  # Default priority
            "category": task_data.get("category"),
            "created_at": task_data.get("created_at")
        }
        tasks.append(task)
    
    return tasks

@router.post("/tasks", response_model=PlannerTask)
async def create_task(task: PlannerTaskCreate):
    """Create a new task as a habit with time block"""
    habit_data = {
        "name": task.title,
        "description": task.description,
        "frequency": "Daily",
        "type": "yes_no",
        "targetValue": 0,
        "targetUnit": "",
        "targetComparator": ">=",
        "frequencyType": "daily",
        "weekdays": [],
        "frequencyInterval": 1,
        "frequencyCount": 1,
        "frequencyPeriod": 1,
        "startDate": task.date,
        "endDate": task.date,
        "timeBlockStart": task.start_time,
        "timeBlockEnd": task.end_time,
        "icon": "task_alt",
        "color": "#3b82f6",
        "category": task.category or "General",
        "streak": 0,
        "bestStreak": 0,
        "completionRate": 0,
        "completedToday": task.status == "completed",
        "created_at": datetime.utcnow(),
        "_isTask": True  # Marker to identify this as a task
    }
    
    result = habit_collection.insert_one(habit_data)
    created_habit = habit_collection.find_one({"_id": result.inserted_id})
    task_data = habit_helper(created_habit)
    
    return {
        "id": task_data.get("id"),
        "title": task_data.get("name"),
        "description": task_data.get("description"),
        "date": task.date,
        "start_time": task_data.get("timeBlockStart"),
        "end_time": task_data.get("timeBlockEnd"),
        "status": task.status,
        "priority": task.priority,
        "category": task_data.get("category"),
        "created_at": task_data.get("created_at")
    }

@router.get("/tasks/{task_id}", response_model=PlannerTask)
async def get_task(task_id: str):
    """Get a specific task by ID"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    habit = habit_collection.find_one({"_id": ObjectId(task_id)})
    if not habit:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_data = habit_helper(habit)
    return {
        "id": task_data.get("id"),
        "title": task_data.get("name"),
        "description": task_data.get("description"),
        "date": task_data.get("startDate", ""),
        "start_time": task_data.get("timeBlockStart"),
        "end_time": task_data.get("timeBlockEnd"),
        "status": "completed" if task_data.get("completedToday") else "pending",
        "priority": "medium",
        "category": task_data.get("category"),
        "created_at": task_data.get("created_at")
    }

@router.put("/tasks/{task_id}", response_model=PlannerTask)
async def update_task(task_id: str, task_update: PlannerTaskUpdate):
    """Update a task"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    update_data = {}
    if task_update.title is not None:
        update_data["name"] = task_update.title
    if task_update.description is not None:
        update_data["description"] = task_update.description
    if task_update.date is not None:
        update_data["startDate"] = task_update.date
        update_data["endDate"] = task_update.date
    if task_update.start_time is not None:
        update_data["timeBlockStart"] = task_update.start_time
    if task_update.end_time is not None:
        update_data["timeBlockEnd"] = task_update.end_time
    if task_update.status is not None:
        update_data["completedToday"] = task_update.status == "completed"
    if task_update.category is not None:
        update_data["category"] = task_update.category
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = habit_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated_habit = habit_collection.find_one({"_id": ObjectId(task_id)})
    task_data = habit_helper(updated_habit)
    
    return {
        "id": task_data.get("id"),
        "title": task_data.get("name"),
        "description": task_data.get("description"),
        "date": task_data.get("startDate", ""),
        "start_time": task_data.get("timeBlockStart"),
        "end_time": task_data.get("timeBlockEnd"),
        "status": task_update.status or "pending",
        "priority": task_update.priority or "medium",
        "category": task_data.get("category"),
        "created_at": task_data.get("created_at")
    }

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    result = habit_collection.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}

# Notes endpoints
def note_helper(note) -> dict:
    """Convert note document to dict with proper serialization"""
    serialized = {k: v for k, v in note.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized

@router.get("/notes", response_model=List[Note])
async def get_notes(
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get notes, optionally filtered by date or date range"""
    query = {}
    
    if date:
        query["date"] = date
    elif start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}
    
    notes = list(note_collection.find(query).sort("date", -1))
    return [note_helper(note) for note in notes]

@router.post("/notes", response_model=Note)
async def create_note(note: NoteCreate):
    """Create a new note"""
    note_dict = note.dict()
    note_dict["created_at"] = datetime.utcnow()
    
    result = note_collection.insert_one(note_dict)
    created_note = note_collection.find_one({"_id": result.inserted_id})
    return note_helper(created_note)

@router.get("/notes/{note_id}", response_model=Note)
async def get_note(note_id: str):
    """Get a specific note by ID"""
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    note = note_collection.find_one({"_id": ObjectId(note_id)})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return note_helper(note)

@router.put("/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, note_update: NoteUpdate):
    """Update a note"""
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    update_data = {k: v for k, v in note_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = note_collection.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    updated_note = note_collection.find_one({"_id": ObjectId(note_id)})
    return note_helper(updated_note)

@router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note"""
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    result = note_collection.delete_one({"_id": ObjectId(note_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted successfully"}

# Monthly Reflection endpoints
def reflection_helper(reflection) -> dict:
    """Convert reflection document to dict with proper serialization"""
    serialized = {k: v for k, v in reflection.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized

@router.get("/reflections", response_model=List[MonthlyReflection])
async def get_reflections(year: Optional[int] = None, month: Optional[int] = None):
    """Get monthly reflections, optionally filtered by year and month"""
    query = {}
    
    if year:
        query["year"] = year
    if month:
        query["month"] = month
    
    reflections = list(monthly_reflection_collection.find(query).sort([("year", -1), ("month", -1)]))
    return [reflection_helper(r) for r in reflections]

@router.get("/reflections/{year}/{month}", response_model=MonthlyReflection)
async def get_reflection(year: int, month: int):
    """Get reflection for a specific month"""
    reflection = monthly_reflection_collection.find_one({"year": year, "month": month})
    if not reflection:
        # Return empty reflection if not found
        return {
            "id": "",
            "year": year,
            "month": month,
            "primary_focus": [],
            "secondary_focus": [],
            "targeted_goals": "",
            "achieved_goals": "",
            "worked": "",
            "failed": "",
            "improve": "",
            "study_hours": 0.0,
            "created_at": datetime.utcnow()
        }
    
    return reflection_helper(reflection)

@router.post("/reflections", response_model=MonthlyReflection)
async def create_or_update_reflection(reflection: MonthlyReflectionCreate):
    """Create or update a monthly reflection"""
    # Check if reflection already exists
    existing = monthly_reflection_collection.find_one({
        "year": reflection.year,
        "month": reflection.month
    })
    
    reflection_dict = reflection.dict()
    
    if existing:
        # Update existing
        monthly_reflection_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": reflection_dict}
        )
        updated = monthly_reflection_collection.find_one({"_id": existing["_id"]})
        return reflection_helper(updated)
    else:
        # Create new
        reflection_dict["created_at"] = datetime.utcnow()
        result = monthly_reflection_collection.insert_one(reflection_dict)
        created = monthly_reflection_collection.find_one({"_id": result.inserted_id})
        return reflection_helper(created)

@router.put("/reflections/{year}/{month}", response_model=MonthlyReflection)
async def update_reflection(year: int, month: int, reflection_update: MonthlyReflectionUpdate):
    """Update a monthly reflection"""
    update_data = {k: v for k, v in reflection_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = monthly_reflection_collection.update_one(
        {"year": year, "month": month},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        # Create if doesn't exist
        new_reflection = {
            "year": year,
            "month": month,
            "primary_focus": [],
            "secondary_focus": [],
            "targeted_goals": "",
            "achieved_goals": "",
            "worked": "",
            "failed": "",
            "improve": "",
            "study_hours": 0.0,
            "created_at": datetime.utcnow()
        }
        new_reflection.update(update_data)
        result = monthly_reflection_collection.insert_one(new_reflection)
        created = monthly_reflection_collection.find_one({"_id": result.inserted_id})
        return reflection_helper(created)
    
    updated = monthly_reflection_collection.find_one({"year": year, "month": month})
    return reflection_helper(updated)

# Habit completions for monthly view
@router.get("/habits/completions")
async def get_habit_completions(year: int, month: int, timezone_offset: int = 0):
    """
    Get all habit completions for a specific month.
    Returns a map of habit_id -> {day: completion_status}
    """
    # Calculate start and end dates in LOCAL time
    local_start = datetime(year, month, 1)
    if month == 12:
        local_end = datetime(year + 1, 1, 1)
    else:
        local_end = datetime(year, month + 1, 1)
    
    # Apply offset to get UTC query range
    # Local = UTC - Offset  =>  UTC = Local + Offset
    offset_delta = timedelta(minutes=timezone_offset)
    utc_start = local_start + offset_delta
    utc_end = local_end + offset_delta
    
    # Get all habits
    habits = list(habit_collection.find())
    
    # Get all logs for this month (using UTC range)
    logs = list(habit_log_collection.find({
        "completed_at": {"$gte": utc_start, "$lt": utc_end}
    }))
    
    # Build completion map
    completions = {}
    
    for habit in habits:
        habit_id = str(habit["_id"])
        completions[habit_id] = {
            "name": habit.get("name", ""),
            "type": habit.get("type", "yes_no"),
            "completions": {}
        }
    
    # Fill in completions
    for log in logs:
        habit_id = log["habit_id"]
        completed_at = log["completed_at"]
        
        # Ensure timezone awareness
        if completed_at.tzinfo is None:
            completed_at = completed_at.replace(tzinfo=timezone.utc)
            
        # Convert to Local Time to get correct day
        # Local = UTC - Offset
        local_time = completed_at - offset_delta
        
        # Double check if it falls in the month (it should based on query, but good for safety)
        if local_time.month != month:
            continue
            
        day = local_time.day
        value = log.get("value")
        if value is None:
            value = 1.0
        
        if habit_id in completions:
            # For yes_no habits, value > 0 means completed
            # For measurable habits, store the actual value
            if completions[habit_id]["type"] == "yes_no":
                completions[habit_id]["completions"][day] = value > 0
            else:
                completions[habit_id]["completions"][day] = value
    
    return completions

# Calculate study hours from time blocks
@router.get("/study-hours/{year}/{month}")
async def calculate_study_hours(year: int, month: int):
    """
    Calculate total study hours from task time blocks for a specific month.
    """
    # Get start and end dates for the month
    start_date_str = f"{year}-{month:02d}-01"
    if month == 12:
        end_date_str = f"{year + 1}-01-01"
    else:
        end_date_str = f"{year}-{month + 1:02d}-01"
    
    # Find all tasks (habits with time blocks) in this month
    tasks = list(habit_collection.find({
        "timeBlockStart": {"$exists": True, "$ne": None},
        "timeBlockEnd": {"$exists": True, "$ne": None},
        "startDate": {"$gte": start_date_str, "$lt": end_date_str}
    }))
    
    total_hours = 0.0
    
    for task in tasks:
        start_time = task.get("timeBlockStart")
        end_time = task.get("timeBlockEnd")
        
        if start_time and end_time:
            try:
                # Parse time strings (HH:MM format)
                start_parts = start_time.split(":")
                end_parts = end_time.split(":")
                
                start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
                end_minutes = int(end_parts[0]) * 60 + int(end_parts[1])
                
                # Calculate duration in hours
                duration_minutes = end_minutes - start_minutes
                if duration_minutes < 0:
                    duration_minutes += 24 * 60  # Handle overnight tasks
                
                total_hours += duration_minutes / 60.0
            except (ValueError, IndexError):
                continue  # Skip invalid time formats
    
    return {"study_hours": round(total_hours, 2)}


# Habit Notes endpoints (rich-text notes linked to habits)
def habit_note_helper(note) -> dict:
    """Convert habit note document to dict with proper serialization"""
    serialized = {k: v for k, v in note.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized


@router.get("/habit-notes/{habit_id}", response_model=List[HabitNote])
async def get_habit_notes(habit_id: str):
    """Get all notes for a specific habit"""
    notes = list(habit_note_collection.find({"habit_id": habit_id}).sort("updated_at", -1))
    return [habit_note_helper(n) for n in notes]


@router.post("/habit-notes", response_model=HabitNote)
async def create_habit_note(note: HabitNoteCreate):
    """Create a new rich-text note for a habit"""
    note_dict = note.dict()
    now = datetime.utcnow()
    note_dict["created_at"] = now
    note_dict["updated_at"] = now
    
    result = habit_note_collection.insert_one(note_dict)
    created = habit_note_collection.find_one({"_id": result.inserted_id})
    return habit_note_helper(created)


@router.get("/habit-notes/detail/{note_id}", response_model=HabitNote)
async def get_habit_note(note_id: str):
    """Get a specific habit note by ID"""
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    note = habit_note_collection.find_one({"_id": ObjectId(note_id)})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return habit_note_helper(note)


@router.put("/habit-notes/{note_id}", response_model=HabitNote)
async def update_habit_note(note_id: str, note_update: HabitNoteUpdate):
    """Update a habit note"""
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    update_data = {k: v for k, v in note_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = habit_note_collection.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    updated = habit_note_collection.find_one({"_id": ObjectId(note_id)})
    return habit_note_helper(updated)


@router.delete("/habit-notes/{note_id}")
async def delete_habit_note(note_id: str):
    """Delete a habit note"""
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    result = habit_note_collection.delete_one({"_id": ObjectId(note_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted successfully"}
