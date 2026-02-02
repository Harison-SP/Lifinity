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
