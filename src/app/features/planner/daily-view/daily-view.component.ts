import { Component, signal, inject, OnInit, NgZone, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PlannerService, PlannerTask } from '../../../services/planner.service';

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
    MatDatepickerModule
  ],
  template: `
    <div class="h-full flex flex-col">
      <div class="flex flex-col gap-4 mb-6 px-4">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-white flex items-center gap-2 tracking-tight uppercase">
            <span class="text-[#ec5b13] material-symbols-outlined">view_day</span>
            Daily_Protocol
          </h2>
          
          <div class="flex gap-3 items-center">
             <!-- Date Navigation -->
             <div class="flex items-center bg-[#050608] rounded border border-[#2a3441] p-1 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                <button (click)="changeDate(-1)" class="p-1 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 rounded transition-all" title="Previous Day">
                  <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                
                <div class="relative">
                  <input [matDatepicker]="picker" 
                         [ngModel]="selectedDateDate()" 
                         (dateChange)="onDateChangeDate($event.value)"
                         class="bg-transparent border-none text-white font-mono font-bold text-sm px-2 cursor-pointer w-[120px] outline-none text-center h-full hover:text-[#ec5b13] transition-colors">
                  <mat-datepicker-toggle matIconSuffix [for]="picker" class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 text-[#ec5b13]"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </div>

                <button (click)="changeDate(1)" class="p-1 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 rounded transition-all" title="Next Day">
                  <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
             </div>

             <!-- Timeline Height Slider (Zoom) -->
             <div class="flex items-center gap-2 bg-[#050608] rounded border border-[#2a3441] px-3 py-2 shadow-sm" title="Adjust Timeline Scale">
                 <span class="material-symbols-outlined text-slate-500 text-sm">unfold_more</span>
                 <input type="range" [min]="40" [max]="200" [step]="5" 
                        [ngModel]="slotHeight()" (ngModelChange)="onSlotHeightChange($event)"
                        class="w-24 accent-[#ec5b13] h-1.5 bg-[#2a3441] rounded-lg appearance-none cursor-pointer">
             </div>

            <button (click)="openNewTaskForm()" 
                    class="px-4 py-2 bg-[#ec5b13] text-white rounded font-bold hover:bg-white hover:text-[#ec5b13] transition-all shadow-[0_0_15px_rgba(236,91,19,0.4)] flex items-center gap-2 uppercase tracking-wider text-xs">
              <span class="material-symbols-outlined text-lg">add</span>
              INIT_TASK
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden gap-6 px-4 pb-4">
        <!-- Timeline Side -->
        <div class="flex-1 overflow-y-auto bg-[#050608]/50 rounded border border-[#2a3441] p-6 custom-scrollbar relative">
          <div class="flex justify-between items-center mb-6 border-b border-[#2a3441] pb-4 sticky top-0 bg-[#050608]/90 z-30 backdrop-blur-sm -mx-6 px-6 -mt-6 pt-6">
               <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Timeline_Sequence</h3>
               <span class="text-[9px] uppercase font-bold tracking-widest text-[#ec5b13] bg-[#ec5b13]/10 px-2 py-1 rounded border border-[#ec5b13]/20">Double-tap to execute quick add</span>
          </div>
          
          <div class="space-y-0 relative mt-4">
            @for (hour of timeSlots; track hour) {
              <div class="flex gap-4 items-stretch group">
                <!-- Hour Label -->
                <div class="w-16 text-right text-xs text-slate-600 font-mono font-bold pr-2 select-none relative pt-0">
                  <span class="absolute -top-2 right-2">{{hour}}</span>
                </div>
                
                <!-- Time Slot Bucket -->
                <div class="timeline-slot flex-1 border-l border-[#2a3441] pl-4 relative hover:bg-[#ec5b13]/5 transition-colors cursor-pointer"
                     [style.min-height.px]="slotHeight()"
                     (dblclick)="onSlotDoubleClick(hour)">
                     
                  <!-- Hour Guide Line -->
                  <div class="absolute top-0 left-[-1px] right-0 border-t border-[#2a3441] w-full"></div>

                  @for (task of getTasksForHour(hour); track task.id) {
                    <div class="task-card absolute left-4 right-2 p-3 rounded border transition-all shadow-lg cursor-pointer z-10 overflow-hidden group/card"
                         [ngStyle]="getTaskStyle(task)"
                         [class.bg-red-900/40]="task.priority === 'high'"
                         [class.border-red-500/50]="task.priority === 'high'"
                         [class.hover:border-red-500]="task.priority === 'high'"
                         
                         [class.bg-yellow-900/40]="task.priority === 'medium'"
                         [class.border-yellow-500/50]="task.priority === 'medium'"
                         [class.hover:border-yellow-500]="task.priority === 'medium'"
                         
                         [class.bg-blue-900/40]="task.priority === 'low' || !task.priority"
                         [class.border-blue-500/50]="task.priority === 'low' || !task.priority"
                         [class.hover:border-blue-500]="task.priority === 'low' || !task.priority"
                         (click)="$event.stopPropagation(); editTask(task)">
                      
                      <!-- Scanline effect on card -->
                      <div class="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none"></div>

                      <!-- Resize Handle Top -->
                      <div class="resize-handle top absolute top-0 left-0 right-0 h-3 cursor-ns-resize z-20 hover:bg-white/10 transition-colors"
                           (mousedown)="startResize($event, task, 'top')"
                           (click)="$event.stopPropagation()">
                         <div class="w-8 h-0.5 bg-slate-500/50 rounded-full mx-auto mt-1 opacity-0 group-hover/card:opacity-100"></div>
                      </div>

                      <!-- Resize Handle Bottom -->
                      <div class="resize-handle bottom absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize z-20 hover:bg-white/10 transition-colors"
                           (mousedown)="startResize($event, task, 'bottom')"
                           (click)="$event.stopPropagation()">
                         <div class="w-8 h-0.5 bg-slate-500/50 rounded-full mx-auto mt-1 opacity-0 group-hover/card:opacity-100"></div>
                      </div>

                      <div class="flex justify-between items-start pointer-events-none relative z-10">
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-white text-xs uppercase tracking-wide truncate shadow-black drop-shadow-md">{{task.title}}</h4>
                          @if (task.description) {
                            <p class="text-[10px] text-slate-400 mt-1 line-clamp-1 font-mono">{{task.description}}</p>
                          }
                          <div class="flex items-center gap-3 mt-1">
                             <span class="text-[9px] font-bold text-slate-400 flex items-center gap-1 font-mono bg-black/30 px-1 rounded">
                               {{task.start_time}} - {{task.end_time}}
                             </span>
                          </div>
                        </div>
                        
                        <div class="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-auto">
                          <button (click)="$event.stopPropagation(); toggleTaskStatus(task)" 
                                  class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
                                  [class.text-[#ec5b13]]="task.status !== 'completed'"
                                  [class.text-slate-500]="task.status === 'completed'"
                                  title="Complete">
                            <span class="material-symbols-outlined text-base">
                              {{task.status === 'completed' ? 'check_circle' : 'radio_button_unchecked'}}
                            </span>
                          </button>
                          <button (click)="$event.stopPropagation(); deleteTask(task.id!)" 
                                  class="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-red-500"
                                  title="Delete">
                            <span class="material-symbols-outlined text-base">delete</span>
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
          <div class="w-96 bg-[#0c0e12] p-6 rounded border border-[#ec5b13] flex flex-col animate-in slide-in-from-right duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
            <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ec5b13]"></div>
            <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ec5b13]"></div>
            <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#ec5b13]"></div>
            <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#ec5b13]"></div>

            <div class="flex justify-between items-center mb-6 border-b border-[#2a3441] pb-4">
              <h3 class="text-lg font-black text-white uppercase tracking-wider">
                 <span class="text-[#ec5b13] mr-2">>></span>{{ newTask.id ? 'Edit_Protocol' : 'New_Protocol' }}
              </h3>
              <button (click)="closeForm()" class="size-8 rounded hover:text-[#ec5b13] transition-colors flex items-center justify-center text-slate-500">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              <!-- Title -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operation_Name</label>
                <input [(ngModel)]="newTask.title" (ngModelChange)="onFormChange()" placeholder="ENTER_NAME" required
                       class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all rounded">
              </div>

              <!-- Description -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mission_Intel</label>
                <textarea [(ngModel)]="newTask.description" (ngModelChange)="onFormChange()" placeholder="// ADD_DETAILS..." rows="3"
                          class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all resize-none rounded"></textarea>
              </div>

              <!-- Time Selection -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">T_Start</label>
                  <div class="relative">
                      <input [matTimepicker]="picker1" [ngModel]="startTimeDate()" (ngModelChange)="updateStartTime($event)"
                             class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all rounded cursor-pointer">
                      <mat-timepicker #picker1 />
                      <mat-timepicker-toggle [for]="picker1" matSuffix class="absolute right-2 top-1/2 -translate-y-1/2 text-[#ec5b13]"/>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">T_End</label>
                  <div class="relative">
                      <input [matTimepicker]="picker2" [ngModel]="endTimeDate()" (ngModelChange)="updateEndTime($event)"
                             class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all rounded cursor-pointer">
                      <mat-timepicker #picker2 />
                      <mat-timepicker-toggle [for]="picker2" matSuffix class="absolute right-2 top-1/2 -translate-y-1/2 text-[#ec5b13]"/>
                  </div>
                </div>
              </div>

              <!-- Priority -->
              <div>
                <label class="block text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Priority_Level</label>
                <div class="flex gap-2">
                  @for (p of priorities; track p) {
                    <button (click)="setPriority(p)"
                            class="flex-1 py-2 rounded border font-bold uppercase text-xs transition-all"
                            [class.bg-transparent]="newTask.priority !== p"
                            [class.border-[#2a3441]]="newTask.priority !== p"
                            [class.text-slate-500]="newTask.priority !== p"
                            
                            [class.border-red-500]="newTask.priority === p && p === 'high'"
                            [class.text-red-500]="newTask.priority === p && p === 'high'"
                            [class.bg-red-500/10]="newTask.priority === p && p === 'high'"
                            
                            [class.border-yellow-500]="newTask.priority === p && p === 'medium'"
                            [class.text-yellow-500]="newTask.priority === p && p === 'medium'"
                            [class.bg-yellow-500/10]="newTask.priority === p && p === 'medium'"
                            
                            [class.border-blue-500]="newTask.priority === p && p === 'low'"
                            [class.text-blue-500]="newTask.priority === p && p === 'low'"
                            [class.bg-blue-500/10]="newTask.priority === p && p === 'low'">
                      {{p}}
                    </button>
                  }
                </div>
              </div>

               <div class="pt-4 flex gap-3 border-t border-[#2a3441] mt-4">
                  @if (newTask.id) {
                    <button (click)="deleteTask(newTask.id!)" class="mr-auto text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">delete</span>
                      Abort
                    </button>
                  }
                  <button (click)="saveTask()" class="flex-1 py-3 bg-[#ec5b13] text-white rounded font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(236,91,19,0.3)] hover:shadow-[0_0_25px_rgba(236,91,19,0.5)] hover:scale-[1.02] transition-all text-xs">
                    {{ newTask.id ? 'Update_Protocol' : 'Initialize_Task' }}
                  </button>
                </div>
            </div>
          </div>
        }
      </div>

      <!-- Unscheduled Section -->
      @if (tasksWithoutTime().length > 0) {
        <div class="mt-4 mx-4 bg-[#0c0e12] rounded border border-dashed border-[#2a3441] p-4">
          <h3 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">inbox</span>
            Unscheduled_Buffer
          </h3>
          <div class="flex flex-wrap gap-2">
            @for (task of displayTasksWithoutTime(); track task.id) {
              <div (click)="editTask(task)" 
                   class="bg-[#050608] px-4 py-2 rounded border border-[#2a3441] shadow-sm hover:border-[#ec5b13] cursor-pointer flex items-center gap-3 transition-all group">
                <span class="font-bold text-sm text-slate-300 group-hover:text-white">{{task.title}}</span>
                <span class="material-symbols-outlined text-xs text-slate-600 group-hover:text-[#ec5b13]">edit</span>
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
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #2a3441;
      border-radius: 2px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #ec5b13;
    }
    
    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: transparent !important;
    }
    
    ::ng-deep .mat-mdc-input-element {
      color: inherit !important;
    }
    
    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }
    
    /* Remove default underline of Angular Material */
    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
    }
    ::ng-deep .mat-mdc-text-field-wrapper {
        padding: 0;
    }
    ::ng-deep .mat-mdc-form-field-infix {
        border: none;
        padding: 0 !important;
        min-height: unset !important;
    }
    
    /* Timepicker Overrides */
    ::ng-deep .mat-timepicker-toggle-button {
        color: #ec5b13 !important;
    }

    .timeline-slot:has(.task-card:hover) {
       background-color: transparent !important;
    }
    
    .resize-handle:hover {
       background-color: rgba(236, 91, 19, 0.2);
    }
    
    .resize-handle.top {
       top: 0;
    }
    .resize-handle.bottom {
       bottom: 0;
    }
  `]
})
export class DailyViewComponent implements OnInit {
  private plannerService = inject(PlannerService);
  private ngZone = inject(NgZone);
  
  tasks = signal<PlannerTask[]>([]);
  tasksWithoutTime = signal<PlannerTask[]>([]);
  formUpdateTrigger = signal(0);
  showAddForm = signal(false);

  displayTasks = computed(() => {
    this.formUpdateTrigger();
    const all = this.tasks();
    const current = this.newTask;
    const isFormOpen = this.showAddForm();

    if (isFormOpen) {
      if (current.id) {
        return all.map(t => t.id === current.id ? { ...t, ...current } as PlannerTask : t);
      } else if (current.title && current.start_time) {
        return [...all, { ...current, id: 'preview-' + Date.now() } as PlannerTask];
      }
    }
    return all;
  });

  displayTasksWithoutTime = computed(() => {
    this.formUpdateTrigger();
    const all = this.tasksWithoutTime();
    const current = this.newTask;
    const isFormOpen = this.showAddForm();

    if (isFormOpen) {
      if (current.id) {
        return all.map(t => t.id === current.id ? { ...t, ...current } as PlannerTask : t);
      } else if (current.title && !current.start_time) {
        return [...all, { ...current, id: 'preview-unsched-' + Date.now() } as PlannerTask];
      }
    }
    return all;
  });
  selectedDate = new Date().toISOString().split('T')[0];
  selectedDateDate = signal<Date>(new Date());
  slotHeight = signal(64); // Signal for hour height
  
  resizingTask: { 
    id: string, 
    startY: number, 
    originalStartStr: string,
    originalEndStr: string,
    direction: 'top' | 'bottom' 
  } | null = null;
  resizeMoveListener: any;
  resizeEndListener: any;
  
  priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

  timeSlots = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];
  
  newTask: Partial<PlannerTask> = this.getDefaultTask();

  // Fix: Use signals for date handling to avoid infinite change detection loops
  startTimeDate = signal<Date>(new Date());
  endTimeDate = signal<Date>(new Date());

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

  saveTask() {
    if (!this.newTask.title?.trim()) return;
    this.newTask.date = this.selectedDate;
    
    const obs$ = this.newTask.id 
      ? this.plannerService.updateTask(this.newTask.id, this.newTask)
      : this.plannerService.createTask(this.newTask as any);

    obs$.subscribe(() => {
      this.loadTasks();
      this.closeForm();
    });
  }

  openNewTaskForm() {
      this.newTask = this.getDefaultTask();
      this.syncDatesFromTask();
      this.onFormChange();
      this.showAddForm.set(true);
  }

  editTask(task: PlannerTask | Partial<PlannerTask>) {
      this.newTask = { ...task };
      this.syncDatesFromTask();
      this.onFormChange();
      this.showAddForm.set(true);
  }

  closeForm() {
      this.showAddForm.set(false);
      this.onFormChange();
  }

  setPriority(p: 'low' | 'medium' | 'high') {
    this.newTask.priority = p;
    this.onFormChange();
  }

  onFormChange() {
    this.formUpdateTrigger.update(v => v + 1);
  }
  
  getDefaultTask(): Partial<PlannerTask> {
      return {
        title: '',
        description: '',
        date: this.selectedDate,
        start_time: '09:00',
        end_time: '10:00',
        status: 'pending',
        priority: 'medium'
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

  deleteTask(id: string) {
    if (confirm('Delete this task?')) {
      this.plannerService.deleteTask(id).subscribe(() => {
        this.loadTasks();
        if (this.newTask.id === id) this.closeForm();
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
    return this.displayTasks().filter(task => {
      if (!task.start_time) return false;
      const taskHour = task.start_time.split(':')[0].padStart(2, '0');
      const slotHour = hour.split(':')[0];
      return taskHour === slotHour;
    });
  }

  onDateChange(newDate: string) {
      this.selectedDate = newDate;
      this.loadTasks();
  }

  changeDate(days: number) {
      const date = new Date(this.selectedDate);
      date.setDate(date.getDate() + days);
      this.selectedDate = date.toISOString().split('T')[0];
      this.loadTasks();
  }

  onSlotHeightChange(val: any) {
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

  getTaskStyle(task: PlannerTask) {
    if (!task.start_time || !task.end_time) return {};
    
    const start = this.timeStringToDate(task.start_time);
    const end = this.timeStringToDate(task.end_time);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const startMinutes = start.getMinutes();
    
    // Calculate pixel values based on current slot height
    // slotHeight is the height of 1 hour (60 minutes)
    const heightPerMinute = this.slotHeight() / 60;
    const height = durationMinutes * heightPerMinute;
    const top = startMinutes * heightPerMinute;
    
    return {
      top: `${top}px`,
      height: `${height}px`
    };
  }

  private timeStringToDate(timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  private dateToTimeString(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  
  onDateChangeDate(date: Date | null) {
      if (!date) return;
      this.selectedDateDate.set(date);
      // Adjust for timezone offset to keep the selected day correct
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      this.selectedDate = localDate.toISOString().split('T')[0];
      this.loadTasks();
  }

  // Resizing Logic
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
        window.addEventListener('mousemove', this.resizeMoveListener);
        window.addEventListener('mouseup', this.resizeEndListener);
    });
  }

  onResizeMove(event: MouseEvent) {
      if (!this.resizingTask) return;
      
      const deltaY = event.clientY - this.resizingTask.startY;
      const pixelsPerMinute = this.slotHeight() / 60;
      const deltaMinutes = Math.round(deltaY / pixelsPerMinute);
      
      const originalStart = this.timeStringToDate(this.resizingTask.originalStartStr);
      const originalEnd = this.timeStringToDate(this.resizingTask.originalEndStr);
      
      // Update task in signal locally
      this.ngZone.run(() => {
          const allTasks = this.tasks();
          const taskIdx = allTasks.findIndex(t => t.id === this.resizingTask!.id);
          if (taskIdx !== -1) {
              const task = allTasks[taskIdx];
              let newStart = new Date(originalStart);
              let newEnd = new Date(originalEnd);
              
              if (this.resizingTask!.direction === 'bottom') {
                  newEnd = new Date(originalEnd.getTime() + deltaMinutes * 60000);
                  // Min 15 mins duration
                  if (newEnd.getTime() - newStart.getTime() < 15 * 60000) {
                      newEnd = new Date(newStart.getTime() + 15 * 60000);
                  }
              } else {
                  newStart = new Date(originalStart.getTime() + deltaMinutes * 60000);
                  // Min 15 mins duration
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

                  // Update form if this is the task being edited
                  if (this.newTask && this.newTask.id === updatedTask.id) {
                      this.newTask.start_time = updatedTask.start_time;
                      this.newTask.end_time = updatedTask.end_time;
                      this.syncDatesFromTask();
                  }
              }
          }
      });
  }

  onResizeEnd() {
      if (this.resizingTask) {
          const task = this.tasks().find(t => t.id === this.resizingTask!.id);
          if (task) {
             // Save changes
             this.plannerService.updateTask(task.id!, { 
                 start_time: task.start_time,
                 end_time: task.end_time 
             }).subscribe();
          }
          
          window.removeEventListener('mousemove', this.resizeMoveListener);
          window.removeEventListener('mouseup', this.resizeEndListener);
          this.resizingTask = null;
      }
  }
}
