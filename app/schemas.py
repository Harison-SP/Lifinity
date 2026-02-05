from app.models import HabitBase, HabitCreate, HabitUpdate, Habit

def habit_serializer(habit) -> dict:
    return {
        "id": str(habit["_id"]),
        "name": habit.get("name"),
        "description": habit.get("description"),
        "frequency": habit.get("frequency", "Daily"),
        "targetDays": habit.get("targetDays", []),
        "icon": habit.get("icon"),
        "color": habit.get("color"),
        "category": habit.get("category"),
        "streak": habit.get("streak", 0),
        "bestStreak": habit.get("bestStreak", 0),
        "completionRate": habit.get("completionRate", 0.0),
        "completedToday": habit.get("completedToday", False),
        "latestLog": habit.get("latestLog"),
        "created_at": habit.get("created_at")
    }

def habits_serializer(habits) -> list:
    return [habit_serializer(habit) for habit in habits]

def habit_log_serializer(log) -> dict:
    return {
        "id": str(log["_id"]),
        "habit_id": log.get("habit_id"),
        "completed_at": log.get("completed_at")
    }

def habit_logs_serializer(logs) -> list:
    return [habit_log_serializer(log) for log in logs]
