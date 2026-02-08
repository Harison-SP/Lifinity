import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FrequencyType } from '../../models/habit.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-add-habit',
    imports: [
        ReactiveFormsModule, 
        SidebarComponent, 
        MatDatepickerModule, 
        MatTimepickerModule, 
        MatFormFieldModule, 
        MatInputModule, 
        MatNativeDateModule
    ],
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
                            
                            <!-- Habit Type Selection -->
                            <div class="space-y-3">
                                <label class="text-xs font-black uppercase tracking-[0.2em] text-[#4c9a66] dark:text-[#13ec5b]">Habit Type</label>
                                <div class="flex items-center gap-4">
                                    <button type="button" (click)="setHabitType('yes_no')"
                                        class="flex-1 p-4 rounded-xl border-2 text-center transition-all font-bold"
                                        [class.border-[#13ec5b]]="habitType() === 'yes_no'"
                                        [class.bg-[#13ec5b]/10]="habitType() === 'yes_no'"
                                        [class.text-[#13ec5b]]="habitType() === 'yes_no'"
                                        [class.border-gray-100]="habitType() !== 'yes_no'"
                                        [class.dark:border-gray-800]="habitType() !== 'yes_no'">
                                        Yes / No
                                    </button>
                                    <button type="button" (click)="setHabitType('measurable')"
                                        class="flex-1 p-4 rounded-xl border-2 text-center transition-all font-bold"
                                        [class.border-[#13ec5b]]="habitType() === 'measurable'"
                                        [class.bg-[#13ec5b]/10]="habitType() === 'measurable'"
                                        [class.text-[#13ec5b]]="habitType() === 'measurable'"
                                        [class.border-gray-100]="habitType() !== 'measurable'"
                                        [class.dark:border-gray-800]="habitType() !== 'measurable'">
                                        Measurable
                                    </button>
                                </div>
                            </div>

                            @if (habitType() === 'measurable') {
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-3">
                                        <label class="text-xs font-black uppercase tracking-[0.2em] text-[#4c9a66] dark:text-[#13ec5b]">Target</label>
                                        <input formControlName="targetValue" type="number" class="w-full rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-[#102216] p-4 font-bold outline-none focus:border-[#13ec5b]"/>
                                    </div>
                                    <div class="space-y-3">
                                        <label class="text-xs font-black uppercase tracking-[0.2em] text-[#4c9a66] dark:text-[#13ec5b]">Unit</label>
                                        <input formControlName="targetUnit" type="text" placeholder="e.g. pages" class="w-full rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-[#102216] p-4 font-bold outline-none focus:border-[#13ec5b]"/>
                                    </div>
                                    <div class="col-span-2 space-y-3">
                                        <label class="text-xs font-black uppercase tracking-[0.2em] text-[#4c9a66] dark:text-[#13ec5b]">Goal Type</label>
                                        <select formControlName="targetComparator" class="w-full rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-[#102216] p-4 font-bold outline-none focus:border-[#13ec5b]">
                                            <option value=">=">At least</option>
                                            <option value="<=">At most</option>
                                            <option value="==">Exactly</option>
                                        </select>
                                    </div>
                                </div>
                            }

                            <div class="space-y-3">
                                <label class="text-xs font-black uppercase tracking-[0.2em] text-[#4c9a66] dark:text-[#13ec5b]">Description</label>
                                <textarea formControlName="description" class="w-full min-h-[100px] rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-[#102216] p-5 text-lg font-medium placeholder-[#4c9a66]/50 dark:placeholder-gray-500 focus:border-[#13ec5b] focus:bg-white dark:focus:bg-[#1a2c20] transition-all outline-none resize-none" placeholder="Add some motivation..."></textarea>
                            </div>
                        </div>
                        
                        <div class="my-10 h-px w-full bg-[#f0f2f1] dark:bg-[#2d3a30]"></div>

                        <!-- Section 2: Frequency -->
                        <!-- Section 2: Frequency -->
                        <div class="space-y-8">
                            <h3 class="text-xl font-black">Frequency</h3>
                            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <button type="button" (click)="setFrequencyType('daily')" 
                                    class="p-3 rounded-xl border-2 text-sm font-bold transition-all"
                                    [class.border-[#13ec5b]]="frequencyType() === 'daily'"
                                    [class.bg-[#13ec5b]/10]="frequencyType() === 'daily'"
                                    [class.border-gray-100]="frequencyType() !== 'daily'"
                                    [class.dark:border-gray-800]="frequencyType() !== 'daily'">
                                    Every Day
                                </button>
                                <button type="button" (click)="setFrequencyType('specific_days')"
                                    class="p-3 rounded-xl border-2 text-sm font-bold transition-all"
                                    [class.border-[#13ec5b]]="frequencyType() === 'specific_days'"
                                    [class.bg-[#13ec5b]/10]="frequencyType() === 'specific_days'"
                                    [class.border-gray-100]="frequencyType() !== 'specific_days'"
                                    [class.dark:border-gray-800]="frequencyType() !== 'specific_days'">
                                    Specific Days
                                </button>
                                <button type="button" (click)="setFrequencyType('interval')"
                                    class="p-3 rounded-xl border-2 text-sm font-bold transition-all"
                                    [class.border-[#13ec5b]]="frequencyType() === 'interval'"
                                    [class.bg-[#13ec5b]/10]="frequencyType() === 'interval'"
                                    [class.border-gray-100]="frequencyType() !== 'interval'"
                                    [class.dark:border-gray-800]="frequencyType() !== 'interval'">
                                    Interval
                                </button>
                                <!-- Added Count per Period options could go here -->
                            </div>
                            
                            @if (frequencyType() === 'specific_days') {
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

                            @if (frequencyType() === 'interval') {
                                <div class="flex items-center gap-4">
                                    <span class="font-bold">Every</span>
                                    <input formControlName="frequencyInterval" type="number" min="1" class="w-24 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-transparent p-3 text-center font-bold outline-none focus:border-[#13ec5b]"/>
                                    <span class="font-bold">days</span>
                                </div>
                            }
                        </div>

                        <!-- Section 3: Duration & Time -->
                        <div class="my-10 h-px w-full bg-[#f0f2f1] dark:bg-[#2d3a30]"></div>
                        <div class="space-y-6">
                            <h3 class="text-xl font-black">Schedule</h3>
                            <div class="grid grid-cols-2 gap-6">
                                <mat-form-field appearance="outline" class="w-full">
                                    <mat-label>Start Date</mat-label>
                                    <input matInput [matDatepicker]="startPicker" formControlName="startDate" placeholder="Choose a date">
                                    <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                                    <mat-datepicker #startPicker></mat-datepicker>
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="w-full">
                                    <mat-label>End Date</mat-label>
                                    <input matInput [matDatepicker]="endPicker" formControlName="endDate" placeholder="Choose a date">
                                    <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                                    <mat-datepicker #endPicker></mat-datepicker>
                                </mat-form-field>
                            </div>
                            <div class="grid grid-cols-2 gap-6">
                                <mat-form-field appearance="outline" class="w-full">
                                    <mat-label>Time Block Start</mat-label>
                                    <input matInput [matTimepicker]="timeStartPicker" formControlName="timeBlockStart">
                                    <mat-timepicker-toggle matSuffix [for]="timeStartPicker"></mat-timepicker-toggle>
                                    <mat-timepicker #timeStartPicker></mat-timepicker>
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="w-full">
                                    <mat-label>Time Block End</mat-label>
                                    <input matInput [matTimepicker]="timeEndPicker" formControlName="timeBlockEnd">
                                    <mat-timepicker-toggle matSuffix [for]="timeEndPicker"></mat-timepicker-toggle>
                                    <mat-timepicker #timeEndPicker></mat-timepicker>
                                </mat-form-field>
                            </div>
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

    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }
    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: transparent !important;
    }
    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: transparent !important;
    }
    ::ng-deep .mat-mdc-input-element {
      color: inherit !important;
      font-weight: 700 !important;
    }
    ::ng-deep .mdc-notched-outline__leading,
    ::ng-deep .mdc-notched-outline__notch,
    ::ng-deep .mdc-notched-outline__trailing {
      border-color: rgba(76, 154, 102, 0.2) !important;
      border-width: 2px !important;
    }
    ::ng-deep .mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-focused .mdc-notched-outline__trailing {
      border-color: #13ec5b !important;
    }
    ::ng-deep .mat-mdc-form-field-label-wrapper {
        top: -4px !important;
    }
    ::ng-deep .mat-mdc-form-field-infix {
        padding-top: 12px !important;
        padding-bottom: 12px !important;
    }
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
        type: ['yes_no'], // yes_no, measurable
        targetValue: [0],
        targetUnit: [''],
        targetComparator: ['>='], // >=, <=, ==
        frequencyType: ['daily'], // daily, specific_days, interval, count_per_period
        frequencyInterval: [1],
        frequencyCount: [1],
        frequencyPeriod: [7], // days
        startDate: [''],
        endDate: [''],
        timeBlockStart: [''],
        timeBlockEnd: ['']
    });

    habitType = signal<string>('yes_no');
    frequencyType = signal<string>('daily');

    constructor() {
        effect(() => {
            const id = this.habitId();
            const habits = this.habitService.habits();
            if (id && habits.length > 0) {
                const habit = habits.find(h => h.id === id);
                if (habit) {
                    this.habitForm.patchValue({
                        name: habit.name,
                        description: habit.description,
                        type: habit.type || 'yes_no',
                        targetValue: habit.targetValue,
                        targetUnit: habit.targetUnit,
                        targetComparator: habit.targetComparator,
                        frequencyType: habit.frequencyType || 'daily',
                        frequencyInterval: habit.frequencyInterval,
                        frequencyCount: habit.frequencyCount,
                        frequencyPeriod: habit.frequencyPeriod,
                        startDate: habit.startDate ? new Date(habit.startDate) : null,
                        endDate: habit.endDate ? new Date(habit.endDate) : null,
                        timeBlockStart: habit.timeBlockStart ? this.timeStringToDate(habit.timeBlockStart) : null,
                        timeBlockEnd: habit.timeBlockEnd ? this.timeStringToDate(habit.timeBlockEnd) : null
                    } as any, { emitEvent: false }); 
                    
                    this.habitType.set(habit.type || 'yes_no');
                    this.frequencyType.set(habit.frequencyType || 'daily');
                    this.selectedDays.set(habit.frequencyDays || habit.targetDays || []);
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

    setHabitType(type: string) {
        this.habitType.set(type);
        this.habitForm.patchValue({ type });
    }

    setFrequencyType(type: string) {
        this.frequencyType.set(type);
        this.habitForm.patchValue({ frequencyType: type });
    }

    onSubmit() {
        if (this.habitForm.valid) {
            const formVal = this.habitForm.value;
            const habitData = {
                name: formVal.name!,
                description: formVal.description || undefined,
                type: this.habitType() as any,
                targetValue: formVal.targetValue || 0,
                targetUnit: formVal.targetUnit || '',
                targetComparator: formVal.targetComparator as any || '>=',
                
                frequency: 'Custom', // Legacy/display backup
                frequencyType: this.frequencyType(),
                frequencyDays: this.frequencyType() === 'specific_days' ? this.selectedDays() : [],
                frequencyInterval: formVal.frequencyInterval || 1,
                frequencyCount: formVal.frequencyCount || 1,
                frequencyPeriod: formVal.frequencyPeriod || 7,

                targetDays: this.frequencyType() === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : 
                            this.frequencyType() === 'specific_days' ? this.selectedDays() : [],
                
                startDate: this.dateToString(formVal.startDate as any),
                endDate: this.dateToString(formVal.endDate as any),
                timeBlockStart: this.timeToString(formVal.timeBlockStart as any),
                timeBlockEnd: this.timeToString(formVal.timeBlockEnd as any),

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

    private dateToString(date: Date | null | undefined): string | undefined {
        if (!date) return undefined;
        if (typeof date === 'string') return date;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private timeToString(date: Date | null | undefined): string | undefined {
        if (!date) return undefined;
        if (typeof date === 'string') return date;
        const d = new Date(date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    private timeStringToDate(timeStr: string): Date {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    }
}
