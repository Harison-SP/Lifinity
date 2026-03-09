def habit_serializer(habit) -> dict:
    # Convert _id to id and ensure all fields are included
    serialized = {k: v for k, v in habit.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    
    # Ensure weekdays is present for frontend compatibility
    if "weekdays" not in serialized:
        serialized["weekdays"] = serialized.get("frequencyDays") or serialized.get("targetDays", [])
        
    return serialized

def habits_serializer(habits) -> list:
    return [habit_serializer(habit) for habit in habits]
