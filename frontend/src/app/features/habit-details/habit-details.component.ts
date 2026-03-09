import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { HabitAnalyticsComponent } from './habit-analytics/habit-analytics';
import { AnalyticsResponse } from '../../models/habit.model';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
    selector: 'app-habit-details',
    standalone: true,
    imports: [CommonModule, FormsModule, HabitAnalyticsComponent, NgxChartsModule, RouterLink],
    template: `
    <div class="min-h-screen bg-concrete-200 dark:bg-concrete-900 px-4 py-5 sm:p-6 md:p-8 lg:p-12 font-manrope pb-24 relative transition-colors duration-300 overflow-x-hidden">
        <!-- Header -->
        <header class="mb-10 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 border-b-4 border-black dark:border-concrete-100 pb-6 bg-white dark:bg-concrete-800 p-4 sm:p-6 rigid-border-sm brutalist-shadow-sm dark:shadow-[4px_4px_0_0_white]">
            <div class="flex items-start sm:items-center gap-3 sm:gap-6 w-full md:w-auto">
                <button (click)="goBack()" class="w-12 h-12 rigid-border-sm bg-white dark:bg-concrete-900 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors group shrink-0 border-2 border-transparent dark:border-concrete-500">
                    <span class="material-symbols-outlined text-2xl dark:text-white dark:group-hover:text-black">arrow_back</span>
                </button>
                <div>
                    <div class="bg-black dark:bg-concrete-100 text-white dark:text-black px-2 py-0.5 inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                        Protocol_Analysis
                    </div>
                    <h1 class="text-3xl md:text-5xl font-black text-black dark:text-white uppercase leading-none font-arvo flex items-center gap-3">
                        {{ habit()?.name || 'LOADING...' }}
                    </h1>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-start md:justify-end">
                <a routerLink="/add" class="px-4 py-2 bg-electric-red text-white rigid-border-sm border-[2px] dark:border-concrete-100 text-xs font-black uppercase tracking-widest hover:bg-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">add_box</span>
                    Initialize_Protocol
                </a>
                <button (click)="editHabit()" class="px-4 py-2 bg-concrete-100 dark:bg-concrete-700 rigid-border-sm border-[2px] dark:border-concrete-500 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center gap-2 dark:text-white">
                    <span class="material-symbols-outlined text-base">edit</span>
                    Edit
                </button>
                <button (click)="deleteHabit()" class="px-4 py-2 bg-concrete-100 dark:bg-concrete-700 rigid-border-sm border-[2px] dark:border-concrete-500 text-xs font-black uppercase tracking-widest hover:bg-electric-red hover:text-white hover:border-black dark:hover:border-electric-red transition-colors flex items-center gap-2 dark:text-white">
                    <span class="material-symbols-outlined text-base">delete</span>
                    Purge
                </button>
                <button (click)="toggleDone()" 
                        class="px-6 py-2 rigid-border-sm border-[2px] dark:border-concrete-100 font-black uppercase tracking-widest text-xs transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] dark:text-white"
                        [class.bg-electric-red]="!isCompletedOnSelectedDate()"
                        [class.text-white]="!isCompletedOnSelectedDate()"
                        [class.bg-concrete-900]="isCompletedOnSelectedDate()"
                        [class.dark:bg-black]="isCompletedOnSelectedDate()"
                        [class.text-white]="isCompletedOnSelectedDate()">
                    {{ isCompletedOnSelectedDate() ? 'COMPLETED' : 'MARK_COMPLETE' }}
                </button>
            </div>
        </header>

        @if (habit()) {
            <!-- Protocol Details Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <!-- System Type -->
                <div class="bg-white dark:bg-concrete-800 rigid-border-sm border-[2px] dark:border-concrete-100 p-4 brutalist-shadow-sm dark:shadow-[2px_2px_0_0_white]">
                    <p class="text-[9px] font-black uppercase tracking-widest text-concrete-400 dark:text-concrete-500 mb-1">System_Type</p>
                    <p class="text-sm font-bold uppercase dark:text-white">{{ habit()?.type === 'yes_no' ? 'Binary State' : 'Quantitative' }}</p>
                </div>
                <!-- Time Range -->
                <div class="bg-white dark:bg-concrete-800 rigid-border-sm border-[2px] dark:border-concrete-100 p-4 brutalist-shadow-sm dark:shadow-[2px_2px_0_0_white]">
                    <p class="text-[9px] font-black uppercase tracking-widest text-concrete-400 dark:text-concrete-500 mb-1">Timeline_Range</p>
                    <p class="text-sm font-bold uppercase dark:text-white">{{ habit()?.startDate | date:'MMM d' }} - {{ habit()?.endDate | date:'MMM d, yy' }}</p>
                </div>
                <!-- Recurrence -->
                <div class="bg-white dark:bg-concrete-800 rigid-border-sm border-[2px] dark:border-concrete-100 p-4 brutalist-shadow-sm dark:shadow-[2px_2px_0_0_white]">
                    <p class="text-[9px] font-black uppercase tracking-widest text-concrete-400 dark:text-concrete-500 mb-1">Frequency</p>
                    <p class="text-sm font-bold uppercase dark:text-white">
                        {{ habit()?.frequencyType === 'daily' ? 'Daily' : 
                           habit()?.frequencyType === 'specific_days' ? 'Specific Days' : 
                           'Every ' + habit()?.frequencyInterval + ' Days' }}
                    </p>
                </div>
                <!-- Time Block -->
                <div class="bg-white dark:bg-concrete-800 rigid-border-sm border-[2px] dark:border-concrete-100 p-4 brutalist-shadow-sm dark:shadow-[2px_2px_0_0_white]">
                    <p class="text-[9px] font-black uppercase tracking-widest text-concrete-400 dark:text-concrete-500 mb-1">Time_Block</p>
                    <p class="text-sm font-bold uppercase dark:text-white">{{ habit()?.timeBlockStart || 'ANY' }} - {{ habit()?.timeBlockEnd || 'ANY' }}</p>
                </div>
                <!-- Target (If Measurable) -->
                @if (habit()?.type === 'measurable') {
                    <div class="col-span-2 md:col-span-4 bg-concrete-100 dark:bg-concrete-900 rigid-border-sm border-[2px] dark:border-concrete-100 p-4">
                        <p class="text-[9px] font-black uppercase tracking-widest text-concrete-500 dark:text-concrete-400 mb-1">Metric_Target</p>
                        <p class="text-sm font-bold uppercase dark:text-white">{{ habit()?.targetComparator }} {{ habit()?.targetValue }} {{ habit()?.targetUnit }}</p>
                    </div>
                }
            </div>

            @if (inconsistentDaysCount() >= 2) {
                <div class="bg-electric-red text-white p-4 font-black uppercase tracking-widest mb-8 border-4 border-black dark:border-white flex items-center gap-3">
                    <span class="material-symbols-outlined text-2xl">warning</span>
                    WARNING: {{ inconsistentDaysCount() }} inconsistent days detected recently. Protocol adherence compromised!
                </div>
            }

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

                <!-- Streak -->
                <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-6 relative group overflow-hidden brutalist-shadow-sm dark:shadow-[4px_4px_0_0_white]">
                    <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 dark:text-concrete-500 mb-2 border-b-2 border-black dark:border-concrete-100 pb-1">Current_Sequence</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-6xl font-black font-arvo leading-none dark:text-white">{{ habit()?.streak }}</span>
                        <span class="text-xs font-bold text-electric-red uppercase">Days</span>
                    </div>
                </div>

                <!-- Best Streak -->
                <div class="bg-black dark:bg-white text-white dark:text-black rigid-border border-[4px] dark:border-concrete-100 p-6 relative group overflow-hidden brutalist-shadow-sm dark:shadow-[4px_4px_0_0_white]">
                    <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 dark:text-concrete-600 mb-2 border-b border-concrete-400 dark:border-concrete-600 pb-1">Max_Continuity</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-6xl font-black font-arvo leading-none text-yellow-400 dark:text-electric-red">{{ habit()?.bestStreak }}</span>
                        <span class="text-xs font-bold uppercase">Record</span>
                    </div>
                </div>

                <!-- Total Completions -->
                <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-6 relative group overflow-hidden brutalist-shadow-sm dark:shadow-[4px_4px_0_0_white]">
                    <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 dark:text-concrete-500 mb-2 border-b-2 border-black dark:border-concrete-100 pb-1">Total_Executions</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-6xl font-black font-arvo leading-none dark:text-white">{{ stats()?.total_completions || 0 }}</span>
                        <span class="text-xs font-bold uppercase dark:text-concrete-200">Ops</span>
                    </div>
                </div>

            </div>

            <!-- Removed Tracker Modules (now in Daily Track feature) -->

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <!-- Activity Heatmap -->
                <div class="lg:col-span-2 bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-8 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white]">
                    <div class="flex items-center justify-between mb-6 border-b-4 border-black dark:border-concrete-100 pb-4">
                        <h3 class="text-xl font-black text-black dark:text-white uppercase font-arvo">Activity_Matrix</h3>
                        <div class="flex items-center gap-4">
                            <!-- Legend -->
                            <div class="hidden md:flex items-center gap-1 text-[9px] font-bold uppercase">
                                <span>Less</span>
                                <div class="w-3 h-3 bg-concrete-100 border border-black/30"></div>
                                <div class="w-3 h-3 bg-concrete-300 border border-black/30"></div>
                                <div class="w-3 h-3 bg-concrete-500 border border-black/30"></div>
                                <div class="w-3 h-3 bg-black border border-black/30"></div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-8">
                        @for (monthData of timelineMonths(); track monthData.monthYear) {
                            <div class="max-w-xs mx-auto">
                                <h4 class="text-sm font-bold font-mono uppercase mb-3 text-center dark:text-concrete-200">
                                    {{ monthData.monthName }} {{ monthData.year }}
                                </h4>
                                <div class="grid grid-cols-7 gap-1 mb-1">
                                    @for (d of ['S','M','T','W','T','F','S']; track d) {
                                        <div class="text-center text-[9px] font-black text-concrete-400 dark:text-concrete-500">{{ d }}</div>
                                    }
                                </div>
                                <div class="grid grid-cols-7 gap-1">
                                    @for (day of monthData.days; track $index) {
                                        @if (day.isEmpty) {
                                            <div class="aspect-square"></div>
                                        } @else {
                                            <div class="w-full aspect-square border border-black/10 dark:border-white/10 transition-all hover:scale-125 relative cursor-help rounded-sm"
                                                [class.bg-concrete-100]="day.level === 0"
                                                [class.dark:bg-concrete-700]="day.level === 0"
                                                [class.bg-concrete-300]="day.level === 1"
                                                [class.dark:bg-concrete-500]="day.level === 1"
                                                [class.bg-concrete-500]="day.level === 2"
                                                [class.bg-black]="day.level >= 3"
                                                [title]="day.date + ': Level ' + (day.level || 0)">
                                            </div>
                                        }
                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <!-- Calendar -->
                <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-6 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white]">
                    <div class="flex items-center justify-between mb-6 border-b-4 border-black dark:border-concrete-100 pb-2">
                        <h3 class="text-lg font-black uppercase font-arvo dark:text-white">{{ calendarMonthName() }} {{ calendarYear() }}</h3>
                        <div class="flex gap-1">
                            <button (click)="previousMonth()" [disabled]="!canPrevMonth()" class="w-8 h-8 rigid-border-sm bg-concrete-100 dark:bg-concrete-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none">
                                <span class="material-symbols-outlined text-sm dark:text-white dark:group-hover:text-black">chevron_left</span>
                            </button>
                            <button (click)="nextMonth()" [disabled]="!canNextMonth()" class="w-8 h-8 rigid-border-sm bg-concrete-100 dark:bg-concrete-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none">
                                <span class="material-symbols-outlined text-sm dark:text-white dark:group-hover:text-black">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-7 gap-1 mb-2">
                        @for (d of ['S','M','T','W','T','F','S']; track d) {
                            <div class="text-center text-[10px] font-black uppercase dark:text-concrete-400">{{d}}</div>
                        }
                    </div>
                    <div class="grid grid-cols-7 gap-1">
                        @for (day of calendarDays(); track day.date) {
                            @if (day.isEmpty) {
                                <div></div>
                            } @else {
                                <div (click)="selectDate(day.date)" 
                                     class="aspect-square flex items-center justify-center text-xs font-mono font-bold border-2 border-transparent transition-all cursor-pointer relative"
                                     [class.hover:bg-concrete-200]="!day.isFuture"
                                     [class.dark:hover:bg-concrete-700]="!day.isFuture"
                                     [class.opacity-30]="day.isFuture"
                                     [class.pointer-events-none]="day.isFuture"
                                     
                                     [class.bg-black]="day.isCompleted"
                                     [class.dark:bg-white]="day.isCompleted"
                                     [class.text-white]="day.isCompleted"
                                     [class.dark:text-black]="day.isCompleted"
                                     [class.border-black]="day.isCompleted"
                                     [class.dark:border-white]="day.isCompleted"
                                     
                                     [class.border-electric-red]="day.isToday && !day.isCompleted"
                                     [class.text-electric-red]="day.isToday && !day.isCompleted"
                                     
                                     [class.bg-concrete-100]="!day.isCompleted && !day.isToday && !day.isFuture"
                                     [class.dark:bg-concrete-700]="!day.isCompleted && !day.isToday && !day.isFuture"
                                     [class.dark:text-white]="!day.isCompleted && !day.isToday && !day.isFuture">
                                    {{ day.dayNumber }}
                                </div>
                            }
                        }
                    </div>
                </div>
            </div>

            <!-- Weekly Distribution & Efficiency Vector -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <!-- Weekly Distribution -->
                <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-8 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white]">
                    <h3 class="text-xl font-black text-black dark:text-white uppercase font-arvo mb-6 flex items-center gap-2 border-b-4 border-black dark:border-concrete-100 pb-2">
                        <span class="material-symbols-outlined text-electric-red">bubble_chart</span>
                        Weekly_Distribution
                    </h3>
                    @if (stats()?.weekly_frequency) {
                        <div class="h-48 w-full">
                            <ngx-charts-bar-vertical
                                [results]="weeklyBarData()"
                                [xAxis]="true"
                                [yAxis]="false"
                                [showXAxisLabel]="false"
                                [showYAxisLabel]="false"
                                [legend]="false"
                                [scheme]="colorScheme"
                                [roundDomains]="true">
                            </ngx-charts-bar-vertical>
                        </div>
                    }
                </div>

                <!-- Efficiency Vector (Trend Line) -->
                <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-8 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] flex flex-col">
                    <h3 class="text-xl font-black text-black dark:text-white uppercase font-arvo mb-6 flex items-center gap-2 border-b-4 border-black dark:border-concrete-100 pb-2">
                        <span class="material-symbols-outlined text-electric-red">trending_up</span>
                        Efficiency_Vector
                    </h3>
                    <div class="flex-1 flex items-end relative h-48 w-full bg-concrete-100 border-2 border-black p-2">
                        <svg viewBox="0 0 100 50" class="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stop-color="black" stop-opacity="0.2"/>
                                    <stop offset="100%" stop-color="black" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                            <path [attr.d]="trendArea()" fill="url(#trendGradient)" />
                            <path [attr.d]="trendLine()" fill="none" stroke="black" class="dark:stroke-white text-black dark:text-white" stroke-width="2.5" stroke-linecap="square" vector-effect="non-scaling-stroke" />
                        </svg>
                    </div>
                    <div class="flex justify-between text-[10px] font-black text-concrete-400 mt-3 font-mono uppercase">
                        @if (stats()?.completion_trend?.length) {
                            <span>{{ stats()!.completion_trend[0].period }}</span>
                            <span>{{ stats()!.completion_trend[stats()!.completion_trend.length - 1].period }}</span>
                        }
                    </div>
                </div>
            </div>

            <!-- Advanced Analytics -->
             @if (analytics()) {
                 <div class="bg-black dark:bg-white rigid-border border-[4px] dark:border-concrete-100 p-8 brutalist-shadow-md mb-12">
                     <app-habit-analytics [habit]="habit()!" [analytics]="analytics()!"></app-habit-analytics>
                 </div>
             }

            <!-- History Log -->
            <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-8 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white]">
                <div class="flex items-center justify-between mb-8 border-b-4 border-black dark:border-concrete-100 pb-4">
                    <h3 class="text-2xl font-black uppercase font-arvo dark:text-white">Data_Log</h3>
                    <div class="flex gap-2 text-xs font-bold font-mono dark:text-white">
                         <button [disabled]="currentPage() === 1" (click)="prevPage()" class="px-2 hover:underline disabled:opacity-30">PREV</button>
                         <span>{{ currentPage() }} / {{ totalPages() }}</span>
                         <button [disabled]="currentPage() >= totalPages()" (click)="nextPage()" class="px-2 hover:underline disabled:opacity-30">NEXT</button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left font-mono text-xs uppercase">
                        <thead class="bg-black dark:bg-white text-white dark:text-black">
                            <tr>
                                <th class="p-4 font-black">Timestamp</th>
                                <th class="p-4 font-black">Status</th>
                                <th class="p-4 font-black">Value</th>
                                <th class="p-4 font-black">Notes</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y-2 divide-black dark:divide-concrete-100 border-2 border-black dark:border-concrete-100 text-black dark:text-white">
                            @for (log of history(); track log.id) {
                                <tr class="hover:bg-concrete-100 dark:hover:bg-concrete-700 transition-colors">
                                    <td class="p-4 font-bold border-r-2 border-black dark:border-concrete-100">{{ log.completed_at | date:'yyyy-MM-dd HH:mm' }}</td>
                                    <td class="p-4 border-r-2 border-black dark:border-concrete-100">
                                        <span class="bg-electric-red text-white px-2 py-0.5 font-black text-[10px]">SUCCESS</span>
                                    </td>
                                    <td class="p-4 border-r-2 border-black dark:border-concrete-100 font-bold">{{ log.value || '--' }}</td>
                                    <td class="p-4 text-concrete-400 dark:text-concrete-500 italic">{{ log.notes || 'N/A' }}</td>
                                </tr>
                             } @empty {
                                [diff_line_limit]
                                <tr>
                                    <td colspan="4" class="p-8 text-center font-bold text-concrete-400">NO_DATA_AVAILABLE</td>
                                </tr>
                             }
                        </tbody>
                    </table>
                </div>
            </div>
        }
    </div>
    `,
    styles: [`
        :host { display: block; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #e5e5e5; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: black; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HabitDetailsComponent implements OnInit {
    location = inject(Location);
    route = inject(ActivatedRoute);
    routerNavigate = inject(Router);
    habitService = inject(HabitService);

    habitId = computed(() => this.route.snapshot.paramMap.get('id'));
    habit = computed(() => this.habitService.habits().find(h => h.id === this.habitId()));

    viewDate = signal(new Date().toISOString().split('T')[0]);
    fullHeatmapData = signal<{date: string, level: number}[]>([]); 

    isCompletedOnSelectedDate = computed(() => {
        const date = this.viewDate();
        return this.fullHeatmapData().some(d => d.date === date && d.level > 0);
    });

    history = signal<any[]>([]);
    currentPage = signal(1);
    pageSize = signal(5);
    totalHistory = signal(0);
    totalPages = computed(() => Math.ceil(this.totalHistory() / this.pageSize()) || 1);

    stats = signal<any | null>(null);
    analytics = signal<AnalyticsResponse | null>(null);

    colorScheme: Color = {
        name: 'vivid',
        selectable: true,
        group: ScaleType.Ordinal,
        domain: ['#3b82f6', '#16a34a', '#ef4444', '#f97316', '#8b5cf6', '#d946ef', '#f43f5e']
    };

    weeklyBarData = computed(() => {
        const freq = this.stats()?.weekly_frequency;
        if (!freq) return [];

        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return freq.map((day: any) => ({
            name: day.day_name,
            value: day.count
        })).sort((a: any, b: any) => dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name));
    });

    inconsistentDaysCount = computed(() => {
        const data = this.fullHeatmapData();
        if (!data.length) return 0;
        
        let missed = 0;
        const today = new Date();
        today.setHours(0,0,0,0);
        for (let i = 0; i < 7; i++) { // check last 7 days
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            const dayData = data.find(d => d.date === dateStr);
            if (!dayData || dayData.level === 0) {
                missed++;
            } else {
                break; // stop at first completion going backwards
            }
        }
        return missed;
    });

    timelineMonths = computed(() => {
        const h = this.habit();
        if (!h || !h.startDate || !h.endDate) return [];
        
        const start = new Date(h.startDate);
        const end = new Date(h.endDate);
        const dataMap = new Map(this.fullHeatmapData().map(item => [item.date, item.level]));
        const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

        const months = [];
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        const target = new Date(end.getFullYear(), end.getMonth(), 1);

        while (current <= target) {
            const year = current.getFullYear();
            const month = current.getMonth();
            const firstDay = new Date(year, month, 1);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startingDayOfWeek = firstDay.getDay();

            const days: any[] = [];
            for (let i = 0; i < startingDayOfWeek; i++) {
                days.push({ isEmpty: true });
            }
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, month, d);
                const dateStr = date.toISOString().split('T')[0];
                days.push({
                    isEmpty: false,
                    date: dateStr,
                    level: dataMap.get(dateStr) || 0
                });
            }

            months.push({
                monthName: monthNames[month],
                year,
                monthYear: `${year}-${month}`,
                days
            });

            current.setMonth(current.getMonth() + 1);
        }
        return months;
    });

    monthHeatmap = computed(() => {
        const year = this.calendarYear();
        const monthIndex = this.calendarMonth();
        const dataMap = new Map(this.fullHeatmapData().map(item => [item.date, item.level]));
        
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); 

        const days: any[] = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ isEmpty: true });
        }

        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const date = new Date(year, monthIndex, dayNum);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                isEmpty: false,
                date: dateStr,
                level: dataMap.get(dateStr) || 0
            });
        }
        return { month: monthIndex, days };
    });

    canPrevMonth = computed(() => {
        const h = this.habit();
        if (!h || !h.startDate) return true;
        const start = new Date(h.startDate);
        const currentMonthFirst = new Date(this.calendarYear(), this.calendarMonth(), 1);
        return currentMonthFirst > new Date(start.getFullYear(), start.getMonth(), 1);
    });

    canNextMonth = computed(() => {
        const h = this.habit();
        if (!h || !h.endDate) return true;
        const end = new Date(h.endDate);
        const currentMonthFirst = new Date(this.calendarYear(), this.calendarMonth(), 1);
        return currentMonthFirst < new Date(end.getFullYear(), end.getMonth(), 1);
    });

    // Calendar state
    calendarMonth = signal(new Date().getMonth());
    calendarYear = signal(new Date().getFullYear());
    selectedDate = signal<string | null>(null);
    logValue: number | undefined;
    logNotes: string = '';

    trendLine = computed(() => {
        const stats = this.stats();
        if (!stats || !stats.completion_trend || stats.completion_trend.length === 0) return '';
        
        const data = stats.completion_trend;
        const count = data.length;
        if (count < 2) return '';
        
        const points = data.map((item: any, index: number) => {
            const x = (index / (count - 1)) * 100;
            const y = 50 - ((item.rate / 100) * 50);
            return `${x},${y}`;
        });
        
        return `M ${points.join(' L ')}`;
    });

    trendArea = computed(() => {
        const line = this.trendLine();
        if (!line) return '';
        
        return `${line} V 50 H 0 Z`;
    });

    calendarMonthName = computed(() => {
        const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
        return monthNames[this.calendarMonth()];
    });

    calendarDays = computed(() => {
        const year = this.calendarYear();
        const month = this.calendarMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const today = new Date();
        today.setHours(0,0,0,0);

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ date: '', dayNumber: 0, isEmpty: true, isCompleted: false, isToday: false, isFuture: false });
        }

        const completedDates = new Set(this.fullHeatmapData().filter(h => h.level > 0).map(h => h.date));

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = date.getTime() === today.getTime();
            const isFuture = date > today;
            const isCompleted = completedDates.has(dateStr);

            days.push({
                date: dateStr,
                dayNumber: day,
                isEmpty: false,
                isCompleted,
                isToday,
                isFuture
            });
        }
        return days;
    });

    ngOnInit() {
        const id = this.habitId();
        if (id) {
            this.loadAllData(id);
        }
    }

    onDateChange(newDate: string) {
        this.viewDate.set(newDate);
        const id = this.habitId();
        if (id) {
            this.loadAllData(id);
        }
    }

    loadAllData(id: string) {
        this.loadHistory(id);
        this.loadStats(id);
        this.loadAnalytics(id);
    }

    loadStats(id: string) {
        this.habitService.getHabitStats(id).subscribe({
            next: (stats) => {
                this.stats.set(stats);
                this.fullHeatmapData.set(stats.heatmap || []);
            },
            error: (err) => console.error('Failed to load stats', err)
        });
    }

    loadAnalytics(id: string) {
        this.habitService.getHabitAnalytics(id).subscribe({
            next: (data) => this.analytics.set(data),
            error: (err) => console.error('Failed to load analytics', err)
        });
    }

    loadHistory(id: string) {
        this.habitService.getHistory(id, this.currentPage(), this.pageSize()).subscribe({
            next: (res) => {
                this.history.set(res.items);
                this.totalHistory.set(res.total);
            },
            error: (err) => console.error('Failed to load history', err)
        });
    }

    toggleDone() {
        const id = this.habitId();
        const habit = this.habit();
        const date = this.viewDate();
        const isCompletedNow = this.isCompletedOnSelectedDate();
        
        if (id && habit) {
            if (habit.type === 'measurable') {
                this.selectDate(date);
            } else {
                this.habitService.toggleCompletion(id, date).subscribe(() => {
                     this.loadAllData(id);
                });
            }
        }
    }

    selectDate(date: string) {
        if (!date) return;
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (selectedDate > today) return;

        const habit = this.habit();
        if (!habit) return;

        if (habit.type === 'yes_no') {
            this.habitService.toggleCompletion(habit.id, date).subscribe(() => {
                 this.loadStats(habit.id!);
                 this.loadHistory(habit.id!);
                 this.loadAnalytics(habit.id!);
            });
            return;
        }

        this.selectedDate.set(date);
        const existingLog = this.history().find(log => log.completed_at.startsWith(date));
        if (existingLog) {
            this.logValue = existingLog.value;
            this.logNotes = existingLog.notes || '';
        } else {
            this.logValue = undefined;
            this.logNotes = '';
        }
    }

    closeLogForm() {
        this.selectedDate.set(null);
    }

    saveLog() {
        const date = this.selectedDate();
        const id = this.habitId();
        if (!date || !id) return;

        const isCompletedNow = this.isCompletedOnSelectedDate();
        this.habitService.updateLog(id, date, {
            value: this.logValue,
            notes: this.logNotes
        }).subscribe(() => {
            this.loadHistory(id);
            this.loadStats(id);
            this.loadAnalytics(id);
            this.closeLogForm();
        });
    }

    deleteHabit() {
        const id = this.habitId();
        if (id && confirm('CONFIRM PURGE?')) {
            this.habitService.deleteHabit(id).subscribe(() => {
                this.routerNavigate.navigate(['/']);
            });
        }
    }

    editHabit() {
        const id = this.habitId();
        if (id) this.routerNavigate.navigate(['/edit', id]);
    }

    goBack() {
        this.location.back();
    }

    nextPage() {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
            const id = this.habitId();
            if (id) this.loadHistory(id);
        }
    }

    prevPage() {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
            const id = this.habitId();
            if (id) this.loadHistory(id);
        }
    }

    previousMonth() {
        if (this.calendarMonth() === 0) {
            this.calendarMonth.set(11);
            this.calendarYear.update(y => y - 1);
        } else {
            this.calendarMonth.update(m => m - 1);
        }
    }

    nextMonth() {
        if (this.calendarMonth() === 11) {
            this.calendarMonth.set(0);
            this.calendarYear.update(y => y + 1);
        } else {
            this.calendarMonth.update(m => m + 1);
        }
    }


}





