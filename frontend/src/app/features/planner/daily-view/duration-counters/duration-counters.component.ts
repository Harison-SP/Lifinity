import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannerTask } from '../../../../services/planner.service';

@Component({
  selector: 'app-duration-counters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <div class="flex-1 bg-white dark:bg-concrete-800 p-4 rigid-border-sm border-[2px] dark:border-concrete-100 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0_0_white] relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
        <h3 class="text-[10px] font-black uppercase tracking-widest text-concrete-500 dark:text-concrete-400 mb-1">Total Focus Time Today</h3>
        <p class="text-2xl font-black font-mono text-black dark:text-white">{{ totalFocusTime() | number:'1.0-1' }}h</p>
        <p class="text-[9px] font-mono text-concrete-400 dark:text-concrete-500 uppercase mt-1">Completed tasks by time block</p>
      </div>
      <div class="flex-1 bg-white dark:bg-concrete-800 p-4 rigid-border-sm border-[2px] dark:border-concrete-100 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0_0_white] relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-black dark:bg-white"></div>
        <h3 class="text-[10px] font-black uppercase tracking-widest text-concrete-500 dark:text-concrete-400 mb-1">Deep Work Hours</h3>
        <p class="text-2xl font-black font-mono text-black dark:text-white">{{ deepWorkHours() | number:'1.0-1' }}h</p>
        <p class="text-[9px] font-mono text-concrete-400 dark:text-concrete-500 uppercase mt-1">High-priority completed tasks</p>
      </div>
      <div class="flex-1 bg-white dark:bg-concrete-800 p-4 rigid-border-sm border-[2px] dark:border-concrete-100 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0_0_white] relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-concrete-400"></div>
        <h3 class="text-[10px] font-black uppercase tracking-widest text-concrete-500 dark:text-concrete-400 mb-1">Distraction Time</h3>
        <p class="text-2xl font-black font-mono text-concrete-500 dark:text-concrete-300">{{ distractionTime() | number:'1.0-1' }}h</p>
        <p class="text-[9px] font-mono text-concrete-400 dark:text-concrete-500 uppercase mt-1">Pending + skipped tasks scheduled</p>
      </div>
    </div>
  `,
})
export class DurationCountersComponent {
  @Input({ required: true }) tasks: PlannerTask[] = [];

  /** Calculate hours from start/end_time of a task */
  private calculateDuration(task: PlannerTask): number {
    if (!task.start_time || !task.end_time) return 0;
    const start = new Date(`1970-01-01T${task.start_time}`);
    const end = new Date(`1970-01-01T${task.end_time}`);
    if (end <= start) return 0;
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  /** Total time of all completed tasks (by scheduled slot duration) */
  totalFocusTime = computed(() => {
    return this.tasks
      .filter(t => t.status === 'completed')
      .reduce((acc, task) => acc + this.calculateDuration(task), 0);
  });

  /** Deep work = completed high-priority tasks */
  deepWorkHours = computed(() => {
    return this.tasks
      .filter(t => t.status === 'completed' && t.priority === 'high')
      .reduce((acc, task) => acc + this.calculateDuration(task), 0);
  });

  /**
   * Distraction time = time blocks that were scheduled but not completed.
   * Skipped OR still-pending tasks represent time lost / diverted attention.
   */
  distractionTime = computed(() => {
    return this.tasks
      .filter(t => t.status === 'skipped' || t.status === 'pending')
      .reduce((acc, task) => acc + this.calculateDuration(task), 0);
  });
}
