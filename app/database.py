from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27018")
DB_NAME = os.getenv("DB_NAME", "habit_tracker")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection_name = "habits"
habit_collection = db[collection_name]
habit_log_collection = db["habit_logs"]
note_collection = db["notes"]
monthly_reflection_collection = db["monthly_reflections"]
habit_note_collection = db["habit_notes"]

# Weekly Planner Collections
weekly_task_collection = db["weekly_tasks"]
weekly_target_collection = db["weekly_targets"]
weekly_review_collection = db["weekly_reviews"]
weekly_metrics_collection = db["weekly_metrics"]

# Learning System Collection
learning_system_collection = db["learning_systems"]

# System Instance Collection (stores instantiated hierarchy, linked to a parent habit)
system_instance_collection = db["system_instances"]
