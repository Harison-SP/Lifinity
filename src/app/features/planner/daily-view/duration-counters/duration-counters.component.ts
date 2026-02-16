import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannerTask } from '../../../../services/planner.service';

@Component({
  selector: 'app-duration-counters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex gap-4 mb-4">
      <div class="flex-1 bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm font-bold text-gray-500">Total Focus Time Today</h3>
        <p class="text-2xl font-bold">{{ totalFocusTime() | number:'1.0-1' }}h</p>
      </div>
      <div class="flex-1 bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm font-bold text-gray-500">Deep Work Hours</h3>
        <p class="text-2xl font-bold">{{ deepWorkHours() | number:'1.0-1' }}h</p>
      </div>
      <div class="flex-1 bg-white p-4 rounded-lg shadow">
        <h3 class="text-sm font-bold text-gray-500">Distraction Time</h3>
        <p class="text-2xl font-bold">{{ distractionTime() | number:'1.0-1' }}h</p>
      </div>
    </div>
  `,
})
export class DurationCountersComponent {
  @Input({ required: true }) tasks: PlannerTask[] = [];

  private calculateDuration(task: PlannerTask): number {
    if (!task.start_time || !task.end_time) {
      return 0;
    }
    const start = new Date(`1970-01-01T${task.start_time}`);
    const end = new Date(`1970-01-01T${task.end_time}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  totalFocusTime = computed(() => {
    return this.tasks
      .filter(t => t.status === 'completed')
      .reduce((acc, task) => acc + this.calculateDuration(task), 0);
  });

  deepWorkHours = computed(() => {
    return this.tasks
      .filter(t => t.status === 'completed' && t.priority === 'high')
      .reduce((acc, task) => acc + this.calculateDuration(task), 0);
  });

  distractionTime = computed(() => {
    return this.tasks
      .filter(t => t.category === 'Personal' && t.status === 'skipped')
      .reduce((acc, task) => acc + this.calculateDuration(task), 0);
  });
}
