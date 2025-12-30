import { Injectable, signal, computed } from '@angular/core';
import { Habit, HabitLog } from '../models/habit.model';

@Injectable({
    providedIn: 'root'
})
export class HabitService {
    // Mock initial data matching the sample
    private readonly _habits = signal<Habit[]>([
        {
            id: '1',
            name: 'Morning Jog',
            description: 'Daily goal: 30 minutes',
            frequency: 'Daily',
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            icon: 'directions_run',
            color: '#13ec5b', // primary
            category: 'Health',
            streak: 12,
            bestStreak: 45,
            completionRate: 85,
            completedToday: false,
            createdAt: new Date('2023-01-01')
        },
        {
            id: '2',
            name: 'Learn Spanish',
            description: 'Duolingo',
            frequency: 'Daily',
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            icon: 'language',
            color: '#0ea5e9', // blue
            category: 'Learning',
            streak: 5,
            bestStreak: 10,
            completionRate: 70,
            completedToday: true,
            createdAt: new Date('2023-06-01')
        }
    ]);

    private readonly _logs = signal<HabitLog[]>([]);

    readonly habits = this._habits.asReadonly();
    readonly logs = this._logs.asReadonly();

    readonly habitsWithCompletion = computed(() => {
        const habits = this._habits();
        // In a real app we'd join with logs here
        return habits;
    });

    addHabit(habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completionRate' | 'completedToday' | 'createdAt'>) {
        const newHabit: Habit = {
            ...habit,
            id: crypto.randomUUID(),
            streak: 0,
            bestStreak: 0,
            completionRate: 0,
            completedToday: false,
            createdAt: new Date()
        };
        this._habits.update(current => [...current, newHabit]);
    }

    toggleCompletion(habitId: string, date: string) {
        this._habits.update(habits =>
            habits.map(h => {
                if (h.id === habitId) {
                    // Simplified toggle logic for demo
                    return { ...h, completedToday: !h.completedToday };
                }
                return h;
            })
        );
    }

    deleteHabit(id: string) {
        this._habits.update(current => current.filter(h => h.id !== id));
    }
}
