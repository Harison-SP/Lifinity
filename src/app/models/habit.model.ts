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
  created_at: string; // Changed from Date to string to match API response type usually
  latestLog?: {
      id: string;
      value?: number;
      notes?: string;
      completed_at: any;
  };
}

export interface HabitLog {
  id: string;
  habit_id: string;
  completed_at: string; // ISO UTC
  value?: number;
  notes?: string;
}

export interface HistoryResponse {
  items: HabitLog[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface HeatmapItem {
  date: string;
  level: number;
}

export interface DayFrequency {
  day_name: string;
  count: number;
  percentage: number;
}

export interface TrendItem {
  period: string;
  rate: number;
}

export interface HabitStats {
  total_completions: number;
  completion_rate: number;
  heatmap: HeatmapItem[];
  weekly_frequency: DayFrequency[];
  completion_trend: TrendItem[];
}
