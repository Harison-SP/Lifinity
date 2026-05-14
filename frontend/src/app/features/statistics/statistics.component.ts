import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../services/habit.service';


@Component({
    selector: 'app-statistics',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div class="min-h-screen bg-white px-3 md:px-6 py-3 md:py-8 font-body pb-24 transition-colors duration-300 paper-texture">
        <!-- Header -->
        <header class="mb-6 md:mb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-3 md:gap-4">
            <div>
                <h1 class="font-heading text-2xl md:text-5xl font-bold text-charcoal">
                    Statistics
                </h1>
                <p class="text-taupe text-sm md:text-base mt-0.5 md:mt-1">Track your progress and achievements</p>
            </div>

            <a routerLink="/add" class="inline-flex items-center gap-2 bg-primary text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg shadow-sm hover:bg-primary-light transition-all text-xs md:text-sm">
                <span class="material-symbols-outlined text-sm md:text-base">add</span>
                Add Habit
            </a>
        </header>

        <!-- Aggregate Stats -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
            <!-- Overall Completion (Spans 2 cols on mobile if needed, or stays grid-cols-2) -->
            <div class="bg-alabaster rounded-lg shadow-sm p-4 md:p-6 border border-taupe/10 col-span-2 md:col-span-1">
                <div class="flex items-center justify-between mb-2 md:mb-4">
                    <span class="text-[9px] md:text-xs font-bold uppercase tracking-wider text-taupe">Overall Completion</span>
                    <span class="material-symbols-outlined text-terracotta text-sm md:text-base">percent</span>
                </div>
                <div class="flex items-baseline gap-2 mb-2 md:mb-3">
                    <span class="text-2xl md:text-4xl font-bold text-charcoal">{{ globalEfficiency() }}%</span>
                </div>
                <div class="w-full h-1.5 md:h-2 bg-sand rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all" [style.width.%]="globalEfficiency()"></div>
                </div>
            </div>

            <!-- Total Completions -->
            <div class="bg-primary text-white rounded-lg shadow-sm p-4 md:p-6">
                <div class="flex items-center justify-between mb-2 md:mb-4">
                    <span class="text-[9px] md:text-xs font-bold uppercase tracking-wider text-white/80">Total</span>
                    <span class="material-symbols-outlined text-sm md:text-base">check_circle</span>
                </div>
                <div class="flex items-baseline gap-1 md:gap-2">
                    <span class="text-2xl md:text-4xl font-bold">{{ totalCompletions() }}</span>
                </div>
                <p class="text-[8px] md:text-sm text-white/80 mt-1">Across {{ habitService.habits().length }} habits</p>
            </div>

            <!-- Best Streak -->
            <div class="bg-alabaster rounded-lg shadow-sm p-4 md:p-6 border border-taupe/10">
                <div class="flex items-center justify-between mb-2 md:mb-4">
                    <span class="text-[9px] md:text-xs font-bold uppercase tracking-wider text-taupe">Best Streak</span>
                    <span class="material-symbols-outlined text-terracotta text-xl md:text-2xl">local_fire_department</span>
                </div>
                <div class="flex items-baseline gap-1 md:gap-2">
                    <span class="text-2xl md:text-4xl font-bold text-charcoal">{{ bestStreak() }}</span>
                    <span class="text-[10px] md:text-sm text-taupe">days</span>
                </div>
            </div>
        </div>

        <!-- Habit Cards -->
        <h2 class="font-heading text-xl md:text-3xl font-bold text-charcoal mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
            <span class="w-2 md:w-3 h-2 md:h-3 bg-primary rounded-full"></span>
            Your Habits
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            @for (habit of habitService.habits(); track habit.id) {
                <a [routerLink]="['/details', habit.id]" class="block bg-white rounded-lg shadow-sm p-4 md:p-6 border border-taupe/10 hover:shadow-gentle transition-all hover:border-primary/30">
                    <div class="flex items-center justify-between mb-3 md:mb-4">
                        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-sand flex items-center justify-center">
                            <span class="material-symbols-outlined text-charcoal text-xl md:text-2xl">{{ habit.icon || 'star' }}</span>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="text-[8px] md:text-xs font-bold bg-sand text-charcoal px-2 py-0.5 md:py-1 rounded-full">
                                {{ habit.category || 'General' }}
                            </span>
                            @if (habit.completedToday) {
                                <span class="text-[8px] md:text-xs font-bold bg-sage text-white px-2 py-0.5 md:py-1 rounded-full">Done today</span>
                            }
                        </div>
                    </div>

                    <h3 class="font-heading text-lg md:text-xl font-bold text-charcoal mb-1 truncate">{{ habit.name }}</h3>
                    <p class="text-[10px] md:text-sm text-taupe mb-3 md:mb-4">{{ habit.frequencyType || 'Daily' }} • {{ habit.type === 'measurable' ? 'Measurable' : 'Simple' }}</p>

                    <div class="grid grid-cols-2 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-taupe/20">
                        <div>
                            <p class="text-[8px] md:text-xs text-taupe font-bold uppercase">Streak</p>
                            <p class="text-base md:text-xl font-bold text-charcoal">{{ habit.streak }} days</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[8px] md:text-xs text-taupe font-bold uppercase">Rate</p>
                            <p class="text-base md:text-xl font-bold" [class]="habit.completionRate >= 80 ? 'text-sage' : habit.completionRate >= 50 ? 'text-primary' : 'text-terracotta'">
                                {{ habit.completionRate }}%
                            </p>
                        </div>
                    </div>

                    @if (habit.bestStreak > 0) {
                        <div class="mt-3 md:mt-4 p-2 md:p-3 bg-sand/30 rounded-lg flex justify-between items-center">
                            <p class="text-[10px] text-taupe">Best streak:</p>
                            <p class="text-xs md:text-sm font-bold text-charcoal">{{ habit.bestStreak }} days</p>
                        </div>
                    }
                </a>
            }
        </div>

        @if (habitService.habits().length === 0) {
            <div class="text-center py-10 md:py-16 px-6 md:px-8 bg-alabaster rounded-lg border border-dashed border-taupe/30 mt-6 md:mt-8">
                <span class="material-symbols-outlined text-4xl md:text-6xl text-taupe mb-3 md:mb-4">favorite</span>
                <h3 class="font-heading text-lg md:text-2xl font-bold text-charcoal mb-1 md:mb-2">No habits yet</h3>
                <p class="text-xs md:text-base text-taupe mb-4 md:mb-6">Start building better habits today. Create your first habit and begin your journey.</p>
                <a routerLink="/add" class="inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 md:py-3 px-5 md:px-6 rounded-lg hover:bg-primary-light transition-colors text-sm md:text-base">
                    Create Your First Habit
                    <span class="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
                </a>
            </div>
        }
    </div>
    `,
    styles: [`
        :host { display: block; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent {
    habitService = inject(HabitService);

    isMobile = signal(window.innerWidth < 768);

    globalEfficiency = computed(() => {
        const habits = this.habitService.habits();
        if (habits.length === 0) return 0;
        const totalRate = habits.reduce((acc, h) => acc + (h.completionRate || 0), 0);
        return Math.round(totalRate / habits.length);
    });

    totalCompletions = computed(() => {
        return this.habitService.habits().reduce((acc, h) => acc + (h.streak || 0), 0);
    });

    bestStreak = computed(() => {
        const habits = this.habitService.habits();
        if (habits.length === 0) return 0;
        return Math.max(...habits.map(h => h.streak || 0));
    });
}