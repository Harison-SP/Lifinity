import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlannerGoal {
  id?: string;
  title: string;
  description?: string;
  period: 'yearly' | 'monthly' | 'weekly';
  year?: number;
  month?: number;
  week?: number;
  status: 'active' | 'completed' | 'archived';
  tasks: string[];
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  color?: string;
  created_at?: string;
}

export interface SubTask {
  title: string;
  completed: boolean;
}

export interface PlannerTask {
  id?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'moved' | 'repeated';
  priority?: 'low' | 'medium' | 'high';
  category?: 'Study' | 'Work' | 'Health' | 'Personal';
  linkedGoalId?: string;
  habitId?: string;
  colorTag?: string;
  reminder?: boolean;
  sub_tasks?: SubTask[];
  created_at?: string;
  _isTask?: boolean;
}

export interface DailySummary {
  id?: string;
  date: string; // YYYY-MM-DD
  plannedHours: number;
  actualHours: number;
  completionPercentage: number;
  mood: string;
  notes: {
    whatIPlanned: string;
    whatIActuallyDid: string;
    winsToday: string;
    improvements: string;
    tomorrowFocus: string;
  };
}

export interface Note {
  id?: string;
  content: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  category?: string;
  created_at?: string;
}

export interface MonthlyReflection {
  id?: string;
  year: number;
  month: number; // 1-12
  primary_focus: string[]; // List of habit IDs
  secondary_focus: string[]; // List of habit IDs
  targeted_goals: string;
  achieved_goals: string;
  worked: string;
  failed: string;
  improve: string;
  study_hours: number;
  created_at?: string;
}

export interface HabitCompletions {
  [habitId: string]: {
    name: string;
    type: string;
    completions: { [day: number]: boolean | number };
  };
}

export interface HabitNote {
  id?: string;
  habit_id: string;
  title: string;
  content: string; // Rich-text HTML content
  tags: string[];
  is_pinned: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlannerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/planner';

  // Goals
  getGoals(filters?: { period?: string; year?: number; month?: number; week?: number }): Observable<PlannerGoal[]> {
    let params: any = {};
    if (filters) {
      if (filters.period) params.period = filters.period;
      if (filters.year) params.year = filters.year.toString();
      if (filters.month) params.month = filters.month.toString();
      if (filters.week) params.week = filters.week.toString();
    }
    return this.http.get<PlannerGoal[]>(`${this.apiUrl}/goals`, { params });
  }

  getGoal(id: string): Observable<PlannerGoal> {
    return this.http.get<PlannerGoal>(`${this.apiUrl}/goals/${id}`);
  }

  createGoal(goal: Partial<PlannerGoal>): Observable<PlannerGoal> {
    return this.http.post<PlannerGoal>(`${this.apiUrl}/goals`, goal);
  }

  updateGoal(id: string, goal: Partial<PlannerGoal>): Observable<PlannerGoal> {
    return this.http.put<PlannerGoal>(`${this.apiUrl}/goals/${id}`, goal);
  }

  deleteGoal(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/goals/${id}`);
  }

  // Tasks
  getTasks(date?: string): Observable<PlannerTask[]> {
    let params: any = {};
    if (date) {
      params.date = date;
    }
    return this.http.get<PlannerTask[]>(`${this.apiUrl}/tasks`, { params });
  }

  getTasksByRange(start_date: string, end_date: string): Observable<PlannerTask[]> {
    return this.http.get<PlannerTask[]>(`${this.apiUrl}/tasks`, { 
      params: { start_date, end_date } 
    });
  }

  getTask(id: string): Observable<PlannerTask> {
    return this.http.get<PlannerTask>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(task: Partial<PlannerTask>): Observable<PlannerTask> {
    return this.http.post<PlannerTask>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(id: string, task: Partial<PlannerTask>): Observable<PlannerTask> {
    return this.http.put<PlannerTask>(`${this.apiUrl}/tasks/${id}`, task);
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${id}`);
  }

  // Summary
  getSummary(date: string): Observable<DailySummary> {
    return this.http.get<DailySummary>(`${this.apiUrl}/summary/${date}`);
  }

  saveSummary(summary: DailySummary): Observable<DailySummary> {
    return this.http.post<DailySummary>(`${this.apiUrl}/summary`, summary);
  }

  // Notes
  getNotes(filters?: { date?: string; start_date?: string; end_date?: string }): Observable<Note[]> {
    let params: any = {};
    if (filters) {
      if (filters.date) params.date = filters.date;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
    }
    return this.http.get<Note[]>(`${this.apiUrl}/notes`, { params });
  }

  createNote(note: Partial<Note>): Observable<Note> {
    return this.http.post<Note>(`${this.apiUrl}/notes`, note);
  }

  updateNote(id: string, note: Partial<Note>): Observable<Note> {
    return this.http.put<Note>(`${this.apiUrl}/notes/${id}`, note);
  }

  deleteNote(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notes/${id}`);
  }

  // Monthly Reflections
  getReflections(filters?: { year?: number; month?: number }): Observable<MonthlyReflection[]> {
    let params: any = {};
    if (filters) {
      if (filters.year) params.year = filters.year.toString();
      if (filters.month) params.month = filters.month.toString();
    }
    return this.http.get<MonthlyReflection[]>(`${this.apiUrl}/reflections`, { params });
  }

  getReflection(year: number, month: number): Observable<MonthlyReflection> {
    return this.http.get<MonthlyReflection>(`${this.apiUrl}/reflections/${year}/${month}`);
  }

  saveReflection(reflection: Partial<MonthlyReflection>): Observable<MonthlyReflection> {
    return this.http.post<MonthlyReflection>(`${this.apiUrl}/reflections`, reflection);
  }

  updateReflection(year: number, month: number, reflection: Partial<MonthlyReflection>): Observable<MonthlyReflection> {
    return this.http.put<MonthlyReflection>(`${this.apiUrl}/reflections/${year}/${month}`, reflection);
  }

  // Habit Completions
  getHabitCompletions(year: number, month: number): Observable<HabitCompletions> {
    // Get timezone offset in minutes (UTC - Local)
    const timezone_offset = new Date().getTimezoneOffset();
    return this.http.get<HabitCompletions>(`${this.apiUrl}/habits/completions`, {
      params: { 
        year: year.toString(), 
        month: month.toString(),
        timezone_offset: timezone_offset.toString()
      }
    });
  }

  // Study Hours
  getStudyHours(year: number, month: number): Observable<{ study_hours: number }> {
    return this.http.get<{ study_hours: number }>(`${this.apiUrl}/study-hours/${year}/${month}`);
  }

  // Habit Notes (Rich-text notes linked to habits)
  getHabitNotes(habitId: string): Observable<HabitNote[]> {
    return this.http.get<HabitNote[]>(`${this.apiUrl}/habit-notes/${habitId}`);
  }

  createHabitNote(note: Partial<HabitNote>): Observable<HabitNote> {
    return this.http.post<HabitNote>(`${this.apiUrl}/habit-notes`, note);
  }

  updateHabitNote(noteId: string, note: Partial<HabitNote>): Observable<HabitNote> {
    return this.http.put<HabitNote>(`${this.apiUrl}/habit-notes/${noteId}`, note);
  }

  deleteHabitNote(noteId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/habit-notes/${noteId}`);
  }
}
