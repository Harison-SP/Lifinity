import { Component, signal, inject, OnInit, NgZone, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PlannerService, PlannerTask, PlannerGoal } from '../../../services/planner.service';
import { DurationCountersComponent } from './duration-counters/duration-counters.component';
import { DailySummaryComponent } from './daily-summary/daily-summary.component';

@Component({
  selector: 'app-daily-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTimepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    DurationCountersComponent,
    DailySummaryComponent
  ],
  template: `
    <div class="h-full flex flex-col font-manrope">
      <!-- Header Section -->
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 class="text-2xl font-black text-black flex items-center gap-2 uppercase font-arvo">
            <span class="material-symbols-outlined text-3xl">view_day</span>
            Daily Planner
          </h2>
          
          <div class="flex gap-3 items-center w-full md:w-auto flex-wrap">
             <!-- Date Navigation -->
             <div class="flex items-center bg-white rigid-border-sm border-[2px] p-1 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
                <button (click)="changeDate(-1)" class="p-1 hover:bg-black hover:text-white transition-colors" title="Previous Day">
                  <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                
                <div class="relative">
                  <input [matDatepicker]="picker" 
                         [ngModel]="selectedDateDate()" 
                         (dateChange)="onDatePickerChange($event.value)"
                         class="bg-transparent border-none text-black font-mono font-bold text-sm px-2 cursor-pointer w-[120px] outline-none text-center h-full hover:underline decoration-2 underline-offset-4">
                  <mat-datepicker-toggle matIconSuffix [for]="picker" class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </div>

                <button (click)="changeDate(1)" class="p-1 hover:bg-black hover:text-white transition-colors" title="Next Day">
                  <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>

                <button (click)="goToToday()" 
                        class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors border-l-2 border-black ml-1"
                        title="Go to Today">
                  Today
                </button>
             </div>

             <!-- Timeline Zoom -->
             <div class="flex items-center gap-2 bg-white rigid-border-sm border-[2px] px-3 py-2" title="Zoom: Adjust timeline row height">
                 <span class="material-symbols-outlined text-black text-sm">zoom_in</span>
                 <input type="range" [min]="40" [max]="200" [step]="5" 
                        [ngModel]="slotHeight()" (ngModelChange)="onSlotHeightChange($event)"
                        class="w-24 accent-black h-1 bg-concrete-300 rounded-lg appearance-none cursor-pointer">
             </div>

             <!-- Task Summary Stats -->
             <div class="flex items-center gap-2 bg-white rigid-border-sm border-[2px] px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider">
               <span class="text-concrete-500">Tasks:</span>
               <span class="text-black">{{ tasks().length }}</span>
               <span class="text-concrete-300">|</span>
               <span class="text-green-600">{{ completedCount() }} done</span>
               <span class="text-concrete-300">|</span>
               <span class="text-orange-500">{{ pendingCount() }} pending</span>
             </div>

            <button (click)="showSummary.set(true)"
                    class="ml-auto md:ml-0 px-4 py-2 bg-white text-black rigid-border-sm border-[2px] font-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_0_black] flex items-center gap-2 uppercase tracking-wider text-xs active:translate-y-1 active:shadow-none">
              <span class="material-symbols-outlined text-lg">summarize</span>
              Summary
            </button>

            <button (click)="openNewTaskForm()" 
                    class="ml-auto md:ml-0 px-4 py-2 bg-electric-red text-white rigid-border-sm border-[2px] font-black hover:bg-black transition-all shadow-[2px_2px_0_0_black] flex items-center gap-2 uppercase tracking-wider text-xs active:translate-y-1 active:shadow-none">
              <span class="material-symbols-outlined text-lg">add</span>
              New Task
            </button>
          </div>
        </div>
        <app-duration-counters [tasks]="tasks()"></app-duration-counters>
        @if (hasOverlap()) {
          <div class="flex items-center gap-2 bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-3 rigid-border-sm border-[2px]" role="alert">
            <span class="material-symbols-outlined text-amber-500">warning</span>
            <div>
              <p class="font-black text-xs uppercase tracking-wider">Schedule Conflict</p>
              <p class="text-xs mt-0.5">Some tasks have overlapping time slots. Review your schedule below.</p>
            </div>
          </div>
        }
      </div>

      <div class="flex flex-1 overflow-hidden gap-6 pb-4 relative">
        <!-- Timeline -->
        <div class="flex-1 overflow-y-auto bg-concrete-100 rigid-border-sm border-[2px] p-0 custom-scrollbar relative">
          <div class="flex justify-between items-center px-6 py-4 border-b-2 border-black sticky top-0 bg-white z-30">
               <h3 class="text-xs font-black text-black uppercase tracking-[0.2em]">Timeline</h3>
               <span class="text-[9px] uppercase font-bold tracking-widest text-concrete-400 border border-concrete-300 px-2 py-1 bg-concrete-100">Double-click to add task</span>
          </div>
          
          <div class="space-y-0 relative mt-0">
            @for (hour of timeSlots; track hour) {
              <div class="flex gap-0 items-stretch group border-b border-concrete-300">
                <!-- Hour Label -->
                <div class="w-16 text-right text-xs text-concrete-400 font-mono font-bold pr-4 select-none relative pt-2 bg-white border-r-2 border-black">
                  <span>{{hour}}</span>
                </div>
                
                <!-- Time Slot -->
                <div class="timeline-slot flex-1 relative hover:bg-black/5 transition-colors cursor-pointer bg-white"
                     [style.min-height.px]="slotHeight()"
                     (dblclick)="onSlotDoubleClick(hour)">
                     
                  @for (task of getTasksForHour(hour); track task.id) {
                    <div class="task-card absolute left-2 right-2 p-3 rigid-border-sm border-[2px] shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] cursor-pointer z-10 overflow-hidden group/card hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] hover:-translate-y-[1px] transition-all"
                         [ngStyle]="getTaskStyle(task)"
                         [style.border-left-color]="task.colorTag"
                         [style.background-color]="getTaskBgColor(task)"
                         [class.border-l-[8px]]="true"
                         [class.opacity-50]="task.status === 'completed' || task.status === 'skipped'"
                         (click)="$event.stopPropagation(); editTask(task)">
                      
                      <!-- Resize Handle Top -->
                      <div class="resize-handle top absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20 hover:bg-black/10 transition-colors"
                           (mousedown)="startResize($event, task, 'top')"
                           (click)="$event.stopPropagation()"></div>

                      <!-- Resize Handle Bottom -->
                      <div class="resize-handle bottom absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 hover:bg-black/10 transition-colors"
                           (mousedown)="startResize($event, task, 'bottom')"
                           (click)="$event.stopPropagation()"></div>

                      <div class="flex justify-between items-start pointer-events-none relative z-10 h-full">
                        <div class="flex-1 min-w-0 pr-2">
                          <h4 class="font-black text-black text-xs uppercase tracking-wide truncate"
                              [class.line-through]="task.status === 'completed'">
                            {{task.title}}
                          </h4>
                          @if (task.category) {
                            <p class="text-[10px] text-concrete-500 mt-0.5 line-clamp-1 font-mono uppercase">
                              <span class="material-symbols-outlined text-[10px] align-middle">folder</span> {{task.category}}
                            </p>
                          }
                          @if (task.linkedGoalId) {
                            <p class="text-[10px] text-concrete-500 mt-0.5 line-clamp-1 font-mono uppercase">
                              <span class="material-symbols-outlined text-[10px] align-middle">flag</span> {{ getGoalTitle(task.linkedGoalId) }}
                            </p>
                          }
                          @if (task.description) {
                            <p class="text-[10px] text-concrete-400 mt-0.5 line-clamp-1 italic">{{task.description}}</p>
                          }
                          <div class="flex items-center gap-3 mt-1">
                             <span class="text-[9px] font-bold text-black flex items-center gap-1 font-mono bg-concrete-100 px-1 border border-black">
                               {{task.start_time}} – {{task.end_time}}
                             </span>
                             @if(task.reminder) {
                              <span class="material-symbols-outlined text-sm text-electric-red" title="Reminder set">notifications</span>
                             }
                             <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                                   [class.bg-red-100]="task.priority === 'high'"
                                   [class.text-red-700]="task.priority === 'high'"
                                   [class.bg-amber-100]="task.priority === 'medium'"
                                   [class.text-amber-700]="task.priority === 'medium'"
                                   [class.bg-green-100]="task.priority === 'low'"
                                   [class.text-green-700]="task.priority === 'low'">
                               {{task.priority}}
                             </span>
                          </div>
                        </div>
                        
                        <!-- Task Actions (visible on hover) -->
                        <div class="flex flex-col gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-auto">
                          <button (click)="$event.stopPropagation(); markCompleted(task)" 
                                  class="w-7 h-7 flex items-center justify-center border border-black transition-colors"
                                  [class.bg-green-500]="task.status === 'completed'"
                                  [class.text-white]="task.status === 'completed'"
                                  [class.hover:bg-green-500]="task.status !== 'completed'"
                                  [class.hover:text-white]="task.status !== 'completed'"
                                  [title]="task.status === 'completed' ? 'Mark as Pending' : 'Mark as Done'">
                            <span class="material-symbols-outlined text-sm">
                              {{ task.status === 'completed' ? 'undo' : 'check' }}
                            </span>
                          </button>
                          <button (click)="$event.stopPropagation(); markSkipped(task)" 
                                  class="w-7 h-7 flex items-center justify-center border border-black transition-colors"
                                  [class.bg-red-400]="task.status === 'skipped'"
                                  [class.text-white]="task.status === 'skipped'"
                                  [class.hover:bg-red-400]="task.status !== 'skipped'"
                                  [class.hover:text-white]="task.status !== 'skipped'"
                                  [title]="task.status === 'skipped' ? 'Mark as Pending' : 'Skip Task'">
                            <span class="material-symbols-outlined text-sm">
                              {{ task.status === 'skipped' ? 'undo' : 'close' }}
                            </span>
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

        <!-- Add/Edit Side Panel -->
        @if (showAddForm()) {
          <div class="w-96 bg-white rigid-border border-[4px] p-6 flex flex-col brutalist-shadow-active relative h-full">
            <div class="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 class="text-lg font-black text-black uppercase font-arvo">
                 {{ newTask.id ? 'Edit Task' : 'New Task' }}
              </h3>
              <button (click)="closeForm()" class="w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              <!-- Title -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Task Name *</label>
                <input [(ngModel)]="newTask.title" (ngModelChange)="onFormChange()" placeholder="What do you need to do?" required
                       class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all placeholder:text-concrete-300">
              </div>

              <!-- Description -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Description</label>
                <textarea [(ngModel)]="newTask.description" (ngModelChange)="onFormChange()" placeholder="Add details or notes..." rows="3"
                          class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all resize-none placeholder:text-concrete-300"></textarea>
              </div>

              <!-- Category -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Category</label>
                <select [(ngModel)]="newTask.category" (ngModelChange)="onFormChange()" class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all">
                  @for (c of categories; track c) {
                    <option [value]="c">{{c}}</option>
                  }
                </select>
              </div>

              <!-- Linked Goal -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Linked Goal</label>
                <select [(ngModel)]="newTask.linkedGoalId" (ngModelChange)="onFormChange()" class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all">
                  <option [value]="undefined">None</option>
                  @for (g of goals(); track g.id) {
                    <option [value]="g.id">{{g.title}}</option>
                  }
                </select>
              </div>

              <!-- Color Tag and Reminder -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Color Tag</label>
                  <input type="color" [(ngModel)]="newTask.colorTag" (ngModelChange)="onFormChange()" class="w-full h-12 bg-white rigid-border-sm border-[2px] outline-none">
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Reminder</label>
                  <label class="flex items-center gap-2 h-12 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="newTask.reminder" (ngModelChange)="onFormChange()" class="w-5 h-5 accent-black">
                    <span class="text-xs font-mono text-concrete-500">{{ newTask.reminder ? 'On' : 'Off' }}</span>
                  </label>
                </div>
              </div>

              <!-- Time Selection -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Start Time</label>
                  <div class="relative">
                      <input [matTimepicker]="picker1" [ngModel]="startTimeDate()" (ngModelChange)="updateStartTime($event)"
                             class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all cursor-pointer">
                      <mat-timepicker #picker1 />
                      <mat-timepicker-toggle [for]="picker1" matSuffix class="absolute right-2 top-1/2 -translate-y-1/2 text-black"/>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">End Time</label>
                  <div class="relative">
                      <input [matTimepicker]="picker2" [ngModel]="endTimeDate()" (ngModelChange)="updateEndTime($event)"
                             class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all cursor-pointer">
                      <mat-timepicker #picker2 />
                      <mat-timepicker-toggle [for]="picker2" matSuffix class="absolute right-2 top-1/2 -translate-y-1/2 text-black"/>
                  </div>
                </div>
              </div>

              <!-- Priority -->
              <div>
                <label class="block text-[10px] font-black tracking-widest text-concrete-900 uppercase mb-3">Priority</label>
                <div class="flex gap-2">
                  @for (p of priorities; track p) {
                    <button (click)="setPriority(p)"
                            class="flex-1 py-3 rigid-border-sm border-[2px] font-black uppercase text-xs transition-all"
                            [class.bg-white]="newTask.priority !== p"
                            [class.border-black]="newTask.priority !== p"
                            [class.text-concrete-400]="newTask.priority !== p"
                            
                            [class.bg-black]="newTask.priority === p && p === 'high'"
                            [class.text-white]="newTask.priority === p && p === 'high'"
                            
                            [class.bg-concrete-400]="newTask.priority === p && p === 'medium'"
                            [class.text-white]="newTask.priority === p && p === 'medium'"
                            
                            [class.bg-concrete-200]="newTask.priority === p && p === 'low'"
                            [class.text-black]="newTask.priority === p && p === 'low'">
                      {{p}}
                    </button>
                  }
                </div>
              </div>

               <div class="pt-4 flex gap-3 border-t-4 border-black mt-auto">
                  @if (newTask.id) {
                    <button (click)="deleteTask(newTask.id!)" class="mr-auto text-electric-red hover:text-black font-black text-xs uppercase tracking-widest flex items-center gap-1 border-2 border-transparent hover:border-black px-2">
                      <span class="material-symbols-outlined text-sm">delete</span>
                      Delete
                    </button>
                  }
                  <button (click)="saveTask()" 
                          [disabled]="!newTask.title?.trim()"
                          class="flex-1 py-4 bg-electric-red text-white rigid-border-sm border-[2px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_black] hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0_0_black] disabled:hover:translate-x-0 disabled:hover:translate-y-0">
                    {{ newTask.id ? 'Save Changes' : 'Add Task' }}
                  </button>
                </div>
            </div>
          </div>
        }

        <!-- Daily Summary Side Panel -->
        @if (showSummary()) {
          <div class="w-96 bg-white rigid-border border-[4px] p-6 flex flex-col brutalist-shadow-active relative h-full">
            <div class="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 class="text-lg font-black text-black uppercase font-arvo">
                 Daily Summary
              </h3>
              <button (click)="showSummary.set(false)" class="w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <app-daily-summary [tasks]="tasks()" [date]="selectedDate"></app-daily-summary>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #e5e5e5; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: black; }
    
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .mat-mdc-text-field-wrapper { padding: 0; }
    ::ng-deep .mat-mdc-form-field-infix { border: none; padding: 0 !important; min-height: unset !important; }
  `]
})
export class DailyViewComponent implements OnInit, OnDestroy {
  private plannerService = inject(PlannerService);
  private ngZone = inject(NgZone);
  
  tasks = signal<PlannerTask[]>([]);
  showAddForm = signal(false);
  showSummary = signal(false);
  hasOverlap = signal(false);
  goals = signal<PlannerGoal[]>([]);
  categories: ('Study' | 'Work' | 'Health' | 'Personal')[] = ['Study', 'Work', 'Health', 'Personal'];

  /** Tasks to render on the timeline (includes live preview of form edits) */
  displayTasks = computed(() => {
    const all = this.tasks();
    const current = this.newTask;
    const isFormOpen = this.showAddForm();

    let tasksToDisplay = all;
    if (isFormOpen) {
      if (current.id) {
        tasksToDisplay = all.map(t => t.id === current.id ? { ...t, ...current } as PlannerTask : t);
      } else if (current.title && current.start_time) {
        tasksToDisplay = [...all, { ...current, id: 'preview-' + Date.now() } as PlannerTask];
      }
    }
    return tasksToDisplay;
  });

  /** Derived counts for the header stats */
  completedCount = computed(() => this.tasks().filter(t => t.status === 'completed').length);
  pendingCount = computed(() => this.tasks().filter(t => t.status === 'pending').length);

  selectedDate = new Date().toISOString().split('T')[0];
  selectedDateDate = signal<Date>(new Date());
  slotHeight = signal(64);
  
  private resizingTask: { 
    id: string; 
    startY: number; 
    originalStartStr: string;
    originalEndStr: string;
    direction: 'top' | 'bottom';
  } | null = null;
  private resizeMoveListener: ((e: MouseEvent) => void) | null = null;
  private resizeEndListener: (() => void) | null = null;
  
  priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

  timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 5;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
  
  newTask: Partial<PlannerTask> = this.getDefaultTask();

  startTimeDate = signal<Date>(new Date());
  endTimeDate = signal<Date>(new Date());

  ngOnInit() {
    this.loadTasks();
    this.loadGoals();
  }

  ngOnDestroy() {
    // Clean up any lingering resize listeners
    this.cleanupResizeListeners();
  }

  loadTasks() {
    this.plannerService.getTasks(this.selectedDate).subscribe(tasks => {
      const withTime = tasks.filter(t => t.start_time && t.end_time);
      this.tasks.set(withTime);
      this.checkOverlap(withTime);
    });
  }

  loadGoals() {
    this.plannerService.getGoals({ period: 'weekly' }).subscribe(goals => {
      this.goals.set(goals);
    });
  }

  // ─── Task CRUD ───────────────────────────────────────────

  saveTask() {
    if (!this.newTask.title?.trim()) return;
    this.newTask.date = this.selectedDate;
    
    const obs$ = this.newTask.id 
      ? this.plannerService.updateTask(this.newTask.id, this.newTask)
      : this.plannerService.createTask(this.newTask as PlannerTask);

    obs$.subscribe(() => {
      this.loadTasks();
      this.closeForm();
    });
  }

  deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.plannerService.deleteTask(id).subscribe(() => {
        this.loadTasks();
        if (this.newTask.id === id) this.closeForm();
      });
    }
  }

  /** Mark task as completed, or toggle back to pending */
  markCompleted(task: PlannerTask) {
    const newStatus: PlannerTask['status'] = task.status === 'completed' ? 'pending' : 'completed';
    this.plannerService.updateTask(task.id!, { status: newStatus }).subscribe(() => {
      this.loadTasks();
    });
  }

  /** Mark task as skipped, or toggle back to pending */
  markSkipped(task: PlannerTask) {
    const newStatus: PlannerTask['status'] = task.status === 'skipped' ? 'pending' : 'skipped';
    this.plannerService.updateTask(task.id!, { status: newStatus }).subscribe(() => {
      this.loadTasks();
    });
  }

  // ─── Form Management ────────────────────────────────────

  openNewTaskForm() {
    this.newTask = this.getDefaultTask();
    this.syncDatesFromTask();
    this.showSummary.set(false);
    this.showAddForm.set(true);
  }

  editTask(task: PlannerTask | Partial<PlannerTask>) {
    this.newTask = { ...task };
    this.syncDatesFromTask();
    this.showSummary.set(false);
    this.showAddForm.set(true);
  }

  closeForm() {
    this.showAddForm.set(false);
  }

  setPriority(p: 'low' | 'medium' | 'high') {
    this.newTask.priority = p;
    this.onFormChange();
  }

  onFormChange() {
    // Trigger reactivity for displayTasks computed by reassigning tasks signal
    this.tasks.update(t => [...t]);
  }
  
  getDefaultTask(): Partial<PlannerTask> {
    return {
      title: '',
      description: '',
      date: this.selectedDate,
      start_time: '09:00',
      end_time: '10:00',
      status: 'pending',
      priority: 'medium',
      category: 'Work',
      linkedGoalId: undefined,
      colorTag: '#FFFFFF',
      reminder: false,
    };
  }

  syncDatesFromTask() {
    this.startTimeDate.set(this.timeStringToDate(this.newTask.start_time || '09:00'));
    this.endTimeDate.set(this.timeStringToDate(this.newTask.end_time || '10:00'));
  }

  updateStartTime(date: Date) {
    if (!date) return;
    this.startTimeDate.set(date);
    this.newTask.start_time = this.dateToTimeString(date);
  }

  updateEndTime(date: Date) {
    if (!date) return;
    this.endTimeDate.set(date);
    this.newTask.end_time = this.dateToTimeString(date);
  }

  // ─── Timeline Helpers ───────────────────────────────────

  getGoalTitle(goalId: string): string {
    const goal = this.goals().find(g => g.id === goalId);
    return goal ? goal.title : 'Unknown Goal';
  }

  getTasksForHour(hour: string): PlannerTask[] {
    return this.displayTasks().filter(task => {
      if (!task.start_time) return false;
      const taskHour = task.start_time.split(':')[0].padStart(2, '0');
      const slotHour = hour.split(':')[0];
      return taskHour === slotHour;
    });
  }

  getTaskStyle(task: PlannerTask) {
    if (!task.start_time || !task.end_time) return {};
    
    const start = this.timeStringToDate(task.start_time);
    const end = this.timeStringToDate(task.end_time);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const startMinutes = start.getMinutes();
    
    const heightPerMinute = this.slotHeight() / 60;
    const height = durationMinutes * heightPerMinute;
    const top = startMinutes * heightPerMinute;
    
    return {
      top: `${top}px`,
      height: `${height}px`
    };
  }

  /** Give completed/skipped tasks a subtle background tint */
  getTaskBgColor(task: PlannerTask): string {
    if (task.status === 'completed') return '#f0fdf4'; // light green
    if (task.status === 'skipped') return '#fef2f2';   // light red
    return '#ffffff';
  }

  // ─── Date Navigation ────────────────────────────────────

  changeDate(days: number) {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + days);
    this.setSelectedDate(date);
  }

  goToToday() {
    this.setSelectedDate(new Date());
  }

  onDatePickerChange(date: Date | null) {
    if (!date) return;
    this.setSelectedDate(date);
  }

  /** Central method to update the selected date and reload tasks */
  private setSelectedDate(date: Date) {
    this.selectedDateDate.set(date);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    this.selectedDate = localDate.toISOString().split('T')[0];
    this.loadTasks();
  }

  onSlotHeightChange(val: number | string) {
    const height = typeof val === 'string' ? parseInt(val, 10) : val;
    this.slotHeight.set(height);
  }

  onSlotDoubleClick(hour: string) {
    this.newTask = this.getDefaultTask();
    this.newTask.start_time = hour;
    
    const [h, m] = hour.split(':').map(Number);
    const endH = (h + 1) % 24;
    this.newTask.end_time = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    
    this.syncDatesFromTask();
    this.showSummary.set(false);
    this.showAddForm.set(true);
  }

  // ─── Resize Logic ───────────────────────────────────────

  startResize(event: MouseEvent, task: PlannerTask, direction: 'top' | 'bottom') {
    event.preventDefault();
    event.stopPropagation();
    
    this.resizingTask = {
      id: task.id!,
      startY: event.clientY,
      originalStartStr: task.start_time!,
      originalEndStr: task.end_time!,
      direction
    };

    this.resizeMoveListener = this.onResizeMove.bind(this);
    this.resizeEndListener = this.onResizeEnd.bind(this);
    
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.resizeMoveListener!);
      window.addEventListener('mouseup', this.resizeEndListener!);
    });
  }

  private onResizeMove(event: MouseEvent) {
    if (!this.resizingTask) return;
    
    const deltaY = event.clientY - this.resizingTask.startY;
    const pixelsPerMinute = this.slotHeight() / 60;
    const deltaMinutes = Math.round(deltaY / pixelsPerMinute);
    
    const originalStart = this.timeStringToDate(this.resizingTask.originalStartStr);
    const originalEnd = this.timeStringToDate(this.resizingTask.originalEndStr);
    
    this.ngZone.run(() => {
      const allTasks = this.tasks();
      const taskIdx = allTasks.findIndex(t => t.id === this.resizingTask!.id);
      if (taskIdx !== -1) {
        const task = allTasks[taskIdx];
        let newStart = new Date(originalStart);
        let newEnd = new Date(originalEnd);
        
        if (this.resizingTask!.direction === 'bottom') {
          newEnd = new Date(originalEnd.getTime() + deltaMinutes * 60000);
          // Minimum 15 minutes duration
          if (newEnd.getTime() - newStart.getTime() < 15 * 60000) {
            newEnd = new Date(newStart.getTime() + 15 * 60000);
          }
        } else {
          newStart = new Date(originalStart.getTime() + deltaMinutes * 60000);
          // Minimum 15 minutes duration
          if (originalEnd.getTime() - newStart.getTime() < 15 * 60000) {
            newStart = new Date(originalEnd.getTime() - 15 * 60000);
          }
        }
        
        const newStartStr = this.dateToTimeString(newStart);
        const newEndStr = this.dateToTimeString(newEnd);
        
        if (task.start_time !== newStartStr || task.end_time !== newEndStr) {
          const updatedTask = { ...task, start_time: newStartStr, end_time: newEndStr };
          const newTasks = [...allTasks];
          newTasks[taskIdx] = updatedTask;
          this.tasks.set(newTasks);

          // Keep side-panel form in sync if this task is being edited
          if (this.newTask?.id === updatedTask.id) {
            this.newTask.start_time = updatedTask.start_time;
            this.newTask.end_time = updatedTask.end_time;
            this.syncDatesFromTask();
          }
        }
      }
    });
  }

  private onResizeEnd() {
    if (this.resizingTask) {
      const task = this.tasks().find(t => t.id === this.resizingTask!.id);
      if (task) {
        this.plannerService.updateTask(task.id!, { 
          start_time: task.start_time,
          end_time: task.end_time 
        }).subscribe(() => this.loadTasks());
      }
      this.cleanupResizeListeners();
      this.resizingTask = null;
    }
  }

  private cleanupResizeListeners() {
    if (this.resizeMoveListener) {
      window.removeEventListener('mousemove', this.resizeMoveListener);
      this.resizeMoveListener = null;
    }
    if (this.resizeEndListener) {
      window.removeEventListener('mouseup', this.resizeEndListener);
      this.resizeEndListener = null;
    }
  }

  // ─── Overlap Detection ──────────────────────────────────

  private checkOverlap(tasks: PlannerTask[]) {
    let overlapFound = false;
    for (let i = 0; i < tasks.length && !overlapFound; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const t1 = tasks[i];
        const t2 = tasks[j];

        if (!t1.start_time || !t1.end_time || !t2.start_time || !t2.end_time) continue;

        const start1 = this.timeStringToDate(t1.start_time).getTime();
        const end1 = this.timeStringToDate(t1.end_time).getTime();
        const start2 = this.timeStringToDate(t2.start_time).getTime();
        const end2 = this.timeStringToDate(t2.end_time).getTime();

        if (Math.max(start1, start2) < Math.min(end1, end2)) {
          overlapFound = true;
          break;
        }
      }
    }
    this.hasOverlap.set(overlapFound);
  }

  // ─── Time Utilities ─────────────────────────────────────

  private timeStringToDate(timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  private dateToTimeString(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}
