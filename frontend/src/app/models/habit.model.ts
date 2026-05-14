export type FrequencyType = 'Daily' | 'Weekly' | 'Interval' | 'SpecificDays';
export type HabitType = 'yes_no' | 'measurable';
export type TargetComparator = '>=' | '<=' | '==';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type HabitCategory = 'protocol' | 'bad_habit';

export interface FrictionRule {
  id?: string;
  description: string;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
}

export interface MicroHabit {
  id?: string;
  name: string;
  description?: string;
  priority: PriorityLevel;
  reminderOffsetMinutes?: number;
  executionWindowStart?: string;
  executionWindowEnd?: string;
  completedToday?: boolean;
  streak?: number;
  parentId?: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: string;

  // New Fields
  type: HabitType;
  targetValue: number;
  targetUnit: string;
  targetComparator: TargetComparator;

  frequencyType: string;
  weekdays: number[];
  frequencyInterval: number;
  frequencyCount: number;
  frequencyPeriod: number;

  // Hierarchy - Main to Micro mapping
  parentId?: string;
  tier?: 'yearly' | 'monthly' | 'weekly' | 'daily';
  systemId?: string;
  systemTitle?: string;
  systemDescription?: string;
  systemTaskTitle?: string;
  systemTaskDescription?: string;
  systemTaskResourceLink?: string;

  // Subtasks (Micro-Habits)
  subtasks?: MicroHabit[];

  // Priority & Forced Consistency
  priority?: PriorityLevel;

  // Bad Habit Management
  category?: HabitCategory;
  soberStartDate?: string; // YYYY-MM-DD HH:mm:ss when the sobriety/avoidance streak started
  frictionRules?: FrictionRule[];

  // Temporal Defaults
  startDate?: string;
  endDate?: string;
  timeBlockStart?: string;
  timeBlockEnd?: string;
  defaultFocusHours?: number;

  icon?: string;
  color?: string;
  streak: number;
  bestStreak: number;
  completionRate: number;
  completedToday: boolean;
  archived?: boolean;
  stackedWith?: string;
  stackDuration?: number;
  stackStartDate?: string;
  created_at: string;
  latestLog?: {
      id: string;
      habit_name?: string;
      value?: number;
      notes?: string;
      completed_at: any;
      focused_minutes?: number;
  };
}

export interface HabitLog {
  id: string;
  habit_id: string;
  habit_name?: string;
  completed_at: string;
  value?: number;
  notes?: string;
  focused_minutes?: number;
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
  best_day?: number;
  worst_day?: number;
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