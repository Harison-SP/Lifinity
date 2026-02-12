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
    <div class="h-full flex flex-col font-manrope">
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 class="text-2xl font-black text-black flex items-center gap-2 uppercase font-arvo">
            <span class="material-symbols-outlined text-3xl">view_day</span>
            Daily_Protocol
          </h2>
          
          <div class="flex gap-3 items-center w-full md:w-auto">
             <!-- Date Navigation -->
             <div class="flex items-center bg-white rigid-border-sm border-[2px] p-1 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
                <button (click)="changeDate(-1)" class="p-1 hover:bg-black hover:text-white transition-colors" title="Previous Day">
                  <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                
                <div class="relative">
                  <input [matDatepicker]="picker" 
                         [ngModel]="selectedDateDate()" 
                         (dateChange)="onDateChangeDate($event.value)"
                         class="bg-transparent border-none text-black font-mono font-bold text-sm px-2 cursor-pointer w-[120px] outline-none text-center h-full hover:underline decoration-2 underline-offset-4">
                  <mat-datepicker-toggle matIconSuffix [for]="picker" class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </div>

                <button (click)="changeDate(1)" class="p-1 hover:bg-black hover:text-white transition-colors" title="Next Day">
                  <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
             </div>

             <!-- Timeline Height Slider (Zoom) -->
             <div class="flex items-center gap-2 bg-white rigid-border-sm border-[2px] px-3 py-2" title="Adjust Timeline Scale">
                 <span class="material-symbols-outlined text-black text-sm">unfold_more</span>
                 <input type="range" [min]="40" [max]="200" [step]="5" 
                        [ngModel]="slotHeight()" (ngModelChange)="onSlotHeightChange($event)"
                        class="w-24 accent-black h-1 bg-concrete-300 rounded-lg appearance-none cursor-pointer">
             </div>

            <button (click)="openNewTaskForm()" 
                    class="ml-auto md:ml-0 px-4 py-2 bg-electric-red text-white rigid-border-sm border-[2px] font-black hover:bg-black transition-all shadow-[2px_2px_0_0_black] flex items-center gap-2 uppercase tracking-wider text-xs active:translate-y-1 active:shadow-none">
              <span class="material-symbols-outlined text-lg">add</span>
              INIT_TASK
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden gap-6 pb-4 relative">
        <!-- Timeline Side -->
        <div class="flex-1 overflow-y-auto bg-concrete-100 rigid-border-sm border-[2px] p-0 custom-scrollbar relative">
          <div class="flex justify-between items-center px-6 py-4 border-b-2 border-black sticky top-0 bg-white z-30">
               <h3 class="text-xs font-black text-black uppercase tracking-[0.2em]">Timeline_Sequence</h3>
               <span class="text-[9px] uppercase font-bold tracking-widest text-concrete-400 border border-concrete-300 px-2 py-1 bg-concrete-100">Double-tap to add</span>
          </div>
          
          <div class="space-y-0 relative mt-0">
            @for (hour of timeSlots; track hour) {
              <div class="flex gap-0 items-stretch group border-b border-concrete-300">
                <!-- Hour Label -->
                <div class="w-16 text-right text-xs text-concrete-400 font-mono font-bold pr-4 select-none relative pt-2 bg-white border-r-2 border-black">
                  <span class="">{{hour}}</span>
                </div>
                
                <!-- Time Slot Bucket -->
                <div class="timeline-slot flex-1 relative hover:bg-black/5 transition-colors cursor-pointer bg-white"
                     [style.min-height.px]="slotHeight()"
                     (dblclick)="onSlotDoubleClick(hour)">
                     
                  @for (task of getTasksForHour(hour); track task.id) {
                    <div class="task-card absolute left-2 right-2 p-3 rigid-border-sm border-[2px] shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] cursor-pointer z-10 overflow-hidden group/card bg-white hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] hover:-translate-y-[1px] transition-all"
                         [ngStyle]="getTaskStyle(task)"
                         [class.border-l-[8px]]="true"
                         [class.border-l-black]="task.priority === 'high'"
                         [class.border-l-concrete-400]="task.priority === 'medium'"
                         [class.border-l-concrete-200]="task.priority === 'low'"
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
                          <h4 class="font-black text-black text-xs uppercase tracking-wide truncate">{{task.title}}</h4>
                          @if (task.description) {
                            <p class="text-[10px] text-concrete-500 mt-0.5 line-clamp-1 font-mono uppercase">{{task.description}}</p>
                          }
                          <div class="flex items-center gap-3 mt-1">
                             <span class="text-[9px] font-bold text-black flex items-center gap-1 font-mono bg-concrete-100 px-1 border border-black">
                               {{task.start_time}} - {{task.end_time}}
                             </span>
                          </div>
                        </div>
                        
                        <div class="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-auto">
                          <button (click)="$event.stopPropagation(); toggleTaskStatus(task)" 
                                  class="w-6 h-6 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-colors"
                                  title="Complete">
                            <span class="material-symbols-outlined text-sm">
                              {{task.status === 'completed' ? 'check' : 'check_box_outline_blank'}}
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
                 {{ newTask.id ? 'Edit_Protocol' : 'New_Protocol' }}
              </h3>
              <button (click)="closeForm()" class="w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              <!-- Title -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Operation_Name</label>
                <input [(ngModel)]="newTask.title" (ngModelChange)="onFormChange()" placeholder="ENTER_NAME" required
                       class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all uppercase placeholder:text-concrete-300">
              </div>

              <!-- Description -->
              <div class="space-y-1">
                <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Mission_Intel</label>
                <textarea [(ngModel)]="newTask.description" (ngModelChange)="onFormChange()" placeholder="// ADD_DETAILS..." rows="3"
                          class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all resize-none uppercase placeholder:text-concrete-300"></textarea>
              </div>

              <!-- Time Selection -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">T_Start</label>
                  <div class="relative">
                      <input [matTimepicker]="picker1" [ngModel]="startTimeDate()" (ngModelChange)="updateStartTime($event)"
                             class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all cursor-pointer">
                      <mat-timepicker #picker1 />
                      <mat-timepicker-toggle [for]="picker1" matSuffix class="absolute right-2 top-1/2 -translate-y-1/2 text-black"/>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">T_End</label>
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
                <label class="block text-[10px] font-black tracking-widest text-concrete-900 uppercase mb-3">Priority_Level</label>
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
                      Abort
                    </button>
                  }
                  <button (click)="saveTask()" class="flex-1 py-4 bg-electric-red text-white rigid-border-sm border-[2px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_black] hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs">
                    {{ newTask.id ? 'Commit' : 'Initialize' }}
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
  `]
})
export class DailyViewComponent implements OnInit {
   // ... Logic remains EXACTLY the same as previous file ...
   // Note to LLM: Since I'm using write_to_file with full content, I need to replicate the logic.
   // I will copy the logic from the read file.

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
  slotHeight = signal(64);
  
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
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      this.selectedDate = localDate.toISOString().split('T')[0];
      this.loadTasks();
  }

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
      
      this.ngZone.run(() => {
          const allTasks = this.tasks();
          const taskIdx = allTasks.findIndex(t => t.id === this.resizingTask!.id);
          if (taskIdx !== -1) {
              const task = allTasks[taskIdx];
              let newStart = new Date(originalStart);
              let newEnd = new Date(originalEnd);
              
              if (this.resizingTask!.direction === 'bottom') {
                  newEnd = new Date(originalEnd.getTime() + deltaMinutes * 60000);
                  if (newEnd.getTime() - newStart.getTime() < 15 * 60000) {
                      newEnd = new Date(newStart.getTime() + 15 * 60000);
                  }
              } else {
                  newStart = new Date(originalStart.getTime() + deltaMinutes * 60000);
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
