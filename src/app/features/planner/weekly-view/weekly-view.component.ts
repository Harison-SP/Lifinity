import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { WeeklyPlannerService } from '../../../services/weekly-planner.service';
import { HabitService } from '../../../services/habit.service';
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
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="h-full flex flex-col font-manrope p-4 gap-6 bg-concrete-50">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <button (click)="changeWeek(-1)" class="p-2 hover:bg-black hover:text-white transition-all rigid-border-sm border-[2px] bg-white">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 class="text-2xl font-black text-black uppercase font-arvo min-w-[250px] text-center">
              {{ weekDateRange() }}
            </h2>
            <button (click)="changeWeek(1)" class="p-2 hover:bg-black hover:text-white transition-all rigid-border-sm border-[2px] bg-white">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="carryForwardTasks()" class="px-6 py-3 bg-blue-600 text-white rigid-border-sm border-[2px] font-black uppercase text-xs hover:bg-blue-700 hover:-translate-y-1 transition-all brutalist-shadow-sm">
            Carry Forward Incomplete Tasks
          </button>
        </div>
      </div>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
        <!-- Left Panel: Targets & Metrics -->
        <div class="lg:col-span-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
          <!-- Weekly Targets -->
          <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-lg flex flex-col min-h-[400px]">
            <h3 class="text-xl font-black text-black uppercase font-arvo border-b-4 border-black pb-3 mb-6 flex items-center gap-2">
              <span class="material-symbols-outlined">target</span>
              Weekly Targets
            </h3>
            <div class="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
              @for(target of weeklyTargets(); track target.id) {
                <div class="flex items-center gap-3 group bg-concrete-50 p-2 rigid-border-sm border-[2px] hover:border-black transition-colors">
                  <input type="checkbox" [checked]="target.completed" (change)="toggleTargetCompletion(target)" class="size-5 accent-black cursor-pointer"/>
                  <input [(ngModel)]="target.text" (ngModelChange)="updateTarget(target)" 
                         class="flex-1 bg-transparent border-none focus:outline-none text-sm font-mono uppercase font-bold" 
                         [class.line-through]="target.completed"
                         [disabled]="target.completed">
                  <button (click)="deleteTarget(target.id)" class="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity">
                    <span class="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              }
            </div>
            <div class="flex flex-col gap-2 mt-6 pt-4 border-t-4 border-black">
               <input [(ngModel)]="newTargetText" placeholder="New Target" (keyup.enter)="addTarget()" 
                      class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none uppercase placeholder:text-concrete-400">
               <button (click)="addTarget()" class="w-full py-3 bg-black text-white rigid-border-sm border-[2px] font-black uppercase text-sm hover:bg-gray-800 transition-colors">Add Target</button>
            </div>
          </div>

          <!-- Weekly Metrics -->
          <div class="bg-yellow-100 rigid-border border-[4px] p-6 brutalist-shadow-lg">
             <h3 class="text-xl font-black text-black uppercase font-arvo border-b-4 border-black pb-3 mb-6 flex items-center gap-2">
               <span class="material-symbols-outlined">analytics</span>
               Weekly Metrics
             </h3>
             <div class="space-y-4">
                <div class="flex justify-between items-center p-3 bg-white rigid-border-sm border-[2px]">
                    <span class="text-sm font-black uppercase">Focus Hours</span>
                    <div class="flex items-center gap-2">
                      <input type="number" [(ngModel)]="metrics().focus_hours" (ngModelChange)="updateMetrics()" 
                             class="w-16 text-center py-1 bg-transparent font-mono font-bold text-lg outline-none border-none">
                      <span class="font-bold text-xs">HRS</span>
                    </div>
                </div>
                 <div class="flex justify-between items-center p-3 bg-white rigid-border-sm border-[2px]">
                    <span class="text-sm font-black uppercase">Completion</span>
                    <span class="font-mono font-black text-xl text-blue-600">{{ tasksCompleted() }}/{{ totalTasks() }}</span>
                </div>
                 <div class="flex justify-between items-center p-3 bg-white rigid-border-sm border-[2px]">
                    <span class="text-sm font-black uppercase">Consistency</span>
                    <span class="font-mono font-black text-xl text-green-600">{{ consistencyScore() | number:'1.0-0' }}%</span>
                </div>
             </div>
          </div>
        </div>

        <!-- Right Panel: Task Distribution - NOW 2 COLUMNS AND BIGGER -->
        <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar p-1" cdkDropListGroup>
          @for(day of weekDays(); track day.dateString) {
            <div class="bg-white rigid-border border-[4px] p-6 flex flex-col gap-4 brutalist-shadow-lg min-h-[450px]">
              <div class="flex justify-between items-center border-b-4 border-black pb-3 mb-2">
                <h4 class="text-xl font-black uppercase font-arvo">{{ day.name }}</h4>
                <span class="bg-black text-white px-3 py-1 font-mono text-sm font-bold">{{ day.date | date:'MMMM d' }}</span>
              </div>
              
              <div class="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 min-h-[250px]"
                   cdkDropList
                   [cdkDropListData]="day.tasks"
                   (cdkDropListDropped)="drop($event, day)">
                @for(task of day.tasks; track task.id) {
                   <div cdkDrag class="p-3 rigid-border-sm border-[2px] bg-concrete-50 cursor-grab active:cursor-grabbing flex items-start gap-3 group hover:border-black transition-all"
                        [class.border-blue-500]="task.task_type === 'habit'"
                        [class.bg-blue-50]="task.task_type === 'habit'">
                      
                      <button (click)="toggleTaskCompletion(task)" class="mt-1 flex-shrink-0">
                        <span class="material-symbols-outlined text-2xl" 
                              [class.text-green-600]="task.completed"
                              [class.text-concrete-300]="!task.completed">
                          {{ task.completed ? 'check_box' : 'check_box_outline_blank' }}
                        </span>
                      </button>
                      
                      <div class="flex-1 flex flex-col min-w-0">
                        @if(task.habit_id) {
                          <span class="text-[10px] font-black text-blue-600 uppercase mb-1 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">label</span>
                            {{ getHabitName(task.habit_id) }}
                          </span>
                        }
                        <span class="font-mono text-sm uppercase font-bold break-words" 
                              [class.line-through]="task.completed" 
                              [class.text-concrete-400]="task.completed">
                          {{ task.text }}
                        </span>
                      </div>
                      
                      <button (click)="deleteTask(task.id)" class="opacity-0 group-hover:opacity-100 text-red-500 flex-shrink-0 transition-opacity">
                        <span class="material-symbols-outlined">close</span>
                      </button>

                      <!-- Drag Handle Placeholder -->
                      <div *cdkDragPlaceholder class="cdk-drag-placeholder rounded"></div>
                   </div>
                }
                @if(day.tasks.length === 0) {
                  <div class="h-full flex flex-col items-center justify-center text-concrete-300 border-2 border-dashed border-concrete-300 rounded-lg p-8">
                    <span class="material-symbols-outlined text-4xl mb-2">assignment_add</span>
                    <span class="font-mono text-xs uppercase text-center">No tasks planned for today</span>
                  </div>
                }
              </div>

              <!-- Input Section with Habit Tagging -->
              <div class="mt-auto flex flex-col gap-3 pt-4 border-t-4 border-black">
                <div class="flex items-center gap-2 px-2 py-1 bg-concrete-100 rigid-border-sm border-[2px]">
                  <span class="material-symbols-outlined text-sm text-concrete-500 uppercase font-black">sell</span>
                  <select #habitSelect class="flex-1 bg-transparent border-none text-[10px] font-black uppercase outline-none text-concrete-700 cursor-pointer hover:text-black">
                    <option value="">No Habit Tag</option>
                    @for(habit of weeklyHabits(); track habit.id) {
                      <option [value]="habit.id">{{ habit.name }}</option>
                    }
                  </select>
                </div>
                <div class="flex gap-2">
                  <input #taskInput (keyup.enter)="addTaskManually(day, taskInput, habitSelect)" 
                         placeholder="What's the plan?..." 
                         class="flex-1 px-3 py-2 bg-white rigid-border-sm border-[2px] font-mono text-sm outline-none placeholder:text-concrete-400 focus:border-black">
                  <button (click)="addTaskManually(day, taskInput, habitSelect)" 
                          class="bg-black text-white px-4 py-2 rigid-border-sm border-[2px] hover:bg-gray-800 transition-colors">
                    <span class="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
      
       <!-- Weekly Review Section -->
        <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-lg mt-4">
          <h3 class="text-xl font-black text-black uppercase font-arvo border-b-4 border-black pb-3 mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined">rate_review</span>
            Weekly Review
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div class="flex flex-col gap-2">
               <label class="text-xs font-black uppercase text-concrete-500 ml-1">What was achieved?</label>
               <textarea [(ngModel)]="review().achieved" (ngModelChange)="updateReview()" placeholder="List achievements..." 
                         rows="4" class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-50 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             </div>
             <div class="flex flex-col gap-2">
               <label class="text-xs font-black uppercase text-concrete-500 ml-1">What was missed?</label>
               <textarea [(ngModel)]="review().missed" (ngModelChange)="updateReview()" placeholder="List misses..." 
                         rows="4" class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-50 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             </div>
             <div class="flex flex-col gap-2">
               <label class="text-xs font-black uppercase text-concrete-500 ml-1">Why things happened?</label>
               <textarea [(ngModel)]="review().why" (ngModelChange)="updateReview()" placeholder="Analyze root causes..." 
                         rows="4" class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-50 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             </div>
             <div class="flex flex-col gap-2">
               <label class="text-xs font-black uppercase text-concrete-500 ml-1">Carry forward plan?</label>
               <textarea [(ngModel)]="review().carry_forward" (ngModelChange)="updateReview()" placeholder="Define next steps..." 
                         rows="4" class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-50 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             </div>
          </div>
        </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 0px; border: 2px solid #f0f0f0; }
    .custom-scrollbar-sm::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar-sm::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar-sm::-webkit-scrollbar-thumb { background: #ccc; }
    .cdk-drag-placeholder {
      opacity: 0.3;
      background: #eab308;
      border: 4px dashed black;
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
  }


  getHabitName(habitId: string): string {
    return this.weeklyHabits().find(h => h.id === habitId)?.name || 'Habit Tag';
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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to make Monday the first day
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
