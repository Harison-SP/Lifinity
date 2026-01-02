import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Habit, HabitLog } from '../models/habit.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HabitService {
    private http = inject(HttpClient);
    private apiUrl = 'http://127.0.0.1:8000/habits';

    private readonly _habits = signal<Habit[]>([]);
    private readonly _logs = signal<HabitLog[]>([]);

    readonly habits = this._habits.asReadonly();
    readonly logs = this._logs.asReadonly();

    readonly habitsWithCompletion = computed(() => {
        return this._habits();
    });

    constructor() {
        this.loadHabits();
    }

    async loadHabits() {
        try {
            const habits = await firstValueFrom(this.http.get<Habit[]>(this.apiUrl));
            this._habits.set(habits);
        } catch (error) {
            console.error('Failed to load habits', error);
        }
    }

    async addHabit(habitData: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completionRate' | 'completedToday' | 'createdAt'>) {
        // Backend expects matching fields. Our model is aligned now.
        // We set default values for fields backend might not require but our UI does
        const payload = {
            ...habitData,
            name: habitData.name,
            description: habitData.description || '',
            frequency: habitData.frequency,
            targetDays: habitData.targetDays,
            icon: habitData.icon || 'star', // Default icon
            color: habitData.color || '#000000',
            category: habitData.category || 'General',
            streak: 0,
            bestStreak: 0,
            completionRate: 0,
            completedToday: false
        };

        try {
            const newHabit = await firstValueFrom(this.http.post<Habit>(this.apiUrl, payload));
            this._habits.update(current => [...current, newHabit]);
        } catch (error) {
            console.error('Failed to add habit', error);
        }
    }

    async updateHabit(id: string, habitData: Partial<Habit>) {
        try {
             const updatedHabit = await firstValueFrom(this.http.put<Habit>(`${this.apiUrl}/${id}`, habitData));
             this._habits.update(habits =>
                habits.map(h => h.id === id ? updatedHabit : h)
            );
        } catch (error) {
            console.error('Failed to update habit', error);
        }
    }

    async toggleCompletion(habitId: string, date: string) {
        const habit = this._habits().find(h => h.id === habitId);
        if (!habit) return;

        const updatedStatus = !habit.completedToday;
        // In a real app we might also log this to a separate 'logs' endpoint
        
        try {
            const updatedHabit = await firstValueFrom(this.http.put<Habit>(`${this.apiUrl}/${habitId}`, { 
                completedToday: updatedStatus 
            }));
            
            this._habits.update(habits =>
                habits.map(h => h.id === habitId ? updatedHabit : h)
            );
        } catch (error) {
            console.error('Failed to toggle completion', error);
        }
    }

    async deleteHabit(id: string) {
        try {
            await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
            this._habits.update(current => current.filter(h => h.id !== id));
        } catch (error) {
            console.error('Failed to delete habit', error);
        }
    }
}
