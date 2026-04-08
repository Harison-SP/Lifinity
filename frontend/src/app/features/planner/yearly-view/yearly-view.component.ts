import { Component, signal, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
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
    <div class="min-h-screen bg-white font-body transition-colors duration-300 paper-texture p-4 md:p-6">
      <!-- Header -->
      <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-alabaster p-6 rounded-lg shadow-gentle border border-taupe/10">
        <div class="flex items-center gap-4">
          <button (click)="changeYear(-1)" class="w-10 h-10 flex items-center justify-center rounded-lg border border-taupe/30 hover:bg-sand transition-colors">
            <span class="material-symbols-outlined text-taupe">chevron_left</span>
          </button>
          <div class="text-center md:text-left">
            <h2 class="font-heading text-2xl md:text-3xl font-bold text-charcoal">
              {{ currentYear() }}
            </h2>
            <p class="text-sm text-taupe mt-1">Yearly goals overview</p>
          </div>
          <button (click)="changeYear(1)" class="w-10 h-10 flex items-center justify-center rounded-lg border border-taupe/30 hover:bg-sand transition-colors">
            <span class="material-symbols-outlined text-taupe">chevron_right</span>
          </button>
        </div>

        <!-- Year Progress -->
        <div class="flex-1 w-full max-w-md mx-0 md:mx-4 mt-4 md:mt-0">
          <div class="flex justify-between text-xs font-bold uppercase tracking-wider text-taupe mb-2">
            <span>Year Progress</span>
            <span>{{ yearProgress() | number:'1.0-0' }}%</span>
          </div>
          <div class="w-full h-3 bg-sand rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all duration-1000" [style.width.%]="yearProgress()"></div>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 custom-scrollbar w-full md:w-auto mt-4 md:mt-0">
          <span class="text-xs uppercase font-bold text-taupe mr-2 whitespace-nowrap">Filter by Color:</span>
          <div class="flex gap-2">
            @for (color of presetColors; track color) {
              <button (click)="toggleFilter(color)"
                      class="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm"
                      [style.background-color]="color"
                      [class.border-primary]="selectedColors().has(color)"
                      [class.border-taupe]="!selectedColors().has(color)"
                      [class.opacity-40]="selectedColors().size > 0 && !selectedColors().has(color)"
                      [title]="selectedColors().has(color) ? 'Remove filter' : 'Filter by this color'">
                @if (selectedColors().has(color)) {
                  <span class="text-xs text-white font-bold flex items-center justify-center w-full h-full bg-black/20 rounded-full">✓</span>
                }
              </button>
            }
          </div>
        </div>

        <a routerLink="/add"
            class="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium text-sm flex items-center gap-2 whitespace-nowrap shadow-sm">
          <span class="material-symbols-outlined text-sm">add</span>
          Add Goal
        </a>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col xl:flex-row overflow-hidden gap-6">
        <!-- Linear Calendar -->
        <div class="flex-1 bg-white rounded-lg shadow-gentle border border-taupe/10 overflow-hidden flex flex-col">
          <div class="absolute inset-x-0 top-0 h-1 bg-primary"></div>
          <app-linear-calendar
            [events]="calendarEvents()"
            (eventClick)="onEventClick($event)"
            (backgroundClick)="onBackgroundClick($event)"
            (eventUpdate)="onEventUpdate($event)">
          </app-linear-calendar>
        </div>

        <!-- Details Panel -->
        @if (selectedGoal()) {
          <div class="w-full xl:w-80 bg-alabaster rounded-lg shadow-gentle p-6 border border-taupe/10 overflow-y-auto flex flex-col">
            <div class="flex justify-between items-center mb-6 border-b border-taupe/20 pb-4">
              <h3 class="font-heading text-lg font-bold text-charcoal">Goal Details</h3>
              <button (click)="closeDetails()" class="p-1 hover:text-primary transition-colors">
                <span class="material-symbols-outlined text-taupe">close</span>
              </button>
            </div>

            <div class="space-y-6 flex-1">
              <div>
                <label class="block text-xs font-bold uppercase text-taupe mb-2">Goal Title</label>
                <p class="font-heading text-xl font-bold text-charcoal">{{ selectedGoal()!.title }}</p>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase text-taupe mb-2">Timeframe</label>
                <div class="p-4 bg-white rounded-lg border border-taupe/20 font-mono text-sm text-charcoal">
                  <div class="flex items-center gap-2">
                    <span>{{ selectedGoal()!.startDate | date:'MMM d, yyyy' }}</span>
                    <span class="text-primary">→</span>
                    <span>{{ selectedGoal()!.endDate | date:'MMM d, yyyy' }}</span>
                  </div>
                </div>
              </div>

              @if (selectedGoal()!.description) {
                <div>
                  <label class="block text-xs font-bold uppercase text-taupe mb-2">Description</label>
                  <div class="p-4 bg-white rounded-lg border border-taupe/20 text-sm text-charcoal leading-relaxed">
                    {{ selectedGoal()!.description }}
                  </div>
                </div>
              }

              <div>
                <label class="block text-xs font-bold uppercase text-taupe mb-2">Color</label>
                <div class="h-8 rounded-lg border-2 border-taupe/20" [style.background-color]="selectedGoal()!.color"></div>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase text-taupe mb-2">Category</label>
                <span class="inline-block px-3 py-1 bg-sand text-charcoal text-sm rounded-full font-medium">
                  {{ $any(selectedGoal())?.category || 'General' }}
                </span>
              </div>
            </div>

            <div class="pt-6 border-t border-taupe/20 mt-auto flex flex-col gap-3">
              <button (click)="navigateToEdit()" class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">edit</span>
                Edit Goal
              </button>

              @if (!isConfirmingDelete()) {
                <button (click)="deleteGoal()" class="w-full py-3 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-sm">delete</span>
                  Delete Goal
                </button>
              } @else {
                <div class="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p class="text-sm font-bold text-red-600 text-center mb-3">Delete this goal?</p>
                  <div class="flex gap-3">
                    <button (click)="confirmDelete()" class="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium">Delete</button>
                    <button (click)="cancelDelete()" class="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors text-sm font-medium">Cancel</button>
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
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--color-sand); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-taupe); border-radius: 3px; }
    .custom-scrollbar-x::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar-x::-webkit-scrollbar-track { background: var(--color-sand); }
    .custom-scrollbar-x::-webkit-scrollbar-thumb { background: var(--color-taupe); border-radius: 3px; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
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
            this.goals.update(gs => gs.map(g => g.id === goal.id ? updatedGoal : g));
            this.plannerService.updateGoal(goal.id!, updatedGoal).subscribe({
                error: (err) => {
                    console.error('Failed to update goal', err);
                    this.loadGoals();
                }
            });
        }
    }

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