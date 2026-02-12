import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, FormsModule, CommonModule],
    template: `
    <div class="h-full overflow-y-auto custom-scrollbar relative bg-[#050608] text-slate-300">
        <div class="scanline"></div>
        <div class="fixed inset-0 pointer-events-none z-0" style="background-image: radial-gradient(circle at center, transparent 0%, #050608 100%); opacity: 0.8"></div>
        
        <div class="p-6 lg:p-10 max-w-[1600px] mx-auto grid grid-cols-12 gap-6 relative z-10 pb-20">
            <!-- Header Section -->
            <header class="col-span-12 lg:col-span-9 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                <div>
                    <h2 class="text-3xl lg:text-5xl font-black text-white tracking-tight uppercase glitch-hover cursor-default">
                        SYS_OVERVIEW: <br class="hidden md:block"/> <span class="text-slate-500">SECTOR_ALFA</span>
                    </h2>
                    <div class="flex items-center gap-3 mt-3 text-[10px] text-[#ec5b13] font-mono tracking-widest uppercase">
                        <span>SIGNAL: SECURE</span>
                        <span class="text-slate-700">//</span>
                        <span>{{ habitService.habits().length }} ACTIVE SUB_SYSTEMS</span>
                    </div>
                </div>
            </header>

            <div class="col-span-12 lg:col-span-3 flex items-end justify-end mb-4">
                <button routerLink="/add" class="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ec5b13] text-white hover:bg-white hover:text-[#ec5b13] transition-all text-xs uppercase font-black tracking-widest shadow-[0_0_20px_rgba(236,91,19,0.4)] hover:scale-[1.02] rounded-lg">
                    <span class="material-symbols-outlined text-lg">add_circle</span>
                    <span>INITIATE_TASK</span>
                </button>
            </div>

            <div class="col-span-12 lg:col-span-9 space-y-6">
                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Progress / Runtime Efficiency -->
                    <div class="tac-panel p-5 group hover:bg-[#151920] transition-colors h-[180px] flex flex-col justify-between">
                        <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
                        <div class="flex justify-between items-start">
                            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-[#ec5b13]">Runtime_Efficiency</p>
                            <span class="material-symbols-outlined text-slate-700">timelapse</span>
                        </div>
                        <div>
                            <div class="flex items-end gap-2 mb-2">
                                <span class="text-5xl font-black text-white tracking-tighter leading-none">{{ completionPercent() }}<span class="text-2xl text-slate-500">%</span></span>
                                <span class="text-[#ec5b13] text-[10px] font-bold uppercase mb-1">In_Sync</span>
                            </div>
                            <div class="flex gap-1 h-3 w-full bg-slate-800/30 rounded-full overflow-hidden">
                                <div class="h-full bg-[#ec5b13] shadow-[0_0_10px_#ec5b13] transition-all duration-1000" [style.width.%]="completionPercent()"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Streak / Active Continuity -->
                    <div class="tac-panel p-5 group hover:bg-[#151920] transition-colors h-[180px] flex flex-col justify-between">
                        <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
                        <div class="flex justify-between items-start">
                            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-[#ec5b13]">Active_Continuity</p>
                            <span class="material-symbols-outlined text-[#ec5b13] animate-pulse">local_fire_department</span>
                        </div>
                        <div>
                            <div class="flex items-end gap-2 mb-2">
                                <span class="text-5xl font-black text-white tracking-tighter leading-none">{{ bestStreak() }}</span>
                                <span class="text-slate-500 text-[10px] font-bold uppercase mb-1">Cycles</span>
                            </div>
                            <div class="bg-slate-800/50 p-2 border border-slate-700 flex items-center gap-2 rounded">
                                <span class="material-symbols-outlined text-[#ec5b13] text-xs">trending_up</span>
                                <span class="text-[9px] text-[#ec5b13] font-mono">POSITIVE_GRADIENT</span>
                            </div>
                        </div>
                    </div>

                    <!-- Weekly Avg / Network Health -->
                    <div class="tac-panel p-5 group hover:bg-[#151920] transition-colors h-[180px] flex flex-col justify-between">
                        <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
                        <div class="flex justify-between items-start">
                            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-[#ec5b13]">Network_Health</p>
                            <span class="material-symbols-outlined text-slate-700">wifi_tethering</span>
                        </div>
                        <div>
                            <div class="flex items-end gap-2 mb-2">
                                <span class="text-5xl font-black text-white tracking-tighter leading-none">{{ weeklyAvg() }}<span class="text-2xl text-slate-500">%</span></span>
                            </div>
                            <div class="bg-slate-800/50 p-2 border border-slate-700 flex items-center gap-2 rounded">
                                <span class="material-symbols-outlined text-blue-400 text-xs">bolt</span>
                                <span class="text-[9px] text-blue-400 font-mono">SIGNAL_OPTIMAL</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Active Mission Queue (Habits List) -->
                <div class="tac-panel p-6 min-h-[400px]">
                    <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
                    <div class="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                        <div class="flex items-center gap-4">
                            <div class="p-1 border border-[#ec5b13] bg-[#ec5b13]/10 rounded">
                                <span class="material-symbols-outlined text-[#ec5b13] text-sm">list_alt</span>
                            </div>
                            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white">Active_Mission_Queue</h3>
                            <span class="bg-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded border border-slate-700 font-mono">CNT: {{ habitService.habits().length }}</span>
                        </div>
                    </div>
                    <div class="space-y-4">
                        @for (habit of habitService.habits(); track habit.id) {
                            <div class="group relative p-4 bg-[#0e1116] border border-slate-800 hover:border-[#ec5b13] transition-all flex items-center justify-between overflow-hidden rounded-lg cursor-pointer"
                                    (click)="handleHabitClick(habit)">
                                @if(habit.completedToday) { <div class="absolute inset-y-0 left-0 w-1 bg-[#ec5b13]"></div> }
                                
                                <div class="flex items-center gap-4 flex-1">
                                    <!-- Checkbox area -->
                                    <div class="w-10 h-10 rounded flex items-center justify-center shrink-0 transition-all"
                                            [class.bg-[#ec5b13]]="habit.completedToday"
                                            [class.shadow-[0_0_10px_#ec5b13]]="habit.completedToday"
                                            [class.border]="!habit.completedToday"
                                            [class.border-slate-600]="!habit.completedToday"
                                            [class.bg-slate-900]="!habit.completedToday"
                                            (click)="$event.stopPropagation(); toggleCompletion(habit.id)">
                                        @if(habit.completedToday) { <span class="material-symbols-outlined text-white font-bold">check</span> }
                                    </div>
                                    
                                    <div class="min-w-0">
                                        <h4 class="font-bold uppercase tracking-wider text-sm transition-colors truncate"
                                            [class.text-white]="habit.completedToday"
                                            [class.group-hover:text-[#ec5b13]]="habit.completedToday"
                                            [class.text-slate-300]="!habit.completedToday"
                                            [class.group-hover:text-white]="!habit.completedToday">{{ habit.name }}</h4>
                                        <p class="text-[9px] text-slate-500 font-mono uppercase mt-0.5 truncate">SEC: {{ habit.category }} // FREQ: EVERY_CYCLE</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-6 ml-4">
                                    <div class="flex items-center gap-2 text-[#ec5b13]">
                                        <span class="material-symbols-outlined text-sm">local_fire_department</span>
                                        <span class="font-mono text-xs font-bold">{{ habit.streak }}</span>
                                    </div>
                                    <button class="w-8 h-8 rounded flex items-center justify-center border border-slate-700 text-slate-500 group-hover:bg-slate-800 group-hover:text-white transition-all">
                                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        } @empty {
                            <div class="p-10 text-center border-2 border-dashed border-slate-800 rounded-lg">
                                <p class="text-slate-500 font-mono text-xs">NO_ACTIVE_MISSIONS_DETECTED</p>
                            </div>
                        }
                    </div>
                </div>
            </div>

            <!-- Right Sidebar (Insights / Comms Feed) -->
            <div class="col-span-12 lg:col-span-3 space-y-6">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 class="text-xs font-black uppercase tracking-[0.2em] text-white">Comms_Feed</h3>
                </div>
                
                <!-- Good Morning / Quote Panel -->
                <div class="tac-panel p-6 relative overflow-hidden group">
                    <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
                    <div class="relative z-10">
                        <div class="w-8 h-8 bg-[#ec5b13] text-white flex items-center justify-center mb-4 rounded">
                            <span class="material-symbols-outlined text-lg">terminal</span>
                        </div>
                        <p class="text-white font-bold text-lg italic tracking-wide leading-relaxed mb-4">"Good Morning, Alex! You have {{ remainingHabits() }} habits left."</p>
                        <div class="flex items-center gap-2">
                            <div class="h-px w-6 bg-[#ec5b13]"></div>
                            <p class="text-[#ec5b13] text-[10px] font-black uppercase tracking-widest">COMMANDER_VERIFIED</p>
                        </div>
                    </div>
                </div>

                <!-- Cycle Performance -->
                <div class="tac-panel p-6 relative h-[300px] flex flex-col">
                    <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
                    <div class="mb-4">
                        <h3 class="text-xs font-black uppercase tracking-[0.1em] text-white">Cycle_Performance</h3>
                        <p class="text-[9px] text-slate-500 mt-1 font-mono">TARGET_CAP: 100%</p>
                    </div>
                    <div class="flex-1 flex items-end justify-between gap-2 px-2 pb-2 relative">
                        <div class="absolute inset-0 border-b border-slate-800 z-0 flex flex-col justify-between">
                            <div class="border-t border-dashed border-slate-800/50 w-full h-px"></div>
                            <div class="border-t border-dashed border-slate-800/50 w-full h-px"></div>
                            <div class="border-t border-dashed border-slate-800/50 w-full h-px"></div>
                            <div class="border-t border-dashed border-slate-800/50 w-full h-px"></div>
                        </div>
                        <!-- Mock Bars -->
                            <div class="w-full bg-slate-800/60 h-[40%] relative z-10 border border-slate-700/50 rounded-t"></div>
                            <div class="w-full bg-slate-800/60 h-[65%] relative z-10 border border-slate-700/50 rounded-t"></div>
                            <div class="w-full bg-[#ec5b13] h-[85%] relative z-10 shadow-[0_0_15px_rgba(236,91,19,0.3)] rounded-t"></div>
                            <div class="w-full bg-slate-800/60 h-[50%] relative z-10 border border-slate-700/50 rounded-t"></div>
                            <div class="w-full bg-slate-800/60 h-[30%] relative z-10 border border-slate-700/50 rounded-t"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Log Modal -->
        @if (selectedHabit()) {
            <div class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm transition-all"
                    (click)="closeLogModal()">
                <div class="bg-[#0c0e12] rounded-lg p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] relative border border-[#2a3441] animate-in zoom-in-95 duration-200"
                        (click)="$event.stopPropagation()">
                    
                        <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>

                    <div class="flex items-start justify-between mb-6">
                        <div>
                            <span class="text-[10px] font-bold text-[#ec5b13] uppercase tracking-widest mb-1 block">{{ selectedHabit()?.category }}</span>
                            <h3 class="text-2xl font-black text-white uppercase tracking-tight">{{ selectedHabit()?.name }}</h3>
                        </div>
                        <button (click)="closeLogModal()" class="size-10 flex items-center justify-center hover:text-[#ec5b13] transition-colors">
                            <span class="material-symbols-outlined text-slate-500">close</span>
                        </button>
                    </div>

                    <div class="space-y-5">
                        @if (selectedHabit()?.type === 'measurable') {
                            <div class="space-y-2">
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Value</label>
                                <input type="number" 
                                        [(ngModel)]="logValue" 
                                        placeholder="ENTER_VALUE"
                                        class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all rounded">
                            </div>

                            <div class="space-y-2">
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notes</label>
                                <textarea rows="3" 
                                            [(ngModel)]="logNotes" 
                                            placeholder="// MISSION_LOG_ENTRY..."
                                            class="w-full px-4 py-3 bg-[#050608] border border-[#2a3441] focus:border-[#ec5b13] text-white font-mono text-sm outline-none transition-all resize-none rounded"></textarea>
                            </div>
                        } @else {
                            <div class="p-4 bg-[#050608] border border-dashed border-[#2a3441] text-center rounded">
                                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Toggle_Only_Directive</p>
                            </div>
                        }
                    </div>

                    <div class="flex gap-3 mt-8">
                        <button (click)="navigateToDetails(selectedHabit()!.id)" class="flex-1 px-4 py-3 border border-[#2a3441] text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-[#ec5b13] hover:text-[#ec5b13] transition-all rounded">
                            HISTORY_LOG
                        </button>
                        <button (click)="saveLog()" class="flex-[2] px-4 py-3 bg-[#ec5b13] text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#ec5b13] transition-all shadow-[0_0_15px_rgba(236,91,19,0.3)] rounded">
                            COMMIT_DATA
                        </button>
                    </div>
                </div>
            </div>
        }
    </div>
    `,
    styles: [`
    :host { font-family: 'Public Sans', sans-serif; display: block; height: 100%; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .material-symbols-outlined.filled { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    habitService = inject(HabitService);
    router = inject(Router);

    completedCount = computed(() => this.habitService.habits().filter(h => h.completedToday).length);
    remainingHabits = computed(() => this.habitService.habits().filter(h => !h.completedToday).length);
    completionPercent = computed(() => {
        const total = this.habitService.habits().length;
        if (total === 0) return 0;
        return Math.round((this.completedCount() / total) * 100);
    });

    bestStreak = computed(() => {
        const habits = this.habitService.habits();
        if (habits.length === 0) return 0;
        return Math.max(...habits.map(h => h.bestStreak || 0));
    });

    weeklyAvg = computed(() => {
        const habits = this.habitService.habits();
        if (habits.length === 0) return 0;
        const totalRate = habits.reduce((sum, h) => sum + (h.completionRate || 0), 0);
        return Math.round(totalRate / habits.length);
    });

    // Modal State
    selectedHabit = signal<import('../../models/habit.model').Habit | null>(null);
    logValue: number | undefined;
    logNotes: string = '';

    handleHabitClick(habit: any) {
        if (habit.type === 'measurable') {
            this.openLogModal(habit);
        } else {
            this.toggleCompletion(habit.id);
        }
    }

    openLogModal(habit: any) {
        this.selectedHabit.set(habit);
        if (habit.latestLog) {
            this.logValue = habit.latestLog.value;
            this.logNotes = habit.latestLog.notes || '';
        } else {
            this.logValue = undefined;
            this.logNotes = '';
        }
    }

    closeLogModal() {
        this.selectedHabit.set(null);
    }

    saveLog() {
        const habit = this.selectedHabit();
        if (!habit) return;

        this.habitService.updateLog(habit.id, new Date().toISOString(), {
            value: this.logValue,
            notes: this.logNotes
        }).subscribe(() => {
            this.closeLogModal();
        });
    }

    toggleCompletion(id: string) {
        const habit = this.habitService.habits().find(h => h.id === id);
        if (habit?.type === 'measurable') {
            this.openLogModal(habit!);
        } else {
            this.habitService.toggleCompletion(id, 'today').subscribe();
        }
    }

    navigateToDetails(id: string) {
        this.router.navigate(['/details', id]);
    }
}
