import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannerService, PlannerGoal } from '../../../services/planner.service';

@Component({
  selector: 'app-monthly-view',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col font-manrope">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-4">
        <h2 class="text-2xl font-black text-black flex items-center gap-2 uppercase font-arvo">
          <span class="material-symbols-outlined text-3xl">calendar_month</span>
          Monthly_Directives
        </h2>
        
        <button (click)="showAddForm.set(!showAddForm())" 
                class="px-4 py-2 bg-electric-red text-white rigid-border-sm border-[2px] font-black uppercase tracking-wider text-xs shadow-[4px_4px_0_0_black] hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2">
          <span class="material-symbols-outlined text-lg">add</span>
          INIT_DIRECTIVE
        </button>
      </div>

      <!-- Add Goal Form -->
      @if (showAddForm()) {
        <div class="mb-8 mx-4 bg-white rigid-border border-[4px] p-6 relative brutalist-shadow-active">
            <div class="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
                <h3 class="text-lg font-black text-black uppercase tracking-wider font-arvo">New_Directive_Parameters</h3>
                <button (click)="showAddForm.set(false)" class="border-2 border-transparent hover:border-black w-8 h-8 flex items-center justify-center">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
          <div class="space-y-4">
              <div class="space-y-1">
                 <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Directive_Title</label>
                 <input [(ngModel)]="newGoal.title" placeholder="ENTER_TITLE" 
                        class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all rounded-none uppercase placeholder:text-concrete-300">
              </div>

              <div class="space-y-1">
                 <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Directive_Details</label>
                 <textarea [(ngModel)]="newGoal.description" placeholder="// ADD_DETAILS..." 
                        class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all resize-none rounded-none uppercase placeholder:text-concrete-300" rows="3"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                   <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Cycle_Year</label>
                   <input type="number" [(ngModel)]="newGoal.year" [placeholder]="currentYear.toString()" 
                          class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all rounded-none">
                </div>
                <div class="space-y-1">
                   <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Target_Month</label>
                   <select [(ngModel)]="newGoal.month" 
                        class="w-full px-4 py-3 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none transition-all rounded-none appearance-none cursor-pointer uppercase">
                      @for (month of months; track month.value) {
                        <option [value]="month.value">{{month.label}}</option>
                      }
                    </select>
                </div>
              </div>
          </div>
          <div class="flex gap-3 mt-6 border-t-4 border-black pt-4">
            <button (click)="addGoal()" class="flex-1 px-6 py-3 bg-black text-white rigid-border-sm border-[2px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all text-xs shadow-[4px_4px_0_0_concrete-400]">
                Initialize_Directive
            </button>
          </div>
        </div>
      }

      <!-- Goals List -->
      <div class="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar space-y-4">
        @for (goal of goals(); track goal.id) {
          <div class="bg-white p-6 rigid-border-sm border-[2px] transition-all group relative overflow-hidden hover:shadow-[4px_4px_0_0_black] cursor-pointer">
            <div class="flex justify-between items-start mb-4 relative z-10">
              <div class="flex items-start gap-4">
                  <div class="p-3 bg-black text-white border-2 border-black rigid-border-sm flex items-center justify-center">
                      <span class="material-symbols-outlined">star</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-black text-black uppercase tracking-wide font-arvo">{{goal.title}}</h3>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] bg-concrete-200 text-black px-1.5 py-0.5 font-mono border border-black font-bold uppercase">{{getMonthName(goal.month!)}} // {{goal.year}}</span>
                        <span class="text-[10px] text-electric-red font-mono tracking-widest uppercase font-bold">
                            ACTIVE
                        </span>
                    </div>
                  </div>
              </div>
              <button (click)="deleteGoal(goal.id!)" class="text-concrete-400 hover:text-electric-red transition-colors p-2 border-2 border-transparent hover:border-black">
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
            @if (goal.description) {
               <div class="pl-[60px] relative z-10">
                  <p class="text-black text-sm font-mono border-l-4 border-black pl-3 py-1 uppercase">{{goal.description}}</p>
              </div>
            }
          </div>
        } @empty {
            <div class="flex flex-col items-center justify-center py-20 border-4 border-dashed border-concrete-300">
             <span class="material-symbols-outlined text-6xl text-concrete-400 mb-4">calendar_today</span>
             <p class="text-concrete-500 font-mono uppercase tracking-widest font-bold">NO_DIRECTIVES_DETECTED</p>
             <button (click)="showAddForm.set(true)" class="mt-4 text-black hover:bg-black hover:text-white px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-colors">
                 Initialize_First_Directive
             </button>
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
    
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `]
})
export class MonthlyViewComponent implements OnInit {
   // Logic remains identical
  private plannerService = inject(PlannerService);
  
  goals = signal<PlannerGoal[]>([]);
  showAddForm = signal(false);
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  
  newGoal: Partial<PlannerGoal> = {
    title: '',
    description: '',
    year: this.currentYear,
    month: this.currentMonth,
    period: 'monthly',
    status: 'active',
    tasks: []
  };

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    this.plannerService.getGoals({ period: 'monthly' }).subscribe(goals => {
      this.goals.set(goals);
    });
  }

  addGoal() {
    if (!this.newGoal.title?.trim()) return;
    
    // Ensure all required fields for creation are present
    const goalToCreate = {
        ...this.newGoal,
        year: this.newGoal.year || this.currentYear,
        month: this.newGoal.month || this.currentMonth,
        period: 'monthly' as const,
        status: 'active' as const,
        tasks: []
    } as PlannerGoal;

    this.plannerService.createGoal(goalToCreate).subscribe(() => {
      this.loadGoals();
      this.newGoal = {
        title: '',
        description: '',
        year: this.currentYear,
        month: this.currentMonth,
        period: 'monthly',
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

  getMonthName(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }
}
