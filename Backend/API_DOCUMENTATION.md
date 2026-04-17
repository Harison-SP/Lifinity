# Lifinity API Documentation

Base URL: `http://localhost:8000`

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Habits](#habits)
- [Planner](#planner)
- [Weekly Planner](#weekly-planner)
- [Systems](#systems)
- [AI Generation](#ai-generation)
- [Maintenance](#maintenance)

---

## Overview

Lifinity is a comprehensive habit tracking and planning system built with FastAPI. The API provides endpoints for managing habits, daily planning, weekly planning, learning systems, and AI-powered curriculum generation.

### Base Configuration
- **CORS**: Enabled for `localhost:4200` and `localhost:1234`
- **Database**: MongoDB
- **Timezone Handling**: All dates support `timezone_offset` parameter (in minutes)

---

## Habits

Base path: `/habits`

### Get All Habits
```
GET /habits
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Filter by date (YYYY-MM-DD) |
| `timezone_offset` | integer | Client timezone offset in minutes |
| `tier` | string | Filter by habit tier |

**Response:** `Array<Habit>`

---

### Get Habit by ID
```
GET /habits/{id}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Habit ID |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Check completion for specific date |
| `timezone_offset` | integer | Client timezone offset |

**Response:** `Habit`

---

### Get Habit History
```
GET /habits/{id}/history
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Habit ID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `size` | integer | 10 | Items per page (max 100) |
| `timezone_offset` | integer | 0 | Client timezone offset |

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10
}
```

---

### Get Habit Statistics
```
GET /habits/{id}/stats
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Habit ID |

**Response:** `HabitStats`
```json
{
  "total_completions": 45,
  "completion_rate": 75,
  "heatmap": [{"date": "2024-01-15", "level": 3}],
  "weekly_frequency": [{"day_name": "Mon", "count": 5, "percentage": 100}],
  "completion_trend": [{"period": "W-7", "rate": 85}]
}
```

---

### Get Habit Analytics
```
GET /habits/{id}/analytics
```

Returns comprehensive analytics including:
- **Binary habits**: Success ratio, missed day patterns, recovery time, consistency score
- **Measurable habits**: Average value, target achievement rate, best/worst day, trend direction

**Response:** `AnalyticsResponse`

---

### Create Habit
```
POST /habits
```

**Request Body:** `HabitCreate`

```json
{
  "name": "Morning Exercise",
  "description": "30 minutes of cardio",
  "frequency": "Daily",
  "type": "yes_no",
  "targetValue": 0,
  "icon": "fitness_center",
  "color": "#4CAF50",
  "category": "Health",
  "frequencyType": "daily",
  "weekdays": [],
  "startDate": "2024-01-01",
  "endDate": null
}
```

**Response:** `Habit`

---

### Update Habit
```
PUT /habits/{id}
```

**Request Body:** `HabitUpdate`

**Response:** `Habit`

---

### Delete Habit
```
DELETE /habits/{id}
```

Deletes habit and all associated logs.

**Response:**
```json
{"message": "Habit deleted successfully"}
```

---

### Toggle Habit Completion
```
POST /habits/{id}/toggle
```

Toggles habit completion for a specific date. If completed, it creates/updates a log entry. If not completed, it removes the log entry.

**Request Body:**
```json
{
  "completed_at": "2024-01-15T10:30:00.000Z",
  "timezone_offset": -330,
  "value": 1.0,
  "notes": "Great workout!",
  "focused_minutes": 30
}
```

**Response:** `Habit` (with updated `completedToday` status)

---

## Planner

Base path: `/planner`

### Goals

#### Get Goals
```
GET /planner/goals
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | yearly, monthly, or weekly |
| `year` | integer | Filter by year |
| `month` | integer | Filter by month (1-12) |
| `week` | integer | Filter by week number |

**Response:** `Array<PlannerGoal>`

---

#### Create Goal
```
POST /planner/goals
```

**Request Body:** `PlannerGoalCreate`

```json
{
  "title": "Learn Python",
  "description": "Complete Python course",
  "period": "yearly",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "color": "#FF5722"
}
```

---

#### Update Goal
```
PUT /planner/goals/{goal_id}
```

---

#### Delete Goal
```
DELETE /planner/goals/{goal_id}
```

---

### Tasks

#### Get Tasks
```
GET /planner/tasks
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Single date filter (YYYY-MM-DD) |
| `start_date` | string | Range start date |
| `end_date` | string | Range end date |

---

#### Create Task
```
POST /planner/tasks
```

**Request Body:** `PlannerTaskCreate`

```json
{
  "title": "Team Meeting",
  "description": "Weekly sync",
  "date": "2024-01-15",
  "start_time": "09:00",
  "end_time": "10:00",
  "status": "pending",
  "priority": "high",
  "category": "Work"
}
```

---

#### Update Task
```
PUT /planner/tasks/{task_id}
```

---

#### Delete Task
```
DELETE /planner/tasks/{task_id}
```

---

### Notes

#### Get Notes
```
GET /planner/notes
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Single date filter |
| `start_date` | string | Range start |
| `end_date` | string | Range end |

---

#### Create Note
```
POST /planner/notes
```

**Request Body:** `NoteCreate`

---

#### Update Note
```
PUT /planner/notes/{note_id}
```

---

#### Delete Note
```
DELETE /planner/notes/{note_id}
```

---

### Monthly Reflections

#### Get Reflections
```
GET /planner/reflections
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | integer | Filter by year |
| `month` | integer | Filter by month |

---

#### Get Specific Reflection
```
GET /planner/reflections/{year}/{month}
```

---

#### Create/Update Reflection
```
POST /planner/reflections
```

**Request Body:** `MonthlyReflectionCreate`

```json
{
  "year": 2024,
  "month": 1,
  "primary_focus": ["habit_id_1", "habit_id_2"],
  "secondary_focus": ["habit_id_3"],
  "targeted_goals": "Complete Python basics",
  "achieved_goals": "Finished modules 1-5",
  "worked": "Consistent daily practice",
  "failed": "Missed weekend sessions",
  "improve": "Better time blocking",
  "study_hours": 45.5
}
```

---

### Daily Summary

#### Get Summary
```
GET /planner/summary/{date}
```

**Response:** `DailySummary`

```json
{
  "id": "...",
  "date": "2024-01-15",
  "plannedHours": 8.0,
  "actualHours": 7.5,
  "completionPercentage": 85.0,
  "mood": "productive",
  "notes": {
    "whatIPlanned": "Finish project milestone",
    "whatIActuallyDid": "Completed 90% of tasks",
    "winsToday": "Great team collaboration",
    "improvements": "Need to reduce meetings",
    "tomorrowFocus": "Code review"
  }
}
```

---

#### Create/Update Summary
```
POST /planner/summary
```

---

### Habit Completions (Monthly View)

#### Get Monthly Completions
```
GET /planner/habits/completions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | integer | Year |
| `month` | integer | Month (1-12) |
| `timezone_offset` | integer | Client timezone offset |

---

### Study Hours

#### Calculate Monthly Study Hours
```
GET /planner/study-hours/{year}/{month}
```

Returns total hours from task time blocks for the month.

---

### Habit Notes

#### Get Habit Notes
```
GET /planner/habit-notes/{habit_id}
```

---

#### Create Habit Note
```
POST /planner/habit-notes
```

---

#### Update Habit Note
```
PUT /planner/habit-notes/{note_id}
```

---

#### Delete Habit Note
```
DELETE /planner/habit-notes/{note_id}
```

---

## Weekly Planner

Base path: `/weekly-planner`

### Weekly Tasks

#### Get Tasks
```
GET /weekly-planner/tasks?week_start=2024-01-15
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `week_start` | string | Monday of the week (YYYY-MM-DD) |

---

#### Create Task
```
POST /weekly-planner/tasks
```

**Request Body:** `WeeklyTaskCreate`

```json
{
  "text": "Review pull requests",
  "date": "2024-01-15",
  "completed": false,
  "task_type": "normal",
  "habit_id": null,
  "week_start": "2024-01-15"
}
```

---

#### Update Task
```
PUT /weekly-planner/tasks/{task_id}
```

---

#### Delete Task
```
DELETE /weekly-planner/tasks/{task_id}
```

---

#### Carry Forward Tasks
```
POST /weekly-planner/tasks/carry-forward?current_date=2024-01-16
```

Carries incomplete tasks from previous days to current date.

---

### Weekly Targets

#### Get Targets
```
GET /weekly-planner/targets?week_start=2024-01-15
```

---

#### Create Target
```
POST /weekly-planner/targets
```

---

#### Update Target
```
PUT /weekly-planner/targets/{target_id}
```

---

#### Delete Target
```
DELETE /weekly-planner/targets/{target_id}
```

---

### Weekly Review

#### Get Review
```
GET /weekly-planner/review?week_start=2024-01-15
```

---

#### Update Review
```
PUT /weekly-planner/review/{review_id}
```

**Request Body:** `WeeklyReviewUpdate`

```json
{
  "achieved": "Completed all coding tasks",
  "missed": "Missed morning exercise twice",
  "why": "Late nights affected morning routine",
  "carry_forward": "Focus on sleep schedule"
}
```

---

### Weekly Metrics

#### Get Metrics
```
GET /weekly-planner/metrics?week_start=2024-01-15
```

---

#### Update Metrics
```
PUT /weekly-planner/metrics/{metrics_id}
```

---

### Habits for Week

#### Get Active Habits
```
GET /weekly-planner/habits-for-week?week_start=2024-01-15&week_end=2024-01-21
```

Returns all habits that should be active during the specified week.

---

## Systems

Base path: `/systems`

### Learning Systems

#### Get All Systems
```
GET /systems
```

---

#### Get System
```
GET /systems/{system_id}
```

---

#### Create System
```
POST /systems
```

**Request Body:** `LearningSystemCreate`

```json
{
  "title": "Python Fundamentals",
  "description": "12-week Python programming curriculum",
  "tags": ["programming", "python"],
  "items": [
    {
      "phase": "Phase 1: Foundation",
      "week_number": 1,
      "week_focus": "Variables and Data Types",
      "day_number": 1,
      "title": "Learn Python basics",
      "description": "Introduction to Python syntax",
      "time_block_start": "09:00",
      "time_block_end": "11:00",
      "resource_link": "https://docs.python.org/tutorial/"
    }
  ]
}
```

---

#### Update System
```
PUT /systems/{system_id}
```

---

#### Delete System
```
DELETE /systems/{system_id}
```

---

### System Instances

#### Get All Instances
```
GET /systems/instances
```

---

#### Get Instances by Week
```
GET /systems/instances/by-week?week_start=2024-01-15&week_end=2024-01-21
```

---

#### Get Instances by Date
```
GET /systems/instances/by-date?date=2024-01-15
```

---

#### Get Pending Past Tasks
```
GET /systems/instances/pending-past?habit_id=...&before_date=2024-01-15
```

---

### Instantiate System

#### Apply System to Planner
```
POST /systems/instantiate
```

Creates a system instance with daily tasks starting from a specific date.

**Request Body:** `SystemInstantiate`

```json
{
  "system_id": "learning_system_id",
  "start_date": "2024-01-15",
  "habit_id": "optional_parent_habit_id"
}
```

**Response:**
```json
{
  "message": "Successfully instantiated 'Python Fundamentals' with 84 tasks",
  "instance_id": "...",
  "habitId": "...",
  "habitName": "Python Fundamentals",
  "startDate": "2024-01-15",
  "totalTasks": 84
}
```

---

#### Toggle Instance Task
```
PATCH /systems/instances/{instance_id}/task?phase_name=Phase%201&week_number=1&task_date=2024-01-15&task_title=Learn%20Python%20basics
```

Marks a daily task as completed or uncompleted.

---

## AI Generation

### Generate Learning System
```
POST /systems/generate
```

Uses Google Gemini to generate a comprehensive learning curriculum.

**Request Body:** `SystemGenerateRequest`

```json
{
  "topic": "Data Structures and Algorithms",
  "description": "Focus on arrays, linked lists, trees, and graphs. Include LeetCode practice.",
  "duration_weeks": 12
}
```

**Response:** `LearningSystemCreate`

**Note:** Requires valid `GOOGLE_API_KEY` in environment variables.

---

## Maintenance

Base path: `/maintenance`

### Find Duplicate Habits
```
GET /maintenance/find-duplicate-habits
```

Returns a report of potential duplicate habits without removing them.

**Response:**
```json
{
  "total_duplicate_groups": 2,
  "total_excess_habits": 4,
  "duplicate_groups": [
    {
      "group_key": "exercise|daily||",
      "count": 3,
      "habits": [...]
    }
  ]
}
```

---

### Remove Duplicate Habits
```
POST /maintenance/remove-duplicate-habits
```

Removes duplicate habits, keeping the most recent one.

**Response:**
```json
{
  "message": "Successfully removed 4 duplicate habits",
  "duplicates_removed": 4,
  "details": [...]
}
```

---

## Data Models

### Habit Types

#### Yes/No Habit
Binary completion tracking (done or not done).

#### Measurable Habit
Track numeric values against a target.

```json
{
  "type": "measurable",
  "targetValue": 10000,
  "targetUnit": "steps",
  "targetComparator": ">="
}
```

### Frequency Types

| Type | Description |
|------|-------------|
| `daily` | Every day |
| `specific_days` | Specific weekdays (use `weekdays` array: 0=Mon, 6=Sun) |
| `interval` | Every X days (use `frequencyInterval`) |
| `count_per_period` | X times per Y days |

### Timezone Handling

The API uses UTC internally. All date-related endpoints accept `timezone_offset` in minutes:
- JavaScript: `new Date().getTimezoneOffset()` returns this value
- Example: UTC+5:30 → offset `-330`

---

## Error Responses

All endpoints may return these error responses:

| Status | Description |
|--------|-------------|
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Missing/invalid API key |
| `404` | Not Found - Resource doesn't exist |
| `422` | Validation Error - Invalid request body |
| `500` | Internal Server Error |

---

## Rate Limits

No rate limits are currently enforced.

---

*Generated for Lifinity API*
