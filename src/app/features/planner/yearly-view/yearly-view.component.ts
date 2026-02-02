import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannerService, PlannerGoal } from '../../../services/planner.service';

@Component({
  selector: 'app-yearly-view',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-[#0d1b12] dark:text-white">Yearly Goals</h2>
        <button (click)="showAddForm.set(!showAddForm())" 
                class="px-4 py-2 bg-[#13ec5b] text-[#0d1b12] rounded-xl font-semibold hover:bg-[#0ba841] transition-colors">
          <span class="material-symbols-outlined align-middle">add</span>
          Add Goal
        </button>
      </div>

      <!-- Add Goal Form -->
      @if (showAddForm()) {
        <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl mb-6">
          <input [(ngModel)]="newGoal.title" placeholder="Goal title" 
                 class="w-full px-4 py-3 rounded-lg mb-3 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white">
          <textarea [(ngModel)]="newGoal.description" placeholder="Description (optional)" 
                    class="w-full px-4 py-3 rounded-lg mb-3 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white" rows="3"></textarea>
          <input type="number" [(ngModel)]="newGoal.year" [placeholder]="currentYear.toString()" 
                 class="w-full px-4 py-3 rounded-lg mb-3 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 text-[#0d1b12] dark:text-white">
          <div class="flex gap-3">
            <button (click)="addGoal()" class="px-6 py-2 bg-[#13ec5b] text-[#0d1b12] rounded-lg font-semibold">Save</button>
            <button (click)="showAddForm.set(false)" class="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-[#0d1b12] dark:text-white rounded-lg">Cancel</button>
          </div>
        </div>
      }

      <!-- Goals List -->
      <div class="space-y-4">
        @for (goal of goals(); track goal.id) {
          <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-xl font-bold text-[#0d1b12] dark:text-white">{{goal.title}}</h3>
                <p class="text-sm text-[#4c9a66] dark:text-[#13ec5b]">Year: {{goal.year}}</p>
              </div>
              <button (click)="deleteGoal(goal.id!)" class="text-red-500 hover:text-red-700">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
            @if (goal.description) {
              <p class="text-[#4c9a66] dark:text-slate-300 mb-3">{{goal.description}}</p>
            }
            @if (goal.tasks && goal.tasks.length > 0) {
              <div class="mt-3">
                <p class="text-sm font-semibold text-[#0d1b12] dark:text-white mb-2">Tasks:</p>
                <ul class="list-disc list-inside text-[#4c9a66] dark:text-slate-300">
                  @for (task of goal.tasks; track $index) {
                    <li>{{task}}</li>
                  }
                </ul>
              </div>
            }
          </div>
        } @empty {
          <p class="text-center text-[#4c9a66] dark:text-slate-400 py-8">No yearly goals yet. Add one to get started!</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .material-symbols-outlined { 
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
  `]
})
export class YearlyViewComponent implements OnInit {
  private plannerService = inject(PlannerService);
  
  goals = signal<PlannerGoal[]>([]);
  showAddForm = signal(false);
  currentYear = new Date().getFullYear();
  
  newGoal = {
    title: '',
    description: '',
    year: this.currentYear,
    period: 'yearly' as const,
    status: 'active' as const,
    tasks: []
  };

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    this.plannerService.getGoals({ period: 'yearly' }).subscribe(goals => {
      this.goals.set(goals);
    });
  }

  addGoal() {
    if (!this.newGoal.title.trim()) return;
    
    this.plannerService.createGoal(this.newGoal).subscribe(() => {
      this.loadGoals();
      this.newGoal = {
        title: '',
        description: '',
        year: this.currentYear,
        period: 'yearly',
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
}
