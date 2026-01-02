import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-habit-details',
    imports: [RouterLink, SidebarComponent, CommonModule],
    template: `
    <div class="bg-[#f8faf9] dark:bg-[#0d1610] font-display text-[#0d1b12] antialiased min-h-screen flex flex-col md:flex-row overflow-hidden">
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
                                <p class="text-[10px] text-gray-400 font-semibold">Achieved in Oct 2023</p>
                            </div>

                            <!-- Total Completions -->
                            <div class="p-8 rounded-[2rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm relative overflow-hidden">
                                <span class="material-symbols-outlined !text-7xl absolute -right-4 -bottom-4 opacity-5 text-blue-500">check_circle</span>
                                <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66] mb-2">Total Completions</p>
                                <div class="flex items-baseline gap-2 mb-4">
                                    <p class="text-4xl font-black">128</p>
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
                                    <p class="text-4xl font-black">{{ habit()?.completionRate }}%</p>
                                </div>
                                <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-[#13ec5b] rounded-full" [style.width.%]="habit()?.completionRate"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Activity Log (Heatmap) -->
                        <div class="p-8 rounded-[2.5rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm overflow-x-auto">
                            <div class="flex items-center justify-between mb-6 min-w-[600px]">
                                <h3 class="text-lg font-black text-[#0d1b12] dark:text-white">Activity Log (2024)</h3>
                                <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                                    @for (level of heatmapData; track $index) {
                                        <div class="size-3 rounded-[2px] transition-colors hover:ring-2 ring-[#0d1b12]/10 dark:ring-white/20"
                                            [class.bg-gray-100]="level === 0"
                                            [class.dark:bg-gray-800]="level === 0"
                                            [class.bg-[#13ec5b]/20]="level === 1"
                                            [class.bg-[#13ec5b]/50]="level === 2"
                                            [class.bg-[#13ec5b]]]="level >= 3"
                                            [title]="'Activity Level: ' + level"></div>
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
                                    @for (day of weeklyData; track day.label) {
                                        <div class="flex-1 flex flex-col justify-end items-center gap-2 group cursor-pointer w-full">
                                            <div class="w-full rounded-md transition-all relative" 
                                                [class.bg-[#13ec5b]]="day.highlight"
                                                [class.bg-gray-100]="!day.highlight"
                                                [class.dark:bg-gray-800]="!day.highlight" 
                                                [style.height.%]="day.value"></div>
                                            <span class="text-[10px] font-bold text-gray-400">{{ day.label }}</span>
                                        </div>
                                    }
                                </div>
                            </div>

                            <!-- Completion Trend -->
                            <div class="p-8 rounded-[2.5rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm flex flex-col relative overflow-hidden">
                                <div class="flex items-center justify-between mb-6 relative z-10">
                                    <h3 class="text-lg font-black">Completion Trend</h3>
                                    <span class="bg-[#13ec5b]/10 text-[#13ec5b] px-2 py-1 rounded-md text-[10px] font-bold uppercase">+15% vs last month</span>
                                </div>
                                <div class="flex-1 flex items-end relative h-48 w-full">
                                    <!-- Simple SVG Wave Mock -->
                                    <svg viewBox="0 0 100 50" class="w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stop-color="#13ec5b" stop-opacity="0.5"/>
                                                <stop offset="100%" stop-color="#13ec5b" stop-opacity="0"/>
                                            </linearGradient>
                                        </defs>
                                        <path d="M0,45 C20,35 30,15 40,25 S60,40 70,10 S90,5 100,20 V50 H0 Z" fill="url(#gradient)" />
                                        <path d="M0,45 C20,35 30,15 40,25 S60,40 70,10 S90,5 100,20" fill="none" stroke="#13ec5b" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke" />
                                    </svg>
                                </div>
                                <div class="flex justify-between text-[10px] font-bold text-gray-400 mt-2">
                                    <span>Week 1</span>
                                    <span>Week 4</span>
                                </div>
                            </div>

                            <!-- Calendar -->
                            <div class="p-8 rounded-[2.5rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm flex flex-col">
                                <div class="flex items-center justify-between mb-6">
                                    <h3 class="text-lg font-black">November 2025</h3>
                                    <div class="flex gap-2 text-gray-400">
                                        <span class="material-symbols-outlined text-sm cursor-pointer hover:text-black">chevron_left</span>
                                        <span class="material-symbols-outlined text-sm cursor-pointer hover:text-black">chevron_right</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-7 gap-2 mb-2">
                                    @for (d of ['S','M','T','W','T','F','S']; track d) {
                                        <div class="text-center text-[10px] font-bold text-gray-400">{{d}}</div>
                                    }
                                </div>
                                <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#0d1b12] dark:text-white">
                                    <div class="p-2"></div><div class="p-2"></div><div class="p-2"></div> <!-- Empty start days for mock -->
                                    <div class="p-2">1</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">2</div>
                                    <div class="p-2">3</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">4</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">5</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">6</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">7</div>
                                    <div class="p-2 rounded-full border border-[#13ec5b] text-[#13ec5b]">8</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">9</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">10</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">11</div>
                                    <div class="p-2">12</div>
                                    <div class="p-2">13</div>
                                    <div class="p-2">14</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">15</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">16</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">17</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#13ec5b] text-[#0d1b12]">18</div>
                                    <div class="p-2">19</div>
                                    <div class="p-2">20</div>
                                    <div class="flex items-center justify-center p-2 rounded-full bg-[#0d1b12] text-white">21</div>
                                    <div class="p-2 text-gray-300">22</div>
                                    <div class="p-2 text-gray-300">23</div>
                                    <div class="p-2 text-gray-300">24</div>
                                    <div class="p-2 text-gray-300">25</div>
                                </div>
                                <button class="mt-auto w-full py-3 rounded-xl border border-dashed border-[#e5e7eb] dark:border-[#2d3a30] text-xs font-bold text-gray-400 hover:border-[#13ec5b] hover:text-[#13ec5b] transition-all flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined text-sm">edit_note</span>
                                    Add Note for Today
                                </button>
                            </div>
                        </div>

                        <!-- 4. History Table -->
                        <div class="bg-white dark:bg-[#1a2c20] rounded-[2.5rem] border border-[#e5e7eb] dark:border-[#2d3a30] p-10 shadow-sm overflow-hidden">
                            <div class="flex items-center justify-between mb-8">
                                <h3 class="text-xl font-black">History</h3>
                                <button class="text-[#13ec5b] text-sm font-bold hover:underline">View All</button>
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
                                        <tr class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td class="px-6 py-5 font-semibold">Today, Nov 21</td>
                                            <td class="px-6 py-5">
                                                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500">Pending</span>
                                            </td>
                                            <td class="px-6 py-5 font-medium">-</td>
                                            <td class="px-6 py-5 text-gray-400 italic">No notes</td>
                                            <td class="px-6 py-5 text-right font-bold text-[#13ec5b] cursor-pointer hover:underline">Check-in</td>
                                        </tr>
                                        <tr class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td class="px-6 py-5 font-semibold">Yesterday, Nov 20</td>
                                            <td class="px-6 py-5">
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#13ec5b]/10 text-[#13ec5b]">Completed</span>
                                            </td>
                                            <td class="px-6 py-5 font-medium">35 mins</td>
                                            <td class="px-6 py-5 text-gray-500">Felt great, extra 5 mins!</td>
                                            <td class="px-6 py-5 text-right">
                                                <span class="material-symbols-outlined text-gray-300 hover:text-gray-500 cursor-pointer text-lg">more_vert</span>
                                            </td>
                                        </tr>
                                        <tr class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td class="px-6 py-5 font-semibold">Nov 18, 2023</td>
                                            <td class="px-6 py-5">
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#13ec5b]/10 text-[#13ec5b]">Completed</span>
                                            </td>
                                            <td class="px-6 py-5 font-medium">30 mins</td>
                                            <td class="px-6 py-5 text-gray-400 italic">No notes</td>
                                            <td class="px-6 py-5 text-right">
                                                <span class="material-symbols-outlined text-gray-300 hover:text-gray-500 cursor-pointer text-lg">more_vert</span>
                                            </td>
                                        </tr>
                                        <tr class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td class="px-6 py-5 font-semibold">Nov 17, 2023</td>
                                            <td class="px-6 py-5">
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#13ec5b]/10 text-[#13ec5b]">Completed</span>
                                            </td>
                                            <td class="px-6 py-5 font-medium">30 mins</td>
                                            <td class="px-6 py-5 text-gray-500">Morning run in the rain</td>
                                            <td class="px-6 py-5 text-right">
                                                <span class="material-symbols-outlined text-gray-300 hover:text-gray-500 cursor-pointer text-lg">more_vert</span>
                                            </td>
                                        </tr>
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

    // Analytics Data (Mock)
    heatmapData: number[] = [];
    weeklyData = [
        { label: 'M', value: 40, highlight: false },
        { label: 'T', value: 80, highlight: false },
        { label: 'W', value: 100, highlight: true },
        { label: 'T', value: 60, highlight: false },
        { label: 'F', value: 20, highlight: false },
        { label: 'S', value: 60, highlight: false }, // Updated for visual variety
        { label: 'S', value: 50, highlight: false },
    ];

    ngOnInit() {
        this.generateHeatmapData();
    }

    generateHeatmapData() {
        // Generate ~365 data points for 52 weeks x 7 days
        // Levels: 0 (empty), 1 (light), 2 (medium), 3 (dark), 4 (darkest)
        this.heatmapData = Array.from({ length: 364 }, () => {
            const rand = Math.random();
            if (rand > 0.8) return 4;
            if (rand > 0.6) return 3;
            if (rand > 0.4) return 2;
            if (rand > 0.2) return 1;
            return 0;
        });
    }

    toggleDone() {
        const id = this.habitId();
        if (id) {
            this.habitService.toggleCompletion(id, new Date().toISOString().split('T')[0]);
        }
    }

    deleteHabit() {
        const id = this.habitId();
        if (id && confirm('Are you sure you want to delete this habit?')) {
            this.habitService.deleteHabit(id);
            this.routerNavigate.navigate(['/']);
        }
    }

    editHabit() {
        const id = this.habitId();
        if (id) {
            this.routerNavigate.navigate(['/edit', id]);
        }
    }

    goBack() {
        this.location.back();
    }
}
