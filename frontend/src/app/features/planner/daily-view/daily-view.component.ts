import { Component, signal, inject, OnInit, NgZone, computed, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PlannerService, PlannerTask, PlannerGoal } from '../../../services/planner.service';

import { HabitService } from '../../../services/habit.service';
import { SystemService } from '../../../services/system.service';
import { SystemInstanceTask } from '../../../models/system.model';
import { ThemeService } from '../../../services/theme.service';
import { Router } from '@angular/router';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventClickArg, DatesSetArg, EventContentArg, Calendar } from '@fullcalendar/core';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';


@Component({
  selector: 'app-daily-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatTimepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    FullCalendarModule
],
  template: `
    <div class="h-full min-h-0 flex flex-col bg-slate-50 dark:bg-neutral-950 font-manrope text-slate-900 dark:text-zinc-100 overflow-x-hidden transition-colors duration-500">
      <!-- Header Section -->
      <div class="px-6 py-6 flex flex-col gap-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div class="flex flex-col gap-1">
            <h2 class="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight font-arvo">
              <span class="material-symbols-outlined text-4xl text-indigo-500 bg-indigo-500/10 p-2 rounded-2xl shadow-sm">view_day</span>
              Daily Flow
            </h2>
            <div class="flex items-center gap-2 ml-14">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <p class="text-[10px] text-slate-500 dark:text-zinc-400 font-black uppercase tracking-[0.2em]">System Optimization Active</p>
            </div>
          </div>
          
          <div class="flex gap-4 items-center w-full md:w-auto flex-wrap">
             <!-- Date Navigation -->
             <div class="flex items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-zinc-800 p-1.5 shadow-sm">
                <button (click)="changeDate(-1)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-400" title="Previous Day">
                  <span class="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                
                <div class="relative group">
                  <input [matDatepicker]="picker" 
                         [ngModel]="selectedDateDate()" 
                         (dateChange)="onDatePickerChange($any($event).value)"
                         class="bg-transparent border-none text-slate-900 dark:text-white font-mono font-bold text-sm px-4 cursor-pointer w-[150px] outline-none text-center h-9 hover:text-indigo-500 transition-colors">
                  <mat-datepicker-toggle [for]="picker" class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </div>

                <button (click)="changeDate(1)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-400" title="Next Day">
                  <span class="material-symbols-outlined text-xl">chevron_right</span>
                </button>

                <div class="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-2"></div>

                <button (click)="goToToday()" 
                        class="px-5 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-indigo-600 hover:text-white dark:text-zinc-300 transition-all active:scale-95"
                        title="Go to Today">
                  Today
                </button>
             </div>

             <!-- Timeline Zoom -->
             <div class="flex items-center gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-zinc-800 px-5 py-2.5 shadow-sm" title="Timeline Density Control">
                 <span class="material-symbols-outlined text-slate-400 text-lg">unfold_more</span>
                 <input type="range" [min]="40" [max]="200" [step]="15" 
                        [ngModel]="slotHeight()" (ngModelChange)="onSlotHeightChange($event)"
                        class="w-24 accent-indigo-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer">
             </div>

             <!-- System Health Stats -->
             <div class="hidden lg:flex items-center gap-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-zinc-800 px-5 py-2.5 shadow-sm text-[11px] font-black font-mono uppercase tracking-wider">
               <div class="flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                 <span class="text-slate-600 dark:text-zinc-400">Queue:</span>
                 <span class="text-slate-900 dark:text-white">{{ systemTasks().length }}</span>
               </div>
               <div class="flex items-center gap-2 border-l border-slate-200 dark:border-zinc-800 pl-5">
                 <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                 <span class="text-slate-600 dark:text-zinc-400">Synced:</span>
                 <span class="text-indigo-600 dark:text-indigo-400">{{ completedSystemTasksCount() }}</span>
               </div>
             </div>


            <div class="flex w-full sm:w-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-zinc-800 p-1.5 ml-0 sm:ml-2 shadow-sm overflow-x-auto no-scrollbar">
                <button (click)="changeView('timeGridDay')" 
                        [class.active]="currentView() === 'timeGridDay'" 
                        class="view-switcher-btn px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all whitespace-nowrap">Day</button>
                <button (click)="changeView('timeGridWeek')" 
                        [class.active]="currentView() === 'timeGridWeek'" 
                        class="view-switcher-btn px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all whitespace-nowrap">Week</button>
                <button (click)="changeView('dayGridMonth')" 
                        [class.active]="currentView() === 'dayGridMonth'" 
                        class="view-switcher-btn px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all whitespace-nowrap">Month</button>
                <button (click)="changeView('listDay')" 
                        [class.active]="currentView() === 'listDay'" 
                        class="view-switcher-btn px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all whitespace-nowrap">Manifest</button>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="md:col-span-3">
          </div>
          @if (hasOverlap()) {
            <div class="flex items-center gap-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 text-orange-800 dark:text-orange-200 px-5 py-4 rounded-3xl animate-pulse shadow-sm shadow-orange-500/10" role="alert">
              <span class="material-symbols-outlined text-orange-500 text-2xl">warning_amber</span>
              <div class="flex-1">
                <p class="font-black text-[10px] uppercase tracking-widest mb-0.5">Complexity Conflict</p>
                <p class="text-[11px] opacity-80 leading-relaxed font-medium">Overlapping system modules detected. Refactor timeline for optimal throughput.</p>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="flex-1 flex flex-col lg:flex-row overflow-hidden px-6 gap-8 pb-8 relative">
        <!-- Timeline Context -->
        <div class="flex-1 overflow-hidden bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200/60 dark:border-zinc-800 flex flex-col shadow-2xl shadow-slate-200/40 dark:shadow-none transition-all duration-500">
          <div class="flex justify-between items-center px-10 py-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl z-30">
               <div class="flex items-center gap-3">
                 <div class="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
                 <h3 class="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-[0.2em]">Temporal Architecture</h3>
               </div>
               <div class="hidden sm:flex items-center gap-4">
               </div>
          </div>
          
          <div class="flex-1 bg-white dark:bg-zinc-900 p-8 pt-4 overflow-auto custom-scrollbar">
            <full-calendar #calendar [options]="calendarOptions()"></full-calendar>
          </div>
        </div>



      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(148, 163, 184, 0.2); 
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
      background: rgba(148, 163, 184, 0.4); 
    }
    
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .mat-mdc-text-field-wrapper {border: none; padding: 0; background: transparent !important; }
    ::ng-deep .mat-mdc-form-field-infix { border: none; padding: 0 !important; min-height: unset !important; }

    /* FullCalendar Premium Overrides */
    ::ng-deep .fc {
      font-family: 'Manrope', sans-serif !important;
      --fc-border-color: rgba(226, 232, 240, 0.6);
      --fc-today-bg-color: rgba(99, 102, 241, 0.03);
      --fc-now-indicator-color: #6366f1;
    }

    :host-context(.dark) ::ng-deep .fc {
      --fc-border-color: rgba(39, 39, 42, 0.6);
      --fc-today-bg-color: rgba(99, 102, 241, 0.05);
    }

    ::ng-deep .fc .fc-scrollgrid {
      border: none !important;
    }

    ::ng-deep .fc-col-header-cell {
      padding: 16px 0 !important;
      background: transparent !important;
      border: none !important;
    }

    ::ng-deep .fc-col-header-cell-cushion {
      color: #64748b !important;
      text-transform: uppercase !important;
      font-weight: 900 !important;
      font-size: 11px !important;
      letter-spacing: 2px;
    }

    :host-context(.dark) ::ng-deep .fc-col-header-cell-cushion {
      color: #a1a1aa !important;
    }

    ::ng-deep .fc-timegrid-slot {
      border-bottom: 1px solid var(--fc-border-color) !important;
      transition: background 0.3s;
    }

    ::ng-deep .fc-timegrid-slot-label-cushion {
      font-weight: 700 !important;
      font-size: 11px !important;
      color: #94a3b8 !important;
      font-family: 'Space Mono', monospace !important;
    }

    /* Event Styling - Advanced Neomorphism/Glassmorphism */
    ::ng-deep .fc-v-event {
      background: rgba(255, 255, 255, 0.9) !important;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      border-radius: 20px !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5) !important;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      overflow: hidden;
    }

    :host-context(.dark) ::ng-deep .fc-v-event {
      background: rgba(24, 24, 27, 0.8) !important;
      border-color: rgba(39, 39, 42, 0.8) !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important;
    }

    ::ng-deep .fc-v-event:hover {
      transform: translateY(-4px) scale(1.02) !important;
      box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15) !important;
      z-index: 100 !important;
    }

    ::ng-deep .fc-event-main {
      padding: 0 !important;
    }

    ::ng-deep .fc-timegrid-now-indicator-line {
      border-color: #6366f1 !important;
      border-width: 3px 0 0 !important;
      z-index: 10;
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
    }

    ::ng-deep .fc-timegrid-now-indicator-arrow {
      border-color: #6366f1 !important;
      border-width: 6px 0 6px 10px !important;
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
    }

    .view-switcher-btn {
      color: #94a3b8;
    }

    .view-switcher-btn.active {
      background: white;
      color: #6366f1;
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.1);
    }

    :host-context(.dark) .view-switcher-btn.active {
      background: #27272a;
      color: #818cf8;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
  `]
})
export class DailyViewComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  private plannerService = inject(PlannerService);
  private ngZone = inject(NgZone);
  private habitService = inject(HabitService);
  private systemService = inject(SystemService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  
  tasks = signal<PlannerTask[]>([]);
  hasOverlap = signal(false);
  goals = signal<PlannerGoal[]>([]);
  systemTasks = signal<SystemInstanceTask[]>([]);
  categories: ('Study' | 'Work' | 'Health' | 'Personal')[] = ['Study', 'Work', 'Health', 'Personal'];

  /** Derived counts for the header stats */
  completedCount = computed(() => this.tasks().filter((t: PlannerTask) => t.status === 'completed').length);
  pendingCount = computed(() => this.tasks().filter((t: PlannerTask) => t.status === 'pending').length);
  completedSystemTasksCount = computed(() => this.systemTasks().filter((t: SystemInstanceTask) => t.completed).length);

  selectedDate = new Date().toISOString().split('T')[0];
  selectedDateDate = signal<Date>(new Date());
  selectedDateStr = computed(() => {
    const date = this.selectedDateDate();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  visibleStart = signal<string>('');
  visibleEnd = signal<string>('');
  slotHeight = signal(60);
  currentView = signal('timeGridDay');

  calendarEvents = computed<EventInput[]>(() => {
    // Only show system-related habits and system instance tasks
    
    // Show all habits that have time blocks
    const habits = this.habitService.habits();
    const timeBlockedHabits = habits.filter(h => h.timeBlockStart && h.timeBlockEnd);
    
    const habitEvents = timeBlockedHabits.map(h => ({
      id: `habit-${h.id}`,
      title: `${h.name}`,
      start: `${this.selectedDateStr()}T${h.timeBlockStart}`,
      end: `${this.selectedDateStr()}T${h.timeBlockEnd}`,
      backgroundColor: h.color || '#6366f1',
      borderColor: h.color || '#6366f1',
      textColor: 'white',
      extendedProps: {
        type: 'habit',
        habit: h
      }
    }));

    // System instance tasks (explicitly generated from systems)
    // Removed from temporal calendar view as they no longer have time blocks
    const sysEvents: EventInput[] = [];

    // We exclude generic taskEvents to keep the view focused on systems
    return [...habitEvents, ...sysEvents];
  });

  calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [timeGridPlugin, interactionPlugin, dayGridPlugin, listPlugin, multiMonthPlugin],
    initialView: this.currentView(),
    headerToolbar: false,
    initialDate: this.selectedDateStr(),
    slotMinTime: '05:00:00',
    slotMaxTime: '23:00:00',
    height: 'auto',
    allDaySlot: false,
    nowIndicator: true,
    editable: true,
    selectable: true,
    slotDuration: '00:15:00',
    slotLabelInterval: '01:00',
    slotEventOverlap: false,
    events: this.calendarEvents(),
    datesSet: (arg: DatesSetArg) => {
      const startStr = arg.startStr.split('T')[0];
      const endStr = arg.endStr.split('T')[0];
      this.visibleStart.set(startStr);
      this.visibleEnd.set(endStr);
      this.loadTasks();
      this.loadSystemTasks();
    },
    eventContent: (arg: EventContentArg) => {
      if (arg.event.display === 'background') return null;

      // System instance task card
      if (arg.event.extendedProps['type'] === 'system_task') {
        const t = arg.event.extendedProps['systemTask'] as SystemInstanceTask;
        const color = t.color || '#6366f1';
        return {
          html: `
            <div class="h-full flex flex-col justify-between p-3 overflow-hidden border-left-4 transition-all" style="border-left: 3px solid ${color}">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5 overflow-hidden">
                   <span class="w-1.5 h-1.5 rounded-full" style="background:${color}"></span>
                   <span class="text-[9px] font-black uppercase tracking-wider truncate opacity-60" style="color:${color}">
                      Protocol: ${t.habitName || t.systemTitle || 'SYSTEM'}
                   </span>
                </div>
                <h4 class="text-[11px] font-black uppercase tracking-tight truncate leading-tight ${t.completed ? 'line-through opacity-40' : ''}">${t.title}</h4>
                ${t.weekFocus ? `<div class="text-[8px] font-bold opacity-40 uppercase tracking-widest mt-0.5">${t.weekFocus}</div>` : ''}
              </div>
              <div class="flex items-center justify-between mt-1">
                ${t.completed ? '<span class="material-symbols-outlined text-emerald-500 text-xs">verified</span>' : ''}
              </div>
            </div>
          `
        };
      }

      // Habit card
      if (arg.event.extendedProps['type'] === 'habit') {
        const habit = arg.event.extendedProps['habit'];
        const color = habit.color || '#6366f1';
        return {
          html: `
            <div class="h-full flex flex-col justify-between p-3 overflow-hidden border-left-4 transition-all" style="border-left: 3px solid ${color}">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5 overflow-hidden">
                   <span class="material-symbols-outlined text-[10px] text-indigo-500">bolt</span>
                   <span class="text-[9px] font-black uppercase tracking-wider truncate opacity-60" style="color:${color}">
                      System Habit
                   </span>
                </div>
                <h4 class="text-[11px] font-black uppercase tracking-tight truncate leading-tight">${habit.name}</h4>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[8px] font-mono font-bold opacity-40">${habit.timeBlockStart} - ${habit.timeBlockEnd}</span>
                <span class="w-2 h-2 rounded-full" style="background:${color}; box-shadow: 0 0 6px ${color}"></span>
              </div>
            </div>
          `
        };
      }
      
      return null;
    },
    eventClick: (arg: EventClickArg) => {
      if (arg.event.extendedProps['type'] === 'system_task') {
        const t = arg.event.extendedProps['systemTask'] as SystemInstanceTask;
        this.toggleSystemTask(t);
      } else if (arg.event.extendedProps['type'] === 'habit') {
        const habit = arg.event.extendedProps['habit'];
        this.goToHabitNotes({ ...habit, id: habit.id, date: this.selectedDateStr() } as any);
      }
    },
    eventDrop: (arg: any) => {
       // Only system tasks/habits are shown, and they are usually defined by systems/preferences.
       // Drag drop may not be desired or should update system settings?
       // For now, revert to prevent accidental desync.
       arg.revert();
    },
    eventResize: (arg: any) => {
       arg.revert();
    }
  }));

  changeView(viewType: string) {
    this.currentView.set(viewType);
    if (this.calendarComponent) {
      const api = this.calendarComponent.getApi();
      api.changeView(viewType);
    }
  }
  
  
  timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 5;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  ngOnInit() {
    this.loadTasks();
    this.loadGoals();
    this.loadSystemTasks();
  }

  ngOnDestroy() {
    // Clean up any lingering resize listeners
    this.cleanupResizeListeners();
    this.cleanupDragListeners();
  }

  loadTasks() {
    const start = this.visibleStart() || this.selectedDate;
    const end = this.visibleEnd() || this.selectedDate;
    this.plannerService.getTasksByRange(start, end).subscribe(tasks => {
      const withTime = tasks.filter(t => t.start_time && t.end_time);
      const habits = this.habitService.habits();
      const habitsMap = new Map(habits.map(h => [h.name.toLowerCase(), h]));

      // Temporary: Link tasks to habits by title if habitId is missing.
      const linkedTasks = withTime.map(task => {
        if (!task.habitId) {
          const matchingHabit = habitsMap.get(task.title.toLowerCase());
          if (matchingHabit) {
            return { ...task, habitId: matchingHabit.id };
          }
        }
        return task;
      });

      const today = new Date().toISOString().split('T')[0];
      const habitIdToCompletion = new Map(habits.map(h => [h.id, h.completedToday]));
      const habitIdToColor = new Map(habits.map(h => [h.id, h.color]));

      const syncedTasks = linkedTasks.map(task => {
        if (task.habitId) {
          const habitColor = habitIdToColor.get(task.habitId);
          const isToday = task.date === today;
          const isCompleted = isToday ? habitIdToCompletion.get(task.habitId) : false;
          return {
            ...task,
            status: (isToday && isCompleted) ? 'completed' : task.status,
            colorTag: habitColor || task.colorTag
          };
        }
        return task;
      });
      this.tasks.set(syncedTasks);
      this.checkOverlap(syncedTasks);
    });
  }

  loadGoals() {
    this.plannerService.getGoals({ period: 'weekly' }).subscribe(goals => {
      this.goals.set(goals);
    });
  }

  loadSystemTasks() {
    const start = this.visibleStart() || this.selectedDate;
    const end = this.visibleEnd() || this.selectedDate;
    this.systemService.getInstanceTasksByWeek(start, end).subscribe({
      next: (tasks) => this.systemTasks.set(tasks),
      error: (err) => console.error('Failed to load system tasks for date', err)
    });
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

  goToHabitNotes(task: PlannerTask) {
    if (!task.habitId) return;
    this.router.navigate(['/planner'], { 
      queryParams: { 
        view: 'monthly', 
        habitId: task.habitId,
        date: task.date
      } 
    });
  }






  // Timeline Helpers

  getGoalTitle(goalId: string): string {
    const goal = this.goals().find(g => g.id === goalId);
    return goal ? goal.title : 'Unknown Goal';
  }

  getTasksForHour(hour: string): PlannerTask[] {
    return this.tasks().filter(task => {
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
    const isDark = this.themeService.currentTheme() === 'dark';
    if (task.status === 'completed') return isDark ? '#86efac' : '#f0fdf4'; // green-300
    if (task.status === 'skipped') return isDark ? '#fca5a5' : '#fef2f2';   // red-300
    return isDark ? '#d4d4d4' : '#ffffff'; // neutral-300
  }

  // Date Navigation

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
    const dateStr = localDate.toISOString().split('T')[0];
    this.selectedDate = dateStr;
    
    if (this.calendarComponent) {
      this.calendarComponent.getApi().gotoDate(dateStr);
    }
    
    this.loadTasks();
    this.loadSystemTasks();
  }

  onSlotHeightChange(val: number | string) {
    const height = typeof val === 'string' ? parseInt(val, 10) : val;
    this.slotHeight.set(height);
  }



  // Resize Logic

  private handleEventDrop(arg: any) {
    const task = arg.event.extendedProps['task'] as PlannerTask;
    const newStart = arg.event.start;
    const newEnd = arg.event.end || new Date(newStart.getTime() + 60 * 60000);

    const updatedTask: Partial<PlannerTask> = {
      start_time: this.dateToTimeString(newStart),
      end_time: this.dateToTimeString(newEnd)
    };

    this.plannerService.updateTask(task.id!, updatedTask).subscribe({
      next: () => this.loadTasks(),
      error: () => arg.revert()
    });
  }

  private handleEventResize(arg: any) {
    const task = arg.event.extendedProps['task'] as PlannerTask;
    const newEnd = arg.event.end;
    const newStart = arg.event.start;

    const updatedTask: Partial<PlannerTask> = {
      start_time: this.dateToTimeString(newStart),
      end_time: this.dateToTimeString(newEnd)
    };

    this.plannerService.updateTask(task.id!, updatedTask).subscribe({
      next: () => this.loadTasks(),
      error: () => arg.revert()
    });
  }



  private cleanupResizeListeners() {}
  private cleanupDragListeners() {}

  // Overlap Detection

  private checkOverlap(tasks: PlannerTask[]) {
    let overlapFound = false;
    for (let i = 0; i < tasks.length && !overlapFound; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const t1 = tasks[i];
        const t2 = tasks[j];

        if (t1.date !== t2.date) continue;
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

  // Time Utilities

  private timeStringToDate(timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  private dateToTimeString(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  formatHour(hourStr: string): string {
    const hour = parseInt(hourStr.split(':')[0], 10);
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    if (hour === 0) return '12 AM';
    return `${hour} AM`;
  }

  formatTime12h(timeStr: string | undefined): string {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }
}







