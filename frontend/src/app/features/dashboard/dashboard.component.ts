import { Component, ChangeDetectionStrategy, inject, computed, signal, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { SystemService } from '../../services/system.service';

@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, FormsModule],
    template: `
    <div class="min-h-screen bg-white px-4 py-5 sm:p-6 md:p-8 font-body transition-colors duration-300 overflow-x-hidden paper-texture">
        <!-- Dashboard Header -->
        <header class="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
            <div class="space-y-2">
                <h1 class="font-heading text-3xl md:text-5xl font-bold text-charcoal">
                    {{ getGreeting() }}, Habit Tracker
                </h1>
                <p class="text-taupe text-base">
                    {{ getDateMessage() }}
                </p>
            </div>
            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <a routerLink="/statistics" class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-sage/10 text-sage font-bold py-3 px-6 rounded-lg border border-sage/20 hover:bg-sage/20 transition-all">
                    <span class="material-symbols-outlined">bar_chart</span>
                    Statistics
                </a>
                <a routerLink="/systems" class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-charcoal/5 text-charcoal font-bold py-3 px-6 rounded-lg border border-charcoal/20 hover:bg-charcoal/10 transition-all">
                    <span class="material-symbols-outlined">hub</span>
                    Systems
                </a>
                <a routerLink="/add" class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-gentle hover:bg-orange-400 transition-all">
                    <span class="material-symbols-outlined">add</span>
                    Add Habit
                </a>
            </div>
        </header>

        <!-- Stats Grid -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <!-- Completion Rate -->
            <div class="bg-alabaster rounded-lg shadow-gentle p-6 border border-taupe/10">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-bold uppercase tracking-wider text-taupe">Completion Rate</span>
                    <span class="material-symbols-outlined text-orange-500 text-xl">trending_up</span>
                </div>
                <div class="flex items-baseline gap-2 mb-3">
                    <span class="text-4xl font-bold text-charcoal">{{ completionPercent() }}%</span>
                    <span class="text-sm text-taupe">today</span>
                </div>
                <div class="w-full h-2 bg-sand rounded-full overflow-hidden">
                    <div class="h-full bg-orange-500 rounded-full transition-all duration-1000" [style.width.%]="completionPercent()"></div>
                </div>
            </div>

            <!-- Best Streak -->
            <div class="bg-orange-500 text-white rounded-lg shadow-gentle p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-bold uppercase tracking-wider text-white/80">Best Streak</span>
                    <span class="material-symbols-outlined text-white">local_fire_department</span>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-4xl font-bold">{{ bestStreak() }}</span>
                    <span class="text-sm">days</span>
                </div>
                <p class="text-sm text-white/80 mt-2">Keep building your momentum!</p>
            </div>

            <!-- Active Habits -->
            <div class="bg-alabaster rounded-lg shadow-gentle p-6 border border-taupe/10">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-bold uppercase tracking-wider text-taupe">Active Habits</span>
                    <span class="material-symbols-outlined text-sage text-xl">check_circle</span>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-4xl font-bold text-charcoal">{{ habitService.habits().length }}</span>
                    <span class="text-sm text-taupe">habits</span>
                </div>
                <p class="text-sm text-taupe mt-2">You're building {{ habitService.habits().length }} new habits</p>
            </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Today's Habits List -->
            <section class="lg:col-span-8">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 class="font-heading text-2xl md:text-3xl font-bold text-charcoal">Today's Habits</h2>
                        <p class="text-sm text-taupe mt-1">{{ remainingHabits() }} remaining, {{ completedCount() }} completed</p>
                    </div>
                    <a routerLink="/planner" class="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1">
                        View Planner
                        <span class="material-symbols-outlined text-base">arrow_forward</span>
                    </a>
                </div>

                <div class="space-y-3">
                    @for (habit of todaysHabits(); track habit.id) {
                        <div class="bg-white rounded-lg shadow-gentle p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-gentle-lg border border-taupe/10"
                             (click)="navigateToTrack(habit.id)">
                            <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                                  [class.bg-sage]="habit.completedToday"
                                 [class.text-white]="habit.completedToday"
                                 [class.border-sage]="habit.completedToday"
                                 [class.border-taupe/30]="!habit.completedToday"
                                 [class.text-taupe]="!habit.completedToday">
                                @if (habit.completedToday) {
                                    <span class="material-symbols-outlined">check</span>
                                } @else {
                                    <span class="material-symbols-outlined text-xl">circle</span>
                                }
                            </div>

                            <div class="flex-1 min-w-0">
                                <h3 class="font-heading text-lg font-bold text-charcoal truncate"
                                    [class.line-through]="habit.completedToday"
                                    [class.text-taupe]="habit.completedToday">
                                    {{ habit.name }}
                                </h3>
                                @if (habit.systemTaskTitle) {
                                    <p class="text-xs text-orange-500 font-medium mt-1">{{ habit.systemTaskTitle }}</p>
                                }
                                <div class="flex items-center gap-2 mt-2 flex-wrap">
                                    <span class="text-xs px-2 py-1 rounded-full bg-sand text-charcoal font-medium">
                                        {{ habit.category || 'General' }}
                                    </span>
                                    <span class="text-xs px-2 py-1 rounded-full bg-sand/50 text-taupe">
                                        {{ habit.frequencyType || 'Daily' }}
                                    </span>
                                    @if (habit.bestStreak > 0) {
                                        <span class="text-xs flex items-center gap-1 text-orange-600">
                                            <span class="material-symbols-outlined text-[14px]">local_fire_department</span>
                                            {{ habit.bestStreak }} day streak
                                        </span>
                                    }
                                </div>
                            </div>

                            <div class="flex items-center gap-2 shrink-0">
                                @if (habit.completedToday) {
                                    <span class="text-sm font-bold text-sage">Completed</span>
                                } @else {
                                    <span class="text-sm text-taupe">Tap to track</span>
                                }
                                <span class="material-symbols-outlined text-taupe">arrow_forward</span>
                            </div>
                        </div>
                    }
                </div>

                @if (todaysHabits().length === 0) {
                    <div class="p-8 text-center bg-alabaster rounded-lg border border-dashed border-taupe/30">
                        <span class="material-symbols-outlined text-5xl text-taupe mb-4">checklist</span>
                        <p class="text-taupe font-medium">No habits scheduled for today.</p>
                        <a routerLink="/add" class="inline-flex items-center gap-2 text-orange-500 font-bold mt-4 hover:text-orange-400">
                            Create your first habit
                            <span class="material-symbols-outlined text-sm">arrow_forward</span>
                        </a>
                    </div>
                }
            </section>

            <!-- Inspiration / Quote Panel -->
            <section class="lg:col-span-4 space-y-6">
                <div class="bg-white rounded-lg shadow-gentle p-6 border border-taupe/10">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="material-symbols-outlined text-orange-600">format_quote</span>
                        <h3 class="font-heading text-lg font-bold text-charcoal">Inspiration</h3>
                    </div>
                    <blockquote class="text-base text-charcoal leading-relaxed italic mb-4">
                        "{{ currentQuote() }}"
                    </blockquote>
                    <div class="h-1 w-full bg-sand rounded-full overflow-hidden">
                        <div class="h-full bg-orange-500 w-1/3 rounded-full"></div>
                    </div>
                </div>

                <!-- Quick Tips -->
                <div class="bg-sage/10 rounded-lg p-6 border border-sage/20">
                    <h3 class="font-heading text-lg font-bold text-charcoal mb-4">Tips for Success</h3>
                    <ul class="space-y-3 text-sm text-charcoal">
                        <li class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-sage text-lg shrink-0">check_circle</span>
                            <span>Start small—tiny habits are easier to maintain</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-sage text-lg shrink-0">check_circle</span>
                            <span>Track consistently—every day counts</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-sage text-lg shrink-0">check_circle</span>
                            <span>Celebrate small wins to stay motivated</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-sage text-lg shrink-0">check_circle</span>
                            <span>Don't break the chain—keep your streak alive</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    </div>
    `,
    styles: [`
        :host { display: block; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnDestroy {
    habitService = inject(HabitService);
    systemService = inject(SystemService);
    router = inject(Router);

    todaySystemTasks = signal<any[]>([]);

    // Gentle, supportive motivational quotes
    private motivationalQuotes = [
        "Small progress is still progress. Every step counts.",
        "Consistency is more important than perfection. Keep going.",
        "Habits are the compound interest of self-improvement.",
        "You don't have to be great to start, but you have to start to be great.",
        "The secret of getting ahead is getting started.",
        "Success is not final, failure is not fatal. Courage to continue is what counts.",
        "What gets measured gets improved.",
        "Fall in love with the process and the results will come.",
        "Your only limit is you. Break barriers daily.",
        "Don't watch the clock; do what it does—keep going.",
        "The best time to start was yesterday. The second best is now.",
        "Build your habits, and your habits will build you.",
        " Excellence is not an act, but a habit.",
        "Motivation gets you going. Habit keeps you growing.",
        "One day at a time. One habit at a time."
    ];

    currentQuote = signal<string>(this.getRandomQuote());

    private getLocalDateString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    todaysHabits = computed(() => {
        const today = new Date();
        const currentDay = today.getDay();
        const todayStr = this.getLocalDateString();
        const systemTasks = this.todaySystemTasks();

        return this.habitService.habits().filter(h => {
            if (h.completedToday) return true;

            if (h.startDate && h.endDate) {
                if (todayStr < h.startDate || todayStr > h.endDate) {
                    return false;
                }
            }

            const weekdays = h.weekdays || (h as any).frequencyDays || (h as any).targetDays;

            if (weekdays && weekdays.length > 0) {
                if (!weekdays.includes(currentDay)) return false;
            } else if (h.frequencyType === 'specific_days') {
                return false;
            }
            return true;
        }).map(h => {
            const task = systemTasks.find(t => t.habitId === h.id);
            if (task) {
                return {
                    ...h,
                    systemTaskTitle: task.title,
                    systemTaskDescription: task.description,
                    systemTaskResourceLink: task.resourceLink
                };
            }
            return h;
        });
    });

    completedCount = computed(() => this.todaysHabits().filter(h => h.completedToday).length);
    remainingHabits = computed(() => this.todaysHabits().filter(h => !h.completedToday).length);
    completionPercent = computed(() => {
        const total = this.todaysHabits().length;
        if (total === 0) return 0;
        return Math.round((this.completedCount() / total) * 100);
    });

    bestStreak = computed(() => {
        const habits = this.habitService.habits();
        if (habits.length === 0) return 0;
        return Math.max(...habits.map(h => h.bestStreak || 0));
    });

    private quoteIntervalId?: ReturnType<typeof setInterval>;

    constructor() {
        this.quoteIntervalId = setInterval(() => {
            this.currentQuote.set(this.getRandomQuote());
        }, 30000);

        this.systemService.getInstanceTasksByDate(this.getLocalDateString()).subscribe(tasks => {
            this.todaySystemTasks.set(tasks);
        });
    }

    ngOnDestroy() {
        if (this.quoteIntervalId) clearInterval(this.quoteIntervalId);
    }

    private getRandomQuote(): string {
        const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
        return this.motivationalQuotes[randomIndex];
    }

    getGreeting(): string {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    getDateMessage(): string {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    }

    navigateToTrack(id: string) {
        this.router.navigate(['/track', id]);
    }

    navigateToDetails(id: string) {
        this.router.navigate(['/details', id]);
    }
}