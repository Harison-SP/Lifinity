from pymongo import MongoClient
import os
from dotenv import load_dotenv
from contextvars import ContextVar

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "habit_tracker")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Context var for storing current user ID
user_id_ctx: ContextVar[str] = ContextVar("user_id", default=None)

class ScopedCollection:
    """Wrapper to automatically inject user_id into all MongoDB queries."""
    def __init__(self, coll):
        self.coll = coll

    def _inject_uid(self, query):
        uid = user_id_ctx.get()
        if uid and isinstance(query, dict):
            # Do not mutate the original query directly in case it's reused
            query = dict(query)
            query["user_id"] = uid
        return query

    def find(self, filter=None, *args, **kwargs):
        return self.coll.find(self._inject_uid(filter if filter is not None else {}), *args, **kwargs)

    def find_one(self, filter=None, *args, **kwargs):
        return self.coll.find_one(self._inject_uid(filter if filter is not None else {}), *args, **kwargs)

    def insert_one(self, document, *args, **kwargs):
        uid = user_id_ctx.get()
        if uid and isinstance(document, dict):
            document["user_id"] = uid
        return self.coll.insert_one(document, *args, **kwargs)

    def update_one(self, filter, update, *args, **kwargs):
        # We assume update uses $set usually, but we don't need to inject user_id into the update payload 
        # unless it's a replacement (no $ operators). However, inserts handle the creation.
        # But we do need to filter by user_id so they can't update others' docs.
        return self.coll.update_one(self._inject_uid(filter), update, *args, **kwargs)

    def update_many(self, filter, update, *args, **kwargs):
        return self.coll.update_many(self._inject_uid(filter), update, *args, **kwargs)

    def delete_one(self, filter, *args, **kwargs):
        return self.coll.delete_one(self._inject_uid(filter), *args, **kwargs)

    def delete_many(self, filter, *args, **kwargs):
        return self.coll.delete_many(self._inject_uid(filter), *args, **kwargs)

    def count_documents(self, filter, *args, **kwargs):
        return self.coll.count_documents(self._inject_uid(filter), *args, **kwargs)

    def aggregate(self, pipeline, *args, **kwargs):
        uid = user_id_ctx.get()
        if uid and isinstance(pipeline, list):
            # Inject $match for user_id at the start of pipeline
            pipeline = [{"$match": {"user_id": uid}}] + pipeline
        return self.coll.aggregate(pipeline, *args, **kwargs)


# ── App Collections (Scoped to user_id) ──────────────────────────────────────
habit_collection = ScopedCollection(db["habits"])
habit_log_collection = ScopedCollection(db["habit_logs"])
note_collection = ScopedCollection(db["notes"])
monthly_reflection_collection = ScopedCollection(db["monthly_reflections"])
habit_note_collection = ScopedCollection(db["habit_notes"])
daily_summary_collection = ScopedCollection(db["daily_summaries"])

weekly_task_collection = ScopedCollection(db["weekly_tasks"])
weekly_target_collection = ScopedCollection(db["weekly_targets"])
weekly_review_collection = ScopedCollection(db["weekly_reviews"])
weekly_metrics_collection = ScopedCollection(db["weekly_metrics"])

learning_system_collection = ScopedCollection(db["learning_systems"])
system_instance_collection = ScopedCollection(db["system_instances"])

# ── Auth Collections (Global) ────────────────────────────────────────────────
users_collection = db["users"]
refresh_tokens_collection = db["refresh_tokens"]

# Ensure unique index on email
users_collection.create_index("email", unique=True)
