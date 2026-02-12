import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { PlannerService, PlannerGoal } from '../../../services/planner.service';
import { LinearCalendarComponent } from './linear-calendar/linear-calendar.component';
import { CalendarEvent } from '../../../models/calendar-event.model';

@Component({
  selector: 'app-yearly-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LinearCalendarComponent, MatDatepickerModule, MatNativeDateModule, MatInputModule, MatChipsModule, MatIconModule],
  template: `
    <div class="h-full flex flex-col gap-4 relative font-manrope">
      <div class="flex flex-col gap-4 px-4 pt-2">
         <div class="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
            <h2 class="text-2xl font-black text-black flex items-center gap-2 uppercase font-arvo">
              <span class="text-black material-symbols-outlined text-3xl">calendar_view_week</span>
              <button (click)="changeYear(-1)" class="p-1 hover:bg-black hover:text-white rounded-none border border-transparent hover:border-black transition-colors"><span class="material-symbols-outlined">chevron_left</span></button>
              <span class="font-mono text-black underline decoration-4 decoration-electric-red">{{ currentYear() }}</span>
              <button (click)="changeYear(1)" class="p-1 hover:bg-black hover:text-white rounded-none border border-transparent hover:border-black transition-colors"><span class="material-symbols-outlined">chevron_right</span></button>
              <span class="text-sm text-concrete-500 ml-2 tracking-widest font-mono font-bold">_CYCLE_OVERVIEW</span>
            </h2>

             <!-- Filter Chips -->
             <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar-x w-full md:w-auto">
                 <span class="text-[10px] uppercase font-black text-concrete-900 tracking-widest mr-2 whitespace-nowrap">Filter_Spectra:</span>
                 <div class="flex gap-2">
                    @for (color of presetColors; track color) {
                      <button (click)="toggleFilter(color)" 
                              class="size-6 rigid-border-sm border-[2px] transition-all hover:scale-110 flex items-center justify-center relative group"
                              [style.background-color]="color"
                              [class.ring-2]="selectedColors().has(color)"
                              [class.ring-black]="selectedColors().has(color)"
                              [class.opacity-40]="selectedColors().size > 0 && !selectedColors().has(color)">
                          @if(selectedColors().has(color)) {
                              <span class="absolute text-[10px] text-white font-black inset-0 flex items-center justify-center bg-black/20">✓</span>
                          }
                      </button>
                    }
                 </div>
             </div>

            <button (click)="openAddForm()" 
                    class="px-4 py-2 bg-electric-red text-white rigid-border-sm border-[2px] font-black hover:bg-black transition-all shadow-[2px_2px_0_0_black] flex items-center gap-2 uppercase tracking-wider text-xs ml-auto md:ml-0 whitespace-nowrap active:translate-y-1 active:shadow-none">
              <span class="material-symbols-outlined text-lg">add</span>
              INIT_EVENT
            </button>
         </div>
      </div>

      <div class="flex-1 flex overflow-hidden gap-4 px-4 pb-4">
        <!-- Linear Calendar -->
        <div class="flex-1 bg-white rigid-border border-[4px] p-0 overflow-hidden h-full flex flex-col relative group/calendar brutalist-shadow-active">
          <div class="absolute inset-x-0 top-0 h-1 bg-electric-red z-20"></div>
          <app-linear-calendar 
            [events]="calendarEvents()"
            (eventClick)="onEventClick($event)"
            (backgroundClick)="onBackgroundClick($event)"
            (eventUpdate)="onEventUpdate($event)"
            (eventCreate)="onEventCreate($event)">
          </app-linear-calendar>
        </div>

        <!-- Add/Edit Goal Form (Side Panel) -->
        @if (showAddForm()) {
          <div class="w-80 bg-white rigid-border border-[4px] p-6 overflow-y-auto h-full flex flex-col transition-all relative animate-in slide-in-from-right duration-300 shadow-[0_0_50px_rgba(0,0,0,0.2)] z-30 brutalist-shadow-active">
            <div class="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
                <h3 class="text-lg font-black text-black uppercase tracking-wider font-arvo">
                    {{ editingId() ? 'Edit_Event' : 'New_Event' }}
                </h3>
                 <button (click)="closeForm()" class="border-2 border-transparent hover:border-black w-8 h-8 flex items-center justify-center">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
               <div class="space-y-1">
                 <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Event_Alias</label>
                 <input [ngModel]="currentGoal().title" (ngModelChange)="updateCurrentGoal({title: $event})" placeholder="ENTER_ALIAS"
                        class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all rounded-none uppercase placeholder:text-concrete-300">
               </div>

               <div class="space-y-1">
                 <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Event_Details</label>
                 <textarea [ngModel]="currentGoal().description" (ngModelChange)="updateCurrentGoal({description: $event})" rows="3" placeholder="// ADD_DETAILS..."
                        class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all resize-none rounded-none uppercase placeholder:text-concrete-300"></textarea>
               </div>

               <div class="space-y-1">
                 <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Time_Window</label>
                 <mat-form-field appearance="outline" class="w-full brutalist-input-wrapper">
                   <mat-date-range-input [rangePicker]="picker" class="text-black font-mono font-bold">
                     <input matStartDate placeholder="START" [(ngModel)]="currentStartDateStr" (dateChange)="onDateChange('start', $event)" class="text-black">
                     <input matEndDate placeholder="END" [(ngModel)]="currentEndDateStr" (dateChange)="onDateChange('end', $event)" class="text-black">
                   </mat-date-range-input>
                   <mat-datepicker-toggle matIconSuffix [for]="picker" class="text-black"></mat-datepicker-toggle>
                   <mat-date-range-picker #picker panelClass="brutalist-datepicker"></mat-date-range-picker>
                 </mat-form-field>
               </div>

               <div>
                 <label class="block text-[10px] font-black tracking-widest text-concrete-900 uppercase mb-3">Spectra_Code</label>
                 <div class="flex gap-2 flex-wrap">
                   @for (color of presetColors; track color) {
                     <button (click)="updateCurrentGoal({color: color})"
                             class="size-8 rounded-none border-[3px] transition-all hover:scale-110 flex items-center justify-center"
                             [style.background-color]="color"
                             [class.border-black]="currentGoal().color === color"
                             [class.border-transparent]="currentGoal().color !== color"
                             [class.shadow-[2px_2px_0_0_black]]="currentGoal().color === color">
                             @if(currentGoal().color === color) {
                                 <div class="w-2 h-2 bg-black"></div>
                             }
                     </button>
                   }
                 </div>
               </div>
            </div>
            
            <div class="flex gap-3 mt-6 justify-end pt-4 border-t-4 border-black">
                @if (editingId()) {
                  @if (!isConfirmingDelete()) {
                    <button (click)="deleteGoal()" class="mr-auto text-electric-red hover:text-black font-black text-xs uppercase tracking-widest flex items-center gap-1 transition-colors border-2 border-transparent hover:border-black px-2">
                      <span class="material-symbols-outlined text-sm">delete</span>
                      Abort
                    </button>
                  } @else {
                    <div class="mr-auto flex items-center gap-2 bg-white p-1 px-2 rigid-border-sm border-[2px] shadow-[2px_2px_0_0_black]">
                       <span class="text-[9px] uppercase font-black text-electric-red mr-1 tracking-wider">Confirm?</span>
                       <button (click)="confirmDelete()" class="text-black hover:text-electric-red flex items-center transition-colors" title="Confirm Delete">
                         <span class="material-symbols-outlined text-sm">check</span>
                       </button>
                       <button (click)="cancelDelete()" class="text-concrete-400 hover:text-black flex items-center transition-colors" title="Cancel Delete">
                         <span class="material-symbols-outlined text-sm">close</span>
                       </button>
                    </div>
                  }
                }
              <button (click)="saveGoal()" class="flex-1 py-3 bg-black text-white rigid-border-sm border-[2px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all text-xs shadow-[4px_4px_0_0_concrete-400]">
                  Commit
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .material-symbols-outlined { 
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
    
    ::ng-deep .brutalist-input-wrapper .mat-mdc-text-field-wrapper {
        background-color: white !important;
        border: 2px solid black !important;
        border-radius: 0 !important;
        padding: 0 0.5rem !important;
    }
    
    ::ng-deep .brutalist-input-wrapper .mat-mdc-form-field-infix {
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
        min-height: unset !important;
        border: none !important;
    }
    
    /* Remove underline */
    ::ng-deep .brutalist-input-wrapper .mdc-line-ripple { 
        display: none !important; 
    }

    .custom-scrollbar-x::-webkit-scrollbar { height: 4px; }
    .custom-scrollbar-x::-webkit-scrollbar-track { background: #e5e5e5; }
    .custom-scrollbar-x::-webkit-scrollbar-thumb { background: black; }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #e5e5e5; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: black; }
  `]
})
export class YearlyViewComponent implements OnInit {
  // Logic remains EXACTLY the same as previous file.
  private plannerService = inject(PlannerService);
  
  goals = signal<PlannerGoal[]>([]);
  showAddForm = signal(false);
  editingId = signal<string | null>(null);
  currentYear = signal(new Date().getFullYear());
  selectedColors = signal<Set<string>>(new Set());
  isConfirmingDelete = signal(false);
  
  presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

  currentGoal = signal<Partial<PlannerGoal>>(this.getEmptyGoal());
  
  // Date Handling helper for Material Datepicker
  currentStartDateStr: Date | null = null;
  currentEndDateStr: Date | null = null;

  // Map PlannerGoals to CalendarEvents with live preview
  calendarEvents = computed(() => {
    const filters = this.selectedColors();
    const editingId = this.editingId();
    const current = this.currentGoal();
    
    let events = this.goals().map(g => {
        // If this is the goal we are currently editing, merge the form data for live preview
        if (editingId && g.id === editingId) {
            return { ...g, ...current };
        }
        return g;
    });

    // If we are adding a new goal, also show it in the calendar
    if (!editingId && this.showAddForm() && current.startDate && current.endDate) {
        // Create a temporary ID for the new goal preview
        events = [...events, { ...current, id: 'temporary-new-goal' } as PlannerGoal];
    }

    const transformedEvents = events
      .filter(g => g.startDate && g.endDate)
      .map(g => ({
        id: g.id!,
        title: g.title,
        startDate: g.startDate!,
        endDate: g.endDate!,
        color: g.color || '#4c9a66',
        description: g.description,
        category: 'goal'
      } as CalendarEvent));
      
    if (filters.size > 0) {
        return transformedEvents.filter(e => filters.has(e.color));
    }
    
    return transformedEvents;
  });

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    this.plannerService.getGoals({ period: 'yearly', year: this.currentYear() }).subscribe(goals => {
      this.goals.set(goals);
    });
  }

  getEmptyGoal(): Partial<PlannerGoal> {
    const today = new Date();
    today.setHours(0,0,0,0);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      title: '',
      description: '',
      year: this.currentYear(),
      period: 'yearly',
      status: 'active',
      startDate: today.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      color: '#22c55e',
      tasks: []
    };
  }

  openAddForm() {
    this.editingId.set(null);
    this.currentGoal.set(this.getEmptyGoal());
    this.syncDateFromGoal();
    this.showAddForm.set(true);
  }

  startEditing(goal: PlannerGoal) {
    this.editingId.set(goal.id!);
    this.currentGoal.set({ ...goal });
    this.syncDateFromGoal();
    this.showAddForm.set(true);
  }

  onEventClick(event: CalendarEvent) {
    const goal = this.goals().find(g => g.id === event.id);
    if (goal) {
      this.startEditing(goal);
    }
  }

  onEventUpdate(event: CalendarEvent) {
    const goal = this.goals().find(g => g.id === event.id);
    if (goal) {
      const updatedGoal = { ...goal, startDate: event.startDate, endDate: event.endDate };
      
      // Optimistic update
      this.goals.update(gs => gs.map(g => g.id === goal.id ? updatedGoal : g));

      this.plannerService.updateGoal(goal.id!, updatedGoal).subscribe({
        error: (err) => {
           console.error('Failed to update goal', err);
           this.loadGoals(); // Rollback
        }
      });
    }
  }

  onEventCreate(event: { date: Date, title: string }) {
    const startStr = event.date.toISOString().split('T')[0];
    const newGoal: Partial<PlannerGoal> = {
      title: event.title,
      description: event.title,
      startDate: startStr,
      endDate: startStr, // Single day event by default
      year: event.date.getFullYear(),
      period: 'yearly',
      status: 'active',
      color: '#22c55e',
      tasks: []
    };

    this.plannerService.createGoal(newGoal).subscribe(() => {
      this.loadGoals();
    });
  }

  onBackgroundClick(date: Date) {
    this.openAddForm();
    const startStr = date.toISOString().split('T')[0];
    const end = new Date(date);
    end.setDate(end.getDate() + 7); // Default 1 week duration
    const endStr = end.toISOString().split('T')[0];
    
    this.updateCurrentGoal({ startDate: startStr, endDate: endStr });
    this.syncDateFromGoal();
  }

  updateCurrentGoal(patch: Partial<PlannerGoal>) {
    this.currentGoal.update(g => ({ ...g, ...patch }));
  }

  closeForm() {
    this.showAddForm.set(false);
    this.editingId.set(null);
    this.isConfirmingDelete.set(false);
  }

  saveGoal() {
    const current = this.currentGoal();
    if (!current.title?.trim()) return;
    
    // Ensure dates are set
    if (!current.startDate || !current.endDate) {
       alert('Please select start and end dates');
       return;
    }
    
    // Ensure goal works with strict planner goal
    const goalToSave = {
        ...current,
        year: current.year || this.currentYear(),
        period: 'yearly' as const,
        status: 'active' as const,
        tasks: current.tasks || []
    } as PlannerGoal;


    if (this.editingId()) {
      this.plannerService.updateGoal(this.editingId()!, goalToSave).subscribe(() => {
        this.loadGoals();
        this.closeForm();
      });
    } else {
      this.plannerService.createGoal(goalToSave).subscribe(() => {
        this.loadGoals();
        this.closeForm();
      });
    }
  }

  deleteGoal() {
    this.isConfirmingDelete.set(true);
  }

  cancelDelete() {
    this.isConfirmingDelete.set(false);
  }

  confirmDelete() {
    if (this.editingId()) {
      this.plannerService.deleteGoal(this.editingId()!).subscribe(() => {
        this.loadGoals();
        this.isConfirmingDelete.set(false);
        this.closeForm();
      });
    }
  }
  changeYear(delta: number) {
      this.currentYear.update(y => y + delta);
      this.loadGoals();
  }

  toggleFilter(color: string) {
      this.selectedColors.update(s => {
          const newSet = new Set(s);
          if (newSet.has(color)) newSet.delete(color);
          else newSet.add(color);
          return newSet;
      });
  }

  // Helpers for MatDatepicker
  syncDateFromGoal() {
      const current = this.currentGoal();
      if (current.startDate) this.currentStartDateStr = new Date(current.startDate);
      if (current.endDate) this.currentEndDateStr = new Date(current.endDate);
  }

  onDateChange(type: 'start' | 'end', event: any) {
      const val = event.value;
      if (!val) return;
      
      const str = this.formatDate(val);
      
      if (type === 'start') this.updateCurrentGoal({ startDate: str });
      else this.updateCurrentGoal({ endDate: str });
  }
  
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
