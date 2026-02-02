import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FrequencyType } from '../../models/habit.model';

@Component({
    selector: 'app-add-habit',
    imports: [ReactiveFormsModule, SidebarComponent],
    template: `
    <div class="bg-[#f8faf9] dark:bg-[#0d1610] font-display text-[#0d1b12] dark:text-white antialiased min-h-screen flex flex-col md:flex-row overflow-hidden">
        <app-sidebar />
        
        <main class="flex-1 flex flex-col h-screen overflow-hidden relative">
            <header class="p-8 border-b border-[#e5e7eb] dark:border-[#2d3a30] bg-white dark:bg-[#1a2c20] flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <button (click)="goBack()" class="size-11 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#4c9a66] hover:text-[#0d1b12] transition-colors">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h2 class="text-3xl font-black text-[#0d1b12] dark:text-white tracking-tight">{{ isEditMode() ? 'Edit Habit' : 'Create Habit' }}</h2>
                        <p class="text-[#4c9a66] dark:text-gray-400 font-medium">{{ isEditMode() ? 'Update your routine.' : 'Design your new routine.' }}</p>
                    </div>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto p-10 scrollbar-hide">
                <div class="max-w-3xl mx-auto">
                    <!-- Form Card -->
                    <form [formGroup]="habitForm" (ngSubmit)="onSubmit()" class="rounded-[2.5rem] bg-white dark:bg-[#1a2c20] p-10 shadow-sm border border-[#e5e7eb] dark:border-[#2d3a30]">
                        <!-- Section 1: Basic Info -->
                        <div class="space-y-8">
                            <div class="space-y-3">
                                <label class="text-xs font-black uppercase tracking-[0.2em] text-[#4c9a66] dark:text-[#13ec5b]">Habit Name</label>
                                <input formControlName="name" class="w-full rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-[#102216] p-5 text-xl font-bold placeholder-[#4c9a66]/50 dark:placeholder-gray-500 focus:border-[#13ec5b] focus:bg-white dark:focus:bg-[#1a2c20] transition-all outline-none" placeholder="e.g. Read 10 pages" type="text"/>
                            </div>
                            <div class="space-y-3">
                                <label class="text-xs font-black uppercase tracking-[0.2em] text-[#4c9a66] dark:text-[#13ec5b]">Description</label>
                                <textarea formControlName="description" class="w-full min-h-[120px] rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-[#102216] p-5 text-lg font-medium placeholder-[#4c9a66]/50 dark:placeholder-gray-500 focus:border-[#13ec5b] focus:bg-white dark:focus:bg-[#1a2c20] transition-all outline-none resize-none" placeholder="Add some motivation or details..."></textarea>
                            </div>
                        </div>
                        
                        <div class="my-10 h-px w-full bg-[#f0f2f1] dark:bg-[#2d3a30]"></div>

                        <!-- Section 2: Frequency -->
                        <div class="space-y-8">
                            <div class="flex items-center justify-between">
                                <h3 class="text-xl font-black">Frequency</h3>
                                <div class="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800/50 p-1.5 p-1">
                                    <button type="button" (click)="frequency.set('Daily')" class="rounded-lg px-6 py-2 text-sm font-bold transition-all" [class.bg-white]="frequency() === 'Daily'" [class.shadow-md]="frequency() === 'Daily'" [class.text-[#0d1b12]]="frequency() === 'Daily'" [class.text-[#4c9a66]]="frequency() !== 'Daily'">Daily</button>
                                    <button type="button" (click)="frequency.set('Weekly')" class="rounded-lg px-6 py-2 text-sm font-bold transition-all" [class.bg-white]="frequency() === 'Weekly'" [class.shadow-md]="frequency() === 'Weekly'" [class.text-[#0d1b12]]="frequency() === 'Weekly'" [class.text-[#4c9a66]]="frequency() !== 'Weekly'">Weekly</button>
                                </div>
                            </div>
                            
                            @if (frequency() === 'Weekly') {
                                <div class="flex flex-wrap gap-4">
                                    @for (day of daysOfWeek; track day.value) {
                                        <button type="button" (click)="toggleDay(day.value)"
                                                class="size-14 flex items-center justify-center rounded-2xl font-black transition-all active:scale-95 border-2"
                                                [class.bg-[#13ec5b]]="selectedDays().includes(day.value)"
                                                [class.border-[#13ec5b]]="selectedDays().includes(day.value)"
                                                [class.text-[#0d1b12]]="selectedDays().includes(day.value)"
                                                [class.bg-transparent]="!selectedDays().includes(day.value)"
                                                [class.border-gray-100]="!selectedDays().includes(day.value)"
                                                [class.dark:border-gray-800]="!selectedDays().includes(day.value)"
                                                [class.text-[#4c9a66]]="!selectedDays().includes(day.value)">
                                            {{ day.label }}
                                        </button>
                                    }
                                </div>
                            }
                        </div>
                        
                        <!-- Action Footer -->
                        <div class="mt-12 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
                            <button type="button" (click)="goBack()" class="rounded-2xl px-8 py-4 text-base font-black text-[#4c9a66] hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                Cancel
                            </button>
                            <button type="submit" [disabled]="habitForm.invalid" class="group relative flex items-center justify-center gap-2 rounded-2xl bg-[#0d1b12] dark:bg-[#13ec5b] px-10 py-4 text-base font-black text-white dark:text-[#0d1b12] shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 overflow-hidden">
                                <div class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                <span class="material-symbols-outlined relative z-10">done_all</span>
                                <span class="relative z-10">{{ isEditMode() ? 'Update Habit' : 'Start Habit' }}</span>
                            </button>
                        </div>
                    </form>
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
export class AddHabitComponent implements OnInit {
    private fb = inject(FormBuilder);
    private habitService = inject(HabitService);
    private router = inject(Router);
    private location = inject(Location);
    private route = inject(ActivatedRoute);

    isEditMode = signal(false);
    habitId = signal<string | null>(null);

    frequency = signal<FrequencyType>('Daily');
    selectedDays = signal<number[]>([1, 2, 3, 4, 5]); // Weekdays default

    daysOfWeek = [
        { label: 'M', value: 1 },
        { label: 'T', value: 2 },
        { label: 'W', value: 3 },
        { label: 'T', value: 4 },
        { label: 'F', value: 5 },
        { label: 'S', value: 6 },
        { label: 'S', value: 0 },
    ];

    habitForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
    });

    constructor() {
        effect(() => {
            const id = this.habitId();
            const habits = this.habitService.habits();
            if (id && habits.length > 0) {
                const habit = habits.find(h => h.id === id);
                if (habit) {
                    this.habitForm.patchValue({
                        name: habit.name,
                        description: habit.description
                    }, { emitEvent: false }); // Avoid infinite loops if we subscribed to valueChanges elsewhere
                    this.frequency.set(habit.frequency as FrequencyType);
                    this.selectedDays.set(habit.targetDays);
                }
            }
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.habitId.set(id);
        }
    }

    toggleDay(day: number) {
        this.selectedDays.update(days =>
            days.includes(day) ? days.filter(d => d !== day) : [...days, day]
        );
    }

    onSubmit() {
        if (this.habitForm.valid) {
            const habitData = {
                name: this.habitForm.value.name!,
                description: this.habitForm.value.description || undefined,
                frequency: this.frequency(),
                targetDays: this.frequency() === 'Daily' ? [0, 1, 2, 3, 4, 5, 6] : this.selectedDays(),
                icon: 'star',
                color: '#13ec5b',
                category: 'General'
            };

            const obs$ = (this.isEditMode() && this.habitId()) 
                ? this.habitService.updateHabit(this.habitId()!, habitData)
                : this.habitService.addHabit(habitData);

            obs$.subscribe({
                next: () => this.router.navigate(['/']),
                error: (error) => console.error('Error saving habit:', error)
            });
        }
    }

    goBack() {
        this.location.back();
    }
}
