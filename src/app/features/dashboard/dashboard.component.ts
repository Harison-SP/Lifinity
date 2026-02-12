import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-concrete-200 p-6 md:p-8 lg:p-12 font-manrope">
        <!-- Dashboard Header -->
        <header class="flex flex-col md:flex-row items-start justify-between gap-6 mb-12">
            <div class="space-y-1">
                <div class="bg-concrete-900 text-white px-4 py-1 inline-block text-xs font-bold uppercase tracking-[0.2em]">User Profile // Identity Verified</div>
                <h1 class="text-6xl md:text-8xl font-black text-concrete-900 uppercase leading-none font-arvo">STATUS: COMMANDER</h1>
                <div class="flex items-center gap-4 pt-2">
                    <div class="h-6 w-1 bg-electric-red"></div>
                    <p class="text-sm font-bold uppercase tracking-widest text-concrete-400">
                        Pending Tasks: <span class="text-concrete-900 underline">{{ remainingHabits() }} UNITS</span>
                    </p>
                </div>
            </div>
            <a routerLink="/add" class="rigid-border border-[4px] brutalist-shadow-md bg-electric-red text-white font-black py-4 px-8 flex items-center gap-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter cursor-pointer">
                <span class="material-symbols-outlined">add_box</span>
                <span>Initialize New Process</span>
            </a>
        </header>

        <!-- Stats Grid -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <!-- Efficiency Rating -->
            <div class="bg-concrete-100 rigid-border border-[4px] brutalist-shadow-md p-6 flex flex-col active-scan relative overflow-hidden">
                <span class="text-[10px] font-black text-concrete-400 uppercase mb-8 border-b-2 border-concrete-900 pb-1 z-10 relative">Efficiency_Rating // 01</span>
                <div class="flex items-end gap-2 mb-4 z-10 relative">
                    <span class="text-7xl font-black leading-none">{{ completionPercent() }}%</span>
                    <span class="text-xs font-bold text-electric-red pb-1 underline">NOMINAL</span>
                </div>
                <div class="w-full h-4 bg-concrete-300 mt-auto z-10 relative">
                    <div class="bg-concrete-900 h-full transition-all duration-1000" [style.width.%]="completionPercent()"></div>
                </div>
            </div>

            <!-- Uptime Sequence (Best Streak) -->
            <div class="bg-concrete-900 rigid-border border-[4px] brutalist-shadow-md p-6 text-white flex flex-col justify-between">
                <span class="text-[10px] font-bold text-concrete-400 uppercase mb-4 border-b border-concrete-400 pb-1">Uptime_Sequence</span>
                <div class="flex items-center gap-4">
                    <span class="text-8xl font-black italic leading-none text-yellow-400">{{ bestStreak() }}</span>
                    <div class="text-xs font-bold leading-tight uppercase">Consecutive<br/>Cycles<br/>Recorded</div>
                </div>
            </div>

            <!-- Aggregate Output (Total Habits) -->
            <div class="bg-concrete-100 rigid-border border-[4px] brutalist-shadow-md p-6 flex flex-col">
                <span class="text-[10px] font-black text-concrete-400 uppercase mb-8 border-b-2 border-concrete-900 pb-1">Total_Protocols</span>
                <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-7xl font-black text-concrete-900 leading-none">{{ habitService.habits().length }}</span>
                    <span class="text-2xl font-black text-concrete-400">ACTIVE</span>
                </div>
            </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Active Protocols List -->
            <section class="lg:col-span-8">
                <div class="flex items-baseline gap-4 mb-6">
                    <h2 class="text-4xl font-black text-concrete-900 uppercase font-arvo">Active_Protocols</h2>
                    <span class="text-xl font-bold text-concrete-400">[{{ remainingHabits() }}]</span>
                </div>
                <div class="space-y-4">
                    @for (habit of habitService.habits(); track habit.id) {
                        <div class="rigid-border border-[2px] brutalist-shadow-sm p-4 flex items-center gap-6 cursor-pointer transition-all hover:translate-x-1"
                             [class.bg-white]="!habit.completedToday"
                             [class.bg-concrete-100]="habit.completedToday"
                             [class.opacity-60]="habit.completedToday"
                             [class.grayscale]="habit.completedToday"
                             [class.border-l-electric-red]="!habit.completedToday"
                             [class.border-l-[12px]]="!habit.completedToday"
                             (click)="handleHabitClick(habit)">
                            
                            <div class="w-10 h-10 border-2 border-concrete-900 flex items-center justify-center transition-colors"
                                 [class.bg-concrete-900]="habit.completedToday"
                                 [class.text-white]="habit.completedToday"
                                 [class.bg-transparent]="!habit.completedToday">
                                @if (habit.completedToday) {
                                    <span class="material-symbols-outlined text-2xl">done_all</span>
                                }
                            </div>
                            
                            <div class="flex-1">
                                <h3 class="text-2xl font-black text-concrete-900 uppercase transition-all"
                                    [class.line-through]="habit.completedToday">{{ habit.name }}</h3>
                                <span class="text-[10px] font-bold px-2 py-0.5 uppercase border border-concrete-900"
                                      [class.bg-concrete-200]="habit.completedToday"
                                      [class.bg-concrete-900]="!habit.completedToday"
                                      [class.text-white]="!habit.completedToday">
                                    {{ habit.category || 'GEN' }} // {{ habit.frequencyType || 'DAILY' }}
                                </span>
                            </div>
                            
                            <button (click)="$event.stopPropagation(); navigateToDetails(habit.id)" class="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-concrete-900 rounded-full transition-colors">
                                <span class="material-symbols-outlined text-concrete-900">arrow_forward</span>
                            </button>
                        </div>
                    } @empty {
                        <div class="p-8 text-center border-4 border-dashed border-concrete-300">
                            <p class="text-concrete-400 font-bold uppercase tracking-widest">No Active Protocols Initiated</p>
                        </div>
                    }
                </div>
            </section>

            <!-- Quote / Side Panel -->
            <section class="lg:col-span-4 space-y-8">
                <div class="bg-yellow-400 rigid-border border-[4px] brutalist-shadow-md p-8 relative overflow-hidden">
                    <span class="material-symbols-outlined text-[10rem] absolute -right-8 -bottom-8 opacity-20 text-black select-none">format_quote</span>
                    <div class="w-10 h-10 bg-black flex items-center justify-center text-white mb-6 relative z-10">
                        <span class="material-symbols-outlined">bolt</span>
                    </div>
                    <blockquote class="text-xl font-black text-black mb-6 leading-tight uppercase relative z-10">
                        "CONSISTENCY IS THE KEY TO ACHIEVING ANY GOAL. REPEAT_PROCESS_UNTIL_SUCCESS."
                    </blockquote>
                </div>
            </section>
        </div>

        <!-- Log Modal (Brutalist Style) -->
        @if (selectedHabit()) {
            <div class="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm" (click)="closeLogModal()">
                <div class="bg-white rigid-border border-[4px] p-8 w-full max-w-md brutalist-shadow-md relative" (click)="$event.stopPropagation()">
                    <div class="bg-black text-white p-2 absolute -top-4 -left-4 font-black uppercase tracking-widest text-xs">
                        Input_Required
                    </div>
                    
                    <div class="flex items-start justify-between mb-8">
                        <div>
                            <span class="text-xs font-bold text-electric-red uppercase tracking-widest block mb-1">MEASURABLE_PROTOCOL</span>
                            <h3 class="text-3xl font-black text-concrete-900 uppercase leading-none font-arvo">{{ selectedHabit()?.name }}</h3>
                        </div>
                        <button (click)="closeLogModal()" class="w-10 h-10 bg-concrete-100 border-2 border-black flex items-center justify-center hover:bg-electric-red hover:text-white transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-xs font-black uppercase tracking-widest text-concrete-900">Value_Input</label>
                            <input type="number" 
                                   [(ngModel)]="logValue" 
                                   placeholder="ENTER_DATA"
                                   class="w-full h-16 rigid-border-sm bg-concrete-100 px-4 text-2xl font-black font-mono outline-none focus:bg-white focus:border-electric-red transition-colors">
                        </div>

                        <div class="space-y-2">
                            <label class="text-xs font-black uppercase tracking-widest text-concrete-900">Mission_Notes</label>
                            <textarea rows="3" 
                                      [(ngModel)]="logNotes" 
                                      placeholder="// OPTIONAL_LOG_ENTRY..."
                                      class="w-full p-4 rigid-border-sm bg-concrete-100 text-sm font-bold font-mono outline-none focus:bg-white focus:border-electric-red transition-colors resize-none"></textarea>
                        </div>
                    </div>

                    <div class="flex gap-4 mt-8">
                        <button (click)="saveLog()" class="flex-1 py-4 bg-electric-red text-white font-black uppercase tracking-widest hover:brightness-110 active:translate-x-1 active:translate-y-1 transition-all rigid-border-sm">
                            COMMIT_DATA
                        </button>
                    </div>
                </div>
            </div>
        }
    </div>
    `,
    styles: [`
        :host { display: block; }
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

    // Modal State
    selectedHabit = signal<any | null>(null);
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
