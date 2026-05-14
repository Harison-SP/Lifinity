import { Component, ChangeDetectionStrategy, inject, computed, signal, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { SystemService } from '../../services/system.service';
import { AuthService } from '../../core/auth/auth.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { MicroHabit } from '../../models/habit.model';

@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, FormsModule, CommonModule],
    template: `
    <div class="min-h-screen bg-white dark:bg-dark-bg px-4 py-4 sm:p-6 md:p-8 font-body transition-colors duration-300 overflow-x-hidden paper-texture">
        <!-- Dashboard Header -->
        <header class="flex flex-col md:flex-row items-start justify-between gap-3 mb-4 md:mb-8">
            <div class="w-full md:w-auto">
                <div class="flex items-center gap-2 bg-alabaster dark:bg-dark-surface p-1 rounded-xl border border-taupe/10 shadow-sm w-full md:w-fit justify-between md:justify-start">
                    <button (click)="changeDate(-1)" class="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-taupe/10 transition-all text-charcoal dark:text-dark-text">
                        <span class="material-symbols-outlined text-xl">chevron_left</span>
                    </button>
                    
                    <div class="px-2 py-0.5 flex flex-col items-center min-w-[120px] cursor-pointer relative group">
                        <span class="text-xs md:text-sm font-bold text-charcoal dark:text-dark-text">{{ getDateDisplay() }}</span>
                        <span class="text-[9px] text-taupe dark:text-dark-text-secondary uppercase tracking-widest font-black">{{ getDayName() }}</span>
                        <input type="date" 
                               [ngModel]="selectedDate()" 
                               (ngModelChange)="onDateSelected($event)"
                               class="absolute inset-0 opacity-0 cursor-pointer">
                    </div>

                    <button (click)="changeDate(1)" class="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-taupe/10 transition-all text-charcoal dark:text-dark-text">
                        <span class="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                    
                    @if (selectedDate() !== getLocalDateString()) {
                        <button (click)="resetToToday()" class="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-all border-l border-taupe/10">
                            Today
                        </button>
                    }
                </div>
            </div>
            <div class="flex flex-row items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <a routerLink="/statistics" class="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-sage/10 text-sage font-bold py-2 px-3 rounded-lg border border-sage/20 hover:bg-sage/20 transition-all text-xs">
                    <span class="material-symbols-outlined text-lg">bar_chart</span>
                    <span class="hidden md:inline">Statistics</span>
                    <span class="md:hidden">Stats</span>
                </a>
                <a routerLink="/systems" class="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-charcoal/5 dark:bg-white/5 text-charcoal dark:text-dark-text font-bold py-2 px-3 rounded-lg border border-charcoal/20 dark:border-white/10 hover:bg-charcoal/10 dark:hover:bg-white/10 transition-all text-xs">
                    <span class="material-symbols-outlined text-lg">hub</span>
                    Systems
                </a>
                <a routerLink="/add" class="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-orange-500 text-white font-bold py-2 px-3 rounded-lg shadow-gentle hover:bg-orange-400 transition-all text-xs">
                    <span class="material-symbols-outlined text-lg">add</span>
                    Add <span class="hidden md:inline">Habit</span>
                </a>
            </div>
        </header>

        <!-- Stats Grid -->
        <section class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
            <!-- Completion Rate -->
            <div class="bg-alabaster dark:bg-dark-surface rounded-lg shadow-gentle dark:shadow-dark-gentle p-3 md:p-6 border border-taupe/10 dark:border-dark-border">
                <div class="flex items-center justify-between mb-2 md:mb-4">
                    <span class="text-[10px] md:text-xs font-bold uppercase tracking-wider text-taupe dark:text-dark-text-secondary">Rate</span>
                    <span class="material-symbols-outlined text-orange-500 text-lg md:text-xl">trending_up</span>
                </div>
                <div class="flex items-baseline gap-1 mb-2 md:mb-3">
                    <span class="text-2xl md:text-4xl font-bold text-charcoal dark:text-dark-text">{{ completionPercent() }}%</span>
                    <span class="text-[10px] text-taupe dark:text-dark-text-secondary">today</span>
                </div>
                <div class="w-full h-1.5 md:h-2 bg-sand dark:bg-dark-border rounded-full overflow-hidden">
                    <div class="h-full bg-orange-500 rounded-full transition-all duration-1000" [style.width.%]="completionPercent()"></div>
                </div>
            </div>

            <!-- Best Streak -->
            <div class="bg-orange-500 text-white rounded-lg shadow-gentle p-3 md:p-6">
                <div class="flex items-center justify-between mb-2 md:mb-4">
                    <span class="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/80">Streak</span>
                    <span class="material-symbols-outlined text-white text-lg md:text-xl">local_fire_department</span>
                </div>
                <div class="flex items-baseline gap-1">
                    <span class="text-2xl md:text-4xl font-bold">{{ bestStreak() }}</span>
                    <span class="text-[10px]">days</span>
                </div>
                <p class="text-[10px] text-white/80 mt-1 hidden md:block">Building momentum!</p>
            </div>

            <!-- Active Habits -->
            <div class="bg-alabaster dark:bg-dark-surface rounded-lg shadow-gentle dark:shadow-dark-gentle p-3 md:p-6 border border-taupe/10 dark:border-dark-border col-span-2 md:col-span-1">
                <div class="flex items-center justify-between mb-2 md:mb-4">
                    <span class="text-[10px] md:text-xs font-bold uppercase tracking-wider text-taupe dark:text-dark-text-secondary">Active</span>
                    <span class="material-symbols-outlined text-sage text-lg md:text-xl">check_circle</span>
                </div>
                <div class="flex items-baseline gap-1">
                    <span class="text-2xl md:text-4xl font-bold text-charcoal dark:text-dark-text">{{ habitService.habits().length }}</span>
                    <span class="text-[10px] text-taupe dark:text-dark-text-secondary">habits</span>
                    <span class="text-[10px] text-taupe dark:text-dark-text-secondary ml-auto hidden sm:inline">Active protocols</span>
                </div>
            </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Today's Habits List -->
            <section class="lg:col-span-8">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-4">
                    <div>
                        <h2 class="font-heading text-xl md:text-3xl font-bold text-charcoal dark:text-dark-text">Today's Habits</h2>
                        <p class="text-[10px] md:text-sm text-taupe dark:text-dark-text-secondary mt-0.5">{{ remainingHabits() }} remaining, {{ completedCount() }} completed</p>
                    </div>
                    <a routerLink="/planner" class="text-xs md:text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1">
                        View Planner
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                </div>

                <div class="space-y-3">
                    @for (habit of todaysHabits(); track habit.id) {
                        <!-- Habit Card -->
                        <div class="rounded-xl shadow-gentle dark:shadow-dark-gentle border transition-all overflow-hidden"
                             [class.border-orange-500/30]="habit.category === 'bad_habit'"
                             [class.border-taupe/10]="habit.category !== 'bad_habit'"
                             [class.dark:border-dark-border]="habit.category !== 'bad_habit'"
                             [class.bg-white]="habit.category !== 'bad_habit'"
                             [class.dark:bg-dark-surface]="habit.category !== 'bad_habit'"
                             [class.bg-orange-500/5]="habit.category === 'bad_habit'">

                            <!-- Main Row -->
                            <div class="p-4 flex items-center gap-4 cursor-pointer hover:bg-sand/30 dark:hover:bg-white/5 transition-all"
                                 (click)="navigateToTrack(habit.id)">
                                <!-- Completion Circle -->
                                <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                                     [class.bg-sage]="habit.completedToday"
                                     [class.text-white]="habit.completedToday"
                                     [class.border-sage]="habit.completedToday"
                                     [class.border-orange-500]="!habit.completedToday && habit.category === 'bad_habit'"
                                     [class.border-taupe/30]="!habit.completedToday && habit.category !== 'bad_habit'"
                                     [class.text-taupe]="!habit.completedToday">
                                    @if (habit.completedToday) {
                                        <span class="material-symbols-outlined">check</span>
                                    } @else if (habit.category === 'bad_habit') {
                                        <span class="material-symbols-outlined text-orange-500 text-xl">block</span>
                                    } @else {
                                        <span class="material-symbols-outlined text-xl">circle</span>
                                    }
                                </div>

                                <!-- Info -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <h3 class="font-heading text-lg font-bold text-charcoal dark:text-dark-text truncate"
                                            [class.line-through]="habit.completedToday"
                                            [class.text-taupe]="habit.completedToday">
                                            {{ habit.name }}
                                        </h3>
                                        @if (habit.category === 'bad_habit') {
                                            <span class="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Avoid</span>
                                        }
                                    </div>
                                    @if (habit.systemTaskTitle) {
                                        <p class="text-xs text-orange-500 font-medium mt-1">{{ habit.systemTaskTitle }}</p>
                                    }
                                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                                        @if (habit.bestStreak > 0) {
                                            <span class="text-xs flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                                <span class="material-symbols-outlined text-[14px]">local_fire_department</span>
                                                {{ habit.bestStreak }} day streak
                                            </span>
                                        }
                                        @if (habit.stackedWith) {
                                            <span class="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1">
                                                <span class="material-symbols-outlined text-[12px]">link</span>
                                                {{ habit.stackedWith }}
                                            </span>
                                        }
                                        <!-- Sobriety Countdown inline (for bad habits with soberStartDate) -->
                                        @if (habit.category === 'bad_habit' && habit.soberStartDate) {
                                            <span class="text-xs flex items-center gap-1 text-charcoal dark:text-dark-text bg-charcoal/5 dark:bg-white/10 px-2 py-0.5 rounded-full font-mono font-bold border border-charcoal/10">
                                                <span class="material-symbols-outlined text-[12px] text-orange-500">timer</span>
                                                {{ getSoberTimeString(habit.id) }}
                                            </span>
                                        }
                                    </div>
                                </div>

                                <!-- Right side controls -->
                                <div class="flex items-center gap-2 shrink-0">
                                    @if (habit.completedToday) {
                                        <span class="text-sm font-bold text-sage">Completed</span>
                                    } @else {
                                        <span class="text-sm text-taupe dark:text-dark-text-secondary hidden sm:block">Tap to track</span>
                                    }
                                    <!-- Micro-habit expand arrow (only if subtasks exist) -->
                                    @if (habit.subtasks && habit.subtasks.length > 0) {
                                        <button (click)="toggleMicroHabits($event, habit.id)"
                                                class="w-8 h-8 rounded-full flex items-center justify-center border border-taupe/20 hover:bg-sand transition-all"
                                                [class.bg-charcoal]="expandedHabitId() === habit.id"
                                                [class.text-white]="expandedHabitId() === habit.id"
                                                [class.border-charcoal]="expandedHabitId() === habit.id"
                                                [title]="expandedHabitId() === habit.id ? 'Hide micro-habits' : 'Show micro-habits'">
                                            <span class="material-symbols-outlined text-base transition-transform duration-300"
                                                  [class.rotate-180]="expandedHabitId() === habit.id">
                                                expand_more
                                            </span>
                                        </button>
                                    }
                                    <a [routerLink]="['/details', habit.id]" 
                                       (click)="$event.stopPropagation()"
                                       class="w-8 h-8 rounded-full flex items-center justify-center border border-taupe/20 hover:bg-sand dark:hover:bg-dark-border transition-all text-taupe dark:text-dark-text-secondary"
                                       title="View details & statistics">
                                        <span class="material-symbols-outlined text-base">arrow_forward</span>
                                    </a>
                                </div>
                            </div>

                            <!-- Micro-Habits Panel (collapsible) -->
                            @if (expandedHabitId() === habit.id && habit.subtasks && habit.subtasks.length > 0) {
                                <div class="border-t border-taupe/10 dark:border-dark-border bg-alabaster/60 dark:bg-dark-bg/40 px-4 py-3 animate-fade-in">
                                    <div class="flex items-center justify-between mb-3">
                                        <p class="text-[10px] font-black uppercase tracking-widest text-taupe flex items-center gap-1">
                                            <span class="material-symbols-outlined text-sm">checklist</span>
                                            Micro-Habits · {{ getSortedSubtasks(habit.subtasks).length }} steps
                                        </p>
                                        <button (click)="startAddingSubtask($event, habit.id)"
                                                class="w-6 h-6 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                                title="Quick add step">
                                            <span class="material-symbols-outlined text-sm font-bold">add</span>
                                        </button>
                                    </div>

                                    @if (addingSubtaskHabitId() === habit.id) {
                                        <div class="mb-3 animate-fade-in">
                                            <div class="flex items-center gap-2 bg-white dark:bg-dark-surface p-2 rounded-lg border border-orange-500/30 shadow-sm">
                                                <input #quickAddInput
                                                       type="text" 
                                                       [(ngModel)]="newSubtaskName"
                                                       (keyup.enter)="saveQuickSubtask(habit.id)"
                                                       (keyup.escape)="addingSubtaskHabitId.set(null)"
                                                       placeholder="What's the next step?"
                                                       class="flex-1 bg-transparent border-none outline-none text-sm font-medium text-charcoal dark:text-dark-text px-1"
                                                       autofocus>
                                                <button (click)="saveQuickSubtask(habit.id)"
                                                        [disabled]="!newSubtaskName().trim()"
                                                        class="w-8 h-8 rounded-md bg-sage text-white flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all">
                                                    <span class="material-symbols-outlined text-sm font-bold">check</span>
                                                </button>
                                                <button (click)="addingSubtaskHabitId.set(null)"
                                                        class="w-8 h-8 rounded-md bg-taupe/10 text-taupe flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                                                    <span class="material-symbols-outlined text-sm font-bold">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    }

                                    <div class="space-y-2">
                                        @for (sub of getSortedSubtasks(habit.subtasks); track sub.id || sub.name) {
                                            <div class="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-dark-surface border shadow-sm transition-all hover:shadow-gentle group/sub cursor-pointer"
                                                 (click)="toggleSubtaskStatus($event, habit.id, sub.id!)"
                                                 [class.border-orange-500/30]="sub.priority === 'high'"
                                                 [class.border-amber-400/30]="sub.priority === 'medium'"
                                                 [class.border-sage/30]="sub.priority === 'low'"
                                                 [class.border-taupe/10]="!sub.priority"
                                                 [class.opacity-60]="sub.completedToday">
                                                
                                                <!-- Custom Minimalistic Checkbox -->
                                                <div class="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0"
                                                        [class.bg-sage]="sub.completedToday"
                                                        [class.border-sage]="sub.completedToday"
                                                        [class.text-white]="sub.completedToday"
                                                        [class.border-taupe/30]="!sub.completedToday"
                                                        [class.hover:border-sage]="!sub.completedToday">
                                                    @if (sub.completedToday) {
                                                        <span class="material-symbols-outlined text-sm font-bold">check</span>
                                                    }
                                                </div>

                                                <div class="flex-1 min-w-0">
                                                    <p class="text-sm font-bold text-charcoal dark:text-dark-text truncate transition-all"
                                                       [class.line-through]="sub.completedToday"
                                                       [class.text-taupe]="sub.completedToday">
                                                        {{ sub.name }}
                                                    </p>
                                                    @if (sub.executionWindowStart || sub.reminderOffsetMinutes) {
                                                        <p class="text-[10px] text-taupe mt-0.5" [class.text-taupe/50]="sub.completedToday">
                                                            @if (sub.executionWindowStart) { {{ sub.executionWindowStart }} }
                                                            @if (sub.reminderOffsetMinutes) { · {{ sub.reminderOffsetMinutes }}m reminder }
                                                        </p>
                                                    }
                                                </div>

                                                <!-- Priority Indicator (Minimalistic Dot) -->
                                                <div class="w-2 h-2 rounded-full shrink-0"
                                                     [class.bg-orange-500]="sub.priority === 'high'"
                                                     [class.bg-amber-400]="sub.priority === 'medium'"
                                                     [class.bg-sage]="sub.priority === 'low'"
                                                     [class.bg-taupe]="!sub.priority"
                                                     [class.opacity-30]="sub.completedToday"></div>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    }
                </div>

                @if (todaysHabits().length === 0) {
                    <div class="p-8 text-center bg-alabaster dark:bg-dark-surface rounded-lg border border-dashed border-taupe/30 dark:border-dark-border">
                        <span class="material-symbols-outlined text-5xl text-taupe dark:text-dark-text-secondary mb-4">checklist</span>
                        <p class="text-taupe dark:text-dark-text-secondary font-medium">No habits scheduled for today.</p>
                        <a routerLink="/add" class="inline-flex items-center gap-2 text-orange-500 font-bold mt-4 hover:text-orange-400">
                            Create your first habit
                            <span class="material-symbols-outlined text-sm">arrow_forward</span>
                        </a>
                    </div>
                }
            </section>

            <!-- Inspiration / Quote Panel -->
            <section class="lg:col-span-4 space-y-6">
                <div class="bg-white dark:bg-dark-surface rounded-lg shadow-gentle dark:shadow-dark-gentle p-6 border border-taupe/10 dark:border-dark-border">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">format_quote</span>
                        <h3 class="font-heading text-lg font-bold text-charcoal dark:text-dark-text">Inspiration</h3>
                    </div>
                    <blockquote class="text-base text-charcoal dark:text-dark-text leading-relaxed italic mb-4">
                        "{{ currentQuote() }}"
                    </blockquote>
                    <div class="h-1 w-full bg-sand dark:bg-dark-border rounded-full overflow-hidden">
                        <div class="h-full bg-orange-500 w-1/3 rounded-full"></div>
                    </div>
                </div>

                <!-- Quick Tips -->
                <div class="bg-sage/10 rounded-lg p-6 border border-sage/20">
                    <h3 class="font-heading text-lg font-bold text-charcoal dark:text-dark-text mb-4">Tips for Success</h3>
                    <ul class="space-y-3 text-sm text-charcoal dark:text-dark-text">
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
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnDestroy {
    habitService = inject(HabitService);
    systemService = inject(SystemService);
    authService = inject(AuthService);
    router = inject(Router);
    settingsService = inject(UserSettingsService);

    user = toSignal(this.authService.currentUser$);
    todaySystemTasks = signal<any[]>([]);

    /** Expanded habit ID for micro-habit list */
    expandedHabitId = signal<string | null>(null);

    /** Quick-add subtask state */
    addingSubtaskHabitId = signal<string | null>(null);
    newSubtaskName = signal<string>('');

    /** Date navigation */
    selectedDate = signal<string>(this.getLocalDateString());

    /** Live sober time map: habitId → elapsed string */
    private soberTimeMap = signal<Record<string, string>>({});
    private soberIntervalId?: ReturnType<typeof setInterval>;

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
        "Excellence is not an act, but a habit.",
        "Motivation gets you going. Habit keeps you growing.",
        "One day at a time. One habit at a time."
    ];

    currentQuote = signal<string>(this.getRandomQuote());

    getLocalDateString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    todaysHabits = computed(() => {
        const selectedStr = this.selectedDate();
        const selectedDate = new Date(selectedStr + 'T12:00:00'); // Use local noon to avoid TZ shifts
        const currentDay = selectedDate.getDay();
        const systemTasks = this.todaySystemTasks();

        return this.habitService.habits().filter(h => {
            if (h.completedToday) return true;
            if (h.startDate && h.endDate) {
                if (selectedStr < h.startDate || selectedStr > h.endDate) return false;
            }
            if (!this.settingsService.settings().showCompletedHabits && h.completedToday) return false;
            const weekdays = h.weekdays || (h as any).frequencyDays || (h as any).targetDays;
            if (weekdays && weekdays.length > 0) {
                if (!weekdays.includes(currentDay)) return false;
            } else if (h.frequencyType === 'specific_days') {
                return false;
            }
            return true;
        }).map(h => {
            const task = systemTasks.find((t: any) => t.habitId === h.id);
            if (task) {
                return { ...h, systemTaskTitle: task.title, systemTaskDescription: task.description, systemTaskResourceLink: task.resourceLink };
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

        // Update sobriety timers every second
        this.soberIntervalId = setInterval(() => {
            const habits = this.habitService.habits();
            const badHabits = habits.filter(h => h.category === 'bad_habit' && h.soberStartDate);
            if (badHabits.length === 0) return;

            const newMap: Record<string, string> = { ...this.soberTimeMap() };
            for (const h of badHabits) {
                const start = new Date(h.soberStartDate!);
                const diff = Date.now() - start.getTime();
                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                    const mins = Math.floor((diff / (1000 * 60)) % 60);
                    const secs = Math.floor((diff / 1000) % 60);
                    if (days > 0) {
                        newMap[h.id] = `${days}d ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
                    } else {
                        newMap[h.id] = `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
                    }
                }
            }
            this.soberTimeMap.set(newMap);
        }, 1000);
    }

    ngOnDestroy() {
        if (this.quoteIntervalId) clearInterval(this.quoteIntervalId);
        if (this.soberIntervalId) clearInterval(this.soberIntervalId);
    }

    getSoberTimeString(habitId: string): string {
        return this.soberTimeMap()[habitId] || '00:00:00';
    }

    toggleMicroHabits(event: Event, habitId: string) {
        event.stopPropagation();
        this.expandedHabitId.set(this.expandedHabitId() === habitId ? null : habitId);
    }

    toggleSubtaskStatus(event: Event, habitId: string, subtaskId: string) {
        event.stopPropagation();
        this.habitService.toggleSubtask(habitId, subtaskId, this.selectedDate()).subscribe({
            error: (err) => console.error('Failed to toggle subtask', err)
        });
    }

    startAddingSubtask(event: Event, habitId: string) {
        event.stopPropagation();
        this.newSubtaskName.set('');
        this.addingSubtaskHabitId.set(habitId);
    }

    saveQuickSubtask(habitId: string) {
        const name = this.newSubtaskName().trim();
        if (!name) return;

        this.habitService.addSubtask(habitId, {
            name,
            priority: 'medium'
        }).subscribe({
            next: () => {
                this.newSubtaskName.set('');
                this.addingSubtaskHabitId.set(null);
            },
            error: (err) => console.error('Failed to add subtask', err)
        });
    }

    getSortedSubtasks(subtasks: MicroHabit[]): MicroHabit[] {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return [...subtasks].sort((a, b) => {
            const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
            const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
            return pa - pb;
        });
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

    getDayName(): string {
        const date = new Date(this.selectedDate() + 'T12:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    getDateDisplay(): string {
        const date = new Date(this.selectedDate() + 'T12:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    changeDate(offset: number) {
        const current = new Date(this.selectedDate() + 'T12:00:00');
        current.setDate(current.getDate() + offset);
        const nextDate = this.formatDate(current);
        this.onDateSelected(nextDate);
    }

    onDateSelected(date: string) {
        this.selectedDate.set(date);
        this.habitService.loadHabits(date);
        this.systemService.getInstanceTasksByDate(date).subscribe(tasks => {
            this.todaySystemTasks.set(tasks);
        });
    }

    resetToToday() {
        this.onDateSelected(this.getLocalDateString());
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    navigateToTrack(id: string) {
        this.router.navigate(['/track', id], { queryParams: { date: this.selectedDate() } });
    }

    navigateToDetails(id: string) {
        this.router.navigate(['/details', id]);
    }
}