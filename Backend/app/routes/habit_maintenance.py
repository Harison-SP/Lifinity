from fastapi import APIRouter, HTTPException
from app.database import habit_collection, habit_log_collection
from bson import ObjectId
from datetime import datetime
from fastapi import Depends
from typing import List, Dict

from app.auth_utils import get_current_user

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

@router.post("/remove-duplicate-habits")
async def remove_duplicate_habits(user_id: str = Depends(get_current_user)):
    """
    Remove duplicate habits based on name, frequency, and other key fields.
    Keeps the most recent habit and deletes older duplicates.
    """
    # Find all habits
    all_habits = list(habit_collection.find({"user_id": user_id}))
    
    # Group habits by identifying fields (name + frequencyType + startDate + endDate)
    habit_groups: Dict[str, List] = {}
    
    for habit in all_habits:
        # Create a unique key based on identifying characteristics
        key_parts = [
            habit.get("name", "").lower().strip(),
            habit.get("frequencyType", "").lower(),
            habit.get("startDate", ""),
            habit.get("endDate", "")
        ]
        key = "|".join(str(p) for p in key_parts)
        
        if key not in habit_groups:
            habit_groups[key] = []
        habit_groups[key].append(habit)
    
    # Process duplicates
    duplicates_removed = 0
    duplicate_report = []
    
    for key, habits in habit_groups.items():
        if len(habits) > 1:
            # Sort by created_at (newest first)
            habits_sorted = sorted(
                habits, 
                key=lambda x: x.get("created_at") or datetime.min, 
                reverse=True
            )
            
            # Keep the first (newest) habit, remove the rest
            habit_to_keep = habits_sorted[0]
            habits_to_remove = habits_sorted[1:]
            
            for duplicate_habit in habits_to_remove:
                habit_id = str(duplicate_habit["_id"])
                
                # Delete the duplicate habit
                habit_collection.delete_one({"_id": duplicate_habit["_id"]})
                
                # Optionally, you might want to keep the logs or transfer them
                # For now, we'll delete them as well
                habit_log_collection.delete_many({"habit_id": habit_id, "user_id": user_id})
                
                duplicates_removed += 1
                duplicate_report.append({
                    "removed_id": habit_id,
                    "name": duplicate_habit.get("name"),
                    "created_at": str(duplicate_habit.get("created_at")),
                    "kept_id": str(habit_to_keep["_id"])
                })
    
    return {
        "message": f"Successfully removed {duplicates_removed} duplicate habits",
        "duplicates_removed": duplicates_removed,
        "details": duplicate_report
    }


@router.get("/find-duplicate-habits")
async def find_duplicate_habits(user_id: str = Depends(get_current_user)):
    """
    Find potential duplicate habits without removing them.
    Returns a report of duplicates for review.
    """
    all_habits = list(habit_collection.find({"user_id": user_id}))
    
    # Group habits by identifying fields
    habit_groups: Dict[str, List] = {}
    
    for habit in all_habits:
        key_parts = [
            habit.get("name", "").lower().strip(),
            habit.get("frequencyType", "").lower(),
            habit.get("startDate", ""),
            habit.get("endDate", "")
        ]
        key = "|".join(str(p) for p in key_parts)
        
        if key not in habit_groups:
            habit_groups[key] = []
        habit_groups[key].append(habit)
    
    # Find duplicates
    duplicate_groups = []
    total_duplicates = 0
    
    for key, habits in habit_groups.items():
        if len(habits) > 1:
            group_info = {
                "group_key": key,
                "count": len(habits),
                "habits": []
            }
            
            for habit in habits:
                group_info["habits"].append({
                    "id": str(habit["_id"]),
                    "name": habit.get("name"),
                    "created_at": str(habit.get("created_at")),
                    "frequency": habit.get("frequency"),
                    "frequencyType": habit.get("frequencyType")
                })
            
            duplicate_groups.append(group_info)
            total_duplicates += len(habits) - 1
    
    return {
        "total_duplicate_groups": len(duplicate_groups),
        "total_excess_habits": total_duplicates,
        "duplicate_groups": duplicate_groups
    }
