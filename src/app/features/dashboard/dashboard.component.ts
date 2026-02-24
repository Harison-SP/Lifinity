import { Component, ChangeDetectionStrategy, inject, computed, signal, effect } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-concrete-200 dark:bg-concrete-900 p-6 md:p-8 lg:p-12 font-manrope transition-colors duration-300">
        <!-- Dashboard Header -->
        <header class="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
            <div class="space-y-1">
                <div class="bg-concrete-900 dark:bg-concrete-100 text-white dark:text-black px-3 py-1 inline-block text-[10px] font-bold uppercase tracking-[0.15em]">User Profile // Identity Verified</div>
                <h1 class="text-4xl md:text-5xl font-black text-concrete-900 dark:text-white uppercase leading-none font-arvo">STATUS: COMMANDER</h1>
                <div class="flex items-center gap-3 pt-1">
                    <div class="h-4 w-1 bg-electric-red"></div>
                    <p class="text-xs font-bold uppercase tracking-widest text-concrete-400">
                        Pending Tasks: <span class="text-concrete-900 dark:text-white underline">{{ remainingHabits() }} UNITS</span>
                    </p>
                </div>
            </div>
            <a routerLink="/add" class="rigid-border border-[3px] dark:border-concrete-100 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] bg-electric-red text-white font-black py-3 px-6 flex items-center gap-2 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter cursor-pointer text-sm">
                <span class="material-symbols-outlined text-xl">add_box</span>
                <span>Initialize New Process</span>
            </a>
        </header>

        <!-- Stats Grid -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <!-- Efficiency Rating -->
            <div class="bg-concrete-100 dark:bg-concrete-800 rigid-border border-[3px] dark:border-concrete-100 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] p-4 flex flex-col active-scan relative overflow-hidden">
                <span class="text-[9px] font-black text-concrete-400 uppercase mb-4 border-b-2 border-concrete-900 dark:border-concrete-100 pb-1 z-10 relative">Efficiency_Rating // 01</span>
                <div class="flex items-end gap-2 mb-3 z-10 relative">
                    <span class="text-5xl font-black leading-none dark:text-white">{{ completionPercent() }}%</span>
                    <span class="text-[10px] font-bold text-electric-red pb-1 underline">NOMINAL</span>
                </div>
                <div class="w-full h-3 bg-concrete-300 dark:bg-concrete-600 mt-auto z-10 relative">
                    <div class="bg-concrete-900 dark:bg-white h-full transition-all duration-1000" [style.width.%]="completionPercent()"></div>
                </div>
            </div>

            <!-- Uptime Sequence (Best Streak) -->
            <div class="bg-concrete-900 dark:bg-white rigid-border border-[3px] dark:border-concrete-100 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] p-4 text-white dark:text-black flex flex-col justify-between">
                <span class="text-[9px] font-bold text-concrete-400 dark:text-concrete-500 uppercase mb-3 border-b border-concrete-400 dark:border-concrete-500 pb-1">Uptime_Sequence</span>
                <div class="flex items-center gap-3">
                    <span class="text-6xl font-black italic leading-none text-yellow-400 dark:text-electric-red">{{ bestStreak() }}</span>
                    <div class="text-[10px] font-bold leading-tight uppercase">Consecutive<br/>Cycles<br/>Recorded</div>
                </div>
            </div>

            <!-- Aggregate Output (Total Habits) -->
            <div class="bg-concrete-100 dark:bg-concrete-800 rigid-border border-[3px] dark:border-concrete-100 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] p-4 flex flex-col">
                <span class="text-[9px] font-black text-concrete-400 uppercase mb-4 border-b-2 border-concrete-900 dark:border-concrete-100 pb-1">Total_Protocols</span>
                <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-5xl font-black text-concrete-900 dark:text-white leading-none">{{ habitService.habits().length }}</span>
                    <span class="text-xl font-black text-concrete-400">ACTIVE</span>
                </div>
            </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Active Protocols List -->
            <section class="lg:col-span-8">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-baseline gap-3">
                        <h2 class="text-3xl font-black text-concrete-900 dark:text-white uppercase font-arvo">Active_Protocols</h2>
                        <span class="text-lg font-bold text-concrete-400">[{{ remainingHabits() }}]</span>
                    </div>
                    <a routerLink="/planner" class="text-xs font-black uppercase tracking-widest border-2 border-concrete-900 dark:border-concrete-100 px-3 py-1 hover:bg-concrete-900 dark:hover:bg-concrete-100 hover:text-white dark:hover:text-black transition-colors cursor-pointer dark:text-white">
                        View_Planner
                    </a>
                </div>
                <div class="space-y-3">
                    @for (habit of todaysHabits(); track habit.id) {
                        <div class="rigid-border border-[2px] dark:border-concrete-400 brutalist-shadow-sm dark:shadow-[4px_4px_0_0_white] p-3 flex items-center gap-4 cursor-pointer transition-all hover:translate-x-1"
                             [class.bg-white]="!habit.completedToday"
                             [class.dark:bg-concrete-800]="!habit.completedToday"
                             [class.bg-concrete-100]="habit.completedToday"
                             [class.dark:bg-concrete-900]="habit.completedToday"
                             [class.opacity-60]="habit.completedToday"
                             [class.grayscale]="habit.completedToday"
                             [class.border-l-electric-red]="!habit.completedToday"
                             [class.border-l-[10px]]="!habit.completedToday"
                             (click)="handleHabitClick(habit)">
                            
                            <div class="w-9 h-9 border-2 border-concrete-900 dark:border-concrete-100 flex items-center justify-center transition-colors"
                                 [class.bg-concrete-900]="habit.completedToday"
                                 [class.dark:bg-concrete-100]="habit.completedToday"
                                 [class.text-white]="habit.completedToday"
                                 [class.dark:text-black]="habit.completedToday"
                                 [class.bg-transparent]="!habit.completedToday">
                                @if (habit.completedToday) {
                                    <span class="material-symbols-outlined text-xl">done_all</span>
                                }
                            </div>
                            
                            <div class="flex-1">
                                <h3 class="text-xl font-black text-concrete-900 dark:text-white uppercase transition-all"
                                    [class.line-through]="habit.completedToday">{{ habit.name }}</h3>
                                <span class="text-[9px] font-bold px-2 py-0.5 uppercase border border-concrete-900 dark:border-concrete-100"
                                      [class.bg-concrete-200]="habit.completedToday"
                                      [class.dark:bg-concrete-800]="habit.completedToday"
                                      [class.bg-concrete-900]="!habit.completedToday"
                                      [class.dark:bg-concrete-100]="!habit.completedToday"
                                      [class.text-white]="!habit.completedToday"
                                      [class.dark:text-black]="!habit.completedToday"
                                      [class.dark:text-concrete-300]="habit.completedToday">
                                    {{ habit.category || 'GEN' }} // {{ habit.frequencyType || 'DAILY' }}
                                </span>
                            </div>
                            
                            <div class="flex items-center gap-2">
                                <button (click)="$event.stopPropagation(); navigateToDetails(habit.id)" class="w-7 h-7 flex items-center justify-center border-2 border-transparent hover:border-concrete-900 dark:hover:border-concrete-100 rounded-full transition-colors">
                                    <span class="material-symbols-outlined text-concrete-900 dark:text-white text-xl">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    } @empty {
                        <div class="p-6 text-center border-3 border-dashed border-concrete-300 dark:border-concrete-600">
                            <p class="text-concrete-400 font-bold uppercase tracking-widest text-sm">No Active Protocols For Today</p>
                        </div>
                    }
                </div>
            </section>

            <!-- Quote / Side Panel -->
            <section class="lg:col-span-4 space-y-6">
                <div class="bg-yellow-400 rigid-border border-[3px] dark:border-concrete-100 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] p-6 relative overflow-hidden">
                    <span class="material-symbols-outlined text-[8rem] absolute -right-6 -bottom-6 opacity-20 text-black select-none">format_quote</span>
                    <div class="w-9 h-9 bg-black flex items-center justify-center text-white mb-4 relative z-10">
                        <span class="material-symbols-outlined text-xl">bolt</span>
                    </div>
                    <blockquote class="text-base font-black text-black mb-4 leading-tight uppercase relative z-10">
                        "{{ currentQuote() }}"
                    </blockquote>
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
export class DashboardComponent {
    habitService = inject(HabitService);
    router = inject(Router);

    // Motivational quotes array
    private motivationalQuotes = [
        "CONSISTENCY IS THE KEY TO ACHIEVING ANY GOAL. REPEAT_PROCESS_UNTIL_SUCCESS.",
        "DISCIPLINE EQUALS FREEDOM. EXECUTE_DAILY_PROTOCOLS_WITHOUT_EXCEPTION.",
        "SUCCESS IS NOT FINAL, FAILURE IS NOT FATAL. COURAGE_TO_CONTINUE_IS_WHAT_COUNTS.",
        "THE ONLY WAY TO DO GREAT WORK IS TO LOVE WHAT YOU DO. PASSION_DRIVES_EXCELLENCE.",
        "YOUR ONLY LIMIT IS YOU. BREAK_BARRIERS_DAILY.",
        "SMALL PROGRESS IS STILL PROGRESS. EVERY_STEP_COUNTS_COMMANDER.",
        "THE HARDER YOU WORK, THE LUCKIER YOU GET. EFFORT_MULTIPLIES_OPPORTUNITY.",
        "DON'T WATCH THE CLOCK; DO WHAT IT DOES. KEEP_GOING_FORWARD.",
        "BELIEVE YOU CAN AND YOU'RE HALFWAY THERE. MINDSET_IS_EVERYTHING.",
        "THE BEST TIME TO PLANT A TREE WAS 20 YEARS AGO. SECOND_BEST_IS_NOW.",
        "SUCCESS USUALLY COMES TO THOSE WHO ARE TOO BUSY TO BE LOOKING FOR IT. FOCUS_ON_THE_WORK.",
        "OPPORTUNITIES DON'T HAPPEN. YOU CREATE THEM. BUILD_YOUR_FUTURE_TODAY.",
        "DON'T STOP WHEN YOU'RE TIRED. STOP WHEN YOU'RE DONE. FINISH_STRONG.",
        "THE SECRET OF GETTING AHEAD IS GETTING STARTED. INITIATE_ALL_PROTOCOLS.",
        "QUALITY IS NOT AN ACT, IT IS A HABIT. EXCELLENCE_IS_ROUTINE."
    ];

    // Random quote signal
    currentQuote = signal<string>(this.getRandomQuote());

    // Filter habits for today
    todaysHabits = computed(() => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sun, 1 = Mon...
        
        // Use YYYY-MM-DD string comparison to avoid timezone issues
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        return this.habitService.habits().filter(h => {
            // Priority 1: If completed today, ALWAY show it (so users can see what they've done)
            if (h.completedToday) {
                return true;
            }

            // 1. Date Range Check
            if (h.startDate && h.endDate) {
                // Ensure we compare strings properly
                if (todayStr < h.startDate || todayStr > h.endDate) {
                    return false;
                }
            }

            // 2. Weekday Check
            // We expect weekdays to be populated. If it's missing or empty:
            // - If 'daily', show it (assume all days).
            // - If 'specific_days', hide it (assume config missing means none).
            const weekdays = h.weekdays || (h as any).frequencyDays || (h as any).targetDays;
            
            if (weekdays && weekdays.length > 0) {
               // Standard check: Does the list include today?
               if (!weekdays.includes(currentDay)) {
                   return false;
               }
            } else if (h.frequencyType === 'specific_days') {
                // Strict check: Specific days requested but none listed -> Hide
                return false; 
            }
            // For 'daily' or others with empty weekdays, we allow passing (default to show)
            
            return true;
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

    // Modal State
    selectedHabit = signal<any | null>(null);
    logValue: number | undefined;
    logNotes: string = '';

    constructor() {
        // Rotate quotes every 30 seconds
        setInterval(() => {
            this.currentQuote.set(this.getRandomQuote());
        }, 30000);
    }

    private getRandomQuote(): string {
        const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
        return this.motivationalQuotes[randomIndex];
    }

    handleHabitClick(habit: any) {
        this.navigateToTrack(habit.id);
    }

    toggleCompletion(id: string) {
        const habit = this.habitService.habits().find(h => h.id === id);
        if (habit?.type !== 'measurable') {
            this.habitService.toggleCompletion(id, 'today').subscribe();
        }
    }

    navigateToTrack(id: string) {
        this.router.navigate(['/track', id]);
    }
    
    navigateToDetails(id: string) {
        this.router.navigate(['/details', id]);
    }
}
