export type FrequencyType = 'Daily' | 'Weekly' | 'Interval' | 'SpecificDays';
export type HabitType = 'yes_no' | 'measurable';
export type TargetComparator = '>=' | '<=' | '==';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: string; // Kept for display/legacy
  
  // New Fields
  type: HabitType;
  targetValue: number;
  targetUnit: string;
  targetComparator: TargetComparator;

  frequencyType: string; // 'daily', 'specific_days', 'interval', 'count_per_period'
  weekdays: number[];
  frequencyInterval: number;
  frequencyCount: number;
  frequencyPeriod: number;

  // Hierarchy
  parentId?: string;
  tier?: 'yearly' | 'monthly' | 'weekly' | 'daily';
  systemId?: string;
  systemTitle?: string;
  systemDescription?: string;
  systemTaskTitle?: string;
  systemTaskDescription?: string;
  systemTaskResourceLink?: string;

  startDate?: string;
  endDate?: string;
  timeBlockStart?: string;
  timeBlockEnd?: string;
  icon?: string;
  color?: string;
  category?: string;
  streak: number;
  bestStreak: number;
  completionRate: number;
  completedToday: boolean;
  archived?: boolean;
  created_at: string; // Changed from Date to string to match API response type usually
  latestLog?: {
      id: string;
      habit_name?: string;
      value?: number;
      notes?: string;
      completed_at: any;
  };
}

export interface HabitLog {
  id: string;
  habit_id: string;
  habit_name?: string;
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

export interface BinaryHabitAnalytics {
  success_ratio: number;
  missed_day_pattern: DayFrequency[];
  recovery_time: number;
  consistency_score: number;
}

export interface MeasurableHabitAnalytics {
  average_value: number;
  target_achievement_rate: number;
  best_day: number;
  worst_day: number;
  trend_percentage: number;
  trend_direction: 'up' | 'down' | 'flat';
}

export interface AnalyticsResponse {
  habit_id: string;
  type: HabitType;
  binary_stats?: BinaryHabitAnalytics;
  measurable_stats?: MeasurableHabitAnalytics;
  common_stats: HabitStats;
  period_days: number;
}

