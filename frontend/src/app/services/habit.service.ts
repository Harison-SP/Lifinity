import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Habit, HabitLog } from '../models/habit.model';
import { Observable, forkJoin, of } from 'rxjs';
import { tap, map, switchMap } from 'rxjs/operators';
import { SystemService } from './system.service';

@Injectable({
    providedIn: 'root'
})
export class HabitService {
    private http = inject(HttpClient);
    private systemService = inject(SystemService);
    private apiUrl = 'http://127.0.0.1:8000/habits';

    private readonly _habits = signal<Habit[]>([]);
    
    // We can keep logs if needed, but for now we focus on habits state
    // private readonly _logs = signal<HabitLog[]>([]);

    readonly habits = this._habits.asReadonly();

    constructor() {
        this.loadHabits();
    }

    private getTimezoneOffset(): number {
        // Returns the time-zone difference from UTC, in minutes.
        // For example, if your time zone is UTC+10, -600 will be returned.
        // Backend expects this value to calculate Local Time = UTC - Offset.
        // So passing this directly is correct based on my backend logic.
        return new Date().getTimezoneOffset();
    }

    private getLocalDateString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadHabits() {
        const params = new HttpParams()
            .set('date', this.getLocalDateString())
            .set('timezone_offset', this.getTimezoneOffset().toString());

        forkJoin({
            habits: this.http.get<Habit[]>(this.apiUrl, { params }),
            systems: this.systemService.getSystems()
        }).subscribe({
            next: ({ habits, systems }) => {
                const systemMap = new Map(systems.map(s => [s.id, s]));
                const enrichedHabits = habits.map(h => {
                    if (h.systemId) {
                        const system = systemMap.get(h.systemId);
                        if (system) {
                            return {
                                ...h,
                                systemTitle: system.title,
                                systemDescription: system.description
                            };
                        }
                    }
                    return h;
                });
                this._habits.set(enrichedHabits);
            },
            error: (error) => console.error('Failed to load habits', error)
        });
    }

    addHabit(habitData: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completionRate' | 'completedToday' | 'created_at'>): Observable<Habit> {
        const payload = {
            ...habitData,
            name: habitData.name,
            description: habitData.description || '',
            frequency: habitData.frequency,
            weekdays: habitData.weekdays,
            icon: habitData.icon || 'star',
            color: habitData.color || '#000000',
            category: habitData.category || 'General'
        };

        return this.http.post<Habit>(this.apiUrl, payload).pipe(
            tap({
                next: (newHabit) => this._habits.update(current => [...current, newHabit]),
                error: (error) => console.error('Failed to add habit', error)
            })
        );
    }

    updateHabit(id: string, habitData: Partial<Habit>): Observable<Habit> {
         return this.http.put<Habit>(`${this.apiUrl}/${id}`, habitData).pipe(
             tap({
                 next: (updatedHabit) => {
                     this._habits.update(habits =>
                        habits.map(h => h.id === id ? updatedHabit : h)
                    );
                 },
                 error: (error) => console.error('Failed to update habit', error)
             })
         );
    }

    toggleCompletion(habitId: string, _date: string): Observable<Habit | null> {
        // Toggle for specific date by creating an ISO timestamp that stays within the desired day
        const timestamp = _date.includes('T') ? _date : `${_date}T12:00:00`;
        const payload = {
            completed_at: new Date(timestamp).toISOString(),
            timezone_offset: this.getTimezoneOffset()
        };
        
        return this.http.post<Habit>(`${this.apiUrl}/${habitId}/toggle`, payload).pipe(
            tap({
                next: (updatedHabit) => {
                    this._habits.update(habits =>
                        habits.map(h => h.id === habitId ? updatedHabit : h)
                    );
                },
                error: (error) => console.error('Failed to toggle completion', error)
            })
        );
    }

    deleteHabit(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap({
                next: () => this._habits.update(current => current.filter(h => h.id !== id)),
                error: (error) => console.error('Failed to delete habit', error)
            })
        );
    }

    updateLog(habitId: string, _date: string, data: { notes?: string; value?: number; focused_minutes?: number }): Observable<Habit | null> {
         // Using the toggle endpoint for updates as it now supports idempotent updates with notes/value
         // Local day neutral timestamp: YYYY-MM-DDT12:00:00
         // This ensures that when subtracting/adding timezone_offset, we stay in the same local day.
         const timestamp = _date.includes('T') ? _date : `${_date}T12:00:00`;
         const payload = {
             completed_at: new Date(timestamp).toISOString(), 
             timezone_offset: this.getTimezoneOffset(),
             value: data.value,
             notes: data.notes,
             focused_minutes: data.focused_minutes
         };
         
         return this.http.post<Habit>(`${this.apiUrl}/${habitId}/toggle`, payload).pipe(
             tap({
                 error: (error) => console.error('Failed to update log', error)
             })
         );
    }
    
    getHistory(habitId: string, page: number, size: number): Observable<import('../models/habit.model').HistoryResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('timezone_offset', this.getTimezoneOffset().toString());

        return this.http.get<import('../models/habit.model').HistoryResponse>(`${this.apiUrl}/${habitId}/history`, { params });
    }

    getHabitStats(habitId: string): Observable<import('../models/habit.model').HabitStats> {
        const params = new HttpParams()
            .set('timezone_offset', this.getTimezoneOffset().toString());
        return this.http.get<import('../models/habit.model').HabitStats>(`${this.apiUrl}/${habitId}/stats`, { params });
    }

    getHabitAnalytics(habitId: string): Observable<import('../models/habit.model').AnalyticsResponse> {
        const params = new HttpParams()
            .set('timezone_offset', this.getTimezoneOffset().toString());
        return this.http.get<import('../models/habit.model').AnalyticsResponse>(`${this.apiUrl}/${habitId}/analytics`, { params });
    }

    getAllHabits(): Observable<Habit[]> {
        return this.http.get<Habit[]>(this.apiUrl);
    }

    getHabitsByTier(tier: 'yearly' | 'monthly' | 'weekly' | 'daily'): Observable<Habit[]> {
        const params = new HttpParams().set('tier', tier);
        return this.http.get<Habit[]>(this.apiUrl, { params });
    }

    // Helper to get habit by ID from the local signal (synchronous)
    getHabitById(id: string): Habit | undefined {
        return this._habits().find(h => h.id === id);
    }
}
