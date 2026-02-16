export interface WeeklyTask {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  task_type: 'normal' | 'habit';
  habit_id?: string;
  week_start: string; // YYYY-MM-DD
  created_at: string;
}

export interface WeeklyTaskCreate {
  text: string;
  date: string;
  completed?: boolean;
  task_type?: 'normal' | 'habit';
  habit_id?: string;
  week_start: string;
}

export interface WeeklyTaskUpdate {
  text?: string;
  date?: string;
  completed?: boolean;
  task_type?: 'normal' | 'habit';
  habit_id?: string;
}

export interface WeeklyTarget {
  id: string;
  text: string;
  completed: boolean;
  week_start: string;
  created_at: string;
}

export interface WeeklyTargetCreate {
  text: string;
  completed?: boolean;
  week_start: string;
}

export interface WeeklyTargetUpdate {
  text?: string;
  completed?: boolean;
}

export interface WeeklyReview {
  id: string;
  week_start: string;
  achieved: string;
  missed: string;
  why: string;
  carry_forward: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReviewUpdate {
  achieved?: string;
  missed?: string;
  why?: string;
  carry_forward?: string;
}

export interface WeeklyMetrics {
  id: string;
  week_start: string;
  focus_hours: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMetricsUpdate {
  focus_hours?: number;
}
