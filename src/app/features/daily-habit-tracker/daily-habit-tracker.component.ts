import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { SystemService } from '../../services/system.service';
import { SystemInstanceTask } from '../../models/system.model';

@Component({
  selector: 'app-daily-habit-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
   <div class="min-h-screen bg-concrete-200 dark:bg-concrete-900 p-6 md:p-8 lg:p-12 font-manrope pb-24 relative transition-colors duration-300">
        <!-- Header -->
        <header class="mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-black dark:border-concrete-100 pb-6 bg-white dark:bg-concrete-800 p-6 rigid-border-sm brutalist-shadow-sm dark:shadow-[4px_4px_0_0_white]">
            <div class="flex items-center gap-6 w-full md:w-auto">
                <button (click)="goBack()" class="w-12 h-12 rigid-border-sm bg-white dark:bg-concrete-900 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors group shrink-0 border-2 border-transparent dark:border-concrete-500">
                    <span class="material-symbols-outlined text-2xl dark:text-white dark:group-hover:text-black">arrow_back</span>
                </button>
                <div>
                    <div class="bg-black dark:bg-concrete-100 text-white dark:text-black px-2 py-0.5 inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                        Daily_Execution
                    </div>
                    <h1 class="text-3xl md:text-5xl font-black text-black dark:text-white uppercase leading-none font-arvo flex items-center gap-3">
                        {{ habit()?.name || 'LOADING...' }}
                    </h1>
                </div>
            </div>
        </header>

        @if (habit()) {
            @if (inconsistentDaysCount() >= 2) {
                <div class="bg-electric-red text-white p-4 font-black uppercase tracking-widest mb-8 border-4 border-black dark:border-white flex items-center gap-3">
                    <span class="material-symbols-outlined text-2xl">warning</span>
                    WARNING: {{ inconsistentDaysCount() }} inconsistent days detected recently. Protocol adherence compromised!
                </div>
            }

            <!-- Focus Session & Target -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <!-- Target Requirement -->
                @if (habit()?.type === 'measurable') {
                    <div class="p-6 bg-yellow-400 text-black border-4 border-black font-black uppercase text-xl md:text-2xl brutalist-shadow-lg flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-[10px] tracking-widest text-black/70 mb-1">Today's_Target</span>
                            <span>
                                {{ habit()?.targetComparator === '>=' ? 'At least' : habit()?.targetComparator === '<=' ? 'At most' : 'Exactly' }} 
                                {{ habit()?.targetValue || '1' }} <span class="text-electric-red">{{ habit()?.targetUnit || 'units' }}</span>
                            </span>
                        </div>
                        <span class="material-symbols-outlined text-4xl">flag</span>
                    </div>
                } @else {
                    <div class="p-6 bg-white dark:bg-concrete-800 border-4 border-black dark:border-concrete-100 font-black uppercase text-xl md:text-2xl brutalist-shadow-lg flex items-center justify-between dark:text-white">
                        <div class="flex flex-col">
                            <span class="text-[10px] tracking-widest text-concrete-500 mb-1">Today's_Target</span>
                            <span>Complete this protocol at least once today.</span>
                        </div>
                        <span class="material-symbols-outlined text-4xl text-concrete-400">task_alt</span>
                    </div>
                }

                <!-- Timer Section -->
                <div class="bg-black text-white p-6 border-4 border-black dark:border-concrete-100 brutalist-shadow-lg relative overflow-hidden group">
                    <div class="flex items-center justify-between mb-4 relative z-10">
                        <h3 class="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined">timer</span> Focus_Session
                        </h3>
                        <span class="text-[10px] font-black text-electric-red uppercase border border-electric-red px-1" title="If you struggle to start, just do it for 2 minutes.">2-Min_Rule</span>
                    </div>
                    <div class="flex flex-col sm:flex-row items-center gap-6 relative z-10 justify-between">
                        <div class="text-6xl font-black font-mono tracking-tighter" [class.text-electric-red]="timerRunning()">
                            {{ formattedTimer() }}
                        </div>
                        <div class="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                            @if (!timerRunning()) {
                                <button (click)="startTimer(120)" class="px-4 py-3 bg-white text-black font-black uppercase text-xs hover:bg-electric-red hover:text-white transition-colors border-2 border-transparent">2 Min</button>
                                <button (click)="startTimer(1500)" class="px-4 py-3 bg-white text-black font-black uppercase text-xs hover:bg-electric-red hover:text-white transition-colors border-2 border-transparent">25 Min</button>
                            } @else {
                                <button (click)="pauseTimer()" class="px-4 py-3 bg-electric-red text-white font-black uppercase text-xs hover:bg-white hover:text-black transition-colors border-2 border-transparent">Pause</button>
                                <button (click)="resetTimer()" class="px-4 py-3 bg-concrete-800 text-white font-black uppercase text-xs hover:bg-white hover:text-black transition-colors border-2 border-transparent">Reset</button>
                            }
                        </div>
                    </div>
                    <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 12px);"></div>
                </div>
            </div>

            <!-- Assigned System Task for Today -->
            @if (todaySystemTask()) {
                <div class="bg-electric-red text-white p-6 border-[4px] border-black dark:border-concrete-100 brutalist-shadow-lg mb-8 relative">
                    <h3 class="font-black uppercase tracking-widest text-lg mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined">assignment</span> Today's_Mission: {{ todaySystemTask()?.title }}
                    </h3>
                    <p class="font-bold text-sm mb-4">
                        Phase: {{ todaySystemTask()?.phase }} | Week {{ todaySystemTask()?.weekNumber }} ({{ todaySystemTask()?.weekFocus }})
                    </p>
                    @if (todaySystemTask()?.description) {
                        <p class="font-mono text-xs italic opacity-90 mb-4 bg-black/20 p-2">{{ todaySystemTask()?.description }}</p>
                    }
                    <div class="flex items-center gap-4 mt-2">
                        @if (todaySystemTask()?.timeBlockStart) {
                            <span class="text-xs font-black bg-black px-2 py-1 text-white uppercase">{{ todaySystemTask()?.timeBlockStart }} - {{ todaySystemTask()?.timeBlockEnd }}</span>
                        }
                        @if (todaySystemTask()?.resourceLink) {
                            <a [href]="todaySystemTask()?.resourceLink" target="_blank" class="text-xs font-black underline hover:text-black transition-colors uppercase">View_Resource</a>
                        }
                    </div>
                </div>
            }

            <!-- Validation/Commit form -->
            <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-concrete-100 p-8 brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] mb-12">
                <h3 class="text-2xl font-black uppercase font-arvo dark:text-white mb-6 border-b-4 border-black dark:border-concrete-100 pb-2">Execution_Log / Today</h3>
                
                @if (habit()?.type === 'measurable') {
                    <div class="space-y-6 max-w-xl">
                        <div>
                             <label class="block text-xs font-black uppercase tracking-widest mb-1 dark:text-concrete-400">Value</label>
                             <input type="number" [(ngModel)]="logValue" class="w-full p-4 font-mono text-xl font-black border-[3px] border-black dark:border-concrete-100 outline-none focus:bg-concrete-100 dark:bg-concrete-900 dark:text-white dark:focus:bg-black transition-colors">
                        </div>
                        <div>
                             <label class="block text-xs font-black uppercase tracking-widest mb-1 dark:text-concrete-400">Notes (Optional)</label>
                             <textarea [(ngModel)]="logNotes" rows="3" class="w-full p-3 font-mono text-sm border-[3px] border-black dark:border-concrete-100 outline-none focus:bg-concrete-100 dark:bg-concrete-900 dark:text-white dark:focus:bg-black resize-none transition-colors"></textarea>
                        </div>
                        <button (click)="saveLog()" class="w-full py-4 bg-electric-red text-white font-black uppercase tracking-widest hover:brightness-110 active:translate-x-1 active:translate-y-1 transition-all rigid-border-sm border-2 border-transparent dark:border-electric-red">
                            COMMIT_DATA
                        </button>
                        @if (isCompletedToday()) {
                             <div class="text-sm font-bold text-concrete-500 uppercase mt-2">Protocol already executed for today. Committing will overwrite values.</div>
                        }
                    </div>
                } @else {
                    <div class="max-w-xl flex flex-col items-start gap-4">
                        <p class="text-sm font-bold dark:text-concrete-300">This is a binary protocol. Simply mark it as completed.</p>
                        <button (click)="toggleDone()" 
                                class="px-8 py-4 rigid-border-sm border-[3px] border-black dark:border-concrete-100 font-black uppercase tracking-widest text-lg transition-all shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] active:translate-x-1 active:translate-y-1 active:shadow-none"
                                [class.bg-electric-red]="!isCompletedToday()"
                                [class.text-white]="!isCompletedToday()"
                                [class.bg-concrete-900]="isCompletedToday()"
                                [class.dark:bg-black]="isCompletedToday()"
                                [class.text-white]="isCompletedToday()">
                            {{ isCompletedToday() ? 'PROTOCOL_EXECUTED' : 'MARK_AS_EXECUTED' }}
                        </button>
                    </div>
                }
            </div>

            <!-- Systems & Pending -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <!-- System Linkage -->
                <div class="bg-concrete-200 dark:bg-concrete-900 border-[4px] border-black dark:border-concrete-100 p-6 brutalist-shadow-lg">
                    <h3 class="font-black uppercase text-lg border-b-4 border-black dark:border-concrete-100 pb-2 mb-4 flex items-center gap-2 dark:text-white">
                        <span class="material-symbols-outlined">account_tree</span> System_Details
                    </h3>
                    
                    <ul class="space-y-3 font-mono text-sm dark:text-concrete-200">
                        <li class="flex justify-between items-center border-b border-black/20 dark:border-white/20 pb-2">
                            <span class="font-bold text-concrete-500">Tier:</span>
                            <span class="uppercase font-black bg-black text-white dark:bg-white dark:text-black px-2 py-0.5">{{ habit()?.tier || 'Uncategorized' }}</span>
                        </li>
                        @if (parentHabit()) {
                            <li class="flex justify-between items-center border-b border-black/20 dark:border-white/20 pb-2">
                                <span class="font-bold text-concrete-500">Parent Protocol:</span>
                                <a [routerLink]="['/details', parentHabit()!.id]" class="uppercase font-black hover:text-electric-red underline decoration-2 underline-offset-4">{{ parentHabit()!.name }}</a>
                            </li>
                        }
                        <li class="flex justify-between items-center mt-4 text-electric-red">
                            <span class="font-bold">Pending Compensation:</span>
                            <span class="uppercase font-black border border-electric-red px-2 py-0.5" *ngIf="inconsistentDaysCount() > 0; else noComp">
                                {{ (inconsistentDaysCount() * 1.5) }}x {{ habit()?.targetUnit || 'Efforts' }}
                            </span>
                            <ng-template #noComp>
                                <span class="uppercase font-black text-black dark:text-white">None (Optimized)</span>
                            </ng-template>
                        </li>
                    </ul>
                </div>

                <!-- Pending -->
                <div class="bg-white dark:bg-concrete-800 border-[4px] border-black dark:border-concrete-100 p-6 brutalist-shadow-lg flex flex-col">
                    <h3 class="font-black uppercase text-lg border-b-4 border-black dark:border-concrete-100 pb-2 mb-4 flex items-center gap-2 text-electric-red dark:text-electric-red">
                        <span class="material-symbols-outlined">warning</span> Pending_{{ habit()?.tier || 'Daily' }}_Missions
                    </h3>
                    @if (pendingToday().length === 0) {
                        <div class="flex-1 flex items-center justify-center p-4">
                            <p class="font-mono text-sm text-concrete-500 dark:text-concrete-400 uppercase font-bold text-center border-2 border-dashed border-concrete-300 dark:border-concrete-600 p-4 w-full">ALL VISIBLE MISSIONS EXECUTED.</p>
                        </div>
                    } @else {
                        <ul class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 flex-1">
                            @for (pending of pendingToday(); track pending.id) {
                                <li class="flex items-center justify-between border-2 border-black dark:border-white p-2 hover:bg-concrete-100 dark:hover:bg-concrete-700 transition-colors group">
                                    <a [routerLink]="['/track', pending.id]" class="font-black uppercase text-sm font-sans group-hover:text-electric-red dark:text-white truncate max-w-[80%] hover:underline">{{ pending.name }}</a>
                                    <span class="text-[10px] font-black underline decoration-wavy text-concrete-500">{{ pending.tier || 'Daily' }}</span>
                                </li>
                            }
                        </ul>
                    }
                </div>
            </div>
        }

        <!-- Celebration Overlay -->
        @if (celebrationMessage()) {
            <div class="fixed inset-0 pointer-events-none z-[80] flex items-center justify-center p-4 backdrop-blur-sm bg-black/20">
                 <div class="animate-bounce text-4xl md:text-6xl lg:text-8xl font-black text-electric-red uppercase font-arvo bg-white px-8 py-6 border-8 border-black shadow-[16px_16px_0_0_black] tracking-tighter transform -rotate-2 text-center break-words max-w-[90vw]">
                      {{ celebrationMessage() }}
                 </div>
            </div>
        }
   </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #525252; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyHabitTrackerComponent implements OnInit, OnDestroy {
    location = inject(Location);
    route = inject(ActivatedRoute);
    habitService = inject(HabitService);
    systemService = inject(SystemService);

    habitId = computed(() => Object.is(this.route.snapshot.paramMap.get('id'), null) ? null : this.route.snapshot.paramMap.get('id'));
    habit = computed(() => this.habitService.habits().find(h => h.id === this.habitId()));

    todaySystemTask = signal<SystemInstanceTask | null>(null);
    
    // Derived states
    allHabits = computed(() => this.habitService.habits());

    pendingToday = computed(() => {
        return this.allHabits().filter(h => 
            h.id !== this.habitId() && 
            !h.completedToday && 
            h.tier === (this.habit()?.tier || 'daily')
        );
    });

    parentHabit = computed(() => {
        const parentId = this.habit()?.parentId;
        if (!parentId) return null;
        return this.allHabits().find(h => h.id === parentId);
    });

    isCompletedToday = computed(() => {
        const h = this.habit();
        return !!h?.completedToday;
    });

    // We assume any log fetch updates habit info. 
    // For inconsistent days, we need heatmap logic, which meant full logs in details.
    // If we only have basic habit info in tracker, inconsistentDaysCount might just rely on cached stats.
    // I'll fetch deep stats oninit if I need them:
    fullHeatmapData = signal<{date: string, level: number}[]>([]); 

    inconsistentDaysCount = computed(() => {
        const data = this.fullHeatmapData();
        if (!data.length) return 0;
        
        let missed = 0;
        const today = new Date();
        today.setHours(0,0,0,0);
        for (let i = 0; i < 7; i++) { 
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            const dayData = data.find(d => d.date === dateStr);
            if (!dayData || dayData.level === 0) {
                missed++;
            } else {
                break;
            }
        }
        return missed;
    });

    timerValue = signal(120);
    timerRunning = signal(false);
    timerInterval: any;
    celebrationMessage = signal('');

    logValue: number | undefined;
    logNotes = '';

    formattedTimer = computed(() => {
        const t = this.timerValue();
        const m = Math.floor(t / 60).toString().padStart(2, '0');
        const s = (t % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    });

    ngOnInit() {
        // Pre-fill log with latest if exists
        const h = this.habit();
        if (h && h.latestLog && this.isCompletedToday()) {
            this.logValue = h.latestLog.value;
            this.logNotes = h.latestLog.notes || '';
        }

        // Fetch deep stats and today's system task
        const id = this.habitId();
        const todayStr = new Date().toISOString().split('T')[0];

        if (id) {
             this.habitService.getHabitStats(id).subscribe(stats => {
                 if (stats && stats.heatmap) {
                     this.fullHeatmapData.set(stats.heatmap);
                 }
             });

             this.systemService.getInstanceTasksByDate(todayStr).subscribe(tasks => {
                 const relatedTask = tasks.find(t => t.habitId === id);
                 this.todaySystemTask.set(relatedTask || null);
             });
        }
    }

    ngOnDestroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    goBack() {
        this.location.back();
    }

    startTimer(seconds: number) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerValue.set(seconds);
        this.timerRunning.set(true);
        this.timerInterval = setInterval(() => {
            if (this.timerValue() > 0) {
                this.timerValue.set(this.timerValue() - 1);
            } else {
                clearInterval(this.timerInterval);
                this.timerRunning.set(false);
                this.showCelebration('SESSION_COMPLETE!');
            }
        }, 1000);
    }

    pauseTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerRunning.set(false);
    }

    resetTimer() {
        this.pauseTimer();
        this.timerValue.set(0);
    }

    toggleDone() {
        const id = this.habitId();
        const isCompletedNow = this.isCompletedToday();
        
        if (id) {
            this.habitService.toggleCompletion(id, 'today').subscribe(() => {
                 this.habitService.loadHabits(); // Update list everywhere
                 if (!isCompletedNow) this.showCelebration();
            });
        }
    }

    saveLog() {
        const id = this.habitId();
        if (!id) return;

        const isCompletedNow = this.isCompletedToday();
        const today = new Date().toISOString().split('T')[0];

        this.habitService.updateLog(id, today, {
            value: this.logValue,
            notes: this.logNotes
        }).subscribe(() => {
            this.habitService.loadHabits();
            if (!isCompletedNow && this.logValue !== undefined && this.logValue > 0) {
                 this.showCelebration();
            }
        });
    }

    showCelebration(msg?: string) {
        const messages = ['CRUSHED IT!', 'OUTSTANDING!', 'PROTOCOL EXECUTED!', 'ANOTHER WIN!', 'UNSTOPPABLE!'];
        this.celebrationMessage.set(msg || messages[Math.floor(Math.random() * messages.length)]);
        
        if (!(window as any).confetti) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
            script.onload = () => this.fireConfetti();
            document.body.appendChild(script);
        } else {
            this.fireConfetti();
        }

        setTimeout(() => this.celebrationMessage.set(''), 3000);
    }

    fireConfetti() {
        if ((window as any).confetti) {
            (window as any).confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#000000', '#ffffff', '#ef4444', '#facc15'],
                zIndex: 2147483647
            });
        }
    }
}
