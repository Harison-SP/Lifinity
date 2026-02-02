from fastapi import APIRouter, HTTPException, Query
from app.database import habit_collection, habit_log_collection
from app.models import Habit, HabitCreate, HabitUpdate, HabitLogCreate, HabitStats
from app.serializers import habits_serializer, habit_serializer
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional

router = APIRouter()

def get_day_range_utc(date_str: str, timezone_offset_minutes: int):
    """
    Convert a local date (YYYY-MM-DD) + offset into UTC start/end range.
    timezone_offset_minutes: Connection between UTC and Local. 
    Local = UTC - offset (Javascript sends new Date().getTimezoneOffset(), which is UTC - Local)
    Actually JS getTimezoneOffset() returns (UTC - Local) in minutes.
    So Local = UTC - MethodResult.
    So UTC = Local + MethodResult.
    
    Example: User is in UTC+5:30. 10:30 PM Local.
    JS `date.getTimezoneOffset()` returns -330.
    10:30 PM Local + (-330 minutes) = 5:00 PM UTC. Correct.
    
    So to find UTC range for a Local Day:
    Local Start: YYYY-MM-DDT00:00:00
    Local End: YYYY-MM-DDT23:59:59.999
    
    UTC Start = Local Start + Offset
    UTC End = Local End + Offset
    """
    try:
        local_date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    local_start = local_date.replace(hour=0, minute=0, second=0, microsecond=0)
    local_end = local_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Apply offset to get UTC
    # If JS sends +ve for West (UTC-5 -> 300) and -ve for East (UTC+5:30 -> -330)
    offset = timedelta(minutes=timezone_offset_minutes)
    
    utc_start = local_start + offset
    utc_end = local_end + offset
    
    return utc_start, utc_end

@router.get("", response_model=list[Habit])
async def get_habits(date: Optional[str] = None, timezone_offset: Optional[int] = 0):
    habits = list(habit_collection.find())
    
    if date:
        # If date is provided, we need to check "completedToday" based on that date
        # "completedToday" becomes "completedOnRequestedDate"
        utc_start, utc_end = get_day_range_utc(date, timezone_offset)
        
        for habit in habits:
            habit_id = str(habit["_id"])
            log = habit_log_collection.find_one({
                "habit_id": habit_id,
                "completed_at": {"$gte": utc_start, "$lte": utc_end}
            })
            habit["completedToday"] = True if log else False
            
    return habits_serializer(habits)

@router.get("/{id}/history")
async def get_habit_history(
    id: str, 
    page: int = Query(1, ge=1), 
    size: int = Query(10, ge=1, le=100),
    timezone_offset: Optional[int] = 0
):
    skip = (page - 1) * size
    
    # Filter logs by habit_id
    query = {"habit_id": id}
    
    total = habit_log_collection.count_documents(query)
    cursor = habit_log_collection.find(query).sort("completed_at", -1).skip(skip).limit(size)
    logs = list(cursor)
    
    # Serialize logs
    # We might want to add "local_date" to the response for convenience?
    # Or just return raw logs.
    
    serialized_logs = []
    for log in logs:
        log["id"] = str(log["_id"])
        # Remove the _id field to avoid serialization issues
        del log["_id"]
        serialized_logs.append(log)

    return {
        "items": serialized_logs,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }

@router.get("/{id}/stats", response_model=HabitStats)
async def get_habit_stats(id: str, timezone_offset: Optional[int] = 0):
    # 1. Total Completions
    total_completions = habit_log_collection.count_documents({"habit_id": id})
    
    # 2. Completion Rate (Overall)
    # This is tricky because "Total Possible Days" depends on creation date and frequency.
    # For now, we can use the stored completionRate in the Habit document, 
    # OR calculate it dynamically based on creation date.
    # Let's use the one from the document for consistency, or simple logic:
    # Rate = Total Completions / (Days since creation)
    
    habit = habit_collection.find_one({"_id": ObjectId(id)})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    # Recalculate completion rate dynamically for better accuracy?
    # Simple approach: Days since creation
    created_at = habit.get("created_at")
    
    # Ensure created_at is aware
    if created_at and created_at.tzinfo is None:
         created_at = created_at.replace(tzinfo=timezone.utc)
         
    if not created_at:
        # Fallback if created_at is missing
        created_at = datetime.now(timezone.utc) - timedelta(days=1)
        
    days_since = (datetime.now(timezone.utc) - created_at).days
    if days_since < 1: 
        days_since = 1
        
    # If frequency is Weekly, divisor is weeks_since
    # For now assuming 'Daily' is standard for this calc or just using Days.
    # Let's stick to the habit's stored rate if available, or calc simple one.
    completion_rate = habit.get("completionRate", 0) # Use stored one for consistency with list view
    
    
    # 3. Heatmap Data (Last 365 days)
    # We need to map logs to "YYYY-MM-DD" in Local Time.
    heatmap_data = []
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=365)
    
    logs_last_year = list(habit_log_collection.find({
        "habit_id": id,
        "completed_at": {"$gte": start_date}
    }))
    
    # Count per day
    day_counts = {}
    for log in logs_last_year:
        c_at = log["completed_at"]
        if c_at.tzinfo is None: c_at = c_at.replace(tzinfo=timezone.utc)
        local_time = c_at - timedelta(minutes=timezone_offset)
        day_str = local_time.strftime("%Y-%m-%d")
        day_counts[day_str] = day_counts.get(day_str, 0) + (log.get("value") or 1) # Use value if present, else 1
        
    # Fill mapping? Or just return sparse list?
    # Frontend expects specific levels.
    # Let's return sparse list of non-zero days. Frontend has logic to fill gaps if mapped by date,
    # BUT the frontend current implementation is a Grid of 364 boxes. 
    # Better to return the map of {date: level}.
    
    for date_str, count in day_counts.items():
        # Level logic: 0=0, 1=1, 2=2, 3=3+, etc. Customizable.
        level = 0
        if count >= 1: level = 1
        if count >= 2: level = 2
        if count >= 3: level = 3
        if count >= 5: level = 4
        
        heatmap_data.append({"date": date_str, "level": level})
        
        
    # 4. Weekly Frequency (Mon, Tue, ... Sun)
    # Aggregate logs by Weekday
    # MongoDB $dayOfWeek is 1=Sunday. Python weekday() is 0=Mon.
    week_counts = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0} # Mon(0) to Sun(6)
    
    for log in logs_last_year: # Use same set of logs
        c_at = log["completed_at"]
        if c_at.tzinfo is None: c_at = c_at.replace(tzinfo=timezone.utc)
        local_time = c_at - timedelta(minutes=timezone_offset)
        # Python weekday: Mon=0, Sun=6
        wd = local_time.weekday()
        week_counts[wd] += 1
        
    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly_frequency = []
    
    max_freq = max(week_counts.values()) if week_counts.values() else 1
    
    for i in range(7):
        count = week_counts[i]
        percentage = (count / max_freq) * 100 if max_freq > 0 else 0
        weekly_frequency.append({
            "day_name": day_labels[i],
            "count": count,
            "percentage": int(percentage)
        })
        
        
    # 5. Trend (Last 4 Weeks or Months?)
    # "Last 6 months" is common. Or "Last 4 weeks" for more granular.
    # Image says "+15% vs last month" -> implies monthly comparison or weekly.
    # Let's do Last 8 Weeks.
    
    trend_data = []
    # bucket by week
    current_week_start = end_date - timedelta(days=end_date.weekday()) # Previous Monday
    
    for i in range(8):
        # Go back i weeks
        w_end = current_week_start - timedelta(weeks=i)
        w_start = w_end - timedelta(days=6)
        
        # Count logs in this range
        count = 0
        for log in logs_last_year:
             c_at = log["completed_at"]
             if c_at.tzinfo is None: c_at = c_at.replace(tzinfo=timezone.utc)
             # Use UTC for buckets to be consistent or shift to local?
             # Simple UTC comparison is fine for trends
             if w_start <= c_at <= w_end + timedelta(days=1):
                 count += 1
                 
        # Calculate rate: count / target? 
        # Or just raw count for now?
        # Let's assume Daily habit => 7 is 100%.
        rate = int((count / 7) * 100)
        if rate > 100: rate = 100
        
        trend_data.insert(0, {
            "period": f"W{-i}", # Just a label
            "rate": rate
        })
        
        
    return {
        "total_completions": total_completions,
        "completion_rate": int(completion_rate),
        "heatmap": heatmap_data,
        "weekly_frequency": weekly_frequency,
        "completion_trend": trend_data
    }

@router.get("/{id}", response_model=Habit)
async def get_habit(id: str, date: Optional[str] = None, timezone_offset: Optional[int] = 0):
    habit = habit_collection.find_one({"_id": ObjectId(id)})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    if date:
        utc_start, utc_end = get_day_range_utc(date, timezone_offset)
        habit_id = str(habit["_id"])
        log = habit_log_collection.find_one({
            "habit_id": habit_id,
            "completed_at": {"$gte": utc_start, "$lte": utc_end}
        })
        habit["completedToday"] = True if log else False

    return habit_serializer(habit)

@router.post("", response_model=Habit)
async def create_habit(habit: HabitCreate):
    habit_dict = habit.dict()
    # Ensure creation time is UTC aware if possible, or naive UTC
    habit_dict["created_at"] = datetime.now(timezone.utc) 
    habit_dict["completedToday"] = False # Default to False upon creation
    result = habit_collection.insert_one(habit_dict)
    new_habit = habit_collection.find_one({"_id": result.inserted_id})
    return habit_serializer(new_habit)

@router.put("/{id}", response_model=Habit)
async def update_habit(id: str, habit: HabitUpdate):
    update_data = {k: v for k, v in habit.dict().items() if v is not None}
    
    if not update_data:
         # raise HTTPException(status_code=400, detail="No data provided to update")
         # Allow empty update for side-effects if needed, or just return existing
         pass

    # We generally don't want to update derived fields like streak directly via PUT 
    # unless it's a migration/admin action. But for now we keep it open.
    
    if update_data:
        result = habit_collection.update_one({"_id": ObjectId(id)}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Habit not found")
        
    updated_habit = habit_collection.find_one({"_id": ObjectId(id)})
    return habit_serializer(updated_habit)

@router.delete("/{id}")
async def delete_habit(id: str):
    result = habit_collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Also delete logs
    habit_log_collection.delete_many({"habit_id": id})
    
    return {"message": "Habit deleted successfully"}

@router.post("/{id}/toggle", response_model=Habit)
async def toggle_habit_completion(id: str, payload: dict):
    # Payload expected: {"completed_at": "ISO_STRING", "timezone_offset": int_minutes, "value": float, "notes": str}
    completed_at_str = payload.get("completed_at")
    timezone_offset = payload.get("timezone_offset", 0)
    
    if not completed_at_str:
        raise HTTPException(status_code=400, detail="completed_at is required")

    try:
        # Pydantic or `datetime.fromisoformat` handle ISO strings (usually with 'Z' or offset)
        # We expect frontend to send UTC ISO string: "2024-02-02T10:00:00.000Z"
        if completed_at_str.endswith("Z"):
            completed_at_str = completed_at_str[:-1] + "+00:00"
        completed_at = datetime.fromisoformat(completed_at_str)
        
        # Ensure it's timezone aware (UTC)
        if completed_at.tzinfo is None:
             completed_at = completed_at.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    # Determine "Local Day"
    # Local = UTC - Offset
    local_time = completed_at - timedelta(minutes=timezone_offset)
    local_day_str = local_time.strftime("%Y-%m-%d") # The "date" we are toggling for
    
    # Get that day's UTC range to find existing log
    utc_start, utc_end = get_day_range_utc(local_day_str, timezone_offset)
    
    existing_log = habit_log_collection.find_one({
        "habit_id": id,
        "completed_at": {"$gte": utc_start, "$lte": utc_end}
    })
    
    update_data = {}
    
    # Check for update payload
    req_value = payload.get("value")
    req_notes = payload.get("notes")

    if existing_log:
        # Check if this is an update (providing value/notes) or a toggle-off
        # Heuristic: If value or notes are provided in payload, treat as UPDATE.
        # If both are missing/null, treat as TOGGLE OFF.
        
        if req_value is not None or req_notes is not None:
             # UPDATE
             update_fields = {}
             if req_value is not None: update_fields["value"] = req_value
             if req_notes is not None: update_fields["notes"] = req_notes
             
             habit_log_collection.update_one(
                 {"_id": existing_log["_id"]},
                 {"$set": update_fields}
             )
             update_data["completedToday"] = True # Still completed
        else:
            # Toggle OFF: Delete log
            habit_log_collection.delete_one({"_id": existing_log["_id"]})
            update_data["completedToday"] = False
    else:
        # Toggle ON: Insert log
        new_log = {
            "habit_id": id,
            "completed_at": completed_at,
            "value": req_value,
            "notes": req_notes
        }
        habit_log_collection.insert_one(new_log)
        update_data["completedToday"] = True
    
    # Recalculate Streak
    # Get all logs for this habit, sorted
    all_logs = list(habit_log_collection.find({"habit_id": id}).sort("completed_at", 1))
    
    # Map logs to Local Days
    unique_days = set()
    for log in all_logs:
        c_at = log["completed_at"]
        if c_at.tzinfo is None:
            c_at = c_at.replace(tzinfo=timezone.utc)
            
        l_time = c_at - timedelta(minutes=timezone_offset)
        unique_days.add(l_time.strftime("%Y-%m-%d"))
        
    sorted_days = sorted(list(unique_days))
    
    streak = 0
    if sorted_days:
        latest_day = datetime.strptime(sorted_days[-1], "%Y-%m-%d")
        current_streak = 1
        for i in range(len(sorted_days) - 2, -1, -1):
            prev_day = datetime.strptime(sorted_days[i], "%Y-%m-%d")
            diff = (latest_day - prev_day).days
            if diff == 1:
                current_streak += 1
                latest_day = prev_day
            else:
                break
        streak = current_streak
        
        streak = current_streak
        
    # Recalculate Best Streak
    current_habit = habit_collection.find_one({"_id": ObjectId(id)})
    current_best = current_habit.get("bestStreak", 0)
    best_streak = current_best
    
    if streak > current_best:
        best_streak = streak
        
    habit_collection.update_one({"_id": ObjectId(id)}, {
        "$set": {
            "streak": streak,
            "bestStreak": best_streak
            # completedToday will be computed on read based on requested date, but we can update it conceptually if needed
        }
    })
    
    # Fetch updated habit
    updated_habit = habit_collection.find_one({"_id": ObjectId(id)})
    
    # Force the completedToday logic for the return value
    updated_habit["completedToday"] = update_data["completedToday"]
    
    return habit_serializer(updated_habit)
