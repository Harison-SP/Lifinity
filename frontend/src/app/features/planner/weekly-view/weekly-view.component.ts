import { Component, signal, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { WeeklyPlannerService } from '../../../services/weekly-planner.service';
import { HabitService } from '../../../services/habit.service';
import { SystemService } from '../../../services/system.service';
import { SystemInstanceTask } from '../../../models/system.model';
import { UserSettingsService } from '../../../services/user-settings.service';
import { 
  WeeklyTask, 
  WeeklyTarget, 
  WeeklyReview, 
  WeeklyMetrics,
  WeeklyTaskCreate
} from '../../../models/weekly-planner.model';
import { Habit } from '../../../models/habit.model';

// Data Structures
interface WeekDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  name: string;
  tasks: WeeklyTask[];
}

@Component({
  selector: 'app-weekly-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="h-full flex flex-col font-body p-3 md:p-6 gap-4 md:gap-6 bg-white overflow-x-hidden paper-texture">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div class="flex w-full md:w-auto items-center gap-3 justify-between md:justify-start">
          <div class="flex items-center gap-2 md:gap-3">
            <button (click)="changeWeek(-1)" 
                    class="p-1.5 md:p-2 bg-white rounded-lg shadow-gentle border border-taupe/10 hover:bg-sand transition-all text-charcoal">
              <span class="material-symbols-outlined text-xl md:text-2xl">chevron_left</span>
            </button>
            <h2 class="text-lg md:text-2xl font-bold text-charcoal font-heading text-center min-w-[150px] md:min-w-[200px]">
              {{ weekDateRange() }}
            </h2>
            <button (click)="changeWeek(1)" 
                    class="p-1.5 md:p-2 bg-white rounded-lg shadow-gentle border border-taupe/10 hover:bg-sand transition-all text-charcoal">
              <span class="material-symbols-outlined text-xl md:text-2xl">chevron_right</span>
            </button>
          </div>
        </div>
        
        <div class="flex items-center gap-2 w-full md:w-auto">
          <button (click)="carryForwardTasks()" 
                  class="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-white text-charcoal border border-taupe/20 rounded-lg font-bold text-[10px] md:text-xs hover:bg-sand transition-all shadow-sm flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">forward_to_inbox</span>
            Carry Forward Tasks
          </button>
        </div>
      </div>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8 overflow-y-auto md:overflow-hidden no-scrollbar">
        <!-- Left Panel: Targets & Metrics -->
        <div class="lg:col-span-1 flex flex-col gap-4 md:gap-6 md:overflow-y-auto custom-scrollbar md:pr-2">
          <!-- Weekly Targets -->
          <div class="bg-white rounded-xl shadow-gentle p-4 md:p-6 border border-taupe/10 flex flex-col min-h-[300px] md:min-h-[400px]">
            <h3 class="text-lg md:text-xl font-bold text-charcoal font-heading border-b border-taupe/10 pb-3 md:pb-4 mb-4 md:mb-6 flex items-center gap-2">
              <span class="material-symbols-outlined text-orange-500">target</span>
              Weekly Targets
            </h3>
            <div class="flex-1 space-y-2 md:space-y-3 overflow-y-auto custom-scrollbar max-h-[300px] md:max-h-none">
              @for(target of weeklyTargets(); track target.id) {
                <div class="flex items-center gap-2 md:gap-3 group bg-alabaster/50 p-2 md:p-3 rounded-lg border border-taupe/5 hover:border-taupe/20 transition-all">
                  <div class="relative flex items-center">
                    <input type="checkbox" [checked]="target.completed" (change)="toggleTargetCompletion(target)" 
                           class="size-4 md:size-5 rounded border-taupe/30 text-orange-500 focus:ring-orange-500 cursor-pointer"/>
                  </div>
                  <input [(ngModel)]="target.text" (ngModelChange)="updateTarget(target)" 
                         class="flex-1 bg-transparent border-none focus:outline-none text-xs md:text-sm font-medium text-charcoal" 
                         [class.line-through]="target.completed"
                         [class.text-taupe]="target.completed"
                         [disabled]="target.completed">
                  <button (click)="deleteTarget(target.id)" class="opacity-0 group-hover:opacity-100 text-taupe hover:text-red-500 transition-all">
                    <span class="material-symbols-outlined text-lg md:text-xl">delete</span>
                  </button>
                </div>
              }
            </div>
            <div class="flex flex-col gap-2 md:gap-3 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-taupe/10">
               <input [(ngModel)]="newTargetText" placeholder="What's your goal?" (keyup.enter)="addTarget()" 
                      class="w-full px-3 md:px-4 py-2 md:py-3 bg-alabaster rounded-lg border border-taupe/10 focus:border-orange-500 focus:bg-white text-charcoal text-xs md:text-sm outline-none transition-all placeholder:text-taupe/50">
               <button (click)="addTarget()" 
                       class="w-full py-2.5 md:py-3 bg-orange-500 text-white rounded-lg font-bold text-xs md:text-sm hover:bg-orange-400 transition-all shadow-sm">
                 Add Target
               </button>
            </div>
          </div>

           <!-- Weekly Metrics -->
           <div class="bg-orange-50 rounded-xl shadow-gentle p-4 md:p-6 border border-orange-100">
              <h3 class="text-lg md:text-xl font-bold text-charcoal font-heading border-b border-orange-200 pb-3 md:pb-4 mb-4 md:mb-6 flex items-center gap-2">
                <span class="material-symbols-outlined text-orange-600">analytics</span>
                Weekly Stats
              </h3>
              <div class="grid grid-cols-3 lg:grid-cols-1 gap-3 md:space-y-4">
                 <div class="flex flex-col lg:flex-row justify-between lg:items-center p-2.5 md:p-4 bg-white rounded-lg border border-orange-100 shadow-sm gap-1">
                     <span class="text-[9px] md:text-sm font-bold text-taupe uppercase tracking-wider">Time</span>
                    <div class="flex items-center gap-1">
                       <input type="number" [(ngModel)]="metrics().focus_hours" (ngModelChange)="updateMetrics()" 
                              class="w-8 md:w-12 text-center py-0.5 md:py-1 bg-sand/30 rounded font-bold text-sm md:text-lg text-charcoal outline-none">
                       <span class="font-bold text-[8px] md:text-xs text-taupe">HRS</span>
                    </div>
                </div>
                 <div class="flex flex-col lg:flex-row justify-between lg:items-center p-2.5 md:p-4 bg-white rounded-lg border border-orange-100 shadow-sm gap-1">
                     <span class="text-[9px] md:text-sm font-bold text-taupe uppercase tracking-wider">Tasks</span>
                     <span class="font-bold text-sm md:text-xl text-orange-600">{{ tasksCompleted() }}/{{ totalTasks() }}</span>
                 </div>
                  <div class="flex flex-col lg:flex-row justify-between lg:items-center p-2.5 md:p-4 bg-white rounded-lg border border-orange-100 shadow-sm gap-1">
                     <span class="text-[9px] md:text-sm font-bold text-taupe uppercase tracking-wider">Pulse</span>
                     <span class="font-bold text-sm md:text-xl text-sage">{{ consistencyScore() | number:'1.0-0' }}%</span>
                </div>
              </div>
          </div>
        </div>

        <!-- Right Panel: Task Distribution -->
        <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:overflow-y-auto custom-scrollbar p-1" cdkDropListGroup>
          @for(day of weekDays(); track day.dateString) {
            <div class="bg-white rounded-xl shadow-gentle p-4 md:p-6 flex flex-col gap-4 md:gap-5 border border-taupe/10 min-h-[300px] md:min-h-[450px] transition-all hover:border-taupe/20">
              <div class="flex justify-between items-start border-b border-taupe/10 pb-3 md:pb-5">
                <div>
                  <h4 class="text-xl md:text-2xl font-bold text-charcoal font-heading leading-tight">{{ day.name }}</h4>
                  <p class="text-[9px] md:text-[10px] font-bold text-taupe uppercase tracking-[0.2em] mt-1 md:mt-1.5">{{ day.date | date:'MMMM d' }}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sand/40 flex items-center justify-center text-charcoal font-black text-[10px] md:text-xs shadow-inner">
                     {{ day.tasks.length + getSystemTasksForDay(day.dateString).length }}
                  </div>
                </div>
              </div>
              
              <div class="flex-1 space-y-3 md:space-y-4 overflow-y-auto custom-scrollbar pr-1 md:pr-2 min-h-[100px] md:min-h-[150px]"
                   cdkDropList
                   [cdkDropListData]="day.tasks"
                   (cdkDropListDropped)="drop($event, day)">
                @for(task of day.tasks; track task.id) {
                   <div cdkDrag class="p-3 md:p-4 rounded-xl bg-white border border-taupe/10 shadow-sm cursor-grab active:cursor-grabbing flex items-start gap-3 md:gap-4 group transition-all hover:shadow-sm hover:bg-alabaster/50"
                        [class.border-l-4]="task.task_type === 'habit'"
                        [style.border-left-color]="task.task_type === 'habit' ? '#f97316' : ''">
                      
                      <button (click)="toggleTaskCompletion(task)" class="mt-0.5 md:mt-1 flex-shrink-0">
                        <div class="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all"
                             [class.bg-sage]="task.completed"
                             [class.border-sage]="task.completed"
                             [class.border-taupe/30]="!task.completed">
                          @if (task.completed) {
                            <span class="material-symbols-outlined text-white text-xs md:text-base">check</span>
                          } @else {
                            <div class="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-taupe/20 group-hover:bg-orange-500/40 transition-colors"></div>
                          }
                        </div>
                      </button>
                      
                      <div class="flex-1 flex flex-col min-w-0 gap-1">
                        @if(task.habit_id) {
                          <span class="text-[8px] md:text-[9px] font-bold text-orange-500 uppercase tracking-wider bg-orange-50 px-1.5 py-0.5 rounded w-fit">
                            {{ getHabitName(task.habit_id) }}
                          </span>
                        }
                        <h5 class="text-xs md:text-sm font-bold text-charcoal font-heading leading-snug break-words" 
                               [class.line-through]="task.completed" 
                               [class.text-taupe]="task.completed">
                          {{ task.text }}
                        </h5>
                      </div>
                      
                      <button (click)="deleteTask(task.id)" class="opacity-0 group-hover:opacity-100 text-taupe hover:text-red-500 flex-shrink-0 transition-opacity">
                        <span class="material-symbols-outlined text-base md:text-lg">delete</span>
                      </button>

                      <div *cdkDragPlaceholder class="cdk-drag-placeholder rounded-xl"></div>
                   </div>
                }

                 <!-- System Instance Tasks for this day -->
                 @for(stask of getSystemTasksForDay(day.dateString); track stask.title) {
                   <div class="p-3 md:p-4 rounded-xl flex items-start gap-3 md:gap-4 transition-all shadow-sm border border-taupe/10 relative overflow-hidden group/stask"
                        [class.bg-sage/5]="stask.completed"
                        [class.bg-white]="!stask.completed"
                        [style.border-left-color]="stask.color || '#f97316'"
                        style="border-left-width: 4px;">
                     
                     <button (click)="toggleSystemTask(stask)" class="mt-0.5 md:mt-1 flex-shrink-0 z-10">
                        <div class="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all"
                             [style.border-color]="stask.completed ? '#8c9a81' : (stask.color || '#f97316')"
                             [style.background-color]="stask.completed ? '#8c9a81' : 'transparent'">
                          @if (stask.completed) {
                            <span class="material-symbols-outlined text-white text-xs md:text-base">check</span>
                          } @else {
                            <div class="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full" [style.background-color]="stask.color || '#f97316'"></div>
                          }
                        </div>
                     </button>
 
                     <div class="flex-1 flex flex-col min-w-0 gap-1 md:gap-1.5">
                       <div class="flex items-center flex-wrap gap-1 md:gap-2">
                         <span class="text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 md:py-0.5 rounded bg-sand/50" [style.color]="stask.color || '#f97316'">
                           {{ stask.habitName || stask.systemTitle }}
                         </span>
                         @if(stask.weekFocus) {
                           <span class="text-[9px] font-medium text-taupe uppercase tracking-tight line-clamp-1 italic px-2 py-0.5 rounded bg-alabaster border border-taupe/10">
                             {{ stask.weekFocus }}
                           </span>
                         }
                       </div>
                       
                       <h5 class="text-sm md:text-base font-bold text-charcoal font-heading leading-snug break-words"
                           [class.line-through]="stask.completed"
                           [class.text-taupe]="stask.completed">
                         {{ stask.title }}
                       </h5>

                     </div>
                   </div>
                 }

                @if(day.tasks.length === 0 && getSystemTasksForDay(day.dateString).length === 0) {
                  <div class="flex-1 flex flex-col items-center justify-center text-taupe/30 border-2 border-dashed border-taupe/10 rounded-xl p-6 md:p-8">
                    <span class="material-symbols-outlined text-2xl md:text-4xl mb-1 md:mb-2">assignment_add</span>
                    <span class="text-[9px] md:text-xs font-bold uppercase text-center">Empty Day</span>
                  </div>
                }
              </div>

              <!-- Input Section -->
              <div class="mt-auto space-y-2 md:space-y-3 pt-3 md:pt-4 border-t border-taupe/10">
                <div class="flex items-center gap-2 px-2 py-1.5 bg-alabaster rounded-lg border border-taupe/5 focus-within:border-taupe/20 transition-all">
                  <span class="material-symbols-outlined text-xs text-taupe">sell</span>
                  <select #habitSelect class="flex-1 bg-transparent border-none text-[9px] md:text-[10px] font-bold uppercase outline-none text-charcoal cursor-pointer">
                    <option value="">Label</option>
                    @for(habit of weeklyHabits(); track habit.id) {
                      <option [value]="habit.id">{{ habit.name }}</option>
                    }
                  </select>
                </div>
                <div class="flex gap-2">
                  <input #taskInput (keyup.enter)="addTaskManually(day, taskInput, habitSelect)" 
                         placeholder="Task..." 
                         class="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-alabaster rounded-lg border border-taupe/10 text-xs md:text-sm outline-none transition-all placeholder:text-taupe/50 focus:border-orange-500 focus:bg-white text-charcoal">
                  <button (click)="addTaskManually(day, taskInput, habitSelect)" 
                          class="bg-charcoal text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-black transition-all shadow-sm">
                    <span class="material-symbols-outlined text-lg md:text-xl">add</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
      
       <!-- Weekly Review Section -->
        <div class="bg-white rounded-xl shadow-gentle p-4 md:p-8 border border-taupe/10 mt-2 md:mt-4">
          <h3 class="text-lg md:text-xl font-bold text-charcoal font-heading border-b border-taupe/10 pb-3 md:pb-4 mb-4 md:mb-8 flex items-center gap-2">
            <span class="material-symbols-outlined text-orange-500">rate_review</span>
            Weekly Reflection
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
             <div class="flex flex-col gap-2 md:gap-3">
               <label class="text-[10px] md:text-xs font-bold uppercase text-taupe tracking-wider ml-1">Wins</label>
               <textarea [(ngModel)]="review().achieved" (ngModelChange)="updateReview()" placeholder="What went well?" 
                         rows="3" md:rows="5" class="w-full px-3 md:px-4 py-2 md:py-3 bg-alabaster rounded-xl border border-taupe/10 focus:border-orange-500 focus:bg-white text-charcoal text-xs md:text-sm outline-none resize-none transition-all placeholder:text-taupe/30"></textarea>
             </div>
             <div class="flex flex-col gap-2 md:gap-3">
               <label class="text-[10px] md:text-xs font-bold uppercase text-taupe tracking-wider ml-1">Misses</label>
               <textarea [(ngModel)]="review().missed" (ngModelChange)="updateReview()" placeholder="Obstacles?" 
                         rows="3" md:rows="5" class="w-full px-3 md:px-4 py-2 md:py-3 bg-alabaster rounded-xl border border-taupe/10 focus:border-orange-500 focus:bg-white text-charcoal text-xs md:text-sm outline-none resize-none transition-all placeholder:text-taupe/30"></textarea>
             </div>
             <div class="flex flex-col gap-2 md:gap-3">
               <label class="text-[10px] md:text-xs font-bold uppercase text-taupe tracking-wider ml-1">Insights</label>
               <textarea [(ngModel)]="review().why" (ngModelChange)="updateReview()" placeholder="Why stay on track?" 
                         rows="3" md:rows="5" class="w-full px-3 md:px-4 py-2 md:py-3 bg-alabaster rounded-xl border border-taupe/10 focus:border-orange-500 focus:bg-white text-charcoal text-xs md:text-sm outline-none resize-none transition-all placeholder:text-taupe/30"></textarea>
             </div>
             <div class="flex flex-col gap-2 md:gap-3">
               <label class="text-[10px] md:text-xs font-bold uppercase text-taupe tracking-wider ml-1">Next Plan</label>
               <textarea [(ngModel)]="review().carry_forward" (ngModelChange)="updateReview()" placeholder="Next actions..." 
                         rows="3" md:rows="5" class="w-full px-3 md:px-4 py-2 md:py-3 bg-alabaster rounded-xl border border-taupe/10 focus:border-orange-500 focus:bg-white text-charcoal text-xs md:text-sm outline-none resize-none transition-all placeholder:text-taupe/30"></textarea>
             </div>
          </div>
        </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #dcd7d0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c1bab0; }
    
    .cdk-drag-placeholder {
      opacity: 0.3;
      background: #fdf6e3;
      border: 2px dashed #e2e8f0;
      min-height: 80px;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .cdk-drag {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class WeeklyViewComponent implements OnInit {
  private weeklyPlannerService = inject(WeeklyPlannerService);
  private habitService = inject(HabitService);
  private systemService = inject(SystemService);
  private settingsService = inject(UserSettingsService);

  currentDate = signal(new Date());
  weekStart = signal('');
  weekEnd = signal('');

  weekDays = signal<WeekDay[]>([]);
  weeklyTargets = signal<WeeklyTarget[]>([]);
  review = signal<WeeklyReview>({ 
    id: '', 
    week_start: '', 
    achieved: '', 
    missed: '', 
    why: '', 
    carry_forward: '',
    created_at: '',
    updated_at: ''
  });
  metrics = signal<WeeklyMetrics>({ 
    id: '', 
    week_start: '', 
    focus_hours: 0,
    created_at: '',
    updated_at: ''
  });
  weeklyHabits = signal<Habit[]>([]);
  systemTasks = signal<SystemInstanceTask[]>([]);

  newTargetText = '';

  ngOnInit() {
    this.generateWeekDays(this.currentDate());
    this.loadWeekData();
  }
  
  generateWeekDays(date: Date) {
    const startOfWeek = this.getStartOfWeek(date);
    const weekStartStr = this.formatDate(startOfWeek);
    const weekEndDate = new Date(startOfWeek);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEndStr = this.formatDate(weekEndDate);
    
    this.weekStart.set(weekStartStr);
    this.weekEnd.set(weekEndStr);

    const days: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(dayDate.getDate() + i);
      const dateString = this.formatDate(dayDate);
      days.push({
        date: dayDate,
        dateString: dateString,
        name: dayDate.toLocaleDateString('en-US', { weekday: 'long' }),
        tasks: []
      });
    }
    this.weekDays.set(days);
  }

  loadWeekData() {
    const weekStartStr = this.weekStart();
    const weekEndStr = this.weekEnd();

    // Load tasks
    this.weeklyPlannerService.getTasks(weekStartStr).subscribe({
      next: (tasks) => {
        this.distributeTasks(tasks);
      },
      error: (error) => console.error('Failed to load tasks', error)
    });

    // Load targets
    this.weeklyPlannerService.getTargets(weekStartStr).subscribe({
      next: (targets) => this.weeklyTargets.set(targets),
      error: (error) => console.error('Failed to load targets', error)
    });

    // Load review
    this.weeklyPlannerService.getReview(weekStartStr).subscribe({
      next: (review) => this.review.set(review),
      error: (error) => console.error('Failed to load review', error)
    });

    // Load metrics
    this.weeklyPlannerService.getMetrics(weekStartStr).subscribe({
      next: (metrics) => this.metrics.set(metrics),
      error: (error) => console.error('Failed to load metrics', error)
    });

    // Load habits for the week
    this.weeklyPlannerService.getHabitsForWeek(weekStartStr, weekEndStr).subscribe({
      next: (habits) => {
        this.weeklyHabits.set(habits);
      },
      error: (error) => console.error('Failed to load habits', error)
    });

    // Load system instance tasks for the week
    this.systemService.getInstanceTasksByWeek(weekStartStr, weekEndStr).subscribe({
      next: (tasks) => this.systemTasks.set(tasks),
      error: (err) => console.error('Failed to load system tasks', err)
    });
  }


  getHabitName(habitId: string): string {
    return this.weeklyHabits().find(h => h.id === habitId)?.name || 'Habit Tag';
  }

  getSystemTasksForDay(dateStr: string): SystemInstanceTask[] {
    return this.systemTasks().filter(t => t.date === dateStr);
  }

  toggleSystemTask(task: SystemInstanceTask) {
    if (!task.instanceId || !task.phase) return;
    this.systemService.toggleInstanceTask(
      task.instanceId, task.phase, task.weekNumber, task.date, task.title
    ).subscribe(() => {
      this.systemTasks.update(tasks =>
        tasks.map(t =>
          t.instanceId === task.instanceId && t.date === task.date && t.title === task.title
            ? { ...t, completed: !t.completed }
            : t
        )
      );
    });
  }

  distributeTasks(tasks: WeeklyTask[]) {
    this.weekDays.update(days => {
      return days.map(day => ({
        ...day,
        tasks: tasks.filter(t => t.date === day.dateString)
      }));
    });
  }

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const weekStartSetting = this.settingsService.settings().weekStartDay;
    
    let diff;
    if (weekStartSetting === 'Monday') {
      diff = d.getDate() - day + (day === 0 ? -6 : 1);
    } else {
      // Sunday
      diff = d.getDate() - day;
    }
    
    return new Date(d.setDate(diff));
  }
  
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  changeWeek(delta: number) {
    const newDate = new Date(this.currentDate());
    newDate.setDate(newDate.getDate() + (delta * 7));
    this.currentDate.set(newDate);
    this.generateWeekDays(newDate);
    this.loadWeekData();
  }

  weekDateRange = computed(() => {
    const days = this.weekDays();
    if (days.length === 0) return '';
    const start = days[0].date;
    const end = days[days.length - 1].date;
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  // Target Methods
  addTarget() {
    if (!this.newTargetText.trim()) return;
    
    const targetCreate = {
      text: this.newTargetText,
      completed: false,
      week_start: this.weekStart()
    };

    this.weeklyPlannerService.createTarget(targetCreate).subscribe({
      next: (newTarget) => {
        this.weeklyTargets.update(t => [...t, newTarget]);
        this.newTargetText = '';
      },
      error: (error) => console.error('Failed to add target', error)
    });
  }

  toggleTargetCompletion(target: WeeklyTarget) {
    const update = { completed: !target.completed };
    this.weeklyPlannerService.updateTarget(target.id, update).subscribe({
      next: (updatedTarget) => {
        this.weeklyTargets.update(targets => 
          targets.map(t => t.id === target.id ? updatedTarget : t)
        );
      },
      error: (error) => console.error('Failed to toggle target', error)
    });
  }
  
  updateTarget(target: WeeklyTarget) {
    const update = { text: target.text };
    this.weeklyPlannerService.updateTarget(target.id, update).subscribe({
      error: (error) => console.error('Failed to update target', error)
    });
  }

  deleteTarget(id: string) {
    this.weeklyPlannerService.deleteTarget(id).subscribe({
      next: () => {
        this.weeklyTargets.update(targets => targets.filter(t => t.id !== id));
      },
      error: (error) => console.error('Failed to delete target', error)
    });
  }

  // Task Methods
  addTaskManually(day: WeekDay, input: HTMLInputElement, habitSelect: HTMLSelectElement) {
    if (!input.value.trim()) return;
    
    const habitId = habitSelect.value;
    const taskCreate: WeeklyTaskCreate = {
      text: input.value,
      date: day.dateString,
      completed: false,
      task_type: habitId ? 'habit' as const : 'normal' as const,
      habit_id: habitId || undefined,
      week_start: this.weekStart()
    };

    this.weeklyPlannerService.createTask(taskCreate).subscribe({
      next: (newTask) => {
        day.tasks.push(newTask);
        this.weekDays.set([...this.weekDays()]);
        input.value = '';
        habitSelect.value = '';
      },
      error: (error) => console.error('Failed to add task', error)
    });
  }

  toggleTaskCompletion(task: WeeklyTask) {
    const update = { completed: !task.completed };
    this.weeklyPlannerService.updateTask(task.id, update).subscribe({
      next: (updatedTask) => {
        this.weekDays.update(days => {
          return days.map(day => ({
            ...day,
            tasks: day.tasks.map(t => t.id === task.id ? updatedTask : t)
          }));
        });
      },
      error: (error) => console.error('Failed to toggle task', error)
    });
  }
  
  deleteTask(taskId: string) {
    this.weeklyPlannerService.deleteTask(taskId).subscribe({
      next: () => {
        this.weekDays.update(days => {
          return days.map(day => ({
            ...day,
            tasks: day.tasks.filter(t => t.id !== taskId)
          }));
        });
      },
      error: (error) => console.error('Failed to delete task', error)
    });
  }

  drop(event: CdkDragDrop<WeeklyTask[]>, targetDay: WeekDay) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      
      // Update task date to new day
      const update = { date: targetDay.dateString };
      this.weeklyPlannerService.updateTask(task.id, update).subscribe({
        next: () => {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex,
          );
          this.weekDays.set([...this.weekDays()]);
        },
        error: (error) => console.error('Failed to move task', error)
      });
    }
  }

  carryForwardTasks() {
    const today = this.formatDate(new Date());
    this.weeklyPlannerService.carryForwardTasks(today).subscribe({
      next: (result) => {
        console.log(result.message);
        // Reload tasks to see the carried forward ones
        this.loadWeekData();
      },
      error: (error) => console.error('Failed to carry forward tasks', error)
    });
  }

  updateReview() {
    const reviewData = this.review();
    if (!reviewData.id) return;

    const update = {
      achieved: reviewData.achieved,
      missed: reviewData.missed,
      why: reviewData.why,
      carry_forward: reviewData.carry_forward
    };

    this.weeklyPlannerService.updateReview(reviewData.id, update).subscribe({
      error: (error) => console.error('Failed to update review', error)
    });
  }

  updateMetrics() {
    const metricsData = this.metrics();
    if (!metricsData.id) return;

    const update = {
      focus_hours: metricsData.focus_hours
    };

    this.weeklyPlannerService.updateMetrics(metricsData.id, update).subscribe({
      error: (error) => console.error('Failed to update metrics', error)
    });
  }

  // Computed Metrics
  tasksCompleted = computed(() => {
    return this.weekDays().reduce((sum, day) => 
      sum + day.tasks.filter(t => t.completed).length, 0
    );
  });

  totalTasks = computed(() => {
    return this.weekDays().reduce((sum, day) => sum + day.tasks.length, 0);
  });

  consistencyScore = computed(() => {
    const total = this.totalTasks();
    return total === 0 ? 0 : (this.tasksCompleted() / total) * 100;
  });
}





