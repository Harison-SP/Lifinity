import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, SidebarComponent, FormsModule],
    template: `
    <div class="bg-[#f8faf9] dark:bg-[#0d1610] font-display text-[#0d1b12] dark:text-white antialiased min-h-screen flex flex-col md:flex-row overflow-hidden">
        <app-sidebar />
        
        <main class="flex-1 flex flex-col h-screen overflow-hidden relative">
            <!-- Mobile Header -->
            <header class="md:hidden flex items-center justify-between p-5 bg-white dark:bg-[#1a2c20] border-b border-[#e5e7eb] dark:border-[#2d3a30]">
                <div class="flex items-center gap-3">
                    <div class="size-9 rounded-xl bg-gradient-to-br from-[#13ec5b] to-[#0ba841] flex items-center justify-center text-[#0d1b12] shadow-sm">
                        <span class="material-symbols-outlined filled text-xl">loop</span>
                    </div>
                    <span class="font-black tracking-tighter text-xl">HabitLoop</span>
                </div>
                <button class="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    <span class="material-symbols-outlined text-[#4c9a66]">menu</span>
                </button>
            </header>

            <div class="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 scrollbar-hide">
                <div class="max-w-[1200px] mx-auto flex flex-col gap-10">
                    <!-- Page Heading Section -->
                    <section class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div class="flex flex-col gap-3">
                            <h2 class="text-4xl md:text-5xl font-black text-[#0d1b12] dark:text-white tracking-tight leading-none">Good Morning, Alex!</h2>
                            <p class="text-[#4c9a66] dark:text-gray-400 text-xl font-medium">
                                You have <span class="text-[#0d1b12] dark:text-[#13ec5b] font-bold underline decoration-[#13ec5b]/30 decoration-4 underline-offset-4">{{ remainingHabits() }} habits</span> left to complete today.
                            </p>
                        </div>
                        <a routerLink="/add" class="group relative inline-flex items-center gap-3 bg-[#0d1b12] dark:bg-[#13ec5b] dark:text-[#0d1b12] text-white px-8 py-4 rounded-2xl font-bold transition-all hover:shadow-[0_20px_50px_rgba(19,236,91,0.2)] active:scale-95 overflow-hidden">
                            <div class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span class="material-symbols-outlined relative z-10">add</span>
                            <span class="relative z-10">New Habit</span>
                        </a>
                    </section>

                    <!-- Stats Overview -->
                    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Progress Card -->
                        <div class="group bg-white dark:bg-[#1a2c20] p-7 rounded-[2rem] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 col-span-1 lg:col-span-2 overflow-hidden relative">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#13ec5b]/10 to-transparent rounded-bl-[100px]"></div>
                            <div class="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66] mb-1">Daily Progress</p>
                                    <h3 class="text-3xl font-black text-[#0d1b12] dark:text-white leading-tight">{{ completionPercent() }}% <span class="text-lg font-bold text-[#4c9a66]">Done</span></h3>
                                </div>
                                <div class="size-14 rounded-2xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b] group-hover:scale-110 transition-transform">
                                    <span class="material-symbols-outlined filled text-3xl">monitoring</span>
                                </div>
                            </div>
                            <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 mb-3 relative overflow-hidden">
                                <div class="bg-gradient-to-r from-[#13ec5b] to-[#0ea5e9] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(19,236,91,0.5)]" [style.width.%]="completionPercent()"></div>
                            </div>
                            <div class="flex justify-between items-center text-sm relative z-10">
                                <span class="font-bold text-[#4c9a66]">{{ completedCount() }} Task Completed</span>
                                <span class="font-bold text-gray-400">{{ habitService.habits().length - completedCount() }} Remaining</span>
                            </div>
                        </div>

                        <!-- Streak Card -->
                        <div class="group bg-white dark:bg-[#1a2c20] p-7 rounded-[2rem] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
                            <div class="flex justify-between items-start mb-4">
                                <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66]">Best Streak</p>
                                <span class="material-symbols-outlined text-orange-500 filled text-3xl animate-pulse">local_fire_department</span>
                            </div>
                            <div>
                                <p class="text-4xl font-black text-[#0d1b12] dark:text-white tracking-tighter">{{ bestStreak() }} <span class="text-lg">Days</span></p>
                                <div class="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 w-fit">
                                    <span class="material-symbols-outlined text-sm font-bold text-green-600">trending_up</span>
                                    <span class="text-xs font-bold text-green-600">Keep it up!</span>
                                </div>
                            </div>
                        </div>

                        <!-- Weekly Completion Card -->
                        <div class="group bg-white dark:bg-[#1a2c20] p-7 rounded-[2rem] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
                            <div class="flex justify-between items-start mb-4">
                                <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66]">Weekly Avg</p>
                                <span class="material-symbols-outlined text-blue-500 filled text-3xl">calendar_month</span>
                            </div>
                            <div>
                                <p class="text-4xl font-black text-[#0d1b12] dark:text-white tracking-tighter">{{ weeklyAvg() }}<span class="text-lg">%</span></p>
                                <div class="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 w-fit">
                                    <span class="material-symbols-outlined text-sm font-bold text-blue-600">bolt</span>
                                    <span class="text-xs font-bold text-blue-600">Avg Completion</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Habits List -->
                    <section class="flex flex-col gap-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <h3 class="text-2xl font-black text-[#0d1b12] dark:text-white tracking-tight">Today's Habits</h3>
                                <span class="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold">{{ habitService.habits().length }}</span>
                            </div>
                            <div class="flex gap-2">
                                <button class="size-11 rounded-xl hover:bg-white hover:shadow-md dark:hover:bg-gray-800 transition-all text-[#4c9a66] flex items-center justify-center border border-transparent hover:border-gray-100">
                                    <span class="material-symbols-outlined">filter_list</span>
                                </button>
                                <button class="size-11 rounded-xl hover:bg-white hover:shadow-md dark:hover:bg-gray-800 transition-all text-[#4c9a66] flex items-center justify-center border border-transparent hover:border-gray-100">
                                    <span class="material-symbols-outlined">sort</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 gap-4">
                            @for (habit of habitService.habits(); track habit.id) {
                                <div class="group flex items-center p-6 bg-white dark:bg-[#1a2c20] rounded-[1.5rem] border border-[#e5e7eb] dark:border-[#2d3a30] hover:shadow-lg hover:border-[#13ec5b]/30 transition-all duration-300 cursor-pointer"
                                     (click)="openLogModal(habit)">
                                    <div class="flex items-center gap-6 flex-1">
                                        <label class="relative flex items-center cursor-pointer" (click)="$event.stopPropagation()">
                                            <input type="checkbox" 
                                                   [checked]="habit.completedToday"
                                                   (change)="toggleCompletion(habit.id)" 
                                                   class="peer sr-only">
                                            <div class="size-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 peer-checked:bg-[#13ec5b] peer-checked:border-[#13ec5b] transition-all flex items-center justify-center">
                                                <span class="material-symbols-outlined text-white text-xl scale-0 peer-checked:scale-100 transition-transform">check</span>
                                            </div>
                                        </label>
                                        <div class="flex flex-col">
                                            <span class="text-lg font-bold transition-all"
                                                  [class.line-through]="habit.completedToday"
                                                  [class.text-gray-400]="habit.completedToday"
                                                  [class.dark:text-white/30]="habit.completedToday"
                                                  [class.text-[#0d1b12]]="!habit.completedToday"
                                                  [class.dark:text-white]="!habit.completedToday">{{ habit.name }}</span>
                                            <span class="text-xs font-bold text-[#4c9a66]/60 uppercase tracking-widest mt-0.5">{{ habit.category }}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="px-4 py-2 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 text-sm font-black flex items-center gap-2">
                                            <span class="material-symbols-outlined text-lg filled">local_fire_department</span>
                                            {{ habit.streak }}
                                        </div>
                                        <span class="material-symbols-outlined text-gray-300 group-hover:text-[#4c9a66] transition-colors">chevron_right</span>
                                    </div>
                                </div>
                            } @empty {
                                <div class="p-20 text-center bg-white dark:bg-[#1a2c20] rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                    <div class="size-20 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6 text-gray-300">
                                        <span class="material-symbols-outlined text-5xl">task_alt</span>
                                    </div>
                                    <h4 class="text-xl font-bold text-[#0d1b12] dark:text-white">No habits yet</h4>
                                    <p class="text-[#4c9a66] mt-2 mb-8 max-w-xs mx-auto text-sm">Every journey begins with a single step. Start your first habit today!</p>
                                    <a routerLink="/add" class="inline-flex items-center gap-2 bg-[#13ec5b] text-[#0d1b12] px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                                        <span class="material-symbols-outlined">add</span>
                                        <span>Create Habit</span>
                                    </a>
                                </div>
                            }
                        </div>
                    </section>
                </div>
            </div>
        </main>

        <!-- Right Sidebar (Insights) -->
        <aside class="hidden xl:flex w-96 border-l border-[#e5e7eb] dark:border-[#2d3a30] bg-white dark:bg-[#1a2c20] flex-col h-screen overflow-y-auto p-10 sticky top-0">
            <div class="flex items-center justify-between mb-10">
                <h3 class="text-xl font-black text-[#0d1b12] dark:text-white tracking-tight">Insights</h3>
                <button class="size-10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
                    <span class="material-symbols-outlined text-[#4c9a66]">more_horiz</span>
                </button>
            </div>
            
            <div class="space-y-10">
                 <!-- Categories -->
                <div>
                    <p class="text-xs font-bold uppercase tracking-widest text-[#4c9a66] mb-5">Tracked Categories</p>
                    <div class="flex flex-wrap gap-2.5">
                        <span class="px-4 py-2 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 text-xs font-bold border border-purple-100 dark:border-purple-800/50">Health</span>
                        <span class="px-4 py-2 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800/50">Learning</span>
                        <span class="px-4 py-2 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300 text-xs font-bold border border-amber-100 dark:border-amber-800/50">Focus</span>
                    </div>
                </div>

                <!-- Motivation Quote -->
                <div class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0d1b12] via-[#1a2c20] to-[#0d1b12] p-8 text-white shadow-2xl">
                    <div class="absolute -right-6 -top-6 text-white/5 pointer-events-none">
                        <span class="material-symbols-outlined" style="font-size: 160px">format_quote</span>
                    </div>
                    <div class="relative z-10">
                        <div class="size-10 rounded-xl bg-[#13ec5b] flex items-center justify-center text-[#0d1b12] mb-6">
                            <span class="material-symbols-outlined filled">bolt</span>
                        </div>
                        <p class="text-2xl font-black leading-tight tracking-tight mb-4 italic">"Consistency is the key to achieving any goal."</p>
                        <p class="text-sm text-[#13ec5b] font-bold uppercase tracking-widest">— Keep going, Alex!</p>
                    </div>
                </div>

                <!-- Goal Tracker Mini -->
                <div class="bg-gray-50 dark:bg-[#2d3a30]/30 p-8 rounded-[2rem] border border-[#e5e7eb] dark:border-[#2d3a30]">
                    <h4 class="font-black text-[#0d1b12] dark:text-white mb-2">Monthly Goal</h4>
                    <p class="text-sm text-[#4c9a66] mb-6">Complete 200 sessions</p>
                    <div class="flex items-end gap-1 h-32 mb-4">
                        <div class="flex-1 bg-gray-200 dark:bg-gray-800 rounded-t-lg h-1/2"></div>
                        <div class="flex-1 bg-gray-200 dark:bg-gray-800 rounded-t-lg h-3/4"></div>
                        <div class="flex-1 bg-[#13ec5b] rounded-t-lg h-full shadow-[0_0_15px_rgba(19,236,91,0.3)]"></div>
                        <div class="flex-1 bg-gray-200 dark:bg-gray-800 rounded-t-lg h-2/3"></div>
                        <div class="flex-1 bg-gray-200 dark:bg-gray-800 rounded-t-lg h-1/2"></div>
                    </div>
                    <p class="text-xs font-bold text-center text-[#4c9a66]">WEEKLY ACTIVITY</p>
                </div>
            </div>
        </aside>

        <!-- Log Entry Modal Overlay -->
        @if (selectedHabit()) {
            <div class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#0d1b12]/60 backdrop-blur-sm transition-all"
                 (click)="closeLogModal()">
                
                <!-- Modal Content -->
                <div class="bg-white dark:bg-[#1a2c20] rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative border border-[#e5e7eb] dark:border-[#2d3a30] animate-in zoom-in-95 duration-200"
                     (click)="$event.stopPropagation()">
                    
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-6">
                        <div>
                            <span class="text-xs font-bold text-[#4c9a66] uppercase tracking-widest mb-1 block">{{ selectedHabit()?.category }}</span>
                            <h3 class="text-2xl font-black text-[#0d1b12] dark:text-white">{{ selectedHabit()?.name }}</h3>
                        </div>
                        <button (click)="closeLogModal()" class="size-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
                            <span class="material-symbols-outlined text-gray-400">close</span>
                        </button>
                    </div>

                    <!-- Form -->
                    <div class="space-y-5">
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-[#0d1b12] dark:text-white">Value</label>
                            <input type="number" 
                                   [(ngModel)]="logValue" 
                                   placeholder="e.g. 30"
                                   class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0d1610] border border-transparent focus:bg-white dark:focus:bg-[#1a2c20] focus:border-[#13ec5b] outline-none transition-all font-medium text-[#0d1b12] dark:text-white">
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-bold text-[#0d1b12] dark:text-white">Notes</label>
                            <textarea rows="3" 
                                      [(ngModel)]="logNotes" 
                                      placeholder="How did it go?"
                                      class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0d1610] border border-transparent focus:bg-white dark:focus:bg-[#1a2c20] focus:border-[#13ec5b] outline-none transition-all font-medium text-[#0d1b12] dark:text-white resize-none"></textarea>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 mt-8">
                        <button (click)="navigateToDetails(selectedHabit()!.id)" class="flex-1 px-4 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[#0d1b12] dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            View History
                        </button>
                        <button (click)="saveLog()" class="flex-[2] px-4 py-3.5 rounded-xl bg-[#13ec5b] text-[#0d1b12] font-bold hover:shadow-[0_10px_30px_rgba(19,236,91,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
                            Save Progress
                        </button>
                    </div>

                </div>
            </div>
        }
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

    openLogModal(habit: import('../../models/habit.model').Habit) {
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
        this.habitService.toggleCompletion(id, 'today').subscribe();
    }

    navigateToDetails(id: string) {
        this.router.navigate(['/details', id]);
    }
}
