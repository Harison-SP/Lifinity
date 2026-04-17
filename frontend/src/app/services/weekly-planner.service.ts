import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  WeeklyTask,
  WeeklyTaskCreate,
  WeeklyTaskUpdate,
  WeeklyTarget,
  WeeklyTargetCreate,
  WeeklyTargetUpdate,
  WeeklyReview,
  WeeklyReviewUpdate,
  WeeklyMetrics,
  WeeklyMetricsUpdate
} from '../models/weekly-planner.model';
import { Habit } from '../models/habit.model';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class WeeklyPlannerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/weekly-planner`;


  // ============ TASKS ============

  getTasks(weekStart: string): Observable<WeeklyTask[]> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.get<WeeklyTask[]>(`${this.apiUrl}/tasks`, { params });
  }

  createTask(task: WeeklyTaskCreate): Observable<WeeklyTask> {
    return this.http.post<WeeklyTask>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(taskId: string, task: WeeklyTaskUpdate): Observable<WeeklyTask> {
    return this.http.put<WeeklyTask>(`${this.apiUrl}/tasks/${taskId}`, task);
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}`);
  }

  carryForwardTasks(currentDate: string): Observable<{ message: string; task_ids: string[] }> {
    const params = new HttpParams().set('current_date', currentDate);
    return this.http.post<{ message: string; task_ids: string[] }>(
      `${this.apiUrl}/tasks/carry-forward`,
      {},
      { params }
    );
  }

  // ============ TARGETS ============

  getTargets(weekStart: string): Observable<WeeklyTarget[]> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.get<WeeklyTarget[]>(`${this.apiUrl}/targets`, { params });
  }

  createTarget(target: WeeklyTargetCreate): Observable<WeeklyTarget> {
    return this.http.post<WeeklyTarget>(`${this.apiUrl}/targets`, target);
  }

  updateTarget(targetId: string, target: WeeklyTargetUpdate): Observable<WeeklyTarget> {
    return this.http.put<WeeklyTarget>(`${this.apiUrl}/targets/${targetId}`, target);
  }

  deleteTarget(targetId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/targets/${targetId}`);
  }

  // ============ REVIEW ============

  getReview(weekStart: string): Observable<WeeklyReview> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.get<WeeklyReview>(`${this.apiUrl}/review`, { params });
  }

  updateReview(reviewId: string, review: WeeklyReviewUpdate): Observable<WeeklyReview> {
    return this.http.put<WeeklyReview>(`${this.apiUrl}/review/${reviewId}`, review);
  }

  // ============ METRICS ============

  getMetrics(weekStart: string): Observable<WeeklyMetrics> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.get<WeeklyMetrics>(`${this.apiUrl}/metrics`, { params });
  }

  updateMetrics(metricsId: string, metrics: WeeklyMetricsUpdate): Observable<WeeklyMetrics> {
    return this.http.put<WeeklyMetrics>(`${this.apiUrl}/metrics/${metricsId}`, metrics);
  }

  // ============ HABITS FOR WEEK ============

  getHabitsForWeek(weekStart: string, weekEnd: string): Observable<Habit[]> {
    const params = new HttpParams()
      .set('week_start', weekStart)
      .set('week_end', weekEnd);
    return this.http.get<Habit[]>(`${this.apiUrl}/habits-for-week`, { params });
  }

  // ============ UTILITY FUNCTIONS ============

  getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to make Monday the first day
    const monday = new Date(d.setDate(diff));
    return this.formatDate(monday);
  }

  getWeekEnd(weekStart: string): string {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return this.formatDate(end);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
