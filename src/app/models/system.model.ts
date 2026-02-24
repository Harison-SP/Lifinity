export interface SystemItem {
  id?: string;
  phase?: string;
  week_number: number;
  week_focus?: string;
  day_number: number;
  title: string;
  description?: string;
  time_block_start?: string;
  time_block_end?: string;
  resource_link?: string;
}

export interface LearningSystem {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  items: SystemItem[];
  created_at?: string;
}

export interface SystemInstantiate {
  system_id: string;
  start_date: string; // YYYY-MM-DD
  habit_id?: string;
}

// ── Instance models (returned from /systems/instances) ──────────────────────

export interface SystemInstanceTask {
  title: string;
  description?: string;
  date: string;             // YYYY-MM-DD
  weekNumber: number;
  dayNumber: number;
  timeBlockStart?: string;  // HH:mm
  timeBlockEnd?: string;    // HH:mm
  durationMinutes?: number;
  resourceLink?: string;
  completed: boolean;
  completedAt?: string;
  // enriched by /by-week endpoint:
  weekFocus?: string;
  weekStart?: string;
  weekEnd?: string;
  phase?: string;
  systemTitle?: string;
  habitId?: string;
  habitName?: string;
  color?: string;
  instanceId?: string;
}

export interface SystemInstanceWeek {
  weekNumber: number;
  focus: string;
  startDate: string;
  endDate: string;
  items: SystemInstanceTask[];
}

export interface SystemInstancePhase {
  name: string;
  startDate: string;
  endDate: string;
  weeks: SystemInstanceWeek[];
}

export interface SystemInstance {
  id?: string;
  systemId: string;
  systemTitle: string;
  habitId?: string;
  habitName?: string;
  startDate: string;
  endDate: string;
  color?: string;
  phases: SystemInstancePhase[];
  created_at?: string;
}

export interface InstantiateResult {
  message: string;
  instance_id: string;
  habitId?: string;
  habitName?: string;
  startDate: string;
  totalTasks: number;
}
