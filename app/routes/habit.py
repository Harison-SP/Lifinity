from fastapi import APIRouter, HTTPException
from app.database import habit_collection
from app.models import Habit, HabitCreate, HabitUpdate
from app.serializers import habits_serializer, habit_serializer
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("", response_model=list[Habit])
async def get_habits():
    habits = habit_collection.find()
    return habits_serializer(habits)

@router.get("/{id}", response_model=Habit)
async def get_habit(id: str):
    habit = habit_collection.find_one({"_id": ObjectId(id)})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit_serializer(habit)

@router.post("", response_model=Habit)
async def create_habit(habit: HabitCreate):
    habit_dict = habit.dict()
    habit_dict["created_at"] = datetime.now()
    result = habit_collection.insert_one(habit_dict)
    new_habit = habit_collection.find_one({"_id": result.inserted_id})
    return habit_serializer(new_habit)

@router.put("/{id}", response_model=Habit)
async def update_habit(id: str, habit: HabitUpdate):
    update_data = {k: v for k, v in habit.dict().items() if v is not None}
    
    if not update_data:
         raise HTTPException(status_code=400, detail="No data provided to update")

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
    return {"message": "Habit deleted successfully"}
