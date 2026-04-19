import { SystemItem } from '../../../models/system.model';

export type ViewMode = 'form' | 'table' | 'mindmap';

export interface WeekNode {
  weekNum: number;
  focus: string;
  goal: string;
  outcome: string;
  items: SystemItem[];
  isExpanded: boolean;
}

export interface PhaseNode {
  name: string;
  objective: string;
  weeks: WeekNode[];
  isExpanded: boolean;
}

export interface PresetTask {
  day: number;
  title: string;
  description: string;
}

export interface PresetWeek {
  focus: string;
  goal: string;
  outcome: string;
  tasks: PresetTask[];
}

export interface PresetPhase {
  name: string;
  objective: string;
  weeks: PresetWeek[];
}

export interface SystemPreset {
  id: string;
  label: string;
  description: string;
  tags: string[];
  phases: PresetPhase[];
}

/** Flat row for the table view — one row per task */
export interface TableRow {
  phaseIndex: number;
  phaseName: string;
  weekIndex: number;
  weekNum: number;
  weekFocus: string;
  taskIndex: number;
  dayNumber: number;
  title: string;
  description: string;
  resourceLink: string;
}

/** D3 tree node data for mind-map */
export interface MindMapNode {
  name: string;
  type: 'system' | 'phase' | 'week' | 'task';
  meta?: string;
  children?: MindMapNode[];
  _collapsed?: boolean;
}
