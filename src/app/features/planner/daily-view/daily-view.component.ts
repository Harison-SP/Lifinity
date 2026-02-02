import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannerService, PlannerTask } from '../../../services/planner.service';

@Component({
  selector: 'app-daily-view',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-[#0d1b12] dark:text-white">Daily Tasks</h2>
        <div class="flex gap-3 items-center">
          <input type="date" [(ngModel)]="selectedDate" (change)="loadTasks()" 
                 class="px-4 py-2 rounded-lg bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white">
          <button (click)="showAddForm.set(!showAddForm())" 
                  class="px-4 py-2 bg-[#13ec5b] text-[#0d1b12] rounded-xl font-semibold hover:bg-[#0ba841] transition-colors">
            <span class="material-symbols-outlined align-middle">add</span>
            Add Task
          </button>
        </div>
      </div>

      <!-- Add Task Form -->
      @if (showAddForm()) {
        <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl mb-6">
          <input [(ngModel)]="newTask.title" placeholder="Task title" 
                 class="w-full px-4 py-3 rounded-lg mb-3 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white">
          <textarea [(ngModel)]="newTask.description" placeholder="Description (optional)" 
                    class="w-full px-4 py-3 rounded-lg mb-3 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white" rows="2"></textarea>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <input type="time" [(ngModel)]="newTask.start_time" placeholder="Start time" 
                   class="px-4 py-3 rounded-lg bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white">
            <input type="time" [(ngModel)]="newTask.end_time" placeholder="End time" 
                   class="px-4 py-3 rounded-lg bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white">
          </div>
          <select [(ngModel)]="newTask.priority" 
                  class="w-full px-4 py-3 rounded-lg mb-3 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white">
            <option value="">Select priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div class="flex gap-3">
            <button (click)="addTask()" class="px-6 py-2 bg-[#13ec5b] text-[#0d1b12] rounded-lg font-semibold">Save</button>
            <button (click)="showAddForm.set(false)" class="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-[#0d1b12] dark:text-white rounded-lg">Cancel</button>
          </div>
        </div>
      }

      <!-- Timeline View -->
      <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
        <h3 class="text-lg font-bold text-[#0d1b12] dark:text-white mb-4">Timeline</h3>
        <div class="space-y-2">
          @for (hour of timeSlots; track hour) {
            <div class="flex gap-4 items-start">
              <div class="w-20 text-sm text-[#4c9a66] dark:text-slate-400 font-semibold pt-2">{{hour}}</div>
              <div class="flex-1 min-h-[60px] border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                @for (task of getTasksForHour(hour); track task.id) {
                  <div class="mb-2 p-3 rounded-lg transition-all"
                       [class.bg-red-100]="task.priority === 'high'"
                       [class.dark:bg-red-900/30]="task.priority === 'high'"
                       [class.bg-yellow-100]="task.priority === 'medium'"
                       [class.dark:bg-yellow-900/30]="task.priority === 'medium'"
                       [class.bg-blue-100]="task.priority === 'low' || !task.priority"
                       [class.dark:bg-blue-900/30]="task.priority === 'low' || !task.priority">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h4 class="font-bold text-[#0d1b12] dark:text-white">{{task.title}}</h4>
                        @if (task.description) {
                          <p class="text-sm text-[#4c9a66] dark:text-slate-300">{{task.description}}</p>
                        }
                        <p class="text-xs text-[#4c9a66] dark:text-slate-400 mt-1">
                          {{task.start_time}} - {{task.end_time}}
                          @if (task.priority) {
                            <span class="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                                  [class.bg-red-200]="task.priority === 'high'"
                                  [class.text-red-800]="task.priority === 'high'"
                                  [class.bg-yellow-200]="task.priority === 'medium'"
                                  [class.text-yellow-800]="task.priority === 'medium'"
                                  [class.bg-blue-200]="task.priority === 'low'"
                                  [class.text-blue-800]="task.priority === 'low'">
                              {{task.priority}}
                            </span>
                          }
                        </p>
                      </div>
                      <div class="flex gap-2">
                        <button (click)="toggleTaskStatus(task)" 
                                class="text-[#13ec5b] hover:text-[#0ba841]"
                                [class.opacity-50]="task.status === 'completed'">
                          <span class="material-symbols-outlined text-xl">
                            {{task.status === 'completed' ? 'check_circle' : 'radio_button_unchecked'}}
                          </span>
                        </button>
                        <button (click)="deleteTask(task.id!)" class="text-red-500 hover:text-red-700">
                          <span class="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Tasks without time -->
      @if (tasksWithoutTime().length > 0) {
        <div class="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
          <h3 class="text-lg font-bold text-[#0d1b12] dark:text-white mb-4">Unscheduled Tasks</h3>
          <div class="space-y-2">
            @for (task of tasksWithoutTime(); track task.id) {
              <div class="p-3 bg-white dark:bg-[#1a2c20] rounded-lg flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-bold text-[#0d1b12] dark:text-white">{{task.title}}</h4>
                  @if (task.description) {
                    <p class="text-sm text-[#4c9a66] dark:text-slate-300">{{task.description}}</p>
                  }
                </div>
                <div class="flex gap-2">
                  <button (click)="toggleTaskStatus(task)" 
                          class="text-[#13ec5b] hover:text-[#0ba841]"
                          [class.opacity-50]="task.status === 'completed'">
                    <span class="material-symbols-outlined text-xl">
                      {{task.status === 'completed' ? 'check_circle' : 'radio_button_unchecked'}}
                    </span>
                  </button>
                  <button (click)="deleteTask(task.id!)" class="text-red-500 hover:text-red-700">
                    <span class="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .material-symbols-outlined { 
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
  `]
})
export class DailyViewComponent implements OnInit {
  private plannerService = inject(PlannerService);
  
  tasks = signal<PlannerTask[]>([]);
  tasksWithoutTime = signal<PlannerTask[]>([]);
  showAddForm = signal(false);
  selectedDate = new Date().toISOString().split('T')[0];
  
  timeSlots = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];
  
  newTask = {
    title: '',
    description: '',
    date: this.selectedDate,
    start_time: '',
    end_time: '',
    status: 'pending' as const,
    priority: undefined as 'low' | 'medium' | 'high' | undefined
  };


  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.plannerService.getTasks(this.selectedDate).subscribe(tasks => {
      const withTime = tasks.filter(t => t.start_time && t.end_time);
      const withoutTime = tasks.filter(t => !t.start_time || !t.end_time);
      this.tasks.set(withTime);
      this.tasksWithoutTime.set(withoutTime);
    });
  }

  addTask() {
    if (!this.newTask.title.trim()) return;
    
    this.newTask.date = this.selectedDate;
    this.plannerService.createTask(this.newTask).subscribe(() => {
      this.loadTasks();
      this.newTask = {
        title: '',
        description: '',
        date: this.selectedDate,
        start_time: '',
        end_time: '',
        status: 'pending',
        priority: undefined
      };
      this.showAddForm.set(false);
    });
  }


  deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.plannerService.deleteTask(id).subscribe(() => {
        this.loadTasks();
      });
    }
  }

  toggleTaskStatus(task: PlannerTask) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.plannerService.updateTask(task.id!, { status: newStatus }).subscribe(() => {
      this.loadTasks();
    });
  }

  getTasksForHour(hour: string): PlannerTask[] {
    return this.tasks().filter(task => {
      if (!task.start_time) return false;
      const taskHour = task.start_time.split(':')[0].padStart(2, '0');
      const slotHour = hour.split(':')[0];
      return taskHour === slotHour;
    });
  }
}
