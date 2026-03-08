import { Component, signal, inject, OnInit, NgZone, computed, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PlannerService, PlannerTask, PlannerGoal } from '../../../services/planner.service';
import { DurationCountersComponent } from './duration-counters/duration-counters.component';
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
  imports: [
    CommonModule,
    FormsModule,
    MatTimepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    DurationCountersComponent,
    FullCalendarModule
  ],
  template: `
    <div class="h-full flex flex-col font-manrope text-black dark:text-white">
      <!-- Header Section -->
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 class="text-2xl font-black text-black dark:text-white flex items-center gap-2 uppercase font-arvo">
            <span class="material-symbols-outlined text-3xl">view_day</span>
            Daily Planner
          </h2>
          
          <div class="flex gap-3 items-center w-full md:w-auto flex-wrap">
             <!-- Date Navigation -->
             <div class="flex items-center bg-white dark:bg-concrete-800 rigid-border-sm border-[2px] dark:border-concrete-500 p-1 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0_0_white]">
                <button (click)="changeDate(-1)" class="p-1 hover:bg-black hover:text-white transition-colors" title="Previous Day">
                  <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                
                <div class="relative">
                  <input [matDatepicker]="picker" 
                         [ngModel]="selectedDateDate()" 
                         (dateChange)="onDatePickerChange($event.value)"
                         class="bg-transparent border-none text-black dark:text-white font-mono font-bold text-sm px-2 cursor-pointer w-[120px] outline-none text-center h-full hover:underline decoration-2 underline-offset-4">
                  <mat-datepicker-toggle matIconSuffix [for]="picker" class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </div>

                <button (click)="changeDate(1)" class="p-1 hover:bg-black hover:text-white transition-colors" title="Next Day">
                  <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>

                <button (click)="goToToday()" 
                        class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-l-2 border-black dark:border-concrete-500 ml-1"
                        title="Go to Today">
                  Today
                </button>
             </div>

             <!-- Timeline Zoom -->
             <div class="flex items-center gap-2 bg-white dark:bg-concrete-800 rigid-border-sm border-[2px] dark:border-concrete-500 px-3 py-2" title="Zoom: Adjust timeline row height">
                 <span class="material-symbols-outlined text-black dark:text-white text-sm">zoom_in</span>
                 <input type="range" [min]="40" [max]="200" [step]="15" 
                        [ngModel]="slotHeight()" (ngModelChange)="onSlotHeightChange($event)"
                        class="w-24 accent-black dark:accent-white h-1 bg-concrete-300 rounded-lg appearance-none cursor-pointer">
             </div>

             <!-- Task Summary Stats -->
             <div class="flex items-center gap-2 bg-white dark:bg-concrete-800 rigid-border-sm border-[2px] dark:border-concrete-500 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider">
               <span class="text-concrete-500">Tasks:</span>
               <span class="text-black dark:text-white">{{ tasks().length }}</span>
               <span class="text-concrete-300">|</span>
               <span class="text-green-600">{{ completedCount() }} done</span>
               <span class="text-concrete-300">|</span>
               <span class="text-orange-500">{{ pendingCount() }} pending</span>
             </div>

            <button (click)="openNewTaskForm()" 
                    class="ml-auto md:ml-0 px-4 py-2 bg-electric-red text-white rigid-border-sm border-[2px] font-black hover:bg-black transition-all shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] flex items-center gap-2 uppercase tracking-wider text-xs active:translate-y-1 active:shadow-none">
              <span class="material-symbols-outlined text-lg">add</span>
              New Task
            </button>
            <div class="flex bg-white dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 p-1 ml-2 overflow-x-auto max-w-[400px] no-scrollbar shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white]">
                <button (click)="changeView('timeGridDay')" 
                        [class.active]="currentView() === 'timeGridDay'" 
                        class="view-switcher-btn px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black whitespace-nowrap">Day</button>
                <button (click)="changeView('timeGridWeek')" 
                        [class.active]="currentView() === 'timeGridWeek'" 
                        class="view-switcher-btn px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-l whitespace-nowrap">Week</button>
                <button (click)="changeView('dayGridMonth')" 
                        [class.active]="currentView() === 'dayGridMonth'" 
                        class="view-switcher-btn px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-l whitespace-nowrap">Month</button>
                <button (click)="changeView('listDay')" 
                        [class.active]="currentView() === 'listDay'" 
                        class="view-switcher-btn px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-l whitespace-nowrap">List</button>
                <button (click)="changeView('listMonth')" 
                        [class.active]="currentView() === 'listMonth'" 
                        class="view-switcher-btn px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-l whitespace-nowrap">Full_Log</button>
                <button (click)="changeView('listYear')" 
                        [class.active]="currentView() === 'listYear'" 
                        class="view-switcher-btn px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-l whitespace-nowrap">Year_List</button>
                <button (click)="changeView('multiMonthYear')" 
                        [class.bg-black]="currentView() === 'multiMonthYear'" 
                        [class.text-white]="currentView() === 'multiMonthYear'"
                        class="px-2 py-1 text-[9px] font-black uppercase tracking-tighter hover:bg-black hover:text-white transition-colors border-l border-black dark:border-concrete-500 whitespace-nowrap">Year_Grid</button>
            </div>
          </div>
        </div>
        <app-duration-counters [tasks]="tasks()"></app-duration-counters>
        @if (hasOverlap()) {
          <div class="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-3 rigid-border-sm border-[2px] dark:border-amber-500/50" role="alert">
            <span class="material-symbols-outlined text-amber-500">warning</span>
            <div>
              <p class="font-black text-xs uppercase tracking-wider">Schedule Conflict</p>
              <p class="text-xs mt-0.5">Some tasks have overlapping time slots. Review your schedule below.</p>
            </div>
          </div>
        }
      </div>

      <div class="flex flex-1 overflow-hidden gap-6 pb-4 relative">
        <!-- Timeline Context -->
        <div class="flex-1 overflow-y-auto bg-concrete-100 dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 custom-scrollbar relative flex flex-col">
          <div class="flex justify-between items-center px-6 py-4 border-b-2 border-black dark:border-concrete-500 bg-white dark:bg-concrete-800 z-30">
               <h3 class="text-xs font-black text-black dark:text-white uppercase tracking-[0.2em]">Timeline</h3>
               <span class="text-[9px] uppercase font-bold tracking-widest text-concrete-400 border border-concrete-300 dark:border-concrete-500 px-2 py-1 bg-concrete-100 dark:bg-concrete-700">Click to Select | Drag to Move | Resize to Adjust</span>
          </div>
          
          <div class="flex-1 bg-white dark:bg-concrete-900 p-2 overflow-auto">
            <full-calendar #calendar [options]="calendarOptions()"></full-calendar>
          </div>
        </div>

        <!-- Add/Edit Side Panel -->
        @if (showAddForm()) {
          <div class="w-96 bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-500 p-6 flex flex-col brutalist-shadow-active dark:shadow-[8px_8px_0_0_white] relative h-full">
            <div class="flex justify-between items-center mb-6 border-b-4 border-black dark:border-concrete-500 pb-4">
              <h3 class="text-lg font-black text-black dark:text-white uppercase font-arvo">
                 {{ newTask.id ? 'Edit Task' : 'New Task' }}
              </h3>
              <button (click)="closeForm()" class="w-8 h-8 flex items-center justify-center hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors border-2 border-transparent hover:border-black dark:hover:border-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              <!-- Title -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">Task Name *</label>
                <input [(ngModel)]="newTask.title" (ngModelChange)="onFormChange()" placeholder="What do you need to do?" required
                       class="w-full px-4 py-3 bg-white dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 focus:bg-concrete-100 dark:focus:bg-black text-black dark:text-white font-mono text-sm outline-none transition-all placeholder:text-concrete-300 dark:placeholder:text-concrete-500">
              </div>

              <!-- Description -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">Description</label>
                <textarea [(ngModel)]="newTask.description" (ngModelChange)="onFormChange()" placeholder="Add details or notes..." rows="3"
                          class="w-full px-4 py-3 bg-white dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 focus:bg-concrete-100 dark:focus:bg-black text-black dark:text-white font-mono text-sm outline-none transition-all resize-none placeholder:text-concrete-300 dark:placeholder:text-concrete-500"></textarea>
              </div>

              <!-- Category -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">Category</label>
                <select [(ngModel)]="newTask.category" (ngModelChange)="onFormChange()" class="w-full px-4 py-3 bg-white dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 focus:bg-concrete-100 dark:focus:bg-black text-black dark:text-white font-mono text-sm outline-none transition-all">
                  @for (c of categories; track c) {
                    <option [value]="c">{{c}}</option>
                  }
                </select>
              </div>

              <!-- Linked Goal -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">Linked Goal</label>
                <select [(ngModel)]="newTask.linkedGoalId" (ngModelChange)="onFormChange()" class="w-full px-4 py-3 bg-white dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 focus:bg-concrete-100 dark:focus:bg-black text-black dark:text-white font-mono text-sm outline-none transition-all">
                  <option [value]="undefined">None</option>
                  @for (g of goals(); track g.id) {
                    <option [value]="g.id">{{g.title}}</option>
                  }
                </select>
              </div>

              <!-- Color Tag and Reminder -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">Color Tag</label>
                  <input type="color" [(ngModel)]="newTask.colorTag" (ngModelChange)="onFormChange()" class="w-full h-12 bg-white dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 outline-none">
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">Reminder</label>
                  <label class="flex items-center gap-2 h-12 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="newTask.reminder" (ngModelChange)="onFormChange()" class="w-5 h-5 accent-black dark:accent-white">
                    <span class="text-xs font-mono text-concrete-500 dark:text-concrete-400">{{ newTask.reminder ? 'On' : 'Off' }}</span>
                  </label>
                </div>
              </div>

              <!-- Time Selection -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">Start Time</label>
                  <div class="relative">
                      <input [matTimepicker]="picker1" [ngModel]="startTimeDate()" (ngModelChange)="updateStartTime($event)"
                             class="w-full px-4 py-3 bg-white dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 focus:bg-concrete-100 dark:focus:bg-black text-black dark:text-white font-mono text-sm outline-none transition-all cursor-pointer">
                      <mat-timepicker #picker1 />
                      <mat-timepicker-toggle [for]="picker1" matSuffix class="absolute right-2 top-1/2 -translate-y-1/2 text-black dark:text-white"/>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">End Time</label>
                  <div class="relative">
                      <input [matTimepicker]="picker2" [ngModel]="endTimeDate()" (ngModelChange)="updateEndTime($event)"
                             class="w-full px-4 py-3 bg-white dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-500 focus:bg-concrete-100 dark:focus:bg-black text-black dark:text-white font-mono text-sm outline-none transition-all cursor-pointer">
                      <mat-timepicker #picker2 />
                      <mat-timepicker-toggle [for]="picker2" matSuffix class="absolute right-2 top-1/2 -translate-y-1/2 text-black dark:text-white"/>
                  </div>
                </div>
              </div>

              <!-- Priority -->
              <div>
                <label class="block text-[10px] font-black tracking-widest text-concrete-900 dark:text-white uppercase mb-3">Priority</label>
                <div class="flex gap-2">
                  @for (p of priorities; track p) {
                    <button (click)="setPriority(p)"
                            class="flex-1 py-3 rigid-border-sm border-[2px] font-black uppercase text-xs transition-all"
                            [class.bg-white]="newTask.priority !== p"
                            [class.dark:bg-concrete-700]="newTask.priority !== p"
                            [class.border-black]="newTask.priority !== p"
                            [class.dark:border-white]="newTask.priority !== p"
                            [class.text-concrete-400]="newTask.priority !== p"
                            [class.dark:text-concrete-300]="newTask.priority !== p"
                            
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

              <!-- Sub-tasks Section -->
              <div class="space-y-3 pt-4 border-t-2 border-black dark:border-concrete-500">
                <div class="flex justify-between items-center">
                  <label class="text-[10px] font-black text-concrete-900 dark:text-white uppercase tracking-widest">Sub_Tasks</label>
                  <button (click)="addSubTask()" class="text-[10px] font-black uppercase flex items-center gap-1 hover:text-electric-red">
                    <span class="material-symbols-outlined text-sm">add_circle</span>
                    Add
                  </button>
                </div>
                
                <div class="space-y-2">
                  @for (st of newTask.sub_tasks; track $index) {
                    <div class="flex items-center gap-2 group">
                      <input type="checkbox" [(ngModel)]="st.completed" (ngModelChange)="onFormChange()" 
                             class="w-4 h-4 accent-black dark:accent-white cursor-pointer">
                      <input [(ngModel)]="st.title" (ngModelChange)="onFormChange()"
                             class="flex-1 bg-transparent border-b border-concrete-300 dark:border-concrete-600 focus:border-black dark:focus:border-white text-xs font-bold outline-none py-1"
                             [class.line-through]="st.completed"
                             [class.opacity-50]="st.completed">
                      <button (click)="removeSubTask($index)" class="opacity-0 group-hover:opacity-100 p-1 text-concrete-400 hover:text-red-500 transition-all">
                        <span class="material-symbols-outlined text-xs">delete</span>
                      </button>
                    </div>
                  } @empty {
                    <p class="text-[10px] text-concrete-400 uppercase font-bold text-center py-2">No sub-tasks</p>
                  }
                </div>
              </div>

               <div class="pt-4 flex gap-3 border-t-4 border-black dark:border-white mt-auto">
                  @if (newTask.id) {
                    <button (click)="deleteTask(newTask.id!)" class="mr-auto text-electric-red hover:text-black font-black text-xs uppercase tracking-widest flex items-center gap-1 border-2 border-transparent hover:border-black dark:hover:border-white px-2">
                      <span class="material-symbols-outlined text-sm">delete</span>
                      Delete
                    </button>
                  }
                  <button (click)="saveTask()" 
                          [disabled]="!newTask.title?.trim()"
                          class="flex-1 py-4 bg-electric-red text-white rigid-border-sm border-[2px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] hover:shadow-[2px_2px_0_0_black] dark:hover:shadow-[2px_2px_0_0_white] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0_0_black] disabled:hover:translate-x-0 disabled:hover:translate-y-0">
                    {{ newTask.id ? 'Save Changes' : 'Add Task' }}
                  </button>
                </div>
            </div>
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

    /* FullCalendar Brutalist Overrides */
    ::ng-deep .fc {
      font-family: 'Space Mono', monospace !important;
      --fc-border-color: black;
    }

    :host-context(.dark) ::ng-deep .fc {
      --fc-border-color: white;
    }

    ::ng-deep .fc .fc-scrollgrid {
      border: 3px solid var(--fc-border-color) !important;
    }

    ::ng-deep .fc-col-header-cell {
      background-color: black !important;
      border: 2px solid black !important;
    }

    :host-context(.dark) ::ng-deep .fc-col-header-cell {
      background-color: white !important;
      border: 2px solid white !important;
    }

    ::ng-deep .fc-col-header-cell-cushion {
      color: white !important;
      text-transform: uppercase !important;
      font-weight: 900 !important;
      font-size: 0.7rem !important;
      letter-spacing: 1px;
    }

    :host-context(.dark) ::ng-deep .fc-col-header-cell-cushion {
      color: black !important;
    }

    ::ng-deep .fc-timegrid-slot {
      height: 60px !important;
      border-bottom: 2px solid var(--fc-border-color) !important;
    }

    ::ng-deep .fc-timegrid-slot-label-cushion {
      font-weight: 900 !important;
      font-size: 10px !important;
      text-transform: uppercase !important;
      color: var(--fc-border-color) !important;
    }

    ::ng-deep .fc-v-event {
      background-color: white !important;
      border: 3px solid black !important;
      border-radius: 0 !important;
      box-shadow: 6px 6px 0 0 rgba(0,0,0,1) !important;
    }

    :host-context(.dark) ::ng-deep .fc-v-event {
      background-color: #1a1a1a !important;
      border-color: white !important;
      box-shadow: 6px 6px 0 0 white !important;
    }

    ::ng-deep .fc-event-main {
      padding: 0 !important;
    }

    ::ng-deep .fc-now-indicator-line {
      border-color: #ff3e3e !important;
      border-width: 3px !important;
    }

    ::ng-deep .fc-now-indicator-arrow {
      border-color: #ff3e3e !important;
    }

    /* Toolbar Buttons Hack */
    .view-switcher-btn {
      transition: none !important;
      border: 2px solid black;
    }

    :host-context(.dark) .view-switcher-btn {
      border-color: white;
    }

    .view-switcher-btn.active {
      background: black;
      color: white;
      box-shadow: 2px 2px 0 0 black;
    }

    :host-context(.dark) .view-switcher-btn.active {
      background: white;
      color: black;
      box-shadow: 2px 2px 0 0 white;
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
  showAddForm = signal(false);
  hasOverlap = signal(false);
  goals = signal<PlannerGoal[]>([]);
  systemTasks = signal<SystemInstanceTask[]>([]);
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
  visibleStart = signal<string>('');
  visibleEnd = signal<string>('');
  slotHeight = signal(60);
  currentView = signal('timeGridDay');

  calendarEvents = computed<EventInput[]>(() => {
    const taskEvents = this.displayTasks().map(task => ({
      id: task.id,
      title: task.title,
      start: `${task.date}T${task.start_time}`,
      end: `${task.date}T${task.end_time}`,
      backgroundColor: this.getTaskBgColor(task),
      borderColor: task.colorTag || '#000000',
      textColor: 'black',
      extendedProps: {
        category: task.category,
        description: task.description,
        status: task.status,
        habitId: task.habitId,
        type: 'task',
        task: task
      }
    }));

    const habits = this.habitService.habits();
    const habitEvents = habits
      .filter(h => h.timeBlockStart && h.timeBlockEnd)
      .map(h => ({
        id: `habit-${h.id}`,
        title: `⚡ ${h.name}`,
        startTime: h.timeBlockStart,
        endTime: h.timeBlockEnd,
        display: 'background',
        backgroundColor: h.color || '#ff3e3e',
        extendedProps: {
          type: 'habit',
          habit: h
        }
      }));

    // System instance tasks (only those with a time block appear as events)
    const sysEvents = this.systemTasks()
      .filter(t => t.timeBlockStart && t.timeBlockEnd)
      .map(t => ({
        id: `sys-${t.instanceId}-${t.date}-${t.title}`,
        title: t.title,
        start: `${t.date}T${t.timeBlockStart}`,
        end: `${t.date}T${t.timeBlockEnd}`,
        backgroundColor: t.completed ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.1)',
        borderColor: t.color || '#7c3aed',
        textColor: t.color || '#7c3aed',
        extendedProps: {
          type: 'system_task',
          systemTask: t
        }
      }));

    return [...taskEvents, ...habitEvents, ...sysEvents];
  });

  calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [timeGridPlugin, interactionPlugin, dayGridPlugin, listPlugin, multiMonthPlugin],
    initialView: this.currentView(),
    headerToolbar: false,
    initialDate: this.selectedDate,
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
        const color = t.color || '#7c3aed';
        return {
          html: `
            <div class="h-full flex flex-col justify-between p-1 overflow-hidden" style="border-left: 3px solid ${color}">
              <div>
                <div class="text-[9px] font-black uppercase tracking-tight mb-0.5" style="color:${color}">
                  📖 ${t.habitName || t.systemTitle || ''}
                </div>
                ${t.weekFocus ? `<div class="text-[8px] opacity-60 uppercase mb-0.5">${t.weekFocus}</div>` : ''}
                <span class="text-[10px] font-black uppercase tracking-tight truncate ${t.completed ? 'line-through opacity-50' : ''}">${t.title}</span>
              </div>
              <div class="text-[8px] font-mono opacity-60">${t.timeBlockStart} – ${t.timeBlockEnd}${t.durationMinutes ? ' (' + t.durationMinutes + 'min)' : ''}</div>
            </div>
          `
        };
      }
      
      const task = arg.event.extendedProps['task'] as PlannerTask;
      const isCompleted = task.status === 'completed';
      const subTasks = task.sub_tasks || [];
      const completedSubTasks = subTasks.filter(st => st.completed).length;
      const progressHtml = subTasks.length > 0 
        ? `<div class="text-[7px] font-black bg-black text-white px-1 py-0.5 mt-1 inline-block uppercase">${completedSubTasks}/${subTasks.length} DONE</div>`
        : '';

      return {
        html: `
          <div class="h-full flex flex-col justify-between p-1 overflow-hidden">
            <div>
              <div class="flex items-center gap-1 mb-1">
                ${isCompleted ? '<span class="material-symbols-outlined text-xs text-green-600">check_circle</span>' : ''}
                <span class="text-[10px] font-black uppercase tracking-tight truncate ${isCompleted ? 'line-through opacity-50' : ''}">${arg.event.title}</span>
              </div>
              ${task.category ? `<span class="text-[8px] font-bold opacity-70 uppercase block truncate">${task.category}</span>` : ''}
              ${progressHtml}
            </div>
            <div class="text-[8px] font-mono opacity-60">${task.start_time} - ${task.end_time}</div>
          </div>
        `
      };
    },
    dateClick: (arg: DateClickArg) => {
      const clickedTime = arg.date.getHours();
      this.onSlotDoubleClick(`${clickedTime.toString().padStart(2, '0')}:00`);
    },
    eventClick: (arg: EventClickArg) => {
      if (arg.event.extendedProps['type'] === 'task') {
        const task = arg.event.extendedProps['task'];
        this.editTask(task);
      } else if (arg.event.extendedProps['type'] === 'system_task') {
        const t = arg.event.extendedProps['systemTask'] as SystemInstanceTask;
        this.toggleSystemTask(t);
      }
    },
    eventDrop: (arg: any) => {
      if (arg.event.extendedProps['type'] === 'task') {
        this.handleEventDrop(arg);
      } else {
        arg.revert();
      }
    },
    eventResize: (arg: any) => {
      if (arg.event.extendedProps['type'] === 'task') {
        this.handleEventResize(arg);
      } else {
        arg.revert();
      }
    },
    select: (arg: any) => this.handleSelect(arg)
  }));

  changeView(viewType: string) {
    this.currentView.set(viewType);
    if (this.calendarComponent) {
      const api = this.calendarComponent.getApi();
      api.changeView(viewType);
    }
  }
  
  
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

  // ─── Form Management ────────────────────────────────────

  openNewTaskForm() {
    this.newTask = this.getDefaultTask();
    this.syncDatesFromTask();
    this.showAddForm.set(true);
  }

  editTask(task: PlannerTask | Partial<PlannerTask>) {
    this.newTask = { ...task };
    this.syncDatesFromTask();
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
      sub_tasks: [],
      created_at: undefined
    };
  }

  addSubTask() {
    if (!this.newTask.sub_tasks) this.newTask.sub_tasks = [];
    this.newTask.sub_tasks.push({ title: 'New Sub-task', completed: false });
    this.onFormChange();
  }

  removeSubTask(index: number) {
    if (this.newTask.sub_tasks) {
      this.newTask.sub_tasks.splice(index, 1);
      this.onFormChange();
    }
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
    const isDark = this.themeService.currentTheme() === 'dark';
    if (task.status === 'completed') return isDark ? '#86efac' : '#f0fdf4'; // green-300
    if (task.status === 'skipped') return isDark ? '#fca5a5' : '#fef2f2';   // red-300
    return isDark ? '#d4d4d4' : '#ffffff'; // neutral-300
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
    this.loadSystemTasks();
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
    this.showAddForm.set(true);
  }

  // ─── Resize Logic ───────────────────────────────────────

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

  private handleSelect(arg: any) {
    this.newTask = this.getDefaultTask();
    this.newTask.start_time = this.dateToTimeString(arg.start);
    this.newTask.end_time = this.dateToTimeString(arg.end);
    this.syncDatesFromTask();
    this.showAddForm.set(true);
  }

  private cleanupResizeListeners() {}
  private cleanupDragListeners() {}

  // ─── Overlap Detection ──────────────────────────────────

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
