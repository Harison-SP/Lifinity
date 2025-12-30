export type FrequencyType = 'Daily' | 'Weekly';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: FrequencyType;
  targetDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  icon?: string;
  color?: string;
  category?: string;
  streak: number;
  bestStreak: number;
  completionRate: number;
  completedToday: boolean;
  createdAt: Date;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // ISO Date string YYYY-MM-DD
  completed: boolean;
  notes?: string;
}
