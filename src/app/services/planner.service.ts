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
  created_at?: string;
}

export interface PlannerTask {
  id?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlannerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/planner';

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
}
