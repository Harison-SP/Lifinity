import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LearningSystem, SystemInstantiate, SystemInstance,
  SystemInstanceTask, InstantiateResult
} from '../models/system.model';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/systems';

  // ── Learning System CRUD ──────────────────────────────────────────────────

  getSystems(): Observable<LearningSystem[]> {
    return this.http.get<LearningSystem[]>(this.apiUrl);
  }

  getSystem(id: string): Observable<LearningSystem> {
    return this.http.get<LearningSystem>(`${this.apiUrl}/${id}`);
  }

  createSystem(system: Partial<LearningSystem>): Observable<LearningSystem> {
    return this.http.post<LearningSystem>(this.apiUrl, system);
  }

  updateSystem(id: string, system: Partial<LearningSystem>): Observable<LearningSystem> {
    return this.http.put<LearningSystem>(`${this.apiUrl}/${id}`, system);
  }

  deleteSystem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  instantiateSystem(data: SystemInstantiate): Observable<InstantiateResult> {
    return this.http.post<InstantiateResult>(`${this.apiUrl}/instantiate`, data);
  }

  // ── Instance Queries (used by planner views) ─────────────────────────────

  getAllInstances(): Observable<SystemInstance[]> {
    return this.http.get<SystemInstance[]>(`${this.apiUrl}/instances`);
  }

  /** Returns flat list of SystemInstanceTask objects for a given week */
  getInstanceTasksByWeek(weekStart: string, weekEnd: string): Observable<SystemInstanceTask[]> {
    const params = new HttpParams()
      .set('week_start', weekStart)
      .set('week_end', weekEnd);
    return this.http.get<SystemInstanceTask[]>(`${this.apiUrl}/instances/by-week`, { params });
  }

  /** Returns flat list of SystemInstanceTask objects for a single date */
  getInstanceTasksByDate(date: string): Observable<SystemInstanceTask[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<SystemInstanceTask[]>(`${this.apiUrl}/instances/by-date`, { params });
  }

  /** Toggle a task's completion state */
  toggleInstanceTask(instanceId: string, phaseName: string, weekNumber: number,
                      taskDate: string, taskTitle: string): Observable<any> {
    const params = new HttpParams()
      .set('phase_name', phaseName)
      .set('week_number', weekNumber.toString())
      .set('task_date', taskDate)
      .set('task_title', taskTitle);
    return this.http.patch(`${this.apiUrl}/instances/${instanceId}/task`, {}, { params });
  }
}
