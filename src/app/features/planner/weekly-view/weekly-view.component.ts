import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannerService, PlannerGoal } from '../../../services/planner.service';

@Component({
  selector: 'app-weekly-view',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <div class="flex justify-between items-center mb-8 px-4">
        <h2 class="text-2xl font-bold text-white flex items-center gap-2 tracking-tight uppercase">
          <span class="text-[#ec5b13] material-symbols-outlined">view_week</span>
          Weekly_Objectives
        </h2>
        
        <button (click)="showAddForm.set(!showAddForm())" 
                class="px-4 py-2 bg-[#ec5b13] text-white rounded font-bold hover:bg-white hover:text-[#ec5b13] transition-all shadow-[0_0_15px_rgba(236,91,19,0.4)] flex items-center gap-2 uppercase tracking-wider text-xs">
          <span class="material-symbols-outlined text-lg">add</span>
          INIT_GOAL
        </button>
      </div>

      <!-- Add Goal Form -->
      @if (showAddForm()) {
        <div class="mb-8 mx-4 bg-[#0c0e12] p-6 rounded border border-[#ec5b13] relative animate-in slide-in-from-top duration-300 shadow-[0_0_30px_rgba(236,91,19,0.15)]">
            <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ec5b13]"></div>
            <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ec5b13]"></div>
            <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#ec5b13]"></div>
            <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#ec5b13]"></div>
            
            <h3 class="text-lg font-black text-white uppercase tracking-wider mb-4 border-b border-[#2a3441] pb-2">
                <span class="text-[#ec5b13] mr-2">>></span>New_Objective_Parameters
            </h3>

          <div class="space-y-4">
              <div class="space-y-1">
                 <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Objective_Title</label>
                 <input [(ngModel)]="newGoal.title" placeholder="ENTER_TITLE" 
                        class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all rounded">
              </div>
              
              <div class="space-y-1">
                 <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculated_Params</label>
                 <textarea [(ngModel)]="newGoal.description" placeholder="// ADD_DETAILS..." 
                        class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all resize-none rounded" rows="3"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                   <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cycle_Year</label>
                   <input type="number" [(ngModel)]="newGoal.year" [placeholder]="currentYear.toString()" 
                          class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all rounded">
                </div>
                <div class="space-y-1">
                   <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sequence_Week</label>
                   <input type="number" [(ngModel)]="newGoal.week" placeholder="1-52" min="1" max="52"
                          class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all rounded">
                </div>
              </div>
          </div>
          
          <div class="flex gap-3 mt-6 border-t border-[#2a3441] pt-4">
            <button (click)="addGoal()" class="flex-1 px-6 py-3 bg-[#ec5b13] text-white rounded font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(236,91,19,0.3)] hover:shadow-[0_0_25px_rgba(236,91,19,0.5)] hover:scale-[1.02] transition-all text-xs">
                Initialize_Objective
            </button>
            <button (click)="showAddForm.set(false)" class="px-6 py-3 border border-[#2a3441] text-slate-400 hover:text-white hover:bg-white/5 rounded font-bold uppercase tracking-widest transition-all text-xs">
                Cancel
            </button>
          </div>
        </div>
      }

      <!-- Goals List -->
      <div class="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar space-y-4">
        @for (goal of goals(); track goal.id) {
          <div class="bg-[#0e1116] p-6 rounded border border-[#2a3441] hover:border-[#ec5b13] transition-all group relative overflow-hidden">
            <!-- Scanline -->
            <div class="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none"></div>

            <div class="flex justify-between items-start mb-4 relative z-10">
              <div class="flex items-start gap-4">
                  <div class="p-3 bg-[#ec5b13]/10 border border-[#ec5b13]/20 rounded text-[#ec5b13] group-hover:bg-[#ec5b13] group-hover:text-white transition-colors">
                      <span class="material-symbols-outlined">flag</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-white uppercase tracking-wide group-hover:text-[#ec5b13] transition-colors">{{goal.title}}</h3>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">W{{goal.week}} // {{goal.year}}</span>
                        <span class="text-[10px] text-[#ec5b13] font-mono tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            ACTIVE
                        </span>
                    </div>
                  </div>
              </div>
              <button (click)="deleteGoal(goal.id!)" class="text-slate-600 hover:text-red-500 transition-colors p-2 rounded hover:bg-red-500/10">
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
            
            @if (goal.description) {
              <div class="pl-[60px] relative z-10">
                  <p class="text-slate-400 text-sm font-mono border-l-2 border-[#2a3441] pl-3 py-1">{{goal.description}}</p>
              </div>
            }
          </div>
        } @empty {
          <div class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#2a3441] rounded opacity-50">
             <span class="material-symbols-outlined text-6xl text-slate-700 mb-4">track_changes</span>
             <p class="text-slate-500 font-mono uppercase tracking-widest">NO_OBJECTIVES_DETECTED</p>
             <button (click)="showAddForm.set(true)" class="mt-4 text-[#ec5b13] hover:underline text-xs font-bold uppercase tracking-wider">
                 Initialize_First_Objective
             </button>
          </div>
        }
      </div>
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
    /* Remove default underline of Angular Material if used later */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `]
})
export class WeeklyViewComponent implements OnInit {
  private plannerService = inject(PlannerService);
  
  goals = signal<PlannerGoal[]>([]);
  showAddForm = signal(false);
  currentYear = new Date().getFullYear();
  currentWeek = this.getWeekNumber(new Date());
  
  newGoal: Partial<PlannerGoal> = {
    title: '',
    description: '',
    year: this.currentYear,
    week: this.currentWeek,
    period: 'weekly',
    status: 'active',
    tasks: []
  };

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    this.plannerService.getGoals({ period: 'weekly' }).subscribe(goals => {
      this.goals.set(goals);
    });
  }

  addGoal() {
    if (!this.newGoal.title?.trim()) return;
    
    // Ensure all required fields are present
    const goalToCreate = {
        ...this.newGoal,
        year: this.newGoal.year || this.currentYear,
        week: this.newGoal.week || this.currentWeek,
        period: 'weekly' as const,
        status: 'active' as const,
        tasks: []
    } as PlannerGoal; // Cast to PlannerGoal to satisfy type

    this.plannerService.createGoal(goalToCreate).subscribe(() => {
      this.loadGoals();
      this.newGoal = {
        title: '',
        description: '',
        year: this.currentYear,
        week: this.currentWeek,
        period: 'weekly',
        status: 'active',
        tasks: []
      };
      this.showAddForm.set(false);
    });
  }

  deleteGoal(id: string) {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.plannerService.deleteGoal(id).subscribe(() => {
        this.loadGoals();
      });
    }
  }

  getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
