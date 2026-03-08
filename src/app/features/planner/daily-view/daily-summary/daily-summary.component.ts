import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannerTask, DailySummary, PlannerService } from '../../../../services/planner.service';

@Component({
  selector: 'app-daily-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <h2 class="text-xl font-bold mb-4">Daily Summary</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <h3 class="text-sm font-bold text-gray-500">Planned Hours</h3>
          <p class="text-2xl font-bold">{{ plannedHours() | number:'1.0-1' }}h</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-500">Actual Hours</h3>
          <p class="text-2xl font-bold">{{ actualHours() | number:'1.0-1' }}h</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-500">Completion %</h3>
          <p class="text-2xl font-bold">{{ completionPercentage() | number:'1.0-0' }}%</p>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-bold text-gray-700">Mood</label>
        <input type="text" [(ngModel)]="summary.mood" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
      </div>

      <div>
        <h3 class="text-lg font-bold mb-2">Daily Notes</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700">What I Planned</label>
            <textarea [(ngModel)]="summary.notes.whatIPlanned" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" disabled></textarea>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">What I Actually Did</label>
            <textarea [(ngModel)]="summary.notes.whatIActuallyDid" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Wins Today</label>
            <textarea [(ngModel)]="summary.notes.winsToday" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Improvements</label>
            <textarea [(ngModel)]="summary.notes.improvements" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Tomorrow's Focus</label>
            <textarea [(ngModel)]="summary.notes.tomorrowFocus" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
        </div>
      </div>
      <button (click)="saveSummary()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md">Save Summary</button>
    </div>
  `,
})
export class DailySummaryComponent {
  @Input({ required: true }) tasks: PlannerTask[] = [];
  @Input({ required: true }) date: string = '';

  summary: DailySummary = {
    date: this.date,
    plannedHours: 0,
    actualHours: 0,
    completionPercentage: 0,
    mood: '',
    notes: {
      whatIPlanned: '',
      whatIActuallyDid: '',
      winsToday: '',
      improvements: '',
      tomorrowFocus: '',
    }
  };

  constructor(private plannerService: PlannerService) {}

  ngOnInit() {
    this.plannerService.getSummary(this.date).subscribe(summary => {
      if (summary) {
        this.summary = summary;
      }
      this.calculateSummary();
    });
  }

  private calculateDuration(task: PlannerTask): number {
    if (!task.start_time || !task.end_time) {
      return 0;
    }
    const start = new Date(`1970-01-01T${task.start_time}`);
    const end = new Date(`1970-01-01T${task.end_time}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  plannedHours = computed(() => {
    return this.tasks.reduce((acc, task) => acc + this.calculateDuration(task), 0);
  });

  actualHours = computed(() => {
    return this.tasks.filter(t => t.status === 'completed').reduce((acc, task) => acc + this.calculateDuration(task), 0);
  });

  completionPercentage = computed(() => {
    const planned = this.plannedHours();
    if (planned === 0) {
      return 0;
    }
    return (this.actualHours() / planned) * 100;
  });

  calculateSummary() {
    this.summary.plannedHours = this.plannedHours();
    this.summary.actualHours = this.actualHours();
    this.summary.completionPercentage = this.completionPercentage();
    this.summary.notes.whatIPlanned = this.tasks.map(t => `${t.title} (${t.start_time} - ${t.end_time})`).join('\n');
  }

  saveSummary() {
    this.plannerService.saveSummary(this.summary).subscribe();
  }
}

