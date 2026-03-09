import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../services/habit.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-statistics',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="min-h-screen bg-concrete-200 dark:bg-concrete-900 px-4 py-5 sm:p-6 md:p-8 lg:p-12 font-manrope pb-24 transition-colors duration-300 overflow-x-hidden">
        <!-- Header -->
        <header class="mb-10 md:mb-12 border-b-4 border-black dark:border-concrete-100 pb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6">
            <div>
                <div class="bg-black dark:bg-concrete-100 text-white dark:text-black px-2 py-1 inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                    System_Analytica // V.2.0
                </div>
                <h1 class="text-3xl sm:text-4xl md:text-7xl font-black text-black dark:text-white uppercase leading-none font-arvo">
                    Global_Metrics
                </h1>
            </div>
            
            <div class="flex w-full md:w-auto flex-col items-start md:items-end gap-4">
                <a routerLink="/add" class="group relative flex w-full sm:w-auto items-center justify-center gap-3 px-5 sm:px-8 py-3 sm:py-4 bg-electric-red text-white font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-xs sm:text-sm rigid-border border-[4px] dark:border-concrete-100 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                    <span class="material-symbols-outlined text-2xl">add_box</span>
                    <span>Initialize_Protocol</span>
                </a>
                <div class="text-right hidden md:block border-t-2 border-black/10 dark:border-white/10 pt-2 w-full">
                    <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400">Data_Stream: ACTIVE</p>
                    <p class="text-[10px] font-bold font-mono text-concrete-900 dark:text-white">{{ today | date:'yyyy-MM-dd HH:mm:ss' }}</p>
                </div>
            </div>
        </header>

        <!-- Aggregate Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <!-- Global Efficiency -->
            <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-6 brutalist-shadow-active dark:shadow-[8px_8px_0_0_white] relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <span class="material-symbols-outlined text-9xl text-black dark:text-white">pie_chart</span>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 mb-4 border-b-2 border-black dark:border-concrete-100 pb-1">System_Efficiency</p>
                <div class="flex items-baseline gap-2 mb-4 relative z-10">
                    <span class="text-5xl sm:text-6xl md:text-7xl font-black font-arvo leading-none dark:text-white">{{ globalEfficiency() }}%</span>
                    <span class="text-xs font-bold text-electric-red uppercase">NOMINAL</span>
                </div>
                <div class="w-full h-4 bg-concrete-100 dark:bg-concrete-600 border-2 border-black dark:border-concrete-100">
                    <div class="h-full bg-electric-red" [style.width.%]="globalEfficiency()"></div>
                </div>
            </div>

            <!-- Total Output -->
            <div class="bg-black dark:bg-concrete-800 text-white dark:text-gray-100 rigid-border border-[4px] dark:border-concrete-100 p-6 brutalist-shadow-active dark:shadow-[8px_8px_0_0_white] relative overflow-hidden group">
                 <div class="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                    <span class="material-symbols-outlined text-9xl text-white dark:text-white">check_circle</span>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 dark:text-concrete-500 mb-4 border-b border-concrete-400 dark:border-concrete-500 pb-1">Total_Completions</p>
                <div class="flex items-baseline gap-2 mb-4 relative z-10">
                    <span class="text-5xl sm:text-6xl md:text-7xl font-black font-arvo leading-none text-yellow-400 dark:text-white">{{ totalCompletions() }}</span>
                    <span class="text-xs font-bold uppercase">Ops</span>
                </div>
                 <p class="text-xs font-mono text-concrete-300 relative z-10">
                    Across {{ habitService.habits().length }} active protocols
                </p>
            </div>

            <!-- Best Performer -->
            <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-6 brutalist-shadow-active dark:shadow-[8px_8px_0_0_white] relative overflow-hidden group">
                 <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <span class="material-symbols-outlined text-9xl text-black dark:text-white">emoji_events</span>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 mb-4 border-b-2 border-black dark:border-concrete-100 pb-1">Top_Performer</p>
                @if (bestHabit(); as best) {
                    <div class="relative z-10">
                        <h3 class="text-2xl font-black uppercase leading-tight mb-2 truncate dark:text-white" [title]="best.name">{{ best.name }}</h3>
                        <div class="flex items-center gap-4">
                            <div class="bg-concrete-100 dark:bg-concrete-700 border-2 border-black dark:border-concrete-100 px-2 py-1">
                                <span class="text-[10px] font-bold uppercase block text-concrete-400 dark:text-concrete-300">Streak</span>
                                <span class="text-xl font-black font-mono dark:text-white">{{ best.streak }}</span>
                            </div>
                            <div class="bg-concrete-100 dark:bg-concrete-700 border-2 border-black dark:border-concrete-100 px-2 py-1">
                                <span class="text-[10px] font-bold uppercase block text-concrete-400 dark:text-concrete-300">Rate</span>
                                <span class="text-xl font-black font-mono dark:text-white">{{ best.completionRate }}%</span>
                            </div>
                        </div>
                    </div>
                } @else {
                     <p class="text-2xl font-black uppercase text-concrete-300">NO_DATA</p>
                }
            </div>
        </div>

        <!-- Detailed Metrics -->
         <h2 class="text-3xl font-black text-black dark:text-white uppercase mb-8 flex items-center gap-4">
            <span class="w-4 h-4 bg-electric-red"></span>
            Active_Directives
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (habit of habitService.habits(); track habit.id) {
                <a [routerLink]="['/details', habit.id]" class="block bg-white dark:bg-concrete-800 rigid-border border-[4px] border-black dark:border-concrete-100 hover:bg-concrete-100 dark:hover:bg-concrete-700 transition-all group overflow-hidden relative p-6 cursor-pointer brutalist-shadow-sm dark:shadow-[4px_4px_0_0_white] hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                    <!-- Decorative Corner -->
                    <div class="absolute top-0 right-0 w-8 h-8 bg-black dark:bg-white triangle-corner"></div>

                    <!-- Progress Background -->
                    <div class="absolute bottom-0 left-0 h-1 bg-black dark:bg-white w-full opacity-10">
                         <div class="h-full bg-electric-red" [style.width.%]="habit.completionRate"></div>
                    </div>

                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 rigid-border-sm bg-concrete-100 dark:bg-concrete-700 flex items-center justify-center">
                            <span class="material-symbols-outlined text-2xl text-black dark:text-white group-hover:text-electric-red transition-colors">{{ habit.icon || 'star' }}</span>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="text-[10px] font-bold bg-black dark:bg-white text-white dark:text-black px-2 py-1 uppercase tracking-wider">{{ habit.category || 'General' }}</span>
                            @if (habit.completedToday) {
                                <div class="bg-electric-red text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest">
                                    COMPLETE
                                </div>
                            }
                        </div>
                    </div>

                    <h3 class="text-2xl font-black uppercase mb-1 truncate group-hover:underline decoration-4 decoration-electric-red underline-offset-4 dark:text-white">{{ habit.name }}</h3>
                    <p class="text-xs font-bold text-concrete-400 uppercase tracking-widest mb-4">{{ habit.frequencyType || 'Daily' }} // ACTIVE</p>

                    <!-- Timing & Dates -->
                    <div class="flex flex-col gap-2 mb-6 bg-concrete-50 dark:bg-concrete-900 p-2 rigid-border-sm border-2 dark:border-concrete-500">
                        <div class="flex items-center justify-between text-[10px] font-black uppercase">
                            <span class="text-concrete-400 flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">calendar_today</span>
                                Period:
                            </span>
                            <span class="text-black dark:text-white">{{ habit.startDate | date:'MMM d' }} - {{ habit.endDate ? (habit.endDate | date:'MMM d') : 'UNTIL HALT' }}</span>
                        </div>
                        <div class="flex items-center justify-between text-[10px] font-black uppercase">
                            <span class="text-concrete-400 flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">schedule</span>
                                Window:
                            </span>
                            <span class="text-black dark:text-white">{{ habit.timeBlockStart || 'NOT SET' }} - {{ habit.timeBlockEnd || 'NOT SET' }}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-xs font-mono border-t-4 border-black dark:border-concrete-100 pt-4">
                        <div>
                            <span class="block text-concrete-400 font-black uppercase text-[10px]">Streak</span>
                            <span class="block text-2xl font-black dark:text-white">{{ habit.streak }}</span>
                        </div>
                         <div class="text-right">
                            <span class="block text-concrete-400 font-black uppercase text-[10px]">Efficiency</span>
                            <span class="block text-2xl font-black text-electric-red">{{ habit.completionRate }}%</span>
                        </div>
                    </div>
                </a>
            } @empty {
                <div class="col-span-full py-20 text-center rigid-border border-[4px] border-dashed border-concrete-400 bg-concrete-100 dark:bg-concrete-900">
                    <span class="material-symbols-outlined text-6xl text-concrete-400 mb-4">folder_off</span>
                    <h3 class="text-xl font-black text-concrete-400 uppercase tracking-widest">No Directives Found</h3>
                    <p class="text-xs font-mono text-concrete-400 mt-2">Initialize a new protocol to begin data collection.</p>
                </div>
            }
        </div>
    </div>
    `,
    styles: [`
        :host { display: block; }
        .triangle-corner {
            clip-path: polygon(100% 0, 0 0, 100% 100%);
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent {
    habitService = inject(HabitService);
    today = new Date();

    globalEfficiency = computed(() => {
        const habits = this.habitService.habits();
        if (habits.length === 0) return 0;
        const totalRate = habits.reduce((acc, h) => acc + (h.completionRate || 0), 0);
        return Math.round(totalRate / habits.length);
    });

    totalCompletions = computed(() => {
          return this.habitService.habits().reduce((acc, h) => acc + (h.streak || 0), 0);
    });

    bestHabit = computed(() => {
        const habits = this.habitService.habits();
        if (habits.length === 0) return null;
        return habits.reduce((prev, current) => ((prev.streak || 0) > (current.streak || 0)) ? prev : current);
    });
}








