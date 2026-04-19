from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import ValidationError
from app.models import (
    LearningSystem, LearningSystemCreate, LearningSystemUpdate,
    SystemInstantiate
)
from app.database import db, learning_system_collection, habit_collection, system_instance_collection

router = APIRouter(prefix="/systems", tags=["systems"])


# ── Helpers ──────────────────────────────────────────────────────────────────

def system_helper(system) -> dict:
    serialized = {k: v for k, v in system.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized


def instance_helper(doc) -> dict:
    serialized = {k: v for k, v in doc.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized


# ── Learning System CRUD ──────────────────────────────────────────────────────

@router.get("", response_model=List[LearningSystem])
async def get_systems():
    systems = list(learning_system_collection.find())
    return [system_helper(s) for s in systems]


@router.get("/instances")
async def get_all_instances():
    """Return all instantiated system instances."""
    instances = list(system_instance_collection.find())
    return [instance_helper(i) for i in instances]


@router.get("/instances/by-week")
async def get_instances_by_week(week_start: str = Query(...), week_end: str = Query(...)):
    """
    Return all daily tasks from any instance whose date falls within
    [week_start, week_end].  Each task carries parent chain metadata.
    """
    results = []
    instances = list(system_instance_collection.find())
    for inst in instances:
        for phase in inst.get("phases", []):
            for week in phase.get("weeks", []):
                week_items = []
                for item in week.get("items", []):
                    item_date = item.get("date", "")
                    if week_start <= item_date <= week_end:
                        week_items.append({
                            **item,
                            "weekFocus": week.get("focus"),
                            "weekStart": week.get("startDate"),
                            "weekEnd": week.get("endDate"),
                            "phase": phase.get("name"),
                            "systemTitle": inst.get("systemTitle"),
                            "habitId": inst.get("habitId"),
                            "habitName": inst.get("habitName"),
                            "color": inst.get("color"),
                            "instanceId": str(inst["_id"]),
                        })
                results.extend(week_items)
    return results


@router.get("/instances/by-date")
async def get_instances_by_date(date: str = Query(...)):
    """Return all daily tasks for a specific date across all instances."""
    return await get_instances_by_week(week_start=date, week_end=date)


@router.get("/instances/pending-past")
async def get_pending_past_instances(habit_id: str = Query(...), before_date: str = Query(...)):
    """Return all uncompleted tasks for a specific habit_id before a certain date."""
    results = []
    instances = list(system_instance_collection.find({"habitId": habit_id}))
    for inst in instances:
        for phase in inst.get("phases", []):
            for week in phase.get("weeks", []):
                for item in week.get("items", []):
                    item_date = item.get("date", "")
                    if item_date < before_date and not item.get("completed", False):
                        results.append({
                            **item,
                            "weekFocus": week.get("focus"),
                            "weekStart": week.get("startDate"),
                            "weekEnd": week.get("endDate"),
                            "phase": phase.get("name"),
                            "systemTitle": inst.get("systemTitle"),
                            "habitId": inst.get("habitId"),
                            "habitName": inst.get("habitName"),
                            "color": inst.get("color"),
                            "instanceId": str(inst["_id"]),
                        })
    return results


@router.get("/{system_id}", response_model=LearningSystem)
async def get_system(system_id: str):
    if not ObjectId.is_valid(system_id):
        raise HTTPException(status_code=400, detail="Invalid system ID")
    system = learning_system_collection.find_one({"_id": ObjectId(system_id)})
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    return system_helper(system)



@router.post("", response_model=LearningSystem)
async def create_system(system: LearningSystemCreate):
    system_dict = system.dict()
    system_dict["created_at"] = datetime.utcnow()
    result = learning_system_collection.insert_one(system_dict)
    created = learning_system_collection.find_one({"_id": result.inserted_id})
    return system_helper(created)


@router.put("/{system_id}", response_model=LearningSystem)
async def update_system(system_id: str, system_update: LearningSystemUpdate):
    if not ObjectId.is_valid(system_id):
        raise HTTPException(status_code=400, detail="Invalid system ID")
    update_data = {k: v for k, v in system_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    result = learning_system_collection.update_one(
        {"_id": ObjectId(system_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="System not found")

    updated = learning_system_collection.find_one({"_id": ObjectId(system_id)})
    return system_helper(updated)


@router.delete("/{system_id}")
async def delete_system(system_id: str):
    if not ObjectId.is_valid(system_id):
        raise HTTPException(status_code=400, detail="Invalid system ID")
    result = learning_system_collection.delete_one({"_id": ObjectId(system_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="System not found")
    return {"message": "System deleted successfully"}


# ── Instantiate ───────────────────────────────────────────────────────────────

@router.post("/instantiate")
async def instantiate_system(data: SystemInstantiate):
    """
    Apply a system to the planner starting from a specific date.

    Stores the full hierarchy in the `system_instances` collection — NOT in
    the habit_collection.  The instance carries an optional `habitId` link so
    planner views can display it under the correct parent habit.

    Hierarchy stored:
      Instance document
        └─ phases[]
              └─ weeks[]
                    └─ items[]   ← individual day tasks with specific dates,
                                     time_block_start, time_block_end, completed flag
    """
    if not ObjectId.is_valid(data.system_id):
        raise HTTPException(status_code=400, detail="Invalid system ID")

    system = learning_system_collection.find_one({"_id": ObjectId(data.system_id)})
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    # Resolve parent habit (if provided)
    habit_name: Optional[str] = None
    habit_color: Optional[str] = None
    if data.habit_id:
        if not ObjectId.is_valid(data.habit_id):
            raise HTTPException(status_code=400, detail="Invalid habit ID")
        parent_habit = habit_collection.find_one({"_id": ObjectId(data.habit_id)})
        if not parent_habit:
            raise HTTPException(status_code=404, detail="Parent habit not found")
        habit_name = parent_habit.get("name")
        habit_color = parent_habit.get("color")

    start_date = datetime.strptime(data.start_date, "%Y-%m-%d")
    base_color = habit_color or (system.get("tags", ["#8b5cf6"])[0] if system.get("tags") else "#8b5cf6")

    # ── Build hierarchy from items ────────────────────────────────────────────
    # Structure: Phase → Week → Items
    raw_hierarchy: dict = {}
    for item in system.get("items", []):
        phase = item.get("phase", "Phase 1")
        week_num = item["week_number"]

        if phase not in raw_hierarchy:
            raw_hierarchy[phase] = {}

        if week_num not in raw_hierarchy[phase]:
            raw_hierarchy[phase][week_num] = {
                "focus": item.get("week_focus", f"Week {week_num}"),
                "items": []
            }
        raw_hierarchy[phase][week_num]["items"].append(item)

    # Compute overall end date for reference
    all_week_nums = [wn for weeks in raw_hierarchy.values() for wn in weeks.keys()]
    max_week = max(all_week_nums) if all_week_nums else 52

    # ── Convert to structured phases list ────────────────────────────────────
    phases = []
    for phase_name, weeks_map in raw_hierarchy.items():
        first_week = min(weeks_map.keys())
        last_week = max(weeks_map.keys())
        phase_start = start_date + timedelta(days=(first_week - 1) * 7)
        phase_end = start_date + timedelta(days=last_week * 7 - 1)

        weeks_list = []
        for week_num in sorted(weeks_map.keys()):
            week_data = weeks_map[week_num]
            week_start = start_date + timedelta(days=(week_num - 1) * 7)
            week_end = week_start + timedelta(days=6)

            items_list = []
            for item in week_data["items"]:
                item_offset = (item["week_number"] - 1) * 7 + (item["day_number"] - 1)
                item_date = start_date + timedelta(days=item_offset)

                # Duration in minutes (if both times provided)
                duration_minutes: Optional[int] = None
                tb_start = item.get("time_block_start")
                tb_end = item.get("time_block_end")
                if tb_start and tb_end:
                    try:
                        s = datetime.strptime(tb_start, "%H:%M")
                        e = datetime.strptime(tb_end, "%H:%M")
                        duration_minutes = int((e - s).total_seconds() / 60)
                    except ValueError:
                        pass

                items_list.append({
                    "title": item["title"],
                    "description": item.get("description", ""),
                    "date": item_date.strftime("%Y-%m-%d"),
                    "weekNumber": item["week_number"],
                    "dayNumber": item["day_number"],
                    "timeBlockStart": tb_start,
                    "timeBlockEnd": tb_end,
                    "durationMinutes": duration_minutes,
                    "resourceLink": item.get("resource_link"),
                    "completed": False,
                    "completedAt": None,
                })

            weeks_list.append({
                "weekNumber": week_num,
                "focus": week_data["focus"],
                "startDate": week_start.strftime("%Y-%m-%d"),
                "endDate": week_end.strftime("%Y-%m-%d"),
                "items": items_list,
            })

        phases.append({
            "name": phase_name,
            "startDate": phase_start.strftime("%Y-%m-%d"),
            "endDate": phase_end.strftime("%Y-%m-%d"),
            "weeks": weeks_list,
        })

    # ── Persist instance document ─────────────────────────────────────────────
    instance_doc = {
        "systemId": str(system["_id"]),
        "systemTitle": system["title"],
        "habitId": data.habit_id,           # link to parent habit (may be None)
        "habitName": habit_name,
        "startDate": data.start_date,
        "endDate": (start_date + timedelta(days=max_week * 7 - 1)).strftime("%Y-%m-%d"),
        "color": base_color,
        "phases": phases,
        "created_at": datetime.utcnow(),
    }

    res = system_instance_collection.insert_one(instance_doc)
    instance_id = str(res.inserted_id)

    total_items = sum(
        len(w["items"])
        for p in phases
        for w in p["weeks"]
    )

    return {
        "message": f"Successfully instantiated '{system['title']}' with {total_items} tasks",
        "instance_id": instance_id,
        "habitId": data.habit_id,
        "habitName": habit_name,
        "startDate": data.start_date,
        "totalTasks": total_items,
    }


@router.patch("/instances/{instance_id}/task")
async def toggle_instance_task(instance_id: str,
                                phase_name: str = Query(...),
                                week_number: int = Query(...),
                                task_date: str = Query(...),
                                task_title: str = Query(...)):
    """Mark a daily task as completed / uncompleted."""
    if not ObjectId.is_valid(instance_id):
        raise HTTPException(status_code=400, detail="Invalid instance ID")

    inst = system_instance_collection.find_one({"_id": ObjectId(instance_id)})
    if not inst:
        raise HTTPException(status_code=404, detail="Instance not found")

    updated = False
    for phase in inst.get("phases", []):
        if phase["name"] == phase_name:
            for week in phase.get("weeks", []):
                if week["weekNumber"] == week_number:
                    for item in week.get("items", []):
                        if item["date"] == task_date and item["title"] == task_title:
                            item["completed"] = not item["completed"]
                            item["completedAt"] = datetime.utcnow().isoformat() if item["completed"] else None
                            updated = True
                            break

    if not updated:
        raise HTTPException(status_code=404, detail="Task not found in instance")

    system_instance_collection.update_one(
        {"_id": ObjectId(instance_id)},
        {"$set": {"phases": inst["phases"]}}
    )
    return {"message": "Task toggled", "instance_id": instance_id}


@router.delete("/instances/{instance_id}")
async def delete_instance(instance_id: str):
    """Delete a launched system instance."""
    if not ObjectId.is_valid(instance_id):
        raise HTTPException(status_code=400, detail="Invalid instance ID")
    result = system_instance_collection.delete_one({"_id": ObjectId(instance_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Instance not found")
    return {"message": "Instance deleted successfully"}


@router.put("/instances/{instance_id}")
async def update_instance(instance_id: str, data: dict):
    """Update a launched system instance (habitId, startDate)."""
    if not ObjectId.is_valid(instance_id):
        raise HTTPException(status_code=400, detail="Invalid instance ID")

    inst = system_instance_collection.find_one({"_id": ObjectId(instance_id)})
    if not inst:
        raise HTTPException(status_code=404, detail="Instance not found")

    update_fields = {}

    # Update habit link
    new_habit_id = data.get("habitId")
    if new_habit_id is not None:
        if new_habit_id and ObjectId.is_valid(new_habit_id):
            parent_habit = habit_collection.find_one({"_id": ObjectId(new_habit_id)})
            if parent_habit:
                update_fields["habitId"] = new_habit_id
                update_fields["habitName"] = parent_habit.get("name")
                update_fields["color"] = parent_habit.get("color", inst.get("color"))
        elif new_habit_id == "":
            update_fields["habitId"] = None
            update_fields["habitName"] = None

    # Update start date — recompute all dates in the hierarchy
    new_start = data.get("startDate")
    if new_start:
        old_start = datetime.strptime(inst["startDate"], "%Y-%m-%d")
        new_start_dt = datetime.strptime(new_start, "%Y-%m-%d")
        delta = new_start_dt - old_start

        phases = inst.get("phases", [])
        for phase in phases:
            phase["startDate"] = (datetime.strptime(phase["startDate"], "%Y-%m-%d") + delta).strftime("%Y-%m-%d")
            phase["endDate"] = (datetime.strptime(phase["endDate"], "%Y-%m-%d") + delta).strftime("%Y-%m-%d")
            for week in phase.get("weeks", []):
                week["startDate"] = (datetime.strptime(week["startDate"], "%Y-%m-%d") + delta).strftime("%Y-%m-%d")
                week["endDate"] = (datetime.strptime(week["endDate"], "%Y-%m-%d") + delta).strftime("%Y-%m-%d")
                for item in week.get("items", []):
                    item["date"] = (datetime.strptime(item["date"], "%Y-%m-%d") + delta).strftime("%Y-%m-%d")

        update_fields["startDate"] = new_start
        update_fields["endDate"] = (datetime.strptime(inst["endDate"], "%Y-%m-%d") + delta).strftime("%Y-%m-%d")
        update_fields["phases"] = phases

    if not update_fields:
        raise HTTPException(status_code=400, detail="No update data provided")

    system_instance_collection.update_one(
        {"_id": ObjectId(instance_id)},
        {"$set": update_fields}
    )

    updated = system_instance_collection.find_one({"_id": ObjectId(instance_id)})
    return instance_helper(updated)
