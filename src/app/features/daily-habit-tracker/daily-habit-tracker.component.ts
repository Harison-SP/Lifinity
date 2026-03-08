import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { SystemService } from '../../services/system.service';
import { SystemInstanceTask } from '../../models/system.model';

@Component({
  selector: 'app-daily-habit-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
   <div class="min-h-screen bg-concrete-200 dark:bg-concrete-900 px-4 py-5 sm:p-6 md:p-8 lg:p-12 font-manrope pb-24 relative transition-colors duration-300 overflow-x-hidden">
        <!-- Header -->
        <header class="mb-10 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 border-b-4 border-black dark:border-concrete-100 pb-6 bg-white dark:bg-concrete-800 p-4 sm:p-6 rigid-border-sm brutalist-shadow-sm dark:shadow-[4px_4px_0_0_white]">
            <div class="flex items-start sm:items-center gap-3 sm:gap-6 w-full md:w-auto">
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
                        <div class="text-5xl sm:text-6xl font-black font-mono tracking-tighter" [class.text-electric-red]="timerRunning()">
                            {{ formattedTimer() }}
                        </div>
                        <div class="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                            @if (!timerRunning()) {
                                <div class="flex items-center bg-white border-2 border-transparent focus-within:border-black transition-colors">
                                    <input type="number" [(ngModel)]="customTimerMinutes" placeholder="MINS" class="w-16 px-3 py-3 text-black font-black font-mono text-xs outline-none bg-transparent text-center" min="1">
                                    <button (click)="startCustomTimer()" class="px-3 py-3 bg-black text-white font-black uppercase text-xs hover:bg-electric-red transition-colors border-l-2 border-black">START</button>
                                </div>
                            } @else {
                                <button (click)="pauseTimer()" class="px-4 py-3 bg-electric-red text-white font-black uppercase text-xs hover:bg-white hover:text-black transition-colors border-2 border-transparent">Pause</button>
                                <button (click)="resetTimer()" class="px-4 py-3 bg-concrete-800 text-white font-black uppercase text-xs hover:bg-white hover:text-black transition-colors border-2 border-transparent">Reset</button>
                            }
                        </div>
                    </div>
                    
                    <!-- Gamification: Focus Garden -->
                    <div class="mt-6 pt-4 border-t-2 border-concrete-800 relative z-10 flex flex-col items-center justify-center">
                        <span class="text-[10px] uppercase font-black tracking-widest text-concrete-400 mb-2">Focus Garden</span>
                        <div class="flex items-end justify-center gap-4 h-16 w-full">
                            <div class="flex flex-col items-center justify-end h-full transition-all duration-700 ease-in-out">
                                <span class="material-symbols-outlined transition-all duration-700" 
                                      [ngClass]="getTreeStyle()">
                                    {{ getTreeIcon() }}
                                </span>
                            </div>
                        </div>
                        <div class="mt-2 text-xs font-black uppercase text-concrete-300">
                            {{ totalFocusedMinutes() }} Mins FOCUSED TODAY
                        </div>
                        <!-- Progress to next stage -->
                        @if (totalFocusedMinutes() < 120) {
                            <div class="w-full max-w-xs h-1 bg-concrete-800 mt-2 relative overflow-hidden">
                                <div class="absolute top-0 left-0 h-full bg-electric-red transition-all duration-1000" [style.width.%]="getProgressPer()"></div>
                            </div>
                        }
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
                    <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div class="flex flex-wrap items-center gap-3 sm:gap-4">
                            @if (todaySystemTask()?.timeBlockStart) {
                                <span class="text-xs font-black bg-black px-2 py-1 text-white uppercase">{{ todaySystemTask()?.timeBlockStart }} - {{ todaySystemTask()?.timeBlockEnd }}</span>
                            }
                            @if (todaySystemTask()?.resourceLink) {
                                <a [href]="todaySystemTask()?.resourceLink" target="_blank" class="text-xs font-black underline hover:text-black transition-colors uppercase">View_Resource</a>
                            }
                        </div>
                        <button (click)="toggleMission(todaySystemTask()!)" class="w-full sm:w-auto px-4 py-2 text-xs font-black bg-white text-black border-2 border-transparent hover:bg-black hover:text-white transition-colors uppercase">
                            {{ todaySystemTask()?.completed ? 'MARK_INCOMPLETE' : 'MARK_COMPLETE' }}
                        </button>
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
                             <label class="block text-xs font-black uppercase tracking-widest mb-1 dark:text-concrete-400">Focus Minutes</label>
                             <div class="flex items-center gap-2">
                                 <input type="number" [ngModel]="totalFocusedMinutes()" (ngModelChange)="updateFocusTime($event)" class="w-24 p-4 font-mono text-xl font-black border-[3px] border-black dark:border-concrete-100 outline-none focus:bg-concrete-100 dark:bg-concrete-900 dark:text-white dark:focus:bg-black transition-colors text-center">
                                 <span class="text-sm font-bold dark:text-concrete-300">MINS</span>
                             </div>
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

            <!-- Pending -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div class="bg-white dark:bg-concrete-800 border-[4px] border-black dark:border-concrete-100 p-6 brutalist-shadow-lg flex flex-col">
                    <h3 class="font-black uppercase text-lg border-b-4 border-black dark:border-concrete-100 pb-2 mb-4 flex items-center gap-2 text-electric-red dark:text-electric-red">
                        <span class="material-symbols-outlined">warning</span> Pending_Past_Tasks
                    </h3>
                    @if (pendingPastTasks().length === 0) {
                        <div class="flex-1 flex items-center justify-center p-4">
                            <p class="font-mono text-sm text-concrete-500 dark:text-concrete-400 uppercase font-bold text-center border-2 border-dashed border-concrete-300 dark:border-concrete-600 p-4 w-full">NO PENDING PAST TASKS.</p>
                        </div>
                    } @else {
                        <ul class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 flex-1">
                            @for (task of pendingPastTasks(); track task.date + task.title) {
                                <li class="flex items-center justify-between border-2 border-black dark:border-white p-2 hover:bg-concrete-100 dark:hover:bg-concrete-700 transition-colors group">
                                    <div class="flex flex-col flex-1 truncate mr-2">
                                        <span class="font-black uppercase text-sm font-sans dark:text-white truncate" [title]="task.title">{{ task.title }}</span>
                                        <span class="text-[10px] font-bold text-electric-red truncate">{{ task.date }} | {{ task.phase }} | W{{ task.weekNumber }}</span>
                                    </div>
                                    <button (click)="toggleMission(task)" [title]="task.completed ? 'Mark Incomplete' : 'Mark Complete'" class="p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex shrink-0 border-2 border-transparent">
                                        <span class="material-symbols-outlined text-sm">check</span>
                                    </button>
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
    pendingPastTasks = signal<SystemInstanceTask[]>([]);
    
    // Derived states
    allHabits = computed(() => this.habitService.habits());

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
    initialTimerValue = signal(120); // Keep track of how much was started
    timerRunning = signal(false);
    timerInterval: any;
    celebrationMessage = signal('');

    customTimerMinutes: number | undefined;

    logValue: number | undefined;
    logNotes = '';
    
    // Track total focus time for the gamification
    totalFocusedMinutes = signal(0);

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
            // Make sure we type-cast or assume it has focused_minutes since we just added it to backend
            this.totalFocusedMinutes.set((h.latestLog as any).focused_minutes || 0);
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

             this.systemService.getPendingPastTasks(id, todayStr).subscribe(tasks => {
                 // Sort older first
                 tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                 this.pendingPastTasks.set(tasks);
             });
        }
    }

    ngOnDestroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    goBack() {
        this.location.back();
    }

    startCustomTimer() {
        if (this.customTimerMinutes && this.customTimerMinutes > 0) {
            this.startTimer(this.customTimerMinutes * 60);
            this.customTimerMinutes = undefined;
        }
    }

    startTimer(seconds: number) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerValue.set(seconds);
        this.initialTimerValue.set(seconds);
        this.timerRunning.set(true);
        this.timerInterval = setInterval(() => {
            if (this.timerValue() > 0) {
                this.timerValue.set(this.timerValue() - 1);
            } else {
                clearInterval(this.timerInterval);
                this.timerRunning.set(false);
                this.completeSession();
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

    saveLog() {
        const id = this.habitId();
        if (!id) return;

        const isCompletedNow = this.isCompletedToday();
        const today = new Date().toISOString().split('T')[0];

        this.habitService.updateLog(id, today, {
            value: this.logValue,
            notes: this.logNotes,
            focused_minutes: this.totalFocusedMinutes()
        } as any).subscribe(() => {
            this.habitService.loadHabits();
            if (!isCompletedNow && this.logValue !== undefined && this.logValue > 0) {
                 this.showCelebration();
            }
        });
    }

    toggleDone() {
        // Toggle the entire habit as executed
        const id = this.habitId();
        const isCompletedNow = this.isCompletedToday();
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (id) {
            this.habitService.toggleCompletion(id, todayStr).subscribe(() => {
                 this.habitService.loadHabits(); // Update list everywhere
                 // We don't fetch stats here on simple toggle, list will auto-update state
                 if (!isCompletedNow) {
                     this.showCelebration('PROTOCOL EXECUTED!');
                 }
            });
        }
    }

    updateFocusTime(mins: number) {
        this.totalFocusedMinutes.set(mins);
        this.saveFocusTime(0); // auto save without celebration
    }

    saveFocusTime(addedMins: number) {
        const id = this.habitId();
        if (id) {
            const today = new Date().toISOString().split('T')[0];
            const payload: any = {
                focused_minutes: this.totalFocusedMinutes()
            };
            if (this.logValue !== undefined && this.logValue !== null) payload.value = this.logValue;
            if (this.logNotes) payload.notes = this.logNotes;
            
            // This endpoint creates/updates the log automatically 
            this.habitService.updateLog(id, today, payload).subscribe(() => {
                this.habitService.loadHabits();
                if (addedMins > 0) {
                    this.showCelebration(`+${addedMins} MINUTE FOCUS GROW!`);
                }
            });
        }
    }

    completeSession() {
        // Calculate minutes from the initial timer value
        const minsCompleted = Math.round(this.initialTimerValue() / 60);
        this.totalFocusedMinutes.update(m => m + minsCompleted);
        
        // Auto-save the focused minutes into the log
        const id = this.habitId();
        if (id) {
            const today = new Date().toISOString().split('T')[0];
            this.habitService.updateLog(id, today, {
                value: this.logValue !== undefined ? this.logValue : 1, // Fallback value if measurable vs bool config is tricky
                notes: this.logNotes,
                focused_minutes: this.totalFocusedMinutes()
            } as any).subscribe(() => {
                this.habitService.loadHabits();
                this.showCelebration(`+${minsCompleted} MINUTE FOCUS GROW!`);
            });
        }
    }

    toggleMission(task: SystemInstanceTask) {
        if (!task.instanceId) return;
        this.systemService.toggleInstanceTask(
            task.instanceId,
            task.phase || '',
            task.weekNumber,
            task.date || '',
            task.title
        ).subscribe(() => {
            const id = this.habitId();
            const todayStr = new Date().toISOString().split('T')[0];
            if (id) {
                // Refresh to get updated completed status
                this.systemService.getInstanceTasksByDate(todayStr).subscribe(tasks => {
                    const relatedTask = tasks.find(t => t.habitId === id);
                    this.todaySystemTask.set(relatedTask || null);
                });
                this.systemService.getPendingPastTasks(id, todayStr).subscribe(tasks => {
                    tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    this.pendingPastTasks.set(tasks);
                });
                this.showCelebration(task.completed ? 'MISSION UNMARKED' : 'MISSION COMPLETED!');
            }
        });
    }

    // Gamification Helpers
    getTreeIcon(): string {
        const mins = this.totalFocusedMinutes();
        if (mins === 0) return 'eco'; // Seed/leaf
        if (mins < 25) return 'park'; // Small tree
        if (mins < 60) return 'forest'; // Few trees
        return 'forest'; // Maximum stage, handled by styling
    }

    getTreeStyle(): string {
        const mins = this.totalFocusedMinutes();
        if (mins === 0) return 'text-concrete-500 text-2xl';
        if (mins < 25) return 'text-green-500 text-4xl';
        if (mins < 60) return 'text-green-400 text-5xl';
        if (mins < 120) return 'text-green-300 text-6xl drop-shadow-[0_0_15px_rgba(7ade80,0.5)]';
        return 'text-green-400 text-7xl drop-shadow-[0_0_25px_rgba(7ade80,0.8)] animate-pulse';
    }
    
    getProgressPer(): number {
        const mins = this.totalFocusedMinutes();
        let target = 25;
        if (mins >= 25) target = 60;
        if (mins >= 60) target = 120;
        if (mins >= 120) return 100;
        
        const prevMilestone = mins < 25 ? 0 : (mins < 60 ? 25 : 60);
        return ((mins - prevMilestone) / (target - prevMilestone)) * 100;
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







