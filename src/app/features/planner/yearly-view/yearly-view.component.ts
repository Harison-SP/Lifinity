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
    <div class="h-full flex flex-col gap-4 relative">
      <div class="flex flex-col gap-4 px-4 pt-2">
         <div class="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
            <h2 class="text-2xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
              <span class="text-[#ec5b13] material-symbols-outlined">calendar_view_week</span>
              <button (click)="changeYear(-1)" class="p-1 hover:text-[#ec5b13] rounded transition-colors"><span class="material-symbols-outlined">chevron_left</span></button>
              <span class="font-mono text-[#ec5b13]">{{ currentYear() }}</span>
              <button (click)="changeYear(1)" class="p-1 hover:text-[#ec5b13] rounded transition-colors"><span class="material-symbols-outlined">chevron_right</span></button>
              <span class="text-sm text-slate-500 ml-2 tracking-widest font-mono">_CYCLE_OVERVIEW</span>
            </h2>

             <!-- Filter Chips -->
             <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar-x w-full md:w-auto">
                 <span class="text-[10px] uppercase font-bold text-slate-500 tracking-widest mr-2 whitespace-nowrap">Filter_Spectra:</span>
                 <div class="flex gap-2">
                    @for (color of presetColors; track color) {
                      <button (click)="toggleFilter(color)" 
                              class="size-6 rounded-sm border border-slate-700 transition-all hover:scale-110 flex items-center justify-center relative group"
                              [style.background-color]="color"
                              [class.ring-2]="selectedColors().has(color)"
                              [class.ring-white]="selectedColors().has(color)"
                              [class.opacity-40]="selectedColors().size > 0 && !selectedColors().has(color)">
                          @if(selectedColors().has(color)) {
                              <span class="absolute text-[8px] text-white font-bold inset-0 flex items-center justify-center bg-black/20">✓</span>
                          }
                      </button>
                    }
                 </div>
             </div>

            <button (click)="openAddForm()" 
                    class="px-4 py-2 bg-[#ec5b13] text-white rounded font-bold hover:bg-white hover:text-[#ec5b13] transition-all shadow-[0_0_15px_rgba(236,91,19,0.4)] flex items-center gap-2 uppercase tracking-wider text-xs ml-auto md:ml-0 whitespace-nowrap">
              <span class="material-symbols-outlined text-lg">add</span>
              INIT_EVENT
            </button>
         </div>
      </div>

      <div class="flex-1 flex overflow-hidden gap-4 px-4 pb-4">
        <!-- Linear Calendar -->
        <div class="flex-1 bg-[#050608]/80 rounded border border-[#2a3441] p-1 overflow-hidden h-full flex flex-col relative group/calendar shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div class="absolute inset-x-0 top-0 h-1 bg-[#ec5b13] opacity-50 z-20"></div>
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
          <div class="w-80 bg-[#0c0e12] p-6 rounded border border-[#ec5b13] overflow-y-auto h-full flex flex-col transition-all relative animate-in slide-in-from-right duration-300 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-30">
            <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ec5b13]"></div>
            <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ec5b13]"></div>
            
            <h3 class="text-lg font-black text-white uppercase tracking-wider mb-6 border-b border-[#2a3441] pb-2">
                <span class="text-[#ec5b13] mr-2">>></span>{{ editingId() ? 'Edit_Event' : 'New_Event' }}
            </h3>
            
            <div class="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
               <div class="space-y-1">
                 <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event_Alias</label>
                 <input [ngModel]="currentGoal().title" (ngModelChange)="updateCurrentGoal({title: $event})" placeholder="ENTER_ALIAS"
                        class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all rounded">
               </div>

               <div class="space-y-1">
                 <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event_Details</label>
                 <textarea [ngModel]="currentGoal().description" (ngModelChange)="updateCurrentGoal({description: $event})" rows="3" placeholder="// ADD_DETAILS..."
                        class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all resize-none rounded"></textarea>
               </div>

               <div class="space-y-1">
                 <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time_Window</label>
                 <mat-form-field appearance="outline" class="w-full cyberpunk-input">
                   <mat-date-range-input [rangePicker]="picker" class="text-white">
                     <input matStartDate placeholder="START" [(ngModel)]="currentStartDateStr" (dateChange)="onDateChange('start', $event)" class="text-white">
                     <input matEndDate placeholder="END" [(ngModel)]="currentEndDateStr" (dateChange)="onDateChange('end', $event)" class="text-white">
                   </mat-date-range-input>
                   <mat-datepicker-toggle matIconSuffix [for]="picker" class="text-[#ec5b13]"></mat-datepicker-toggle>
                   <mat-date-range-picker #picker panelClass="cyberpunk-datepicker"></mat-date-range-picker>
                 </mat-form-field>
               </div>

               <div>
                 <label class="block text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Spectra_Code</label>
                 <div class="flex gap-2 flex-wrap">
                   @for (color of presetColors; track color) {
                     <button (click)="updateCurrentGoal({color: color})"
                             class="size-8 rounded border-2 transition-all hover:scale-110 flex items-center justify-center"
                             [style.background-color]="color"
                             [class.border-white]="currentGoal().color === color"
                             [class.border-transparent]="currentGoal().color !== color"
                             [class.shadow-[0_0_10px_white]]="currentGoal().color === color">
                             @if(currentGoal().color === color) {
                                 <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                             }
                     </button>
                   }
                 </div>
               </div>
            </div>
            
            <div class="flex gap-3 mt-6 justify-end pt-4 border-t border-[#2a3441]">
                @if (editingId()) {
                  @if (!isConfirmingDelete()) {
                    <button (click)="deleteGoal()" class="mr-auto text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1 transition-colors">
                      <span class="material-symbols-outlined text-sm">delete</span>
                      Abort
                    </button>
                  } @else {
                    <div class="mr-auto flex items-center gap-2 bg-[#050608] p-1 px-2 rounded border border-red-900/50">
                       <span class="text-[9px] uppercase font-bold text-red-500 mr-1 tracking-wider">Confirm?</span>
                       <button (click)="confirmDelete()" class="text-[#ec5b13] hover:text-white flex items-center transition-colors" title="Confirm Delete">
                         <span class="material-symbols-outlined text-sm">check</span>
                       </button>
                       <button (click)="cancelDelete()" class="text-slate-500 hover:text-white flex items-center transition-colors" title="Cancel Delete">
                         <span class="material-symbols-outlined text-sm">close</span>
                       </button>
                    </div>
                  }
                }
              <button (click)="closeForm()" class="px-4 py-2 border border-[#2a3441] text-slate-400 hover:text-white hover:bg-white/5 rounded font-bold uppercase tracking-widest transition-all text-xs">
                  Cancel
              </button>
              <button (click)="saveGoal()" class="px-4 py-2 bg-[#ec5b13] text-white rounded font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(236,91,19,0.3)] hover:shadow-[0_0_25px_rgba(236,91,19,0.5)] hover:scale-[1.02] transition-all text-xs">
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
    
    ::ng-deep .cyberpunk-input .mat-mdc-form-field-focus-overlay {
      background-color: transparent !important;
    }
    
    ::ng-deep .cyberpunk-input .mat-mdc-input-element {
      color: white !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 0.875rem !important;
    }
    
    ::ng-deep .cyberpunk-input .mat-mdc-text-field-wrapper {
        background-color: #050608 !important;
        border: 1px solid #2a3441 !important;
        border-radius: 0.25rem !important;
        padding: 0 1rem !important;
    }
    
    ::ng-deep .cyberpunk-input .mat-mdc-form-field-infix {
        padding-top: 0.75rem !important;
        padding-bottom: 0.75rem !important;
        min-height: unset !important;
        border: none !important;
    }
    
    /* Remove underline */
    ::ng-deep .cyberpunk-input .mdc-line-ripple { 
        display: none !important; 
    }

    .custom-scrollbar-x::-webkit-scrollbar {
        height: 2px;
    }
    .custom-scrollbar-x::-webkit-scrollbar-track {
        background: #050608;
    }
    .custom-scrollbar-x::-webkit-scrollbar-thumb {
        background: #2a3441;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #ec5b13;
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
  `]
})
export class YearlyViewComponent implements OnInit {
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
