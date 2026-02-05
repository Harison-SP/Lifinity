import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-habit-details',
    imports: [RouterLink, SidebarComponent, CommonModule, FormsModule],
    template: `
    <div class="bg-[#f8faf9] dark:bg-[#0d1610] font-display text-[#0d1b12] dark:text-white antialiased min-h-screen flex flex-col md:flex-row overflow-hidden">
        <app-sidebar />
        
        <main class="flex-1 flex flex-col h-screen overflow-hidden relative">
            <header class="p-8 border-b border-[#e5e7eb] dark:border-[#2d3a30] bg-white dark:bg-[#1a2c20] flex items-center justify-between sticky top-0 z-30">
                <div class="flex items-center gap-4">
                    <button (click)="goBack()" class="size-11 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#4c9a66] hover:text-[#0d1b12] dark:hover:text-white transition-colors">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h2 class="text-3xl font-black text-[#0d1b12] dark:text-white tracking-tight">{{ habit()?.name || 'Loading...' }}</h2>
                        <p class="text-[#4c9a66] dark:text-gray-400 font-medium">{{ habit()?.description }}</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button class="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-[#0d1b12] dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" (click)="editHabit()">
                        <span class="material-symbols-outlined text-[20px]">edit</span>
                        Edit
                    </button>
                    <button class="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-[#0d1b12] dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" (click)="deleteHabit()">
                        <span class="material-symbols-outlined text-[20px]">delete</span>
                        Delete
                    </button>
                    <button (click)="toggleDone()" 
                            [class.bg-[#13ec5b]]="!habit()?.completedToday"
                            [class.text-[#0d1b12]]="!habit()?.completedToday"
                            [class.bg-gray-100]="habit()?.completedToday"
                            [class.dark:bg-gray-800]="habit()?.completedToday"
                            [class.text-gray-400]="habit()?.completedToday"
                            class="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ml-2">
                        <span class="material-symbols-outlined text-[22px]">{{ habit()?.completedToday ? 'check_circle' : 'check' }}</span>
                        {{ habit()?.completedToday ? 'Completed' : 'Mark Complete' }}
                    </button>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div class="max-w-[1400px] mx-auto flex flex-col gap-8">
                    
                    @if (habit()) {
                        <!-- 1. Stats Cards -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <!-- Current Streak -->
                            <div class="p-8 rounded-[2rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm relative overflow-hidden">
                                <span class="material-symbols-outlined !text-7xl absolute -right-4 -bottom-4 opacity-5 text-[#13ec5b]">local_fire_department</span>
                                <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66] mb-2">Current Streak</p>
                                <div class="flex items-baseline gap-2 mb-4">
                                    <p class="text-4xl font-black">{{ habit()?.streak }}</p>
                                    <span class="text-sm font-bold text-slate-400">Days</span>
                                </div>
                                <div class="inline-flex items-center gap-1 text-[10px] font-bold text-[#0d1b12] bg-[#13ec5b] px-2 py-1 rounded-md">
                                    <span class="material-symbols-outlined text-[14px]">trending_up</span>
                                    +2 this week
                                </div>
                            </div>

                            <!-- Best Streak -->
                            <div class="p-8 rounded-[2rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm relative overflow-hidden">
                                <span class="material-symbols-outlined !text-7xl absolute -right-4 -bottom-4 opacity-5 text-amber-500">emoji_events</span>
                                <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66] mb-2">Best Streak</p>
                                <div class="flex items-baseline gap-2 mb-4">
                                    <p class="text-4xl font-black">{{ habit()?.bestStreak }}</p>
                                    <span class="text-sm font-bold text-slate-400">Days</span>
                                </div>
                                <p class="text-[10px] text-gray-400 dark:text-gray-300 font-semibold">Achieved in --</p>
                            </div>

                            <!-- Total Completions -->
                            <div class="p-8 rounded-[2rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm relative overflow-hidden">
                                <span class="material-symbols-outlined !text-7xl absolute -right-4 -bottom-4 opacity-5 text-blue-500">check_circle</span>
                                <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66] mb-2">Total Completions</p>
                                <div class="flex items-baseline gap-2 mb-4">
                                    <p class="text-4xl font-black">{{ stats()?.total_completions || 0 }}</p>
                                    <span class="text-sm font-bold text-slate-400">Times</span>
                                </div>
                                <div class="inline-flex items-center gap-1 text-[10px] font-bold text-[#0d1b12] bg-[#13ec5b]/20 text-[#13ec5b] px-2 py-1 rounded-md">
                                    <span class="material-symbols-outlined text-[14px]">arrow_upward</span>
                                    Top 10%
                                </div>
                            </div>

                            <!-- Completion Rate -->
                            <div class="p-8 rounded-[2rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm relative overflow-hidden">
                                <span class="material-symbols-outlined !text-7xl absolute -right-4 -bottom-4 opacity-5 text-purple-500">pie_chart</span>
                                <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66] mb-2">Completion Rate</p>
                                <div class="flex items-baseline gap-2 mb-4">
                                    <p class="text-4xl font-black">{{ stats()?.completion_rate || 0 }}%</p>
                                </div>
                                <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-[#13ec5b] rounded-full" [style.width.%]="stats()?.completion_rate || 0"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Activity Log (Heatmap) -->
                        <div class="p-8 rounded-[2.5rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm overflow-x-auto">
                            <div class="flex items-center justify-between mb-6 min-w-[600px]">
                                <h3 class="text-lg font-black text-[#0d1b12] dark:text-white">Activity Log (2024)</h3>
                                <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                                    <span>Less</span>
                                    <div class="flex gap-1">
                                        <div class="size-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
                                        <div class="size-3 rounded-sm bg-[#13ec5b]/30"></div>
                                        <div class="size-3 rounded-sm bg-[#13ec5b]/60"></div>
                                        <div class="size-3 rounded-sm bg-[#13ec5b]"></div>
                                    </div>
                                    <span>More</span>
                                </div>
                            </div>
                                <div class="flex gap-1 min-w-[800px]">
                                <div class="flex flex-col gap-1 pr-2 text-[10px] font-bold text-gray-300 justify-between py-1">
                                    <span>Mon</span>
                                    <span>Wed</span>
                                    <span>Fri</span>
                                    <span>Sun</span>
                                </div>
                                <div class="flex-1 grid grid-flow-col grid-rows-7 gap-1">
                                    @for (item of fullHeatmap; track $index) {
                                        <div class="size-3 rounded-[2px] transition-colors hover:ring-2 ring-[#0d1b12]/10 dark:ring-white/20"
                                            [class.bg-gray-100]="item.level === 0"
                                            [class.dark:bg-gray-800]="item.level === 0"
                                            [class.bg-[#13ec5b]/20]="item.level === 1"
                                            [class.bg-[#13ec5b]/50]="item.level === 2"
                                            [class.bg-[#13ec5b]]="item.level >= 3"
                                            [title]="item.date + ': Level ' + item.level"></div>
                                    }
                                </div>
                            </div>
                        </div>

                        <!-- 3. Charts Grid (Frequency, Trend, Calendar) -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <!-- Weekly Frequency -->
                            <div class="p-8 rounded-[2.5rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm flex flex-col">
                                <h3 class="text-lg font-black mb-6">Weekly Frequency</h3>
                                <div class="flex-1 flex items-end justify-between gap-2 h-48">
                                    @for (day of stats()?.weekly_frequency; track day.day_name) {
                                        <div class="flex-1 flex flex-col justify-end items-center gap-2 group cursor-pointer w-full">
                                            <div class="w-full rounded-md transition-all relative" 
                                                [class.bg-[#13ec5b]]="day.percentage > 0"
                                                [class.bg-gray-100]="day.percentage === 0"
                                                [class.dark:bg-gray-800]="day.percentage === 0" 
                                                [style.height.%]="day.percentage || 10"></div>
                                            <span class="text-[10px] font-bold text-gray-400">{{ day.day_name.charAt(0) }}</span>
                                        </div>
                                    }
                                </div>
                            </div>

                            <!-- Completion Trend -->
                            <div class="p-8 rounded-[2.5rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm flex flex-col relative overflow-hidden">
                                <div class="flex items-center justify-between mb-6 relative z-10">
                                    <h3 class="text-lg font-black">Completion Trend</h3>
                                    <!-- Optional: Dynamic growth calculation -->
                                    <!-- <span class="bg-[#13ec5b]/10 text-[#13ec5b] px-2 py-1 rounded-md text-[10px] font-bold uppercase">+15% vs last month</span> -->
                                </div>
                                <div class="flex-1 flex items-end relative h-48 w-full">
                                    <svg viewBox="0 0 100 50" class="w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stop-color="#13ec5b" stop-opacity="0.5"/>
                                                <stop offset="100%" stop-color="#13ec5b" stop-opacity="0"/>
                                            </linearGradient>
                                        </defs>
                                        <!-- Fill Area -->
                                        <path [attr.d]="trendArea()" fill="url(#gradient)" />
                                        <!-- Stroke Line -->
                                        <path [attr.d]="trendLine()" fill="none" stroke="#13ec5b" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke" />
                                    </svg>
                                </div>
                                <div class="flex justify-between text-[10px] font-bold text-gray-400 mt-2">
                                    @if (stats()?.completion_trend?.length) {
                                        <span>{{ stats()!.completion_trend[0].period }}</span>
                                        <span>{{ stats()!.completion_trend[stats()!.completion_trend.length - 1].period }}</span>
                                    }
                                </div>
                            </div>

                            <!-- Calendar -->
                            <div class="p-8 rounded-[2.5rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm flex flex-col">
                                <div class="flex items-center justify-between mb-6">
                                    <h3 class="text-lg font-black">{{ calendarMonthName() }} {{ calendarYear() }}</h3>
                                    <div class="flex gap-2 text-gray-400">
                                        <span (click)="previousMonth()" class="material-symbols-outlined text-sm cursor-pointer hover:text-black dark:hover:text-white transition-colors">chevron_left</span>
                                        <span (click)="nextMonth()" class="material-symbols-outlined text-sm cursor-pointer hover:text-black dark:hover:text-white transition-colors">chevron_right</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-7 gap-2 mb-2">
                                    @for (d of ['S','M','T','W','T','F','S']; track d) {
                                        <div class="text-center text-[10px] font-bold text-gray-400">{{d}}</div>
                                    }
                                </div>
                                <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#0d1b12] dark:text-white">
                                    @for (day of calendarDays(); track day.date) {
                                        @if (day.isEmpty) {
                                            <div class="p-2"></div>
                                        } @else {
                                            <div (click)="selectDate(day.date)" 
                                                 class="p-2 rounded-full cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                                                 [class.bg-[#13ec5b]]="day.isCompleted"
                                                 [class.text-[#0d1b12]]="day.isCompleted"
                                                 [class.border]="day.isToday && !day.isCompleted"
                                                 [class.border-[#13ec5b]]="day.isToday && !day.isCompleted"
                                                 [class.text-[#13ec5b]]="day.isToday && !day.isCompleted"
                                                 [class.text-gray-300]="day.isFuture"
                                                 [class.cursor-not-allowed]="day.isFuture"
                                                 [class.hover:bg-transparent]="day.isFuture">
                                                {{ day.dayNumber }}
                                            </div>
                                        }
                                    }
                                </div>
                                
                                <!-- Log Entry Modal/Form -->
                                @if (selectedDate()) {
                                    <div class="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-[#e5e7eb] dark:border-[#2d3a30]">
                                        <div class="flex items-center justify-between mb-3">
                                            <h4 class="text-sm font-bold">Log for {{ selectedDate() | date:'mediumDate' }}</h4>
                                            <button (click)="closeLogForm()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                                <span class="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                        <div class="space-y-3">
                                            <div>
                                                <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Value (optional)</label>
                                                <input type="number" [(ngModel)]="logValue" 
                                                       class="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#13ec5b]"
                                                       placeholder="Enter value">
                                            </div>
                                            <div>
                                                <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Notes (optional)</label>
                                                <textarea [(ngModel)]="logNotes" rows="2"
                                                          class="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#13ec5b] resize-none"
                                                          placeholder="Add notes..."></textarea>
                                            </div>
                                            <button (click)="saveLog()" 
                                                    class="w-full py-2.5 rounded-lg bg-[#13ec5b] text-[#0d1b12] font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                                                Save Log
                                            </button>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>

                        <!-- 4. History Table -->
                        <div class="bg-white dark:bg-[#1a2c20] rounded-[2.5rem] border border-[#e5e7eb] dark:border-[#2d3a30] p-10 shadow-sm overflow-hidden">
                            <div class="flex items-center justify-between mb-8">
                                <h3 class="text-xl font-black">History</h3>
                                <div class="flex items-center gap-2">
                                    <button 
                                        [disabled]="currentPage() === 1"
                                        (click)="prevPage()"
                                        class="size-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <span class="material-symbols-outlined text-sm">chevron_left</span>
                                    </button>
                                    <span class="text-xs font-bold text-gray-400">Page {{ currentPage() }} of {{ totalPages() }}</span>
                                    <button 
                                        [disabled]="currentPage() >= totalPages()"
                                        (click)="nextPage()"
                                        class="size-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm">
                                    <thead class="border-b border-gray-100 dark:border-gray-800">
                                        <tr>
                                            <th class="px-6 py-4 font-bold text-gray-400">Date</th>
                                            <th class="px-6 py-4 font-bold text-gray-400">Status</th>
                                            <th class="px-6 py-4 font-bold text-gray-400">Value</th>
                                            <th class="px-6 py-4 font-bold text-gray-400">Note</th>
                                            <th class="px-6 py-4 font-bold text-gray-400 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                        @for (log of history(); track log.id) {
                                            <tr class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td class="px-6 py-5 font-semibold">{{ log.completed_at | date:'mediumDate' }} <span class="text-xs text-gray-400 font-normal ml-1">{{ log.completed_at | date:'shortTime' }}</span></td>
                                                <td class="px-6 py-5">
                                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#13ec5b]/10 text-[#13ec5b]">Completed</span>
                                                </td>
                                                <td class="px-6 py-5 font-medium">{{ log.value ? log.value : '-' }}</td>
                                                <td class="px-6 py-5 text-gray-400 italic">{{ log.notes ? log.notes : 'No notes' }}</td>
                                                <td class="px-6 py-5 text-right">
                                                    <span class="material-symbols-outlined text-gray-300 hover:text-gray-500 cursor-pointer text-lg">more_vert</span>
                                                </td>
                                            </tr>
                                        } @empty {
                                            <tr>
                                                <td colspan="5" class="px-6 py-10 text-center text-gray-400 italic">No history found for this period.</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    } @else {
                        <div class="h-96 flex flex-col items-center justify-center p-20 text-center bg-white dark:bg-[#1a2c20] rounded-[2.5rem] border border-[#e5e7eb] dark:border-[#2d3a30]">
                            <span class="material-symbols-outlined text-6xl text-gray-200 mb-4">search_off</span>
                            <p class="text-gray-400 font-bold text-lg">Habit not found.</p>
                            <a routerLink="/" class="text-[#13ec5b] mt-4 inline-block font-bold hover:underline">Back to Dashboard</a>
                        </div>
                    }
                </div>
            </div>
        </main>
    </div>
  `,
    styles: [`
    :host { font-family: 'Inter', sans-serif; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .material-symbols-outlined.filled { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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

    // History Data
    history = signal<import('../../models/habit.model').HabitLog[]>([]);
    currentPage = signal(1);
    pageSize = signal(5); // Show 5 items per page
    totalHistory = signal(0);
    totalPages = computed(() => Math.ceil(this.totalHistory() / this.pageSize()) || 1);

    // Analytics Data
    stats = signal<import('../../models/habit.model').HabitStats | null>(null);
    fullHeatmap: {date: string, level: number}[] = [];

    // Calendar Data
    calendarMonth = signal(new Date().getMonth());
    calendarYear = signal(new Date().getFullYear());
    selectedDate = signal<string | null>(null);
    logValue: number | undefined;
    logNotes: string = '';

    calendarMonthName = computed(() => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
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
        today.setHours(0, 0, 0, 0);

        const days: Array<{
            date: string;
            dayNumber: number;
            isEmpty: boolean;
            isCompleted: boolean;
            isToday: boolean;
            isFuture: boolean;
        }> = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ date: '', dayNumber: 0, isEmpty: true, isCompleted: false, isToday: false, isFuture: false });
        }

        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            const dateString = date.toISOString().split('T')[0];
            
            // Check if this date has a log entry
            const isCompleted = this.history().some(log => {
                const logDate = new Date(log.completed_at);
                logDate.setHours(0, 0, 0, 0);
                return logDate.toISOString().split('T')[0] === dateString;
            });

            const isToday = date.getTime() === today.getTime();
            const isFuture = date > today;

            days.push({
                date: dateString,
                dayNumber: day,
                isEmpty: false,
                isCompleted,
                isToday,
                isFuture
            });
        }

        return days;
    });

    trendLine = computed(() => {
        const stats = this.stats();
        if (!stats || !stats.completion_trend || stats.completion_trend.length === 0) return '';
        
        const data = stats.completion_trend;
        const count = data.length;
        if (count < 2) return '';
        
        // Map data to points
        // X: 0 to 100
        // Y: 0 to 50 (inverted, 0 is top, 50 is bottom)
        
        const points = data.map((item, index) => {
            const x = (index / (count - 1)) * 100;
            const y = 50 - ((item.rate / 100) * 50);
            return `${x},${y}`;
        });
        
        // Simple smoothing could be added, but for now polyline
        // Use 'L' for lines. C for bezier would need control points calc.
        // Let's try Catmull-Rom or simple L. Simple L is safer for now.
        // Actually, let's just do straight lines for robustness.
        
        return `M ${points.join(' L ')}`;
    });

    trendArea = computed(() => {
        const line = this.trendLine();
        if (!line) return '';
        
        return `${line} V 50 H 0 Z`;
    });

    ngOnInit() {
        const id = this.habitId();
        if (id) {
            this.loadHistory(id);
            this.loadStats(id);
        }
    }

    loadStats(id: string) {
        this.habitService.getHabitStats(id).subscribe({
            next: (stats) => {
                this.stats.set(stats);
                this.generateHeatmap(stats.heatmap);
            },
            error: (err) => console.error('Failed to load stats', err)
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

    generateHeatmap(apiData: import('../../models/habit.model').HeatmapItem[]) {
        // Generate last 364 days to fill the grid
        const today = new Date();
        const endDate = new Date(today);
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 364); // Approx 1 year

        const dataMap = new Map(apiData.map(item => [item.date, item.level]));
        
        this.fullHeatmap = [];
        
        // Loop from start to end
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            this.fullHeatmap.push({
                date: dateStr,
                level: dataMap.get(dateStr) || 0
            });
        }
    }

    toggleDone() {
        const id = this.habitId();
        if (id) {
            this.habitService.toggleCompletion(id, new Date().toISOString().split('T')[0]).subscribe();
        }
    }

    deleteHabit() {
        const id = this.habitId();
        if (id && confirm('Are you sure you want to delete this habit?')) {
            this.habitService.deleteHabit(id).subscribe(() => {
                this.routerNavigate.navigate(['/']);
            });
        }
    }

    editHabit() {
        const id = this.habitId();
        if (id) {
            this.routerNavigate.navigate(['/edit', id]);
        }
    }

    // Calendar Methods
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

    selectDate(date: string) {
        if (!date) return;
        
        // Don't allow selecting future dates
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate > today) return;
        
        this.selectedDate.set(date);
        
        // Load existing log data if available
        const existingLog = this.history().find(log => {
            const logDate = new Date(log.completed_at);
            logDate.setHours(0, 0, 0, 0);
            return logDate.toISOString().split('T')[0] === date;
        });
        
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
        this.logValue = undefined;
        this.logNotes = '';
    }

    saveLog() {
        const date = this.selectedDate();
        const id = this.habitId();
        
        if (!date || !id) return;
        
        this.habitService.updateLog(id, date, {
            value: this.logValue,
            notes: this.logNotes
        }).subscribe({
            next: () => {
                // Reload history to reflect changes
                this.loadHistory(id);
                this.loadStats(id); // Reload stats too
                this.closeLogForm();
            },
            error: (err) => console.error('Failed to save log', err)
        });
    }

    goBack() {
        this.location.back();
    }
}
