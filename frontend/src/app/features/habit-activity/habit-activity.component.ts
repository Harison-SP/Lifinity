import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { isBefore, startOfDay, subDays, format, parseISO } from 'date-fns';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { HabitAnalyticsComponent } from './habit-analytics/habit-analytics';
import { HabitActivityMatrixComponent } from './components/habit-activity-matrix/habit-activity-matrix.component';
import { HabitCalendarViewComponent } from './components/habit-calendar-view/habit-calendar-view.component';
import { HabitTrendChartComponent } from './components/habit-trend-chart/habit-trend-chart.component';
import { SubtaskMatrixComponent } from './components/subtask-matrix/subtask-matrix.component';
import { AnalyticsResponse } from '../../models/habit.model';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
    selector: 'app-habit-activity',
    standalone: true,
    imports: [CommonModule, FormsModule, HabitAnalyticsComponent, HabitActivityMatrixComponent, HabitCalendarViewComponent, HabitTrendChartComponent, SubtaskMatrixComponent, NgxChartsModule],
    template: `
    <div class="min-h-screen bg-white px-4 py-5 sm:p-6 md:p-8 font-body transition-colors duration-300 overflow-x-hidden paper-texture pb-24">
        <!-- Header -->
        <header class="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
            <div class="flex items-center gap-4">
                <button (click)="goBack()" class="w-10 h-10 rounded-full bg-white shadow-gentle flex items-center justify-center hover:bg-sand transition-colors text-charcoal border border-taupe/10">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <span class="text-xs font-bold uppercase tracking-[0.2em] text-taupe mb-1 block">Habit Activity</span>
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

        <!-- Sobriety / Avoidance Tracker -->
        @if (habit()?.category === 'bad_habit' && habit()?.soberStartDate) {
            <div class="mb-10 bg-charcoal text-white rounded-2xl p-8 shadow-gentle-lg border border-white/10 relative overflow-hidden group">
                <!-- Background Accent -->
                <div class="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-orange-500/20 transition-colors duration-700"></div>
                
                <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div class="text-center md:text-left">
                        <div class="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                            <span class="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400">Avoidance Protocol Active</span>
                        </div>
                        <h2 class="text-4xl md:text-6xl font-heading font-bold mb-2">{{ soberTime().days }} Days</h2>
                        <p class="text-sm text-white/60 font-body">Time elapsed since last protocol breach</p>
                    </div>

                    <div class="flex flex-col items-center gap-6">
                        <div class="flex gap-3 text-center">
                            <div class="bg-white/10 rounded-xl p-4 min-w-[80px] backdrop-blur-sm border border-white/5">
                                <p class="text-3xl font-bold font-heading">{{ soberTime().hours }}</p>
                                <p class="text-[8px] uppercase tracking-tighter text-white/50">Hours</p>
                            </div>
                            <div class="bg-white/10 rounded-xl p-4 min-w-[80px] backdrop-blur-sm border border-white/5">
                                <p class="text-3xl font-bold font-heading">{{ soberTime().minutes }}</p>
                                <p class="text-[8px] uppercase tracking-tighter text-white/50">Minutes</p>
                            </div>
                            <div class="bg-white/10 rounded-xl p-4 min-w-[80px] backdrop-blur-sm border border-white/5">
                                <p class="text-3xl font-bold font-heading text-orange-400">{{ soberTime().seconds }}</p>
                                <p class="text-[8px] uppercase tracking-tighter text-white/50">Seconds</p>
                            </div>
                        </div>
                        
                        <button (click)="resetSoberTimer()" 
                                class="px-10 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 group-hover:border-orange-500/50">
                            <span class="material-symbols-outlined text-sm">refresh</span>
                            Record Breach & Reset
                        </button>
                    </div>
                </div>
            </div>
        }

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

            <!-- Habit Stacking Indicator -->
            @if (habit()?.stackedWith) {
                <div class="mb-8 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 rounded-xl p-5 border border-orange-500/20 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -translate-y-8 translate-x-8"></div>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-orange-500">link</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600/80 mb-0.5">Stacking Protocol</p>
                                <p class="text-sm font-bold text-charcoal">Linked Event: <span class="text-orange-500">{{ habit()?.stackedWith }}</span></p>
                                <p class="text-xs text-taupe mt-1">
                                    @if (stackDaysRemaining() > 0) {
                                        {{ stackDaysRemaining() }} cycles remaining in formation phase
                                    } @else {
                                        <span class="text-sage font-bold">🎉 Stacking verified. Habit successfully ingrained.</span>
                                    }
                                </p>
                            </div>
                        </div>
                        <div class="w-full sm:w-48 flex-shrink-0">
                            <div class="flex items-center justify-between text-xs font-bold text-taupe mb-1">
                                <span>Formation Progress</span>
                                <span class="text-orange-500">{{ stackProgress() }}%</span>
                            </div>
                            <div class="w-full h-2.5 bg-taupe/10 rounded-full overflow-hidden p-0.5 border border-taupe/5">
                                <div class="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000 ease-out"
                                     [style.width.%]="stackProgress()"></div>
                            </div>
                        </div>
                    </div>
                </div>
            }

            @if (inconsistentDaysCount() >= 2) {
                <div class="bg-orange-500/10 border border-orange-500/20 text-orange-600 p-4 rounded-lg font-bold text-sm mb-8 flex items-center gap-3">
                    <span class="material-symbols-outlined">warning</span>
                    <span>System Alert: {{ inconsistentDaysCount() }} missed cycles detected. Restoration protocol advised.</span>
                </div>
            }

            <!-- Sobriety Countdown (Conditional for bad_habit) -->
            @if (habit()?.category === 'bad_habit' && habit()?.soberStartDate) {
                <div class="mb-12 bg-charcoal text-white rounded-3xl p-8 shadow-gentle-lg border border-white/10 relative overflow-hidden group">
                    <!-- Glassmorphism Background Accent -->
                    <div class="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-orange-500/30 transition-colors"></div>
                    
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-8">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                    <span class="material-symbols-outlined text-orange-500 text-2xl">timer</span>
                                </div>
                                <div>
                                    <h2 class="font-heading text-2xl font-bold tracking-tight">Active Avoidance Protocol</h2>
                                    <p class="text-xs text-white/60 uppercase tracking-widest font-bold">Continuous clean streak monitoring</p>
                                </div>
                            </div>
                            <button (click)="resetSoberTimer()" 
                                    class="px-5 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-red-500/30 flex items-center gap-2 group/btn">
                                <span class="material-symbols-outlined text-sm group-hover/btn:rotate-180 transition-transform duration-500">restart_alt</span>
                                Report Slip / Reset
                            </button>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div class="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center transform hover:scale-105 transition-transform">
                                <span class="block text-4xl md:text-5xl font-heading font-black text-orange-500 mb-1">{{ soberTime().days }}</span>
                                <span class="text-[10px] font-bold uppercase tracking-widest text-white/40">Days</span>
                            </div>
                            <div class="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center transform hover:scale-105 transition-transform">
                                <span class="block text-4xl md:text-5xl font-heading font-black text-orange-500 mb-1">{{ soberTime().hours | number:'2.0-0' }}</span>
                                <span class="text-[10px] font-bold uppercase tracking-widest text-white/40">Hours</span>
                            </div>
                            <div class="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center transform hover:scale-105 transition-transform">
                                <span class="block text-4xl md:text-5xl font-heading font-black text-orange-500 mb-1">{{ soberTime().minutes | number:'2.0-0' }}</span>
                                <span class="text-[10px] font-bold uppercase tracking-widest text-white/40">Minutes</span>
                            </div>
                            <div class="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center transform hover:scale-105 transition-transform">
                                <span class="block text-4xl md:text-5xl font-heading font-black text-orange-500 mb-1">{{ soberTime().seconds | number:'2.0-0' }}</span>
                                <span class="text-[10px] font-bold uppercase tracking-widest text-white/40">Seconds</span>
                            </div>
                        </div>

                        <div class="mt-8 flex items-center justify-center gap-3 text-white/40 text-xs">
                            <span class="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></span>
                            <span>Live streak validation active since {{ habit()?.soberStartDate | date:'medium' }}</span>
                        </div>
                    </div>
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



            <!-- Subtask Matrix -->
            @if (habit()?.subtasks?.length) {
                <div class="mb-12">
                    <app-subtask-matrix [habit]="habit()!" [date]="viewDate()"></app-subtask-matrix>
                </div>
            }

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <!-- Activity Heatmap -->
                <div class="lg:col-span-8 bg-white rounded-2xl shadow-gentle p-8 border border-taupe/10">
                    <app-habit-activity-matrix 
                        [habit]="habit()!" 
                        [heatmapData]="fullHeatmapData()">
                    </app-habit-activity-matrix>
                </div>

                <!-- Calendar -->
                <div class="lg:col-span-4 bg-white rounded-2xl shadow-gentle p-6 border border-taupe/10">
                    <app-habit-calendar-view 
                        [habit]="habit()!" 
                        [completedDates]="getCompletedDates()"
                        (dateSelected)="selectDate($event)">
                    </app-habit-calendar-view>
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
                    <app-habit-trend-chart [stats]="stats()"></app-habit-trend-chart>
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
export class HabitActivityComponent implements OnInit, OnDestroy {
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

    stackDaysRemaining = computed(() => {
        const h = this.habit();
        if (!h?.stackedWith || !h?.stackStartDate) return 0;
        const start = new Date(h.stackStartDate);
        const duration = h.stackDuration || 21;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, duration - elapsed);
    });

    stackProgress = computed(() => {
        const h = this.habit();
        if (!h?.stackedWith || !h?.stackStartDate) return 0;
        const start = new Date(h.stackStartDate);
        const duration = h.stackDuration || 21;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(100, Math.round((elapsed / duration) * 100));
    });

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
        const habit = this.habit();
        if (!data.length || !habit || !habit.startDate) return 0;
        
        const habitStart = startOfDay(parseISO(habit.startDate));
        const today = startOfDay(new Date());
        let missed = 0;

        for (let i = 0; i < 7; i++) {
            const checkDate = subDays(today, i);
            
            // Don't count days before the habit started
            if (isBefore(checkDate, habitStart)) break;

            const dateStr = format(checkDate, 'yyyy-MM-dd');
            const dayData = data.find(d => d.date === dateStr);
            
            if (!dayData || dayData.level === 0) {
                missed++;
            } else {
                // stop at first completion going backwards
                break; 
            }
        }
        return missed;
    });

    selectedDate = signal<string | null>(null);
    logValue: number | undefined;
    logNotes: string = '';

    getCompletedDates() {
        return this.fullHeatmapData()
            .filter((d: any) => d.level > 0)
            .map((d: any) => d.date);
    }

    // Sobriety Timer
    soberTime = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    private timerInterval: any;

    ngOnInit() {
        const id = this.habitId();
        if (id) {
            this.loadAllData(id);
        }
        this.startSoberTimer();
    }

    ngOnDestroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    private startSoberTimer() {
        this.timerInterval = setInterval(() => {
            const currentHabit = this.habit();
            if (currentHabit?.category === 'bad_habit' && currentHabit?.soberStartDate) {
                const start = new Date(currentHabit.soberStartDate);
                const now = new Date();
                const diff = now.getTime() - start.getTime();

                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                    const minutes = Math.floor((diff / (1000 * 60)) % 60);
                    const seconds = Math.floor((diff / 1000) % 60);
                    this.soberTime.set({ days, hours, minutes, seconds });
                }
            }
        }, 1000);
    }

    resetSoberTimer() {
        const currentHabit = this.habit();
        if (!currentHabit) return;

        if (confirm('Confirm protocol breach? This will reset your avoidance timer to zero.')) {
            const now = new Date().toISOString();
            this.habitService.updateHabit(currentHabit.id, { soberStartDate: now }).subscribe({
                next: (updated) => {
                    // Signal updates automatically via service state
                }
            });
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




}







