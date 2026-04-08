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
    <div class="min-h-screen bg-white px-4 py-5 sm:p-6 md:p-8 font-body transition-colors duration-300 overflow-x-hidden paper-texture pb-24">
        <!-- Header -->
        <header class="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
            <div class="flex items-center gap-4">
                <button (click)="goBack()" class="w-10 h-10 rounded-full bg-white shadow-gentle flex items-center justify-center hover:bg-sand transition-colors text-charcoal border border-taupe/10">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <span class="text-xs font-bold uppercase tracking-[0.2em] text-taupe mb-1 block">Protocol Analysis</span>
                    <h1 class="font-heading text-3xl md:text-5xl font-bold text-charcoal leading-tight">
                        {{ habit()?.name || 'Protocol Offline' }}
                    </h1>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button (click)="toggleDone()" 
                        class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-gentle hover:shadow-gentle-lg flex items-center gap-2"
                        [class.bg-orange-500]="!isCompletedOnSelectedDate()"
                        [class.text-white]="!isCompletedOnSelectedDate()"
                        [class.bg-sage]="isCompletedOnSelectedDate()"
                        [class.text-white]="isCompletedOnSelectedDate()">
                    <span class="material-symbols-outlined text-base">
                        {{ isCompletedOnSelectedDate() ? 'check_circle' : 'pending_actions' }}
                    </span>
                    {{ isCompletedOnSelectedDate() ? 'Completed Today' : 'Mark Complete' }}
                </button>
                <div class="flex gap-2">
                    <button (click)="editHabit()" class="w-10 h-10 rounded-full bg-white shadow-gentle flex items-center justify-center hover:bg-sand transition-colors text-charcoal border border-taupe/10" title="Edit Protocol">
                        <span class="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button (click)="deleteHabit()" class="w-10 h-10 rounded-full bg-white shadow-gentle flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors text-charcoal border border-taupe/10" title="Purge Protocol">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </div>
        </header>

        @if (habit()) {
            <!-- Protocol Config Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-white rounded-lg shadow-gentle p-4 border border-taupe/10">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-taupe mb-1">System Type</p>
                    <p class="text-sm font-bold text-charcoal">{{ habit()?.type === 'yes_no' ? 'Binary Adherence' : 'Quantitative Metric' }}</p>
                </div>
                <div class="bg-white rounded-lg shadow-gentle p-4 border border-taupe/10">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-taupe mb-1">Timeline</p>
                    <p class="text-sm font-bold text-charcoal">{{ habit()?.startDate | date:'MMM d' }} - {{ habit()?.endDate | date:'MMM d, yy' }}</p>
                </div>
                <div class="bg-white rounded-lg shadow-gentle p-4 border border-taupe/10">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-taupe mb-1">Frequency</p>
                    <p class="text-sm font-bold text-charcoal">
                        {{ habit()?.frequencyType === 'daily' ? 'Constant (Daily)' : 
                           habit()?.frequencyType === 'specific_days' ? 'Scheduled Days' : 
                           'Every ' + habit()?.frequencyInterval + ' Days' }}
                    </p>
                </div>
                <div class="bg-white rounded-lg shadow-gentle p-4 border border-taupe/10">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-taupe mb-1">Execution Window</p>
                    <p class="text-sm font-bold text-charcoal">{{ habit()?.timeBlockStart || 'Any Time' }} - {{ habit()?.timeBlockEnd || 'Any Time' }}</p>
                </div>
            </div>

            @if (inconsistentDaysCount() >= 2) {
                <div class="bg-orange-500/10 border border-orange-500/20 text-orange-600 p-4 rounded-lg font-bold text-sm mb-8 flex items-center gap-3">
                    <span class="material-symbols-outlined">warning</span>
                    <span>System Alert: {{ inconsistentDaysCount() }} missed cycles detected. Restoration protocol advised.</span>
                </div>
            }

            <!-- Key Performance Indicators -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <!-- Streak -->
                <div class="bg-white rounded-xl shadow-gentle p-6 border border-taupe/10 hover:shadow-gentle-lg transition-all border-l-4 border-l-orange-500">
                    <p class="text-xs font-bold uppercase tracking-widest text-taupe mb-2">Current Sequence</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-5xl font-bold font-heading text-charcoal">{{ habit()?.streak }}</span>
                        <span class="text-sm font-bold text-orange-500">days active</span>
                    </div>
                </div>

                <!-- Best Streak -->
                <div class="bg-orange-500 text-white rounded-xl shadow-gentle p-6 hover:shadow-gentle-lg transition-all">
                    <p class="text-xs font-bold uppercase tracking-widest text-white/80 mb-2">Maximum Continuity</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-5xl font-bold font-heading">{{ habit()?.bestStreak }}</span>
                        <span class="text-sm font-bold opacity-90">record streak</span>
                    </div>
                </div>

                <!-- Total Completions -->
                <div class="bg-white rounded-xl shadow-gentle p-6 border border-taupe/10 hover:shadow-gentle-lg transition-all border-l-4 border-l-sage">
                    <p class="text-xs font-bold uppercase tracking-widest text-taupe mb-2">Total Executions</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-5xl font-bold font-heading text-charcoal">{{ stats()?.total_completions || 0 }}</span>
                        <span class="text-sm font-bold text-sage">successes</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <!-- Activity Heatmap -->
                <div class="lg:col-span-8 bg-white rounded-2xl shadow-gentle p-8 border border-taupe/10">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 class="font-heading text-xl font-bold text-charcoal">Activity Matrix</h3>
                            <p class="text-xs text-taupe mt-1">Visualization of historical adherence</p>
                        </div>
                        <div class="flex items-center gap-2 text-[10px] font-bold text-taupe bg-sand p-2 rounded-lg">
                            <span>Muted</span>
                            <div class="flex gap-1">
                                <div class="w-3 h-3 bg-sand-dark rounded-[2px]"></div>
                                <div class="w-3 h-3 bg-orange-500/40 rounded-[2px]"></div>
                                <div class="w-3 h-3 bg-orange-500/70 rounded-[2px]"></div>
                                <div class="w-3 h-3 bg-orange-600 rounded-[2px]"></div>
                            </div>
                            <span>Active</span>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-8 justify-center sm:justify-start">
                        @for (monthData of timelineMonths(); track monthData.monthYear) {
                            <div class="w-full max-w-[200px]">
                                <h4 class="text-xs font-bold text-charcoal mb-3 uppercase tracking-wider text-center">
                                    {{ monthData.monthName }} {{ monthData.year }}
                                </h4>
                                <div class="grid grid-cols-7 gap-1.5">
                                    @for (d of ['S','M','T','W','T','F','S']; track $index) {
                                        <div class="text-center text-[9px] font-bold text-taupe">{{ d }}</div>
                                    }
                                    @for (day of monthData.days; track $index) {
                                        @if (day.isEmpty) {
                                            <div class="aspect-square"></div>
                                        } @else {
                                            <div class="w-full aspect-square rounded-[3px] transition-all hover:scale-125 cursor-help relative"
                                                [class.bg-sand]="day.level === 0"
                                                [class.bg-orange-500/40]="day.level === 1"
                                                [class.bg-orange-500/70]="day.level === 2"
                                                [class.bg-orange-600]="day.level >= 3"
                                                [title]="day.date + ': Adherence Level ' + (day.level || 0)">
                                            </div>
                                        }
                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <!-- Calendar -->
                <div class="lg:col-span-4 bg-white rounded-2xl shadow-gentle p-6 border border-taupe/10">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="font-heading text-lg font-bold text-charcoal">{{ calendarMonthName() }} {{ calendarYear() }}</h3>
                        <div class="flex gap-1">
                            <button (click)="$event.stopPropagation(); previousMonth()" [disabled]="!canPrevMonth()" class="w-8 h-8 rounded-full bg-sand flex items-center justify-center hover:bg-sand-dark transition-colors disabled:opacity-20">
                                <span class="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                            <button (click)="$event.stopPropagation(); nextMonth()" [disabled]="!canNextMonth()" class="w-8 h-8 rounded-full bg-sand flex items-center justify-center hover:bg-sand-dark transition-colors disabled:opacity-20">
                                <span class="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-7 gap-1 mb-2">
                        @for (d of ['S','M','T','W','T','F','S']; track $index) {
                            <div class="text-center text-[10px] font-bold text-taupe uppercase">{{d}}</div>
                        }
                    </div>
                    <div class="grid grid-cols-7 gap-2">
                        @for (day of calendarDays(); track day.date) {
                            @if (day.isEmpty) {
                                <div></div>
                            } @else {
                                <div (click)="selectDate(day.date)" 
                                     class="aspect-square flex items-center justify-center text-xs font-bold rounded-lg border-2 border-transparent transition-all cursor-pointer relative"
                                     [class.hover:bg-sand]="!day.isFuture"
                                     [class.opacity-30]="day.isFuture"
                                     [class.pointer-events-none]="day.isFuture"
                                     
                                     [class.bg-sage]="day.isCompleted"
                                     [class.text-white]="day.isCompleted"
                                     
                                     [class.border-orange-500]="day.isToday && !day.isCompleted"
                                     [class.text-orange-600]="day.isToday && !day.isCompleted"
                                     
                                     [class.bg-sand/50]="!day.isCompleted && !day.isToday && !day.isFuture"
                                     [class.text-taupe]="!day.isCompleted && !day.isToday && !day.isFuture">
                                    {{ day.dayNumber }}
                                </div>
                            }
                        }
                    </div>
                    <p class="text-[10px] text-taupe mt-4 text-center">Tap a date to update adherence</p>
                </div>
            </div>

            <!-- Analytics Visualizations -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <!-- Weekly Distribution -->
                <div class="bg-white rounded-2xl shadow-gentle p-8 border border-taupe/10">
                    <h3 class="font-heading text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-orange-500">bubble_chart</span>
                        Weekly Distribution
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

                <!-- Adherence Efficiency -->
                <div class="bg-white rounded-2xl shadow-gentle p-8 border border-taupe/10 flex flex-col">
                    <h3 class="font-heading text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sage">trending_up</span>
                        Adherence Efficiency
                    </h3>
                    <div class="flex-1 flex items-end relative h-48 w-full bg-sand/30 rounded-xl overflow-hidden p-2">
                        <svg viewBox="0 0 100 50" class="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" [attr.stop-color]="'#f97316'" stop-opacity="0.2"/>
                                    <stop offset="100%" [attr.stop-color]="'#f97316'" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                            <path [attr.d]="trendArea()" fill="url(#trendGradient)" />
                            <path [attr.d]="trendLine()" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke" />
                        </svg>
                    </div>
                    <div class="flex justify-between text-[10px] font-bold text-taupe mt-3 uppercase tracking-wider">
                        @if (stats()?.completion_trend?.length) {
                            <span>{{ stats()!.completion_trend[0].period }}</span>
                            <span>{{ stats()!.completion_trend[stats()!.completion_trend.length - 1].period }}</span>
                        }
                    </div>
                </div>
            </div>

            <!-- Advanced Analytics Component -->
             @if (analytics()) {
                 <div class="bg-charcoal rounded-2xl shadow-gentle p-8 mb-12">
                     <app-habit-analytics [habit]="habit()!" [analytics]="analytics()!"></app-habit-analytics>
                 </div>
             }

            <!-- Data Log Table -->
            <div class="bg-white rounded-2xl shadow-gentle p-8 border border-taupe/10 overflow-hidden">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 class="font-heading text-2xl font-bold text-charcoal">Historical Log</h3>
                        <p class="text-sm text-taupe mt-1">Detailed record of protocol executions</p>
                    </div>
                    <div class="flex items-center gap-3 text-xs font-bold text-taupe">
                         <button [disabled]="currentPage() === 1" (click)="prevPage()" class="w-8 h-8 rounded-full bg-sand flex items-center justify-center hover:bg-sand-dark transition-colors disabled:opacity-30">
                            <span class="material-symbols-outlined text-sm">chevron_left</span>
                         </button>
                         <span class="bg-sand px-3 py-1 rounded-full">{{ currentPage() }} / {{ totalPages() }}</span>
                         <button [disabled]="currentPage() >= totalPages()" (click)="nextPage()" class="w-8 h-8 rounded-full bg-sand flex items-center justify-center hover:bg-sand-dark transition-colors disabled:opacity-30">
                            <span class="material-symbols-outlined text-sm">chevron_right</span>
                         </button>
                    </div>
                </div>
                
                <div class="overflow-x-auto rounded-xl border border-taupe/10">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-sand text-charcoal border-b border-taupe/10">
                            <tr>
                                <th class="p-4 font-bold uppercase tracking-wider text-xs">Timestamp</th>
                                <th class="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                                <th class="p-4 font-bold uppercase tracking-wider text-xs">Value</th>
                                <th class="p-4 font-bold uppercase tracking-wider text-xs">Notes</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-taupe/10 text-charcoal">
                            @for (log of history(); track log.id) {
                                <tr class="hover:bg-sand/30 transition-colors">
                                    <td class="p-4 font-medium">{{ log.completed_at | date:'MMM d, yyyy · HH:mm' }}</td>
                                    <td class="p-4">
                                        <span class="bg-sage/10 text-sage px-3 py-1 rounded-full font-bold text-xs">SUCCESS</span>
                                    </td>
                                    <td class="p-4 font-bold">{{ log.value || '--' }}</td>
                                    <td class="p-4 text-taupe text-xs italic">{{ log.notes || 'No observation recorded' }}</td>
                                </tr>
                             } @empty {
                                <tr>
                                    <td colspan="4" class="p-12 text-center text-taupe italic">
                                        <span class="material-symbols-outlined text-4xl block mb-2 opacity-20">inventory_2</span>
                                        No log entries found for this protocol
                                    </td>
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
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--color-sand); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-taupe); border-radius: 3px; }
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
        name: 'warmNatural',
        selectable: true,
        group: ScaleType.Ordinal,
        domain: ['#f97316', '#8c9a81', '#4a443e', '#9a9086', '#ea580c', '#fb923c', '#8b5cf6']
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







