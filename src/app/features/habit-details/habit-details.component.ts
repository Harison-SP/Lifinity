import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { HabitAnalytics } from './habit-analytics/habit-analytics';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-habit-details',
    standalone: true,
    imports: [RouterLink, CommonModule, FormsModule, HabitAnalytics],
    template: `
    <div class="h-full overflow-y-auto custom-scrollbar relative bg-[#050608]">
        <!-- Top Bar Decoration -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-[#ec5b13] z-50 shadow-[0_0_10px_#ec5b13] opacity-80"></div>

        <header class="p-8 border-b border-[#2a3441] bg-[#0c0e12] flex flex-col md:flex-row items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div class="flex items-center gap-6 w-full md:w-auto">
                <button (click)="goBack()" class="size-11 rounded border border-[#2a3441] bg-[#050608] flex items-center justify-center text-slate-400 hover:text-[#ec5b13] hover:border-[#ec5b13] transition-all group shrink-0">
                    <span class="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                </button>
                <div>
                    <h2 class="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                        <span class="material-symbols-outlined text-[#ec5b13] text-4xl">query_stats</span>
                        DIRECTIVE_ANALYSIS
                    </h2>
                    <p class="text-[#ec5b13] font-bold tracking-widest text-xs mt-1 uppercase opacity-80 flex items-center gap-2">
                            <span class="w-2 h-2 bg-[#ec5b13] rounded-full animate-pulse"></span>
                            Target: {{ habit()?.name || 'LOADING_DATA...' }}
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end">
                <button (click)="editHabit()" class="px-4 py-2 border border-[#2a3441] text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:border-white transition-colors flex items-center gap-2 rounded-sm bg-[#050608]">
                    <span class="material-symbols-outlined text-sm">edit</span>
                    Modify
                </button>
                <button (click)="deleteHabit()" class="px-4 py-2 border border-red-900/50 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-900/20 transition-colors flex items-center gap-2 rounded-sm bg-[#050608]">
                    <span class="material-symbols-outlined text-sm">delete</span>
                    Purge
                </button>
                <button (click)="toggleDone()" 
                        [class.bg-[#ec5b13]]="!habit()?.completedToday"
                        [class.text-white]="!habit()?.completedToday"
                        [class.shadow-[0_0_15px_rgba(236,91,19,0.4)]]="!habit()?.completedToday"
                        [class.border-[#ec5b13]]="!habit()?.completedToday"
                        
                        [class.bg-[#050608]]="habit()?.completedToday"
                        [class.border-[#2a3441]]="habit()?.completedToday"
                        [class.text-[#ec5b13]]="habit()?.completedToday"
                        
                        class="flex items-center gap-2 px-6 py-2.5 rounded-sm font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 ml-2 border group">
                    <span class="material-symbols-outlined text-base group-hover:animate-spin">
                        {{ habit()?.completedToday ? 'check_circle' : 'radio_button_unchecked' }}
                    </span>
                    {{ habit()?.completedToday ? 'STATUS: COMPLETE' : 'EXECUTE' }}
                </button>
            </div>
        </header>

        <div class="p-8 relative">
            <!-- Background Grid -->
            <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

            <div class="max-w-[1400px] mx-auto flex flex-col gap-8 relative z-10 pb-20">
                
                @if (habit()) {
                    <!-- 1. Stats Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Current Streak -->
                        <div class="p-6 rounded bg-[#0c0e12] border border-[#2a3441] relative group hover:border-[#ec5b13] transition-colors overflow-hidden">
                            <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span class="material-symbols-outlined text-6xl text-[#ec5b13]">local_fire_department</span>
                            </div>
                            <p class="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Current_Streak_Sequence</p>
                            <div class="flex items-baseline gap-2 mb-2 relative z-10">
                                <p class="text-4xl font-black text-white tracking-tighter">{{ habit()?.streak }}</p>
                                <span class="text-[10px] font-bold text-[#ec5b13] uppercase">Cycles</span>
                            </div>
                            <div class="w-full h-1 bg-[#2a3441] mt-2 relative overflow-hidden">
                                <div class="absolute inset-0 bg-[#ec5b13] w-1/3 animate-pulse"></div>
                            </div>
                        </div>

                        <!-- Best Streak -->
                        <div class="p-6 rounded bg-[#0c0e12] border border-[#2a3441] relative group hover:border-[#ec5b13] transition-colors overflow-hidden">
                            <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span class="material-symbols-outlined text-6xl text-amber-500">emoji_events</span>
                            </div>
                            <p class="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Max_Continuity_Record</p>
                            <div class="flex items-baseline gap-2 mb-2 relative z-10">
                                <p class="text-4xl font-black text-white tracking-tighter">{{ habit()?.bestStreak }}</p>
                                <span class="text-[10px] font-bold text-amber-500 uppercase">Cycles</span>
                            </div>
                            <div class="w-full h-1 bg-[#2a3441] mt-2"></div>
                        </div>

                        <!-- Total Completions -->
                        <div class="p-6 rounded bg-[#0c0e12] border border-[#2a3441] relative group hover:border-[#ec5b13] transition-colors overflow-hidden">
                            <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span class="material-symbols-outlined text-6xl text-blue-500">check_circle</span>
                            </div>
                            <p class="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total_Execution_Count</p>
                            <div class="flex items-baseline gap-2 mb-2 relative z-10">
                                <p class="text-4xl font-black text-white tracking-tighter">{{ stats()?.total_completions || 0 }}</p>
                                <span class="text-[10px] font-bold text-blue-500 uppercase">Iter</span>
                            </div>
                            <div class="w-full h-1 bg-[#2a3441] mt-2"></div>
                        </div>

                        <!-- Completion Rate -->
                        <div class="p-6 rounded bg-[#0c0e12] border border-[#2a3441] relative group hover:border-[#ec5b13] transition-colors overflow-hidden">
                            <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span class="material-symbols-outlined text-6xl text-purple-500">pie_chart</span>
                            </div>
                            <p class="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Efficiency_Rating</p>
                            <div class="flex items-baseline gap-2 mb-2 relative z-10">
                                <p class="text-4xl font-black text-white tracking-tighter">{{ stats()?.completion_rate || 0 }}<span class="text-xl">%</span></p>
                            </div>
                            <div class="w-full h-1 bg-[#2a3441] mt-2 relative">
                                <div class="bg-[#ec5b13] h-full absolute left-0 top-0 shadow-[0_0_10px_#ec5b13]" [style.width.%]="stats()?.completion_rate || 0"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Analytics Component -->
                    @if (analytics()) {
                        <app-habit-analytics 
                            [habit]="habit()!" 
                            [analytics]="analytics()!">
                        </app-habit-analytics>
                    }

                    <!-- 2. Activity Log (Heatmap) -->
                    <div class="p-8 rounded bg-[#0c0e12] border border-[#2a3441] shadow-lg relative overflow-hidden group">
                            <!-- Scanline -->
                        <div class="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none"></div>

                        <div class="flex items-center justify-between mb-6 min-w-[600px] relative z-10">
                            <h3 class="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[#ec5b13]">grid_view</span>
                                    Activity_Matrix
                            </h3>
                            <div class="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <span>IDLE</span>
                                <div class="flex gap-1">
                                    <div class="size-3 rounded-[1px] bg-[#1a2c20]"></div>
                                    <div class="size-3 rounded-[1px] bg-[#ec5b13]/30"></div>
                                    <div class="size-3 rounded-[1px] bg-[#ec5b13]/60"></div>
                                    <div class="size-3 rounded-[1px] bg-[#ec5b13] shadow-[0_0_5px_#ec5b13]"></div>
                                </div>
                                <span>MAX</span>
                            </div>
                        </div>
                        <div class="overflow-x-auto custom-scrollbar pb-2">
                            <div class="flex gap-1 min-w-[800px]">
                                <div class="flex flex-col gap-1 pr-2 text-[9px] font-bold text-slate-600 justify-between py-1 font-mono uppercase">
                                    <span>Mon</span>
                                    <span>Wed</span>
                                    <span>Fri</span>
                                    <span>Sun</span>
                                </div>
                                <div class="flex-1 grid grid-flow-col grid-rows-7 gap-1">
                                    @for (item of fullHeatmap; track $index) {
                                        <div class="size-3 rounded-[1px] transition-all hover:scale-125 hover:z-10 relative cursor-alias"
                                            [class.bg-[#1a2c20]]="item.level === 0"
                                            [class.bg-[#ec5b13]/20]="item.level === 1"
                                            [class.bg-[#ec5b13]/50]="item.level === 2"
                                            [class.bg-[#ec5b13]]="item.level >= 3"
                                            [class.shadow-[0_0_5px_#ec5b13]]="item.level >= 3"
                                            [title]="item.date + ': Level ' + item.level"></div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Charts Grid (Frequency, Trend, Calendar) -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Weekly Frequency -->
                        <div class="p-6 rounded bg-[#0c0e12] border border-[#2a3441] shadow-lg flex flex-col relative overflow-hidden group">
                            <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <span class="material-symbols-outlined text-[#ec5b13] text-base">bar_chart</span>
                                Weekly_Distribution
                            </h3>
                            <div class="flex-1 flex items-end justify-between gap-2 h-40">
                                @for (day of stats()?.weekly_frequency; track day.day_name) {
                                    <div class="flex-1 flex flex-col justify-end items-center gap-2 group/bar cursor-pointer w-full h-full relative">
                                        <div class="w-full bg-[#ec5b13] relative transition-all group-hover/bar:brightness-125 shadow-[0_0_10px_rgba(236,91,19,0.3)]" 
                                            [class.opacity-10]="day.percentage === 0"
                                            [style.height.%]="day.percentage || 10">
                                        </div>
                                        <span class="text-[9px] font-bold text-slate-500 font-mono">{{ day.day_name.charAt(0) }}</span>
                                    </div>
                                }
                            </div>
                        </div>

                        <!-- Completion Trend -->
                        <div class="p-6 rounded bg-[#0c0e12] border border-[#2a3441] shadow-lg flex flex-col relative overflow-hidden group">
                            <div class="flex items-center justify-between mb-6 relative z-10">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[#ec5b13] text-base">Trending_Up</span>
                                    Efficiency_Vector
                                </h3>
                            </div>
                            <div class="flex-1 flex items-end relative h-40 w-full bg-[#050608]/50 border border-[#2a3441]/50 rounded p-2">
                                    <!-- Decor grid inside chart -->
                                <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:10px_10px] pointer-events-none"></div>

                                <svg viewBox="0 0 100 50" class="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stop-color="#ec5b13" stop-opacity="0.4"/>
                                            <stop offset="100%" stop-color="#ec5b13" stop-opacity="0"/>
                                        </linearGradient>
                                    </defs>
                                    <path [attr.d]="trendArea()" fill="url(#gradient)" />
                                    <path [attr.d]="trendLine()" fill="none" stroke="#ec5b13" stroke-width="2" stroke-linecap="square" vector-effect="non-scaling-stroke" />
                                </svg>
                            </div>
                            <div class="flex justify-between text-[9px] font-bold text-slate-500 mt-2 font-mono uppercase">
                                @if (stats()?.completion_trend?.length) {
                                    <span>T-Start: {{ stats()!.completion_trend[0].period }}</span>
                                    <span>T-End: {{ stats()!.completion_trend[stats()!.completion_trend.length - 1].period }}</span>
                                }
                            </div>
                        </div>

                        <!-- Calendar -->
                        <div class="p-6 rounded bg-[#0c0e12] border border-[#2a3441] shadow-lg flex flex-col relative">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[#ec5b13] text-base">calendar_month</span>
                                    {{ calendarMonthName() }} {{ calendarYear() }}
                                </h3>
                                <div class="flex gap-1">
                                    <button (click)="previousMonth()" class="size-6 flex items-center justify-center hover:bg-[#ec5b13] hover:text-black text-slate-400 transition-colors rounded-sm border border-[#2a3441]">
                                        <span class="material-symbols-outlined text-xs">chevron_left</span>
                                    </button>
                                    <button (click)="nextMonth()" class="size-6 flex items-center justify-center hover:bg-[#ec5b13] hover:text-black text-slate-400 transition-colors rounded-sm border border-[#2a3441]">
                                        <span class="material-symbols-outlined text-xs">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                            <div class="grid grid-cols-7 gap-1 mb-2">
                                @for (d of ['S','M','T','W','T','F','S']; track d) {
                                    <div class="text-center text-[9px] font-bold text-slate-600 uppercase">{{d}}</div>
                                }
                            </div>
                            <div class="grid grid-cols-7 gap-1 text-center text-xs font-bold font-mono">
                                @for (day of calendarDays(); track day.date) {
                                    @if (day.isEmpty) {
                                        <div class="p-2"></div>
                                    } @else {
                                        <div (click)="selectDate(day.date)" 
                                                class="aspect-square flex items-center justify-center cursor-pointer transition-all border border-transparent rounded-[1px] relative group"
                                                [class.bg-[#ec5b13]]="day.isCompleted"
                                                [class.text-black]="day.isCompleted"
                                                [class.shadow-[0_0_10px_#ec5b13]]="day.isCompleted"
                                                
                                                [class.border-[#ec5b13]]="day.isToday && !day.isCompleted"
                                                [class.text-[#ec5b13]]="day.isToday && !day.isCompleted"
                                                
                                                [class.text-slate-400]="!day.isCompleted && !day.isToday"
                                                [class.hover:bg-white/10]="!day.isFuture"
                                                
                                                [class.opacity-30]="day.isFuture"
                                                [class.cursor-not-allowed]="day.isFuture">
                                            {{ day.dayNumber }}
                                            
                                            <!-- Tiny marker for notes -->
                                            @if (!day.isEmpty && !day.isFuture && !day.isCompleted) {
                                                    <div class="absolute bottom-0.5 w-0.5 h-0.5 bg-slate-600 rounded-full"></div>
                                            }
                                        </div>
                                    }
                                }
                            </div>
                            
                            <!-- Log Entry Modal/Form Overlay -->
                            @if (selectedDate() && habit()?.type === 'measurable') {
                                <div class="absolute inset-0 bg-[#0c0e12]/95 backdrop-blur-sm z-20 flex flex-col p-4 animate-in fade-in duration-200">
                                    <div class="flex items-center justify-between mb-4 border-b border-[#2a3441] pb-2">
                                        <h4 class="text-xs font-bold uppercase tracking-widest text-[#ec5b13]">Log: {{ selectedDate() | date:'shortDate' }}</h4>
                                        <button (click)="closeLogForm()" class="text-slate-500 hover:text-white transition-colors">
                                            <span class="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                    <div class="space-y-4 flex-1">
                                        <div>
                                            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Measured_Value:</label>
                                            <input type="number" [(ngModel)]="logValue" 
                                                    class="w-full p-2 bg-[#050608] border border-[#2a3441] text-white font-mono text-sm focus:border-[#ec5b13] focus:outline-none rounded-sm"
                                                    placeholder="0.00">
                                        </div>
                                        <div>
                                            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Field_Notes:</label>
                                            <textarea [(ngModel)]="logNotes" rows="3"
                                                        class="w-full p-2 bg-[#050608] border border-[#2a3441] text-white font-mono text-xs focus:border-[#ec5b13] focus:outline-none resize-none rounded-sm"
                                                        placeholder="// ADD_OBSERVATIONS..."></textarea>
                                        </div>
                                        <button (click)="saveLog()" 
                                                class="w-full py-3 bg-[#ec5b13] text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-[#ec5b13] transition-colors shadow-[0_0_15px_rgba(236,91,19,0.3)] mt-auto rounded-sm">
                                            Commit_Log
                                        </button>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>

                    <!-- 4. History Table -->
                    <div class="bg-[#0c0e12] rounded border border-[#2a3441] p-8 shadow-lg relative overflow-hidden">
                            <!-- Header Decoration -->
                        <div class="absolute top-0 left-0 w-20 h-1 bg-[#ec5b13]"></div>

                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[#ec5b13]">history</span>
                                    Execution_History
                            </h3>
                            <div class="flex items-center gap-2">
                                <button 
                                    [disabled]="currentPage() === 1"
                                    (click)="prevPage()"
                                    class="size-8 rounded bg-[#050608] border border-[#2a3441] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#ec5b13] hover:text-[#ec5b13] text-slate-400 transition-colors">
                                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                <span class="text-[10px] font-bold text-slate-500 font-mono">BLK {{ currentPage() }} / {{ totalPages() }}</span>
                                <button 
                                    [disabled]="currentPage() >= totalPages()"
                                    (click)="nextPage()"
                                    class="size-8 rounded bg-[#050608] border border-[#2a3441] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#ec5b13] hover:text-[#ec5b13] text-slate-400 transition-colors">
                                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs font-mono">
                                <thead class="border-b border-[#2a3441]">
                                    <tr>
                                        <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                                        <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Metric</th>
                                        <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest">Log_Data</th>
                                        <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-right">Ops</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-[#2a3441]">
                                    @for (log of history(); track log.id) {
                                        <tr class="group hover:bg-[#ec5b13]/5 transition-colors">
                                            <td class="px-6 py-4 font-bold text-white">
                                                {{ log.completed_at | date:'yyyy-MM-dd' }} 
                                                <span class="text-[10px] text-[#ec5b13] opacity-70 ml-2 font-normal">{{ log.completed_at | date:'HH:mm:ss' }}</span>
                                            </td>
                                            <td class="px-6 py-4">
                                                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#ec5b13]/30 bg-[#ec5b13]/10 text-[#ec5b13] text-[9px] font-bold uppercase tracking-wider rounded-[1px]">
                                                    SUCCESS
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 font-medium text-slate-300">{{ log.value ? log.value : 'N/A' }}</td>
                                            <td class="px-6 py-4 text-slate-500 italic truncate max-w-[200px]">{{ log.notes ? log.notes : '--' }}</td>
                                            <td class="px-6 py-4 text-right">
                                                <span class="material-symbols-outlined text-slate-600 hover:text-white cursor-pointer text-base">more_horiz</span>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="5" class="px-6 py-12 text-center text-slate-600 font-mono tracking-widest uppercase text-xs border border-dashed border-[#2a3441] mt-4 rounded">
                                                // NO_HISTORICAL_DATA_FOUND
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>

                } @else {
                    <div class="h-96 flex flex-col items-center justify-center p-20 text-center bg-[#0c0e12] rounded border border-[#2a3441] shadow-lg">
                        <span class="material-symbols-outlined text-6xl text-[#2a3441] mb-6 animate-pulse">search_off</span>
                        <p class="text-[#ec5b13] font-bold text-sm uppercase tracking-[0.2em] mb-2">Target_Not_Found</p>
                        <p class="text-slate-500 text-xs font-mono max-w-md mx-auto">The requested habit directive could not be located in the current memory bank.</p>
                        <a routerLink="/" class="mt-8 px-6 py-3 bg-[#2a3441] hover:bg-[#ec5b13] hover:text-white text-slate-300 transition-all font-bold uppercase tracking-widest text-xs rounded-sm">
                            Return_To_Dashboard
                        </a>
                    </div>
                }
            </div>
        </div>
    </div>
    `,
    styles: [`
    :host { font-family: 'JetBrains Mono', monospace; display: block; height: 100%; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #050608;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #2a3441;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #ec5b13;
    }
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
    analytics = signal<import('../../models/habit.model').AnalyticsResponse | null>(null);
    fullHeatmap: {date: string, level: number}[] = [];

    // Calendar Data
    calendarMonth = signal(new Date().getMonth());
    calendarYear = signal(new Date().getFullYear());
    selectedDate = signal<string | null>(null);
    logValue: number | undefined;
    logNotes: string = '';

    calendarMonthName = computed(() => {
        const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
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
        
        return `M ${points.join(' L ')}`;
    });

    trendArea = computed(() => {
        const line = this.trendLine();
        if (!line) return '';
        
        return `${line} V 50 H 0 Z`;
    });

    ngOnInit() {
        // Since signals are used, we'll react to changes in habitId within the effect or just rely on the template
        // However, we need to load data initialy.
        // We can use an effect for this, but ngOnInit is fine for initial load if we manually subscribe/get value
        // Better: use an effect in constructor or ngOnInit to trigger loads when ID changes
        
        // For simplicity in this refactor, I'll stick to basic ngOnInit with manual subscription if ID exists
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
        
        // Load Advanced Analytics
        this.habitService.getHabitAnalytics(id).subscribe({
             next: (res) => this.analytics.set(res),
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
        const habit = this.habit();
        if (id && habit) {
            if (habit.type === 'measurable') {
                // For measurable habits, open the modal for today
                const today = new Date().toISOString().split('T')[0];
                this.selectDate(today);
            } else {
                // For yes_no habits, just toggle
                this.habitService.toggleCompletion(id, new Date().toISOString().split('T')[0]).subscribe(() => {
                     // Refresh stats and history after toggle
                     this.loadHistory(id);
                     this.loadStats(id);
                });
            }
        }
    }

    deleteHabit() {
        const id = this.habitId();
        if (id && confirm('Are you sure you want to purge this directive?')) {
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

        const habit = this.habit();
        if (!habit) return;

        if (habit.type === 'yes_no') {
            // For yes_no habits, just toggle that date directly
            this.habitService.updateLog(habit.id, date, {}).subscribe(() => {
                this.loadHistory(habit.id);
                this.loadStats(habit.id);
            });
            return;
        }
        
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
