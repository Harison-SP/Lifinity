from fastapi import APIRouter, HTTPException, Query
from app.database import habit_collection, habit_log_collection
from app.models import Habit, HabitCreate, HabitUpdate, HabitLog, HabitLogCreate, HabitStats, AnalyticsResponse, BinaryHabitAnalytics, MeasurableHabitAnalytics, DayFrequency, TrendItem
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

def parse_object_id(id_value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(id_value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    return ObjectId(id_value)


@router.get("", response_model=list[Habit])
async def get_habits(
    date: Optional[str] = None,
    timezone_offset: Optional[int] = 0,
    tier: Optional[str] = None
):
    query = {} if tier is None else {"tier": tier}
    habits = list(habit_collection.find(query))

    if date:
        utc_start, utc_end = get_day_range_utc(date, timezone_offset)

        for habit in habits:
            habit_id = str(habit["_id"])
            log = habit_log_collection.find_one({
                "habit_id": habit_id,
                "completed_at": {"$gte": utc_start, "$lte": utc_end}
            })
            habit["completedToday"] = bool(log)
            if log:
                habit["latestLog"] = {
                    "id": str(log["_id"]),
                    "habit_name": log.get("habit_name"),
                    "value": log.get("value"),
                    "notes": log.get("notes"),
                    "completed_at": log.get("completed_at"),
                    "focused_minutes": log.get("focused_minutes")
                }

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
    habit_oid = parse_object_id(id)

    # 1. Total Completions
    total_completions = habit_log_collection.count_documents({"habit_id": id})
    
    # 2. Completion Rate (Overall)
    # This is tricky because "Total Possible Days" depends on creation date and frequency.
    # For now, we can use the stored completionRate in the Habit document, 
    # OR calculate it dynamically based on creation date.
    # Let's use the one from the document for consistency, or simple logic:
    # Rate = Total Completions / (Days since creation)
    
    habit = habit_collection.find_one({"_id": habit_oid})
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

@router.get("/{id}/analytics", response_model=AnalyticsResponse)
async def get_habit_analytics(id: str, timezone_offset: Optional[int] = 0):
    habit_oid = parse_object_id(id)
    habit = habit_collection.find_one({"_id": habit_oid})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Fetch common stats (reuse existing logic if possible, or reimplement cleaner)
    # We will reimplement slightly to get the raw data needed for advanced analytics
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=90) # Analyze last 90 days for trends/consistency

    logs = list(habit_log_collection.find({
        "habit_id": id,
        "completed_at": {"$gte": start_date}
    }).sort("completed_at", 1))

    def normalize_dt(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt


    # --- Common Stats Calculation ---
    total_completions = habit_log_collection.count_documents({"habit_id": id})
    
    # Heatmap (last 365 days) - separate query or use logs? 
    # Existing stats endpoint uses 365 days. We should probably keep common stats consistent.
    # Let's call the existing logic or just duplicate it for now to avoid refactoring risk.
    common_stats = await get_habit_stats(id, timezone_offset) 

    # --- Advanced Analytics ---
    habit_type = habit.get("type", "yes_no")
    binary_stats = None
    measurable_stats = None
    
    # Helper to get local date string
    def get_local_date_str(dt):
        if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
        return (dt - timedelta(minutes=timezone_offset)).strftime("%Y-%m-%d")

    if habit_type == "yes_no":
        # 1. Success Ratio (Yes vs No)
        # Ratio = Total Completions / Total Days (since creation or fixed period?)
        # Let's use Last 30 Days for "Current Success Ratio" to be actionable? OR All time?
        # User request says "Yes days vs No days" pie chart. Usually implies a fixed recent period (e.g. Month)
        # Let's use Last 30 Days.
        
        last_30_days_start = end_date - timedelta(days=30)
        logs_30 = [l for l in logs if normalize_dt(l["completed_at"]) >= last_30_days_start]
        yes_count = len(logs_30)
        no_count = 30 - yes_count
        success_ratio = (yes_count / 30) * 100

        # 2. Missed-Day Pattern (Day of week failures)
        # We need to find which days were NOT completed.
        # Iterate last 90 days?
        missed_counts = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0}
        
        # Create a set of completed dates (local)
        completed_dates = set()
        for l in logs:
            completed_dates.add(get_local_date_str(normalize_dt(l["completed_at"])))
            
        current = start_date
        while current <= end_date:
            d_str = get_local_date_str(current)
            if d_str not in completed_dates:
                # Missed
                local_dt = current - timedelta(minutes=timezone_offset)
                missed_counts[local_dt.weekday()] += 1
            current += timedelta(days=1)
            
        missed_pattern = []
        day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        total_misses = sum(missed_counts.values()) or 1
        for i in range(7):
            cnt = missed_counts[i]
            pct = int((cnt / total_misses) * 100)
            missed_pattern.append(DayFrequency(day_name=day_labels[i], count=cnt, percentage=pct))

        # 3. Recovery Time (Avg days to return after miss)
        # Find gaps in sorted completed dates
        # If dates are [1, 2, 5, 6]. Gaps: (5-2)-1 = 2 missed days. Recovery took 3 days?
        # Definition: "Missed on Tue -> Completed on Wed" = 1 day recovery?
        # Definition: "Recovery Time: How quickly user returns after missing a day."
        # If I miss 1 day, and do it next day, recovery is 1 day.
        # If I miss 3 days, and do it 4th day, recovery is 4 days?
        # Let's calc average gap size for gaps >= 1 day.
        
        sorted_dates = sorted(list(completed_dates))
        recovery_times = []
        if len(sorted_dates) > 1:
            for i in range(1, len(sorted_dates)):
                d1 = datetime.strptime(sorted_dates[i-1], "%Y-%m-%d")
                d2 = datetime.strptime(sorted_dates[i], "%Y-%m-%d")
                diff = (d2 - d1).days
                if diff > 1:
                    # diff=2 means 1 day missed. Recovery time = diff?
                    # "Missed Tue, done Wed" -> diff=1. No miss.
                    # "Missed Tue, done Thu" -> diff=2. Missed 1 day. Return took 2 days.
                    recovery_times.append(diff)
        
        avg_recovery = sum(recovery_times) / len(recovery_times) if recovery_times else 0
        if not recovery_times and yes_count > 0: avg_recovery = 1 # Perfect streak? OR 0 if no misses? 
        # If perfect streak, recovery time is N/A or 0 (never fell off). Let's say 0.
        
        # 4. Consistency Score (Last 7 days / 7 * 100)
        last_7_start = end_date - timedelta(days=7)
        logs_7 = [l for l in logs if normalize_dt(l["completed_at"]) >= last_7_start]
        # unique days in logs_7
        unique_days_7 = set()
        for l in logs_7:
            unique_days_7.add(get_local_date_str(normalize_dt(l["completed_at"])))
        consistency = (len(unique_days_7) / 7) * 100

        binary_stats = BinaryHabitAnalytics(
            success_ratio=round(success_ratio, 1),
            missed_day_pattern=missed_pattern,
            recovery_time=round(avg_recovery, 1),
            consistency_score=round(consistency, 1)
        )

    elif habit_type == "measurable":
        target = habit.get("targetValue", 0)
        
        # 1. Average Value (Last 30 days)
        last_30_start = end_date - timedelta(days=30)
        logs_30 = [l for l in logs if normalize_dt(l["completed_at"]) >= last_30_start]
        values = [0 if l.get("value") is None else l.get("value") for l in logs_30]
        avg_val = sum(values) / len(values) if values else 0
        
        # 2. Target Achievement Rate
        # Count days where value >= target (assuming >= comparator for now)
        # TODO: Handle comparator "<="
        met_target_count = sum(1 for v in values if v >= target)
        # Rate over *total days* (30) or *logged days*? 
        # "User hit target 18/30 days". So over period.
        target_rate = (met_target_count / 30) * 100
        
        # 3. Best / Worst Day
        # Max/Min in last 90? or All time? Let's do All Time (from logs fetched, currently 90)
        # Maybe fetch all time max/min from DB aggregation for better accuracy?
        # For now use 90 days.
        best_day = max(values) if values else 0
        worst_day = min(values) if values else 0
        
        # 4. Trend Direction
        # Recent 7 vs Previous 7
        last_7_start = end_date - timedelta(days=7)
        prev_7_start = last_7_start - timedelta(days=7)
        
        curr_vals = [0 if l.get("value") is None else l.get("value") for l in logs if normalize_dt(l["completed_at"]) >= last_7_start]
        prev_vals = [0 if l.get("value") is None else l.get("value") for l in logs if prev_7_start <= normalize_dt(l["completed_at"]) < last_7_start]
        
        curr_avg = sum(curr_vals) / 7 # Over 7 days or over logged days? Usually over time period.
        prev_avg = sum(prev_vals) / 7
        
        trend_dir = "flat"
        trend_pct = 0
        if prev_avg > 0:
            change = ((curr_avg - prev_avg) / prev_avg) * 100
            trend_pct = change
            if change > 5: trend_dir = "up"
            elif change < -5: trend_dir = "down"
        else:
            if curr_avg > 0: 
                trend_dir = "up"
                trend_pct = 100 # Infinity?
        
        measurable_stats = MeasurableHabitAnalytics(
            average_value=round(avg_val, 2),
            target_achievement_rate=round(target_rate, 1),
            best_day=best_day,
            worst_day=worst_day,
            trend_percentage=round(trend_pct, 1),
            trend_direction=trend_dir
        )

    return AnalyticsResponse(
        habit_id=id,
        type=habit_type,
        binary_stats=binary_stats,
        measurable_stats=measurable_stats,
        common_stats=common_stats,
        period_days=90
    )


@router.get("/{id}", response_model=Habit)
async def get_habit(id: str, date: Optional[str] = None, timezone_offset: Optional[int] = 0):
    habit_oid = parse_object_id(id)
    habit = habit_collection.find_one({"_id": habit_oid})
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
        if log:
            habit["latestLog"] = {
                "id": str(log["_id"]),
                "habit_name": log.get("habit_name"),
                "value": log.get("value"),
                "notes": log.get("notes"),
                "completed_at": log.get("completed_at"),
                "focused_minutes": log.get("focused_minutes")
            }

    return habit_serializer(habit)

@router.get("/{id}/log", response_model=Optional[HabitLog])
async def get_habit_log(id: str, date: str, timezone_offset: Optional[int] = 0):
    utc_start, utc_end = get_day_range_utc(date, timezone_offset)
    log = habit_log_collection.find_one({
        "habit_id": id,
        "completed_at": {"$gte": utc_start, "$lte": utc_end}
    })
    
    if not log:
        return None
        
    log["id"] = str(log["_id"])
    del log["_id"]
    return log

@router.post("", response_model=Habit)
async def create_habit(habit: HabitCreate):
    habit_dict = habit.dict()
    # Ensure creation time is UTC aware if possible, or naive UTC
    habit_dict["created_at"] = datetime.now(timezone.utc) 
    habit_dict["completedToday"] = False # Default to False upon creation
    
    # Fill legacy frequency if missing but new fields are present
    if not habit_dict.get("frequency") and habit_dict.get("frequencyType"):
         habit_dict["frequency"] = habit_dict["frequencyType"].capitalize()

    result = habit_collection.insert_one(habit_dict)
    new_habit = habit_collection.find_one({"_id": result.inserted_id})
    return habit_serializer(new_habit)

@router.put("/{id}", response_model=Habit)
async def update_habit(id: str, habit: HabitUpdate):
    habit_oid = parse_object_id(id)
    update_data = {k: v for k, v in habit.dict().items() if v is not None}
    
    if not update_data:
         # raise HTTPException(status_code=400, detail="No data provided to update")
         # Allow empty update for side-effects if needed, or just return existing
         pass

    # We generally don't want to update derived fields like streak directly via PUT 
    # unless it's a migration/admin action. But for now we keep it open.
    
    if update_data:
        result = habit_collection.update_one({"_id": habit_oid}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Habit not found")
        
    updated_habit = habit_collection.find_one({"_id": habit_oid})
    return habit_serializer(updated_habit)

@router.delete("/{id}")
async def delete_habit(id: str):
    habit_oid = parse_object_id(id)
    result = habit_collection.delete_one({"_id": habit_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Also delete logs
    habit_log_collection.delete_many({"habit_id": id})
    
    return {"message": "Habit deleted successfully"}

@router.post("/{id}/toggle", response_model=Habit)
async def toggle_habit_completion(id: str, payload: dict):
    habit_oid = parse_object_id(id)
    # Payload expected: {"completed_at": "ISO_STRING", "timezone_offset": int_minutes, "value": float, "notes": str, "focused_minutes": int}
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
    req_focused = payload.get("focused_minutes")

    if existing_log:
        # Check if this is an update (providing value/notes/focus) or a toggle-off
        # Heuristic: If value, notes, or focused_minutes are provided in payload, treat as UPDATE.
        # If all are missing/null, treat as TOGGLE OFF.
        
        if req_value is not None or req_notes is not None or req_focused is not None:
             # UPDATE
             update_fields = {}
             if req_value is not None: update_fields["value"] = req_value
             if req_notes is not None: update_fields["notes"] = req_notes
             if req_focused is not None: update_fields["focused_minutes"] = req_focused
             
             # Also ensure habit_name is present if it was missing
             if not existing_log.get("habit_name"):
                 habit_doc = habit_collection.find_one({"_id": habit_oid})
                 if habit_doc:
                     update_fields["habit_name"] = habit_doc.get("name")
             
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
        # Fetch habit name to store it with the log
        habit_doc = habit_collection.find_one({"_id": habit_oid})
        habit_name = habit_doc.get("name") if habit_doc else "Unknown Habit"
        
        new_log = {
            "habit_id": id,
            "habit_name": habit_name,
            "completed_at": completed_at,
            "value": req_value,
            "notes": req_notes,
            "focused_minutes": req_focused or 0
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
    best_streak = 0
    
    if sorted_days:
        current_streak_len = 1
        max_len = 1
        for i in range(1, len(sorted_days)):
            d1 = datetime.strptime(sorted_days[i-1], "%Y-%m-%d")
            d2 = datetime.strptime(sorted_days[i], "%Y-%m-%d")
            if (d2 - d1).days == 1:
                current_streak_len += 1
            else:
                max_len = max(max_len, current_streak_len)
                current_streak_len = 1
        max_len = max(max_len, current_streak_len)
        best_streak = max_len
        
        latest_day = datetime.strptime(sorted_days[-1], "%Y-%m-%d")
        today = datetime.now(timezone.utc) - timedelta(minutes=timezone_offset)
        today_str = today.strftime("%Y-%m-%d")
        today_dt = datetime.strptime(today_str, "%Y-%m-%d")
        
        diff_from_today = (today_dt - latest_day).days
        if diff_from_today <= 1:
            streak = current_streak_len
        else:
            streak = 0
            
    # Recalculate Best Streak
    current_habit = habit_collection.find_one({"_id": habit_oid})
    current_best = current_habit.get("bestStreak", 0)
    if best_streak < current_best:
        best_streak = current_best
        
    habit_collection.update_one({"_id": habit_oid}, {
        "$set": {
            "streak": streak,
            "bestStreak": best_streak
            # completedToday will be computed on read based on requested date, but we can update it conceptually if needed
        }
    })
    
    # Fetch updated habit
    updated_habit = habit_collection.find_one({"_id": habit_oid})
    
    # Force the completedToday logic for the return value
    updated_habit["completedToday"] = update_data["completedToday"]
    
    return habit_serializer(updated_habit)












