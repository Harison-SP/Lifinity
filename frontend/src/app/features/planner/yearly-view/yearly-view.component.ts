import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { PlannerService, PlannerGoal } from '../../../services/planner.service';
import { LinearCalendarComponent } from './linear-calendar/linear-calendar.component';
import { CalendarEvent } from '../../../models/calendar-event.model';

@Component({
  selector: 'app-yearly-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LinearCalendarComponent, MatChipsModule, MatIconModule, RouterLink],
  template: `
    <div class="h-full flex flex-col gap-4 relative font-manrope">
      <div class="flex flex-col gap-4 px-0 sm:px-4 pt-2">
         <div class="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
            <h2 class="text-2xl font-black text-black dark:text-white flex items-center gap-2 uppercase font-arvo">
              <span class="text-black dark:text-white material-symbols-outlined text-3xl">calendar_view_week</span>
              <button (click)="changeYear(-1)" class="p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-none border border-transparent hover:border-black dark:hover:border-white transition-colors"><span class="material-symbols-outlined">chevron_left</span></button>
              <span class="font-mono text-black dark:text-white underline decoration-4 decoration-electric-red">{{ currentYear() }}</span>
              <button (click)="changeYear(1)" class="p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-none border border-transparent hover:border-black dark:hover:border-white transition-colors"><span class="material-symbols-outlined">chevron_right</span></button>
              <span class="text-sm text-concrete-500 ml-2 tracking-widest font-mono font-bold">_CYCLE_OVERVIEW</span>
            </h2>

             <!-- Year Progress -->
             <div class="flex-1 w-full max-w-md mx-4 hidden md:flex flex-col gap-1">
                 <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-concrete-600 dark:text-concrete-400 font-mono">
                     <span>YEAR_PROGRESS</span>
                     <span>{{ yearProgress() | number:'1.0-0' }}%</span>
                 </div>
                 <div class="w-full h-2 bg-concrete-200 dark:bg-concrete-800 rigid-border-sm border-[1px] overflow-hidden">
                     <div class="h-full bg-electric-red border-r border-black dark:border-white transition-all duration-1000" [style.width.%]="yearProgress()"></div>
                 </div>
             </div>

             <!-- Filter Chips -->
             <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar-x w-full md:w-auto">
                 <span class="text-[10px] uppercase font-black text-concrete-900 dark:text-concrete-200 tracking-widest mr-2 whitespace-nowrap">Filter_Spectra:</span>
                 <div class="flex gap-2">
                    @for (color of presetColors; track color) {
                      <button (click)="toggleFilter(color)" 
                              class="size-6 rigid-border-sm border-[2px] transition-all hover:scale-110 flex items-center justify-center relative group shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white]"
                              [style.background-color]="color"
                              [class.ring-2]="selectedColors().has(color)"
                              [class.ring-black]="selectedColors().has(color)"
                              [class.dark:ring-white]="selectedColors().has(color)"
                              [class.opacity-40]="selectedColors().size > 0 && !selectedColors().has(color)">
                          @if(selectedColors().has(color)) {
                              <span class="absolute text-[10px] text-white font-black inset-0 flex items-center justify-center bg-black/20">âœ“</span>
                          }
                      </button>
                    }
                 </div>
             </div>

            <a routerLink="/add" 
                    class="px-4 py-2 bg-electric-red text-white rigid-border-sm border-[2px] font-black hover:bg-black dark:hover:bg-white dark:hover:text-black transition-all shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] flex items-center gap-2 uppercase tracking-wider text-xs ml-0 md:ml-auto whitespace-nowrap active:translate-y-1 active:shadow-none cursor-pointer decoration-0 dark:border-concrete-100">
              <span class="material-symbols-outlined text-lg">add</span>
              INIT_EVENT
            </a>
         </div>
      </div>

      <div class="flex-1 flex flex-col xl:flex-row overflow-hidden gap-4 px-0 sm:px-4 pb-4">
        <!-- Linear Calendar -->
        <div class="flex-1 bg-white dark:bg-concrete-900 rigid-border border-[4px] dark:border-concrete-100 p-0 overflow-hidden h-full flex flex-col relative group/calendar brutalist-shadow-active dark:shadow-[8px_8px_0_0_white]">
          <div class="absolute inset-x-0 top-0 h-1 bg-electric-red z-20"></div>
          <app-linear-calendar 
            [events]="calendarEvents()"
            (eventClick)="onEventClick($event)"
            (backgroundClick)="onBackgroundClick($event)"
            (eventUpdate)="onEventUpdate($event)">
          </app-linear-calendar>
        </div>

        <!-- Details Panel -->
        @if (selectedGoal()) {
          <div class="w-full xl:w-80 bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-4 sm:p-6 overflow-y-auto h-auto xl:h-full max-h-[70vh] xl:max-h-none flex flex-col transition-all relative animate-in slide-in-from-right duration-300 shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(255,255,255,0.1)] z-30 brutalist-shadow-active dark:shadow-[8px_8px_0_0_white]">
            <div class="flex justify-between items-center mb-6 border-b-4 border-black dark:border-concrete-100 pb-2">
                <h3 class="text-lg font-black text-black dark:text-white uppercase tracking-wider font-arvo">
                    PROTOCOL_DETAILS
                </h3>
                 <button (click)="closeDetails()" class="border-2 border-transparent hover:border-black dark:hover:border-white w-8 h-8 flex items-center justify-center dark:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-6 flex-1">
                <div>
                     <span class="text-[10px] font-black text-concrete-900 dark:text-concrete-200 uppercase tracking-widest block mb-1">DESIGNATION</span>
                     <p class="text-xl font-black text-black dark:text-white uppercase break-words leading-tight">{{ selectedGoal()!.title }}</p>
                </div>
                
                <div>
                     <span class="text-[10px] font-black text-concrete-900 dark:text-concrete-200 uppercase tracking-widest block mb-1">TIMEFRAME</span>
                     <div class="font-mono text-sm font-bold bg-concrete-100 dark:bg-concrete-900 dark:text-white p-2 border-2 border-concrete-200 dark:border-concrete-600">
                        {{ selectedGoal()!.startDate }} <span class="text-electric-red">>>></span> {{ selectedGoal()!.endDate }}
                     </div>
                </div>

                @if (selectedGoal()!.description) {
                    <div>
                         <span class="text-[10px] font-black text-concrete-900 dark:text-concrete-200 uppercase tracking-widest block mb-1">OPERATIONAL_NOTES</span>
                         <p class="text-sm font-bold text-concrete-600 dark:text-concrete-400 font-mono p-3 bg-concrete-50 dark:bg-concrete-900 border-2 border-dashed border-concrete-300 dark:border-concrete-600">
                            {{ selectedGoal()!.description }}
                         </p>
                    </div>
                }

                <div>
                     <span class="text-[10px] font-black text-concrete-900 dark:text-concrete-200 uppercase tracking-widest block mb-1">SPECTRA_ID</span>
                     <div class="h-6 w-full border-2 border-black dark:border-white" [style.background-color]="selectedGoal()!.color"></div>
                </div>
            </div>

            <div class="pt-6 border-t-4 border-black dark:border-concrete-100 mt-auto flex flex-col gap-3">
                <button (click)="navigateToEdit()" class="w-full py-3 bg-black dark:bg-concrete-100 text-white dark:text-black rigid-border-sm border-[2px] dark:border-concrete-900 font-black uppercase tracking-widest hover:bg-electric-red hover:text-white dark:hover:bg-electric-red dark:hover:text-white transition-all text-xs shadow-[4px_4px_0_0_concrete-400] dark:shadow-[4px_4px_0_0_white] flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-sm">edit</span>
                  INITIATE_OVERRIDE
                </button>

                @if (!isConfirmingDelete()) {
                    <button (click)="deleteGoal()" class="w-full py-3 bg-white dark:bg-concrete-900 text-electric-red rigid-border-sm border-[2px] border-electric-red font-black uppercase tracking-widest hover:bg-electric-red hover:text-white transition-all text-xs flex items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0_0_white] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                        <span class="material-symbols-outlined text-sm">delete</span>
                        TERMINATE_PROTOCOL
                    </button>
                } @else {
                     <div class="w-full p-3 bg-electric-red text-white rigid-border-sm border-[2px] border-black flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-200 shadow-[4px_4px_0_0_black]">
                        <span class="text-xs font-black uppercase tracking-widest text-center leading-none">CONFIRM_TERMINATION?</span>
                        <div class="flex gap-3 w-full mt-1">
                            <button (click)="confirmDelete()" class="flex-1 py-2 bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-colors border-2 border-black">CONFIRM</button>
                            <button (click)="cancelDelete()" class="flex-1 py-2 bg-black text-white font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-colors border-2 border-black">CANCEL</button>
                        </div>
                     </div>
                }
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
    
    .custom-scrollbar-x::-webkit-scrollbar { height: 4px; }
    .custom-scrollbar-x::-webkit-scrollbar-track { background: #e5e5e5; }
    .custom-scrollbar-x::-webkit-scrollbar-thumb { background: black; }

    :host-context(.dark) .custom-scrollbar-x::-webkit-scrollbar-track { background: #262626; }
    :host-context(.dark) .custom-scrollbar-x::-webkit-scrollbar-thumb { background: white; }
  `]
})
export class YearlyViewComponent implements OnInit {
  private plannerService = inject(PlannerService);
  private router = inject(Router);
  
  goals = signal<PlannerGoal[]>([]);
  currentYear = signal(new Date().getFullYear());
  selectedColors = signal<Set<string>>(new Set());
  selectedGoal = signal<PlannerGoal | null>(null);
  isConfirmingDelete = signal(false);
  
  yearProgress = computed(() => {
    const year = this.currentYear();
    const now = new Date();
    if (now.getFullYear() > year) return 100;
    if (now.getFullYear() < year) return 0;

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const progress = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
    return Math.min(Math.max(progress, 0), 100);
  });
  
  presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

  // Map PlannerGoals to CalendarEvents
  calendarEvents = computed(() => {
    const filters = this.selectedColors();
    
    const transformedEvents = this.goals()
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

  onEventClick(event: CalendarEvent) {
    // Show details panel instead of immediate navigation
    const goal = this.goals().find(g => g.id === event.id);
    if (goal) {
       this.selectedGoal.set(goal);
       this.isConfirmingDelete.set(false);
    }
  }

  closeDetails() {
      this.selectedGoal.set(null);
      this.isConfirmingDelete.set(false);
  }

  navigateToEdit() {
      const goal = this.selectedGoal();
      if (goal) {
          this.router.navigate(['/edit', goal.id]);
      }
  }

  deleteGoal() {
    this.isConfirmingDelete.set(true);
  }

  cancelDelete() {
    this.isConfirmingDelete.set(false);
  }

  confirmDelete() {
      const goal = this.selectedGoal();
      if (goal) {
          this.plannerService.deleteGoal(goal.id!).subscribe(() => {
              this.loadGoals();
              this.closeDetails();
          });
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

  // Linear calendar might emit background click for creating events via drag selection
  // We just redirect to add page
  onBackgroundClick(date: Date) {
      this.router.navigate(['/add']);
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
}




