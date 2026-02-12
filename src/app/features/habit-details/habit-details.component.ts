import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-habit-details',
    standalone: true,
    imports: [CommonModule, FormsModule],
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
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-black text-black uppercase font-arvo">Activity_Matrix</h3>
                        <div class="flex items-center gap-1 text-[9px] font-bold uppercase">
                            <span>NULL</span>
                            <div class="w-3 h-3 bg-concrete-100 border border-black"></div>
                            <div class="w-3 h-3 bg-concrete-300 border border-black"></div>
                            <div class="w-3 h-3 bg-concrete-400 border border-black"></div>
                             <div class="w-3 h-3 bg-black border border-black"></div>
                            <span>MAX</span>
                        </div>
                    </div>
                    <div class="overflow-x-auto pb-2 custom-scrollbar">
                        <div class="flex gap-1 min-w-max">
                            <div class="flex flex-col gap-1 pr-2 text-[9px] font-bold font-mono uppercase justify-between">
                                <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
                            </div>
                            <div class="grid grid-flow-col grid-rows-7 gap-1">
                                @for (item of fullHeatmap; track $index) {
                                    <div class="w-3 h-3 border border-black transition-all hover:scale-125 relative cursor-help"
                                         [class.bg-concrete-100]="item.level === 0"
                                         [class.bg-concrete-300]="item.level === 1"
                                         [class.bg-concrete-500]="item.level === 2"
                                         [class.bg-black]="item.level >= 3"
                                         [title]="item.date + ': ' + item.level"></div>
                                }
                            </div>
                        </div>
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
    fullHeatmap: {date: string, level: number}[] = [];

    calendarMonth = signal(new Date().getMonth());
    calendarYear = signal(new Date().getFullYear());
    selectedDate = signal<string | null>(null);
    logValue: number | undefined;
    logNotes: string = '';

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

        const logs = this.history(); // Note: this only has current page logs. For calendar we might need full logs or use theheatmap data? 
        // Actually, for accuracy, the stats endpoint should return a map of completed dates, or we rely on heatmap data which covers a year.
        // Let's use heatmap data for completion check if available, or just history for now (history is paginated effectively, so might miss data).
        // Correction: habit.completedDates might be available in the habit object? No.
        // I'll rely on heatmap for completion check as it has all dates.
        
        // Wait, heatmap structure is {date, level}. level > 0 means completed? 
        // Or level represents intensity.
        // I will use heatmap to determine completion.
        
        const completedDates = new Set(this.fullHeatmap.filter(h => h.level > 0).map(h => h.date));

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

    generateHeatmap(apiData: any[]) {
        const today = new Date();
        const endDate = new Date(today);
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 364);

        const dataMap = new Map(apiData.map(item => [item.date, item.level]));
        this.fullHeatmap = [];
        
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
        const habit = this.habit();
        if (id && habit) {
            if (habit.type === 'measurable') {
                const today = new Date().toISOString().split('T')[0];
                this.selectDate(today);
            } else {
                this.habitService.toggleCompletion(id, new Date().toISOString().split('T')[0]).subscribe(() => {
                     this.loadHistory(id);
                     this.loadStats(id);
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
            this.habitService.updateLog(habit.id, date, {}).subscribe(() => {
                this.loadHistory(habit.id);
                this.loadStats(habit.id);
            });
            return;
        }

        this.selectedDate.set(date);
        // We need to fetch specific log for this date. 
        // For now, scan history (might be incomplete). 
        // Ideally we should have getLog(date) API. 
        // I will leave it empty for new logs if not in current page history.
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
