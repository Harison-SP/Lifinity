import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { HabitAnalyticsComponent } from './habit-analytics/habit-analytics';
import { AnalyticsResponse } from '../../models/habit.model';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
    selector: 'app-habit-details',
    standalone: true,
    imports: [CommonModule, FormsModule, HabitAnalyticsComponent, NgxChartsModule],
    template: `
    <div class="min-h-screen bg-concrete-200 p-6 md:p-8 lg:p-12 font-manrope pb-24 relative">
        <!-- Header -->
        <header class="mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-black pb-6 bg-white p-6 rigid-border-sm brutalist-shadow-sm">
            <div class="flex items-center gap-6 w-full md:w-auto">
                <button (click)="goBack()" class="w-12 h-12 rigid-border-sm bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors group shrink-0">
                    <span class="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <div>
                    <div class="bg-black text-white px-2 py-0.5 inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                        Protocol_Analysis
                    </div>
                    <h1 class="text-3xl md:text-5xl font-black text-black uppercase leading-none font-arvo flex items-center gap-3">
                        {{ habit()?.name || 'LOADING...' }}
                    </h1>
                </div>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto justify-end">
                <button (click)="editHabit()" class="px-4 py-2 bg-concrete-100 rigid-border-sm border-[2px] text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">edit</span>
                    Edit
                </button>
                <button (click)="deleteHabit()" class="px-4 py-2 bg-concrete-100 rigid-border-sm border-[2px] text-xs font-black uppercase tracking-widest hover:bg-electric-red hover:text-white hover:border-black transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">delete</span>
                    Purge
                </button>
                <button (click)="toggleDone()" 
                        class="px-6 py-2 rigid-border-sm border-[2px] font-black uppercase tracking-widest text-xs transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0_0_black]"
                        [class.bg-electric-red]="!habit()?.completedToday"
                        [class.text-white]="!habit()?.completedToday"
                        [class.bg-concrete-900]="habit()?.completedToday"
                        [class.text-white]="habit()?.completedToday">
                    {{ habit()?.completedToday ? 'COMPLETED' : 'MARK_COMPLETE' }}
                </button>
            </div>
        </header>

        @if (habit()) {
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <!-- Streak -->
                <div class="bg-white rigid-border border-[4px] p-6 relative group overflow-hidden brutalist-shadow-sm">
                    <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 mb-2 border-b-2 border-black pb-1">Current_Sequence</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-6xl font-black font-arvo leading-none">{{ habit()?.streak }}</span>
                        <span class="text-xs font-bold text-electric-red uppercase">Days</span>
                    </div>
                </div>

                <!-- Best Streak -->
                <div class="bg-black text-white rigid-border border-[4px] p-6 relative group overflow-hidden brutalist-shadow-sm">
                    <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 mb-2 border-b border-concrete-400 pb-1">Max_Continuity</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-6xl font-black font-arvo leading-none text-yellow-400">{{ habit()?.bestStreak }}</span>
                        <span class="text-xs font-bold uppercase">Record</span>
                    </div>
                </div>

                <!-- Total Completions -->
                <div class="bg-white rigid-border border-[4px] p-6 relative group overflow-hidden brutalist-shadow-sm">
                    <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 mb-2 border-b-2 border-black pb-1">Total_Executions</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-6xl font-black font-arvo leading-none">{{ stats()?.total_completions || 0 }}</span>
                        <span class="text-xs font-bold uppercase">Ops</span>
                    </div>
                </div>

                <!-- Efficiency -->
                <div class="bg-white rigid-border border-[4px] p-6 relative group overflow-hidden brutalist-shadow-sm">
                     <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400 mb-2 border-b-2 border-black pb-1">Global_Efficiency</p>
                     <div class="flex items-baseline gap-2 relative z-10">
                        <span class="text-6xl font-black font-arvo leading-none">{{ stats()?.completion_rate || 0 }}</span>
                        <span class="text-2xl font-black">%</span>
                     </div>
                     <div class="absolute bottom-0 left-0 h-2 bg-concrete-200 w-full">
                        <div class="h-full bg-electric-red transition-all" [style.width.%]="stats()?.completion_rate || 0"></div>
                     </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <!-- Activity Heatmap -->
                <div class="lg:col-span-2 bg-white rigid-border border-[4px] p-8 brutalist-shadow-md">
                    <div class="flex items-center justify-between mb-6 border-b-4 border-black pb-4">
                        <h3 class="text-xl font-black text-black uppercase font-arvo">Activity_Matrix</h3>
                        <div class="flex items-center gap-4">
                            <!-- Year Selector -->
                            <select [ngModel]="heatmapYear()" (ngModelChange)="heatmapYear.set($event)" class="bg-white rigid-border-sm border-2 border-black p-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black">
                                @for (year of availableYears(); track year) {
                                    <option [value]="year">{{ year }}</option>
                                }
                            </select>
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
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-8">
                        @for (monthData of yearHeatmap(); track monthData.month) {
                            <div>
                                <h4 class="text-sm font-bold font-mono uppercase mb-3 text-center">{{ getMonthName(monthData.month) }}</h4>
                                <div class="grid grid-cols-7 gap-1 mb-1">
                                    @for (d of ['S','M','T','W','T','F','S']; track d) {
                                        <div class="text-center text-[9px] font-black text-concrete-400">{{ d }}</div>
                                    }
                                </div>
                                <div class="grid grid-cols-7 gap-1">
                                    @for (day of monthData.days; track $index) {
                                        @if (day.isEmpty) {
                                            <div class="aspect-square"></div>
                                        } @else {
                                            <div class="w-full aspect-square border border-black/10 transition-all hover:scale-125 relative cursor-help rounded-sm"
                                                [class.bg-concrete-100]="day.level === 0"
                                                [class.bg-concrete-300]="day.level === 1"
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
                <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-md">
                    <div class="flex items-center justify-between mb-6 border-b-4 border-black pb-2">
                        <h3 class="text-lg font-black uppercase font-arvo">{{ calendarMonthName() }} {{ calendarYear() }}</h3>
                        <div class="flex gap-1">
                            <button (click)="previousMonth()" class="w-8 h-8 rigid-border-sm bg-concrete-100 hover:bg-black hover:text-white transition-colors flex items-center justify-center">
                                <span class="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                            <button (click)="nextMonth()" class="w-8 h-8 rigid-border-sm bg-concrete-100 hover:bg-black hover:text-white transition-colors flex items-center justify-center">
                                <span class="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-7 gap-1 mb-2">
                        @for (d of ['S','M','T','W','T','F','S']; track d) {
                            <div class="text-center text-[10px] font-black uppercase">{{d}}</div>
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
                                     [class.opacity-30]="day.isFuture"
                                     [class.pointer-events-none]="day.isFuture"
                                     
                                     [class.bg-black]="day.isCompleted"
                                     [class.text-white]="day.isCompleted"
                                     [class.border-black]="day.isCompleted"
                                     
                                     [class.border-electric-red]="day.isToday && !day.isCompleted"
                                     [class.text-electric-red]="day.isToday && !day.isCompleted"
                                     
                                     [class.bg-concrete-100]="!day.isCompleted && !day.isToday && !day.isFuture">
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
                <div class="bg-white rigid-border border-[4px] p-8 brutalist-shadow-md">
                    <h3 class="text-xl font-black text-black uppercase font-arvo mb-6 flex items-center gap-2 border-b-4 border-black pb-2">
                        <span class="material-symbols-outlined text-electric-red">bubble_chart</span>
                        Weekly_Distribution
                    </h3>
                    @if (stats()?.weekly_frequency) {
                        <div class="h-48 w-full">
                            <ngx-charts-bubble-chart
                                [results]="weeklyBubbleData()"
                                [xAxis]="true"
                                [yAxis]="false"
                                [showXAxisLabel]="false"
                                [showYAxisLabel]="false"
                                [legend]="false"
                                [scheme]="colorScheme"
                                [roundDomains]="true"
                                [minRadius]="5"
                                [maxRadius]="30"
                                [autoScale]="true">
                            </ngx-charts-bubble-chart>
                        </div>
                    }
                </div>

                <!-- Efficiency Vector (Trend Line) -->
                <div class="bg-white rigid-border border-[4px] p-8 brutalist-shadow-md flex flex-col">
                    <h3 class="text-xl font-black text-black uppercase font-arvo mb-6 flex items-center gap-2 border-b-4 border-black pb-2">
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
                            <path [attr.d]="trendLine()" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="square" vector-effect="non-scaling-stroke" />
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
                 <div class="bg-black rigid-border border-[4px] p-8 brutalist-shadow-md mb-12">
                     <app-habit-analytics [habit]="habit()!" [analytics]="analytics()!"></app-habit-analytics>
                 </div>
             }

            <!-- History Log -->
            <div class="bg-white rigid-border border-[4px] p-8 brutalist-shadow-md">
                <div class="flex items-center justify-between mb-8 border-b-4 border-black pb-4">
                    <h3 class="text-2xl font-black uppercase font-arvo">Data_Log</h3>
                    <div class="flex gap-2 text-xs font-bold font-mono">
                         <button [disabled]="currentPage() === 1" (click)="prevPage()" class="px-2 hover:underline disabled:opacity-30">PREV</button>
                         <span>{{ currentPage() }} / {{ totalPages() }}</span>
                         <button [disabled]="currentPage() >= totalPages()" (click)="nextPage()" class="px-2 hover:underline disabled:opacity-30">NEXT</button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left font-mono text-xs uppercase">
                        <thead class="bg-black text-white">
                            <tr>
                                <th class="p-4 font-black">Timestamp</th>
                                <th class="p-4 font-black">Status</th>
                                <th class="p-4 font-black">Value</th>
                                <th class="p-4 font-black">Notes</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y-2 divide-black border-2 border-black">
                             @for (log of history(); track log.id) {
                                <tr class="hover:bg-concrete-100 transition-colors">
                                    <td class="p-4 font-bold border-r-2 border-black">{{ log.completed_at | date:'yyyy-MM-dd HH:mm' }}</td>
                                    <td class="p-4 border-r-2 border-black">
                                        <span class="bg-electric-red text-white px-2 py-0.5 font-black text-[10px]">SUCCESS</span>
                                    </td>
                                    <td class="p-4 border-r-2 border-black font-bold">{{ log.value || '--' }}</td>
                                    <td class="p-4 text-concrete-400 italic">{{ log.notes || 'N/A' }}</td>
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

        <!-- Log Modal -->
        @if (selectedDate() && habit()?.type === 'measurable') {
             <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rigid-border border-[4px] p-8 w-full max-w-md brutalist-shadow-active">
                    <div class="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
                        <h4 class="font-black uppercase font-arvo text-xl">Log: {{ selectedDate() }}</h4>
                        <button (click)="closeLogForm()" class="hover:text-electric-red">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="space-y-4 font-manrope">
                        <div>
                             <label class="block text-xs font-black uppercase tracking-widest mb-1">Value</label>
                             <input type="number" [(ngModel)]="logValue" class="w-full p-3 font-mono text-lg font-bold border-2 border-black outline-none focus:bg-concrete-100">
                        </div>
                        <div>
                             <label class="block text-xs font-black uppercase tracking-widest mb-1">Notes</label>
                             <textarea [(ngModel)]="logNotes" rows="3" class="w-full p-3 font-mono text-sm border-2 border-black outline-none focus:bg-concrete-100 resize-none"></textarea>
                        </div>
                        <button (click)="saveLog()" class="w-full py-4 bg-black text-white font-black uppercase hover:bg-electric-red transition-colors mt-4">Commit_Data</button>
                    </div>
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

    weeklyBubbleData = computed(() => {
        const freq = this.stats()?.weekly_frequency;
        if (!freq) return [];

        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const series = freq.map((day: any) => ({
            name: day.day_name,
            x: day.day_name,
            y: 50, 
            r: day.count + 1 
        }));

        series.sort((a: any, b: any) => dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name));

        return [{
            name: this.habit()?.name || 'Frequency',
            series: series
        }];
    });
    
    // Heatmap state
    heatmapYear = signal(new Date().getFullYear());
    fullHeatmapData = signal<{date: string, level: number}[]>([]); 
    availableYears = computed(() => {
        const allDates = this.fullHeatmapData().map(d => new Date(d.date));
        if (allDates.length === 0) return [new Date().getFullYear()];
        const years = [...new Set(allDates.map(d => d.getFullYear()))];
        return years.sort((a, b) => b - a);
    });

    yearHeatmap = computed(() => {
        const year = this.heatmapYear();
        const dataMap = new Map(this.fullHeatmapData().map(item => [item.date, item.level]));
        const months = [];

        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const firstDay = new Date(year, monthIndex, 1);
            const lastDay = new Date(year, monthIndex + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

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
            months.push({ month: monthIndex, days });
        }
        return months;
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
            this.loadHistory(id);
            this.loadStats(id);
            this.loadAnalytics(id);
        }
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

    getMonthName(monthIndex: number): string {
        return new Date(this.heatmapYear(), monthIndex).toLocaleString('default', { month: 'short' }).toUpperCase();
    }

    toggleDone() {
        const id = this.habitId();
        const habit = this.habit();
        if (id && habit) {
            if (habit.type === 'measurable') {
                const today = new Date().toISOString().split('T')[0];
                this.selectDate(today);
            } else {
                this.habitService.toggleCompletion(id, new Date().toISOString().split('T')[0]).subscribe(() => {
                     this.loadHistory(id);
                     this.loadStats(id);
                     this.loadAnalytics(id);
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
            const currentData = this.fullHeatmapData();
            const dayIndex = currentData.findIndex(d => d.date === date);
            
            let newLevel = 1;
            if (dayIndex > -1) {
                const currentLevel = currentData[dayIndex].level;
                newLevel = currentLevel > 0 ? 0 : 1;
                const newData = [...currentData];
                newData[dayIndex] = { ...newData[dayIndex], level: newLevel };
                this.fullHeatmapData.set(newData);
            } else {
                this.fullHeatmapData.set([...currentData, { date, level: newLevel }]);
            }

            this.habitService.updateLog(habit.id, date, { value: newLevel }).subscribe({
                next: () => {
                    this.loadStats(habit.id!);
                    this.loadHistory(habit.id!);
                },
                error: (err) => {
                    console.error("Failed to update log, reverting UI", err);
                    this.fullHeatmapData.set(currentData);
                }
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
