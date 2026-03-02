from fastapi import APIRouter, HTTPException, Query
from app.database import (
    weekly_task_collection, 
    weekly_target_collection, 
    weekly_review_collection, 
    weekly_metrics_collection,
    habit_collection
)
from app.models import (
    WeeklyTask, WeeklyTaskCreate, WeeklyTaskUpdate,
    WeeklyTarget, WeeklyTargetCreate, WeeklyTargetUpdate,
    WeeklyReview, WeeklyReviewCreate, WeeklyReviewUpdate,
    WeeklyMetrics, WeeklyMetricsCreate, WeeklyMetricsUpdate
)
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional, List

router = APIRouter()

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

def get_week_start(date_str: str) -> str:
    """Get Monday of the week for a given date"""
    date = datetime.strptime(date_str, "%Y-%m-%d")
    # Get Monday (0 = Monday, 6 = Sunday)
    days_since_monday = date.weekday()
    monday = date - timedelta(days=days_since_monday)
    return monday.strftime("%Y-%m-%d")

# ============ WEEKLY TASKS ============

@router.get("/tasks", response_model=List[WeeklyTask])
async def get_weekly_tasks(week_start: str = Query(..., description="Week start date (Monday) in YYYY-MM-DD format")):
    """Get all tasks for a specific week"""
    tasks = list(weekly_task_collection.find({"week_start": week_start}))
    return [serialize_doc(task) for task in tasks]

@router.post("/tasks", response_model=WeeklyTask)
async def create_weekly_task(task: WeeklyTaskCreate):
    """Create a new weekly task"""
    task_dict = task.dict()
    task_dict["created_at"] = datetime.now(timezone.utc)
    
    # Ensure week_start is set correctly
    if not task_dict.get("week_start"):
        task_dict["week_start"] = get_week_start(task_dict["date"])
    
    result = weekly_task_collection.insert_one(task_dict)
    new_task = weekly_task_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(new_task)

@router.put("/tasks/{task_id}", response_model=WeeklyTask)
async def update_weekly_task(task_id: str, task: WeeklyTaskUpdate):
    """Update a weekly task"""
    update_data = {k: v for k, v in task.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")
    
    result = weekly_task_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated_task = weekly_task_collection.find_one({"_id": ObjectId(task_id)})
    return serialize_doc(updated_task)

@router.delete("/tasks/{task_id}")
async def delete_weekly_task(task_id: str):
    """Delete a weekly task"""
    result = weekly_task_collection.delete_one({"_id": ObjectId(task_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}

@router.post("/tasks/carry-forward")
async def carry_forward_tasks(current_date: str = Query(..., description="Current date in YYYY-MM-DD format")):
    """Carry forward incomplete tasks from previous days to the current date"""
    current_week_start = get_week_start(current_date)
    current_dt = datetime.strptime(current_date, "%Y-%m-%d")
    
    # Find all incomplete tasks from previous days in the current week
    tasks = list(weekly_task_collection.find({
        "week_start": current_week_start,
        "completed": False,
        "date": {"$lt": current_date}
    }))
    
    carried_forward = []
    for task in tasks:
        # Only carry forward normal tasks, not habit tasks
        if task.get("task_type") == "normal":
            # Update the task date to current date
            weekly_task_collection.update_one(
                {"_id": task["_id"]},
                {"$set": {"date": current_date}}
            )
            carried_forward.append(str(task["_id"]))
    
    return {
        "message": f"Carried forward {len(carried_forward)} tasks",
        "task_ids": carried_forward
    }

# ============ WEEKLY TARGETS ============

@router.get("/targets", response_model=List[WeeklyTarget])
async def get_weekly_targets(week_start: str = Query(..., description="Week start date (Monday) in YYYY-MM-DD format")):
    """Get all targets for a specific week"""
    targets = list(weekly_target_collection.find({"week_start": week_start}))
    return [serialize_doc(target) for target in targets]

@router.post("/targets", response_model=WeeklyTarget)
async def create_weekly_target(target: WeeklyTargetCreate):
    """Create a new weekly target"""
    target_dict = target.dict()
    target_dict["created_at"] = datetime.now(timezone.utc)
    
    result = weekly_target_collection.insert_one(target_dict)
    new_target = weekly_target_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(new_target)

@router.put("/targets/{target_id}", response_model=WeeklyTarget)
async def update_weekly_target(target_id: str, target: WeeklyTargetUpdate):
    """Update a weekly target"""
    update_data = {k: v for k, v in target.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")
    
    result = weekly_target_collection.update_one(
        {"_id": ObjectId(target_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Target not found")
    
    updated_target = weekly_target_collection.find_one({"_id": ObjectId(target_id)})
    return serialize_doc(updated_target)

@router.delete("/targets/{target_id}")
async def delete_weekly_target(target_id: str):
    """Delete a weekly target"""
    result = weekly_target_collection.delete_one({"_id": ObjectId(target_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Target not found")
    
    return {"message": "Target deleted successfully"}

# ============ WEEKLY REVIEW ============

@router.get("/review", response_model=WeeklyReview)
async def get_weekly_review(week_start: str = Query(..., description="Week start date (Monday) in YYYY-MM-DD format")):
    """Get review for a specific week"""
    review = weekly_review_collection.find_one({"week_start": week_start})
    
    if not review:
        # Create a default review if it doesn't exist
        default_review = {
            "week_start": week_start,
            "achieved": "",
            "missed": "",
            "why": "",
            "carry_forward": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = weekly_review_collection.insert_one(default_review)
        review = weekly_review_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(review)

@router.put("/review/{review_id}", response_model=WeeklyReview)
async def update_weekly_review(review_id: str, review: WeeklyReviewUpdate):
    """Update a weekly review"""
    update_data = {k: v for k, v in review.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = weekly_review_collection.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    updated_review = weekly_review_collection.find_one({"_id": ObjectId(review_id)})
    return serialize_doc(updated_review)

# ============ WEEKLY METRICS ============

@router.get("/metrics", response_model=WeeklyMetrics)
async def get_weekly_metrics(week_start: str = Query(..., description="Week start date (Monday) in YYYY-MM-DD format")):
    """Get metrics for a specific week"""
    metrics = weekly_metrics_collection.find_one({"week_start": week_start})
    
    if not metrics:
        # Create default metrics if they don't exist
        default_metrics = {
            "week_start": week_start,
            "focus_hours": 0.0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = weekly_metrics_collection.insert_one(default_metrics)
        metrics = weekly_metrics_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(metrics)

@router.put("/metrics/{metrics_id}", response_model=WeeklyMetrics)
async def update_weekly_metrics(metrics_id: str, metrics: WeeklyMetricsUpdate):
    """Update weekly metrics"""
    update_data = {k: v for k, v in metrics.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = weekly_metrics_collection.update_one(
        {"_id": ObjectId(metrics_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Metrics not found")
    
    updated_metrics = weekly_metrics_collection.find_one({"_id": ObjectId(metrics_id)})
    return serialize_doc(updated_metrics)

# ============ HABITS FOR WEEK ============

@router.get("/habits-for-week")
async def get_habits_for_week(
    week_start: str = Query(..., description="Week start date (Monday) in YYYY-MM-DD format"),
    week_end: str = Query(..., description="Week end date (Sunday) in YYYY-MM-DD format")
):
    """Get all habits that should be active during the specified week"""
    # Parse dates
    start_date = datetime.strptime(week_start, "%Y-%m-%d")
    end_date = datetime.strptime(week_end, "%Y-%m-%d")
    
    # Find habits that overlap with this week
    # A habit is active if:
    # 1. It has no endDate (ongoing)
    # 2. Its startDate <= week_end AND (endDate is null OR endDate >= week_start)
    
    query = {
        "$or": [
            {
                "startDate": {"$lte": week_end},
                "endDate": {"$exists": False}
            },
            {
                "startDate": {"$lte": week_end},
                "endDate": None
            },
            {
                "startDate": {"$lte": week_end},
                "endDate": {"$gte": week_start}
            }
        ]
    }
    
    habits = list(habit_collection.find(query))
    
    # Serialize habits
    serialized_habits = []
    for habit in habits:
        habit["id"] = str(habit["_id"])
        del habit["_id"]
        serialized_habits.append(habit)
    
    return serialized_habits
