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
         <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-[#0d1b12] dark:text-white flex items-center gap-2">
              <button (click)="changeYear(-1)" class="p-1 hover:bg-black/10 rounded-full"><mat-icon>chevron_left</mat-icon></button>
              {{ currentYear() }}
              <button (click)="changeYear(1)" class="p-1 hover:bg-black/10 rounded-full"><mat-icon>chevron_right</mat-icon></button>
            </h2>

             <!-- Filter Chips -->
             <mat-chip-listbox multiple (change)="updateFilters($event)">
                @for (color of presetColors; track color) {
                  <mat-chip-option [value]="color" [selected]="selectedColors().has(color)" 
                                   [style.background-color]="color"
                                   class="custom-chip">
                  </mat-chip-option>
                }
             </mat-chip-listbox>

            <button (click)="openAddForm()" 
                    class="px-4 py-2 bg-[#13ec5b] text-[#0d1b12] rounded-xl font-semibold hover:bg-[#0ba841] transition-colors shadow-sm flex items-center gap-2">
              <mat-icon iconPositionEnd>add</mat-icon>
              Add Event
            </button>
         </div>
      </div>

      <div class="flex-1 flex overflow-hidden gap-4 px-4 pb-4">
        <!-- Linear Calendar -->
        <div class="flex-1 bg-white dark:bg-[#1a2c20] rounded-2xl shadow-lg p-1 overflow-hidden h-full flex flex-col">
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
          <div class="w-80 bg-white dark:bg-[#1a2c20] p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-y-auto h-full flex flex-col transition-all">
            <h3 class="text-lg font-bold mb-4 text-[#0d1b12] dark:text-white">{{ editingId() ? 'Edit Event' : 'New Event' }}</h3>
            
            <div class="flex-1 overflow-y-auto space-y-3">
               <mat-form-field appearance="outline" class="w-full">
                 <mat-label>Title</mat-label>
                 <input matInput [ngModel]="currentGoal().title" (ngModelChange)="updateCurrentGoal({title: $event})">
               </mat-form-field>

               <mat-form-field appearance="outline" class="w-full">
                 <mat-label>Description</mat-label>
                 <textarea matInput [ngModel]="currentGoal().description" (ngModelChange)="updateCurrentGoal({description: $event})" rows="3"></textarea>
               </mat-form-field>

               <mat-form-field appearance="outline" class="w-full">
                 <mat-label>Enter a date range</mat-label>
                 <mat-date-range-input [rangePicker]="picker">
                   <input matStartDate placeholder="Start date" [(ngModel)]="currentStartDateStr" (dateChange)="onDateChange('start', $event)">
                   <input matEndDate placeholder="End date" [(ngModel)]="currentEndDateStr" (dateChange)="onDateChange('end', $event)">
                 </mat-date-range-input>
                 <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                 <mat-date-range-picker #picker></mat-date-range-picker>
               </mat-form-field>

               <div>
                 <label class="block text-xs font-semibold text-[#4c9a66] mb-1">Color</label>
                 <div class="flex gap-2 flex-wrap">
                   @for (color of presetColors; track color) {
                     <button (click)="updateCurrentGoal({color: color})"
                             class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                             [style.background-color]="color"
                             [class.border-black]="currentGoal().color === color"
                             [class.border-transparent]="currentGoal().color !== color">
                     </button>
                   }
                 </div>
               </div>
            </div>
            
            <div class="flex gap-3 mt-6 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                @if (editingId()) {
                  @if (!isConfirmingDelete()) {
                    <button (click)="deleteGoal()" class="mr-auto text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1">
                      <mat-icon class="scale-75">delete</mat-icon>
                      Delete
                    </button>
                  } @else {
                    <div class="mr-auto flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 px-2 rounded-lg border border-red-100 dark:border-red-900/30">
                       <span class="text-[10px] uppercase font-bold text-red-400 mr-1">Sure?</span>
                       <button (click)="confirmDelete()" class="text-green-500 hover:text-green-700 flex items-center" title="Confirm Delete">
                         <mat-icon>done</mat-icon>
                       </button>
                       <button (click)="cancelDelete()" class="text-red-500 hover:text-red-700 flex items-center" title="Cancel Delete">
                         <mat-icon>close</mat-icon>
                       </button>
                    </div>
                  }
                }
              <button (click)="closeForm()" class="px-4 py-2 text-[#4c9a66] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
              <button (click)="saveGoal()" class="px-4 py-2 bg-[#13ec5b] text-[#0d1b12] rounded-lg font-semibold shadow-sm hover:shadow-md transition-all">Save</button>
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
    
    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: transparent !important;
    }
    
    ::ng-deep .mat-mdc-input-element {
      color: white !important;
    }
    
    ::ng-deep .mat-mdc-form-field-label {
      color: #94a3b8 !important; /* slate-400 */
    }
    
    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: rgba(30, 41, 59, 0.5) !important; /* slate-800/50 */
    }

    .custom-chip {
      margin: 0 4px !important;
    }
    
    ::ng-deep .mat-mdc-chip-listbox {
      --mdc-chip-label-text-size: 10px;
      display: flex;
      gap: 8px;
    }

    ::ng-deep .mat-mdc-standard-chip {
      --mdc-chip-container-height: 24px;
      --mdc-chip-container-shape-radius: 12px;
      min-width: 24px !important;
      padding: 0 !important;
    }

    ::ng-deep .mat-mdc-chip-action-label {
      display: none !important;
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
    return {
      title: '',
      description: '',
      year: this.currentYear(),
      period: 'yearly',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
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

    if (this.editingId()) {
      this.plannerService.updateGoal(this.editingId()!, current).subscribe(() => {
        this.loadGoals();
        this.closeForm();
      });
    } else {
      this.plannerService.createGoal(current).subscribe(() => {
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

  updateFilters(event: any) {
      const val = event.value; 
      this.selectedColors.set(new Set(val));
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
