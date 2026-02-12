from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models import (
    PlannerGoal, PlannerGoalCreate, PlannerGoalUpdate,
    PlannerTask, PlannerTaskCreate, PlannerTaskUpdate
)
from app.database import db

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

# Goals endpoints
@router.get("/goals", response_model=List[PlannerGoal])
async def get_goals(
    period: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    week: Optional[int] = None
):
    """Get planner goals with optional filtering"""
    query = {}
    if period:
        query["period"] = period
    if year:
        query["year"] = year
    if month:
        query["month"] = month
    if week:
        query["week"] = week
    
    goals = []
    # Sync iteration
    for goal in db.planner_goals.find(query):
        goals.append(goal_helper(goal))
    return goals

@router.post("/goals", response_model=PlannerGoal)
async def create_goal(goal: PlannerGoalCreate):
    """Create a new planner goal"""
    goal_dict = goal.model_dump()
    goal_dict["created_at"] = datetime.utcnow()
    
    # Sync insert
    result = db.planner_goals.insert_one(goal_dict)
    created_goal = db.planner_goals.find_one({"_id": result.inserted_id})
    return goal_helper(created_goal)

@router.get("/goals/{goal_id}", response_model=PlannerGoal)
async def get_goal(goal_id: str):
    """Get a specific goal by ID"""
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")
    
    # Sync find
    goal = db.planner_goals.find_one({"_id": ObjectId(goal_id)})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal_helper(goal)

@router.put("/goals/{goal_id}", response_model=PlannerGoal)
async def update_goal(goal_id: str, goal_update: PlannerGoalUpdate):
    """Update a goal"""
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")
    
    update_data = {k: v for k, v in goal_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Sync update
    result = db.planner_goals.update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    updated_goal = db.planner_goals.find_one({"_id": ObjectId(goal_id)})
    return goal_helper(updated_goal)

@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    """Delete a goal"""
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")
    
    result = db.planner_goals.delete_one({"_id": ObjectId(goal_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return {"message": "Goal deleted successfully"}

# Tasks endpoints
@router.get("/tasks", response_model=List[PlannerTask])
async def get_tasks(date: Optional[str] = None):
    """Get planner tasks, optionally filtered by date"""
    query = {}
    if date:
        query["date"] = date
    
    tasks = []
    # Sync find
    for task in db.planner_tasks.find(query).sort("start_time", 1):
        tasks.append(task_helper(task))
    return tasks

@router.post("/tasks", response_model=PlannerTask)
async def create_task(task: PlannerTaskCreate):
    """Create a new planner task"""
    task_dict = task.model_dump()
    task_dict["created_at"] = datetime.utcnow()
    
    result = db.planner_tasks.insert_one(task_dict)
    created_task = db.planner_tasks.find_one({"_id": result.inserted_id})
    return task_helper(created_task)

@router.get("/tasks/{task_id}", response_model=PlannerTask)
async def get_task(task_id: str):
    """Get a specific task by ID"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    task = db.planner_tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_helper(task)

@router.put("/tasks/{task_id}", response_model=PlannerTask)
async def update_task(task_id: str, task_update: PlannerTaskUpdate):
    """Update a task"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = db.planner_tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated_task = db.planner_tasks.find_one({"_id": ObjectId(task_id)})
    return task_helper(updated_task)

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    result = db.planner_tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}

