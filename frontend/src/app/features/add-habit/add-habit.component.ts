import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { FrequencyType } from '../../models/habit.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';

@Component({
    selector: 'app-add-habit',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatNativeDateModule,
        MatTimepickerModule
    ],
    template: `
    <div class="min-h-screen bg-white px-4 py-6 md:py-8 lg:px-12 font-body pb-24 transition-colors duration-300 overflow-x-hidden paper-texture">
        <header class="mb-8 md:mb-10">
            <button (click)="goBack()" class="flex items-center gap-2 text-taupe hover:text-charcoal transition-colors font-body text-sm md:text-base group mb-4">
                <span class="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                Back
            </button>
            <h1 class="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal">
                {{ isEditMode() ? 'Edit Habit' : 'Add Habit' }}
            </h1>
        </header>

        <form [formGroup]="habitForm" (ngSubmit)="onSubmit()" class="max-w-3xl mx-auto bg-alabaster rounded-lg shadow-gentle p-6 md:p-8 lg:p-10">
            <!-- Habit Name -->
            <div class="mb-10 relative">
                <label class="block text-sm font-bold uppercase tracking-wider text-taupe mb-2">Habit Name</label>
                <input formControlName="name" class="w-full text-xl border-b-2 border-taupe/30 focus:border-orange-500 outline-none py-2 bg-transparent text-charcoal transition-colors" placeholder="e.g., Morning meditation" type="text"/>
                @if (habitForm.get('name')?.invalid && habitForm.get('name')?.touched) {
                    <p class="text-orange-500 text-xs mt-1">Please enter a habit name</p>
                }
            </div>

            <!-- Habit Type -->
            <div class="mb-10">
                <label class="block text-sm font-bold uppercase tracking-wider text-taupe mb-4">Habit Type</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button type="button" (click)="setHabitType('yes_no')"
                            class="p-6 rounded-xl border-2 border-taupe/30 transition-all hover:border-primary hover:bg-primary/5 flex flex-col items-center text-center group"
                            [class.bg-primary]="habitType() === 'yes_no'"
                            [class.border-primary]="habitType() === 'yes_no'"
                            [class.text-white]="habitType() === 'yes_no'"
                            [class.hover:bg-primary/10]="habitType() !== 'yes_no'">
                        <span class="material-symbols-outlined text-4xl mb-3 transition-transform group-hover:scale-110"
                              [class.text-primary]="habitType() !== 'yes_no'"
                              [class.text-white]="habitType() === 'yes_no'">check_circle</span>
                        <span class="font-heading text-xl font-bold block mb-2">Yes/No Habit</span>
                        <span class="text-sm text-taupe group-hover:text-charcoal transition-colors"
                              [class.text-white/70]="habitType() === 'yes_no'">Simple completion check</span>
                    </button>
                    <button type="button" (click)="setHabitType('measurable')"
                            class="p-6 rounded-xl border-2 border-taupe/30 transition-all hover:border-primary hover:bg-primary/5 flex flex-col items-center text-center group"
                            [class.bg-primary]="habitType() === 'measurable'"
                            [class.border-primary]="habitType() === 'measurable'"
                            [class.text-white]="habitType() === 'measurable'"
                            [class.hover:bg-primary/10]="habitType() !== 'measurable'">
                        <span class="material-symbols-outlined text-4xl mb-3 transition-transform group-hover:scale-110"
                              [class.text-primary]="habitType() !== 'measurable'"
                              [class.text-white]="habitType() === 'measurable'">assessment</span>
                        <span class="font-heading text-xl font-bold block mb-2">Measurable Habit</span>
                        <span class="text-sm text-taupe group-hover:text-charcoal transition-colors"
                              [class.text-white/70]="habitType() === 'measurable'">Track numbers, minutes, pages...</span>
                    </button>
                </div>
            </div>

            <!-- Measurable Options (Conditional) -->
            @if (habitType() === 'measurable') {
                <div class="bg-sand/30 p-6 rounded-lg mb-10 border border-taupe/20">
                    <label class="block text-sm font-bold uppercase tracking-wider text-taupe mb-4">Target Settings</label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-xs text-taupe mb-2 font-body">Goal Type</label>
                            <select formControlName="targetComparator" class="w-full bg-transparent border-b border-taupe/50 py-2 focus:border-orange-500 outline-none text-charcoal font-body">
                                <option value=">=">At least</option>
                                <option value="<=">At most</option>
                                <option value="==">Exactly</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-taupe mb-2 font-body">Target Value</label>
                            <input formControlName="targetValue" type="number" class="w-full bg-transparent border-b border-taupe/50 py-2 focus:border-orange-500 outline-none text-charcoal font-body" placeholder="e.g., 20"/>
                        </div>
                        <div>
                            <label class="block text-xs text-taupe mb-2 font-body">Unit</label>
                            <input formControlName="targetUnit" type="text" class="w-full bg-transparent border-b border-taupe/50 py-2 focus:border-orange-500 outline-none text-charcoal font-body" placeholder="e.g., minutes"/>
                        </div>
                    </div>
                </div>
            }

            <!-- Frequency -->
            <div class="mb-10">
                <label class="block text-sm font-bold uppercase tracking-wider text-taupe mb-4">Frequency</label>
                <div class="flex flex-wrap gap-2 mb-4">
                    <button type="button" (click)="setFrequencyType('daily')"
                            class="px-5 py-2 rounded-full border border-taupe/30 text-sm transition-all hover:bg-sand"
                            [class.bg-charcoal]="frequencyType() === 'daily'"
                            [class.text-white]="frequencyType() === 'daily'"
                            [class.border-charcoal]="frequencyType() === 'daily'">
                        Daily
                    </button>
                    <button type="button" (click)="setFrequencyType('interval')"
                            class="px-5 py-2 rounded-full border border-taupe/30 text-sm transition-all hover:bg-sand"
                            [class.bg-charcoal]="frequencyType() === 'interval'"
                            [class.text-white]="frequencyType() === 'interval'"
                            [class.border-charcoal]="frequencyType() === 'interval'">
                        Every X Days
                    </button>
                    <button type="button" (click)="setFrequencyType('specific_days')"
                            class="px-5 py-2 rounded-full border border-taupe/30 text-sm transition-all hover:bg-sand"
                            [class.bg-charcoal]="frequencyType() === 'specific_days'"
                            [class.text-white]="frequencyType() === 'specific_days'"
                            [class.border-charcoal]="frequencyType() === 'specific_days'">
                        Specific Days
                    </button>
                </div>

                @if (frequencyType() === 'specific_days') {
                    <div class="flex flex-wrap gap-2">
                        @for (day of daysOfWeek; track day.value) {
                            <button type="button" (click)="toggleDay(day.value)"
                                    class="w-10 h-10 flex items-center justify-center rounded-full border border-taupe/30 text-sm font-medium transition-all hover:bg-sand"
                                    [class.bg-sage]="selectedDays().includes(day.value)"
                                    [class.text-white]="selectedDays().includes(day.value)"
                                    [class.border-sage]="selectedDays().includes(day.value)"
                                    [class.bg-sand]="!selectedDays().includes(day.value)">
                                {{ day.label.substring(0, 1) }}
                            </button>
                        }
                    </div>
                }

                @if (frequencyType() === 'interval') {
                    <div class="flex items-center gap-3 p-4 bg-sand/20 rounded-lg mt-4">
                        <span class="text-sm text-taupe font-body">Repeat every</span>
                        <input formControlName="frequencyInterval" type="number" min="1" class="w-16 p-2 border border-taupe/30 rounded text-center font-body text-charcoal bg-alabaster"/>
                        <span class="text-sm text-taupe font-body">days</span>
                    </div>
                }
            </div>

            <!-- Date Range -->
            <div class="mb-10">
                <label class="block text-sm font-bold uppercase tracking-wider text-taupe mb-4">Start and End Dates</label>
                <div class="flex flex-col md:flex-row gap-4 items-center">
                    <div class="flex-1 w-full">
                        <mat-form-field appearance="outline" class="w-full soft-input">
                            <mat-label>Start Date</mat-label>
                            <input matInput formControlName="startDate" [matDatepicker]="startDatePicker" placeholder="Select start date">
                            <mat-datepicker-toggle matSuffix [for]="startDatePicker"></mat-datepicker-toggle>
                            <mat-datepicker #startDatePicker panelClass="soft-datepicker"></mat-datepicker>
                        </mat-form-field>
                    </div>
                    <span class="range-separator hidden md:flex">to</span>
                    <div class="flex-1 w-full">
                        <mat-form-field appearance="outline" class="w-full soft-input">
                            <mat-label>End Date</mat-label>
                            <input matInput formControlName="endDate" [matDatepicker]="endDatePicker" placeholder="Select end date">
                            <mat-datepicker-toggle matSuffix [for]="endDatePicker"></mat-datepicker-toggle>
                            <mat-datepicker #endDatePicker panelClass="soft-datepicker"></mat-datepicker>
                        </mat-form-field>
                    </div>
                </div>
            </div>

            <!-- Time Block -->
            <div class="mb-10">
                <label class="block text-sm font-bold uppercase tracking-wider text-taupe mb-4">Daily Reminder (Optional)</label>
                <div class="flex flex-col md:flex-row gap-4 items-center">
                    <div class="flex-1 w-full">
                        <mat-form-field appearance="outline" class="w-full soft-input">
                            <mat-label>From</mat-label>
                            <input matInput formControlName="timeBlockStart" [matTimepicker]="timeStartPicker">
                            <mat-timepicker-toggle matSuffix [for]="timeStartPicker"></mat-timepicker-toggle>
                            <mat-timepicker #timeStartPicker panelClass="soft-datepicker"></mat-timepicker>
                        </mat-form-field>
                    </div>
                    <span class="range-separator hidden md:flex">to</span>
                    <div class="flex-1 w-full">
                        <mat-form-field appearance="outline" class="w-full soft-input">
                            <mat-label>To</mat-label>
                            <input matInput formControlName="timeBlockEnd" [matTimepicker]="timeEndPicker">
                            <mat-timepicker-toggle matSuffix [for]="timeEndPicker"></mat-timepicker-toggle>
                            <mat-timepicker #timeEndPicker panelClass="soft-datepicker"></mat-timepicker>
                        </mat-form-field>
                    </div>
                </div>
            </div>

            <!-- Color -->
            <div class="mb-10">
                <label class="block text-sm font-bold uppercase tracking-wider text-taupe mb-4">Color</label>
                <div class="flex flex-wrap gap-3 items-center">
                    @for (c of presetColors; track c) {
                        <button type="button" (click)="color.set(c)"
                                class="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-gentle"
                                [style.background-color]="c"
                                [class.border-primary]="color() === c"
                                [class.border-taupe]="color() !== c"
                                [class.ring-2]="color() === c"
                                [class.ring-primary/50]="color() === c">
                        </button>
                    }
                </div>
            </div>

            <!-- Problem Count / Description -->
            <div class="mb-10">
                <label class="block text-sm font-bold uppercase tracking-wider text-taupe mb-2">How many problems solved? (optional)</label>
                <textarea formControlName="description" rows="4" class="w-full p-4 border border-taupe/30 rounded-lg bg-alabaster text-charcoal font-body focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none" placeholder="How many problems do you aim to solve? This will be used in daily reminders."></textarea>
            </div>

            <!-- Actions -->
            <div class="flex flex-col-reverse md:flex-row gap-4 pt-6 border-t border-taupe/30">
                <button type="button" (click)="goBack()" class="flex-1 py-4 border-2 border-taupe text-taupe font-bold uppercase tracking-wider hover:bg-sand hover:border-charcoal transition-colors rounded-lg">
                    Cancel
                </button>
                <button type="submit" [disabled]="habitForm.invalid" class="flex-[2] py-4 bg-primary text-white font-bold uppercase tracking-wider border-2 border-transparent hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg shadow-gentle">
                    {{ isEditMode() ? 'Update Habit' : 'Save Habit' }}
                </button>
            </div>
        </form>
    </div>
    `,
    styles: [`
    :host { display: block; }

    /* Soft Material Input Styling */
    ::ng-deep .soft-input .mdc-notched-outline {
        border-radius: 0.75rem !important;
        transition: box-shadow 0.3s ease !important;
    }

    ::ng-deep .soft-input .mdc-notched-outline__leading {
        border-top-left-radius: 0.75rem !important;
        border-bottom-left-radius: 0.75rem !important;
        border-top-color: var(--color-taupe) !important;
        border-bottom-color: var(--color-taupe) !important;
        border-left-color: var(--color-taupe) !important;
        transition: border-color 0.3s ease !important;
    }
    
    ::ng-deep .soft-input .mdc-notched-outline__trailing {
        border-top-right-radius: 0.75rem !important;
        border-bottom-right-radius: 0.75rem !important;
        border-top-color: var(--color-taupe) !important;
        border-bottom-color: var(--color-taupe) !important;
        border-right-color: var(--color-taupe) !important;
        transition: border-color 0.3s ease !important;
    }
    
    ::ng-deep .soft-input .mdc-notched-outline__notch {
        border-bottom-color: var(--color-taupe) !important;
        transition: border-color 0.3s ease !important;
    }

    ::ng-deep .soft-input .mdc-notched-outline:not(.mdc-notched-outline--notched) .mdc-notched-outline__notch {
        border-top-color: var(--color-taupe) !important;
    }

    ::ng-deep .soft-input .mat-mdc-form-field-flex {
        padding: 0 16px !important;
        background-color: transparent !important;
    }

    ::ng-deep .soft-input.mat-focused .mdc-notched-outline__leading {
        border-top-color: var(--color-primary) !important;
        border-bottom-color: var(--color-primary) !important;
        border-left-color: var(--color-primary) !important;
    }
    ::ng-deep .soft-input.mat-focused .mdc-notched-outline__trailing {
        border-top-color: var(--color-primary) !important;
        border-bottom-color: var(--color-primary) !important;
        border-right-color: var(--color-primary) !important;
    }
    ::ng-deep .soft-input.mat-focused .mdc-notched-outline__notch {
        border-bottom-color: var(--color-primary) !important;
    }    
    ::ng-deep .soft-input.mat-focused .mdc-notched-outline:not(.mdc-notched-outline--notched) .mdc-notched-outline__notch {
        border-top-color: var(--color-primary) !important;
    }

    ::ng-deep .soft-input.mat-focused .mdc-notched-outline {
        box-shadow: 0 0 0 3px rgba(236, 70, 19, 0.1) !important;
    }

    ::ng-deep .soft-input .mat-mdc-input-element {
        font-family: var(--font-body), sans-serif !important;
        color: var(--color-charcoal) !important;
        padding: 12px 0 !important;
    }

    ::ng-deep .soft-input .mat-mdc-floating-label {
        font-family: var(--font-body), sans-serif !important;
        color: var(--color-taupe) !important;
        font-size: 14px !important;
    }

    ::ng-deep .soft-input.mat-focused .mat-mdc-floating-label {
        color: var(--color-primary) !important;
    }

    ::ng-deep .soft-input .mdc-line-ripple {
        display: none !important;
    }

    /* Datepicker/Timepicker Soft Theme */
    ::ng-deep .soft-datepicker .mat-datepicker-content {
        background-color: var(--color-alabaster) !important;
        border: 1px solid var(--color-taupe) !important;
        border-radius: 0.75rem !important;
        box-shadow: 0 8px 30px rgba(74, 68, 62, 0.15) !important;
    }

    ::ng-deep .soft-datepicker .mat-calendar-body-selected {
        background-color: var(--color-primary) !important;
        border-radius: 0.5rem !important;
        color: white !important;
    }

    ::ng-deep .soft-datepicker .mat-calendar-body-cell:hover .mat-calendar-body-cell-content {
        background-color: var(--color-sand) !important;
        border-radius: 0.5rem !important;
    }

    /* Dark mode overrides */
    :host-context(.dark) .soft-input .mat-mdc-form-field-flex {
        background-color: #262626 !important;
    }
    
    :host-context(.dark) .soft-input .mdc-notched-outline__leading {
        border-top-color: #666 !important;
        border-bottom-color: #666 !important;
        border-left-color: #666 !important;
    }
    :host-context(.dark) .soft-input .mdc-notched-outline__trailing {
        border-top-color: #666 !important;
        border-bottom-color: #666 !important;
        border-right-color: #666 !important;
    }
    :host-context(.dark) .soft-input .mdc-notched-outline__notch {
        border-bottom-color: #666 !important;
    }
    :host-context(.dark) .soft-input .mdc-notched-outline:not(.mdc-notched-outline--notched) .mdc-notched-outline__notch {
        border-top-color: #666 !important;
    }

    :host-context(.dark) .soft-input.mat-focused .mdc-notched-outline__leading {
        border-top-color: var(--color-primary) !important;
        border-bottom-color: var(--color-primary) !important;
        border-left-color: var(--color-primary) !important;
    }
    :host-context(.dark) .soft-input.mat-focused .mdc-notched-outline__trailing {
        border-top-color: var(--color-primary) !important;
        border-bottom-color: var(--color-primary) !important;
        border-right-color: var(--color-primary) !important;
    }
    :host-context(.dark) .soft-input.mat-focused .mdc-notched-outline__notch {
        border-bottom-color: var(--color-primary) !important;
    }
    :host-context(.dark) .soft-input.mat-focused .mdc-notched-outline:not(.mdc-notched-outline--notched) .mdc-notched-outline__notch {
        border-top-color: var(--color-primary) !important;
    }

    :host-context(.dark) .soft-input.mat-focused .mdc-notched-outline {
        box-shadow: 0 0 0 3px rgba(236, 70, 19, 0.2) !important;
    }

    :host-context(.dark) .soft-input .mat-mdc-input-element {
        color: #fcfaf8 !important;
    }

    :host-context(.dark) .soft-input .mat-mdc-floating-label {
        color: #9a9086 !important;
    }

    :host-context(.dark) .soft-datepicker .mat-datepicker-content,
    :host-context(.dark) .mat-timepicker-content {
        background-color: #1a1a1a !important;
        border-color: #666 !important;
    }

    :host-context(.dark) .soft-input,
    :host-context(.dark) textarea,
    :host-context(.dark) select,
    :host-context(.dark) input[type="number"],
    :host-context(.dark) input[type="time"] {
        background-color: #262626 !important;
        color: #fcfaf8 !important;
        border-color: #666 !important;
    }

    :host-context(.dark) .soft-input:focus,
    :host-context(.dark) textarea:focus,
    :host-context(.dark) select:focus {
        border-color: var(--color-primary) !important;
    }

    :host-context(.dark) select option {
        background-color: #1a1a1a !important;
        color: #fcfaf8 !important;
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
    selectedDays = signal<number[]>([1, 2, 3, 4, 5]);

    daysOfWeek = [
        { label: 'MON', value: 1 }, { label: 'TUE', value: 2 }, { label: 'WED', value: 3 },
        { label: 'THU', value: 4 }, { label: 'FRI', value: 5 }, { label: 'SAT', value: 6 },
        { label: 'SUN', value: 0 },
    ];

    habitForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        type: ['yes_no'],
        targetValue: [0],
        targetUnit: [''],
        targetComparator: ['>='],
        frequencyType: ['daily'],
        frequencyInterval: [1],
        frequencyCount: [1],
        frequencyPeriod: [7],
        startDate: [this.getDefaultStartDate(), Validators.required],
        endDate: [this.getDefaultEndDate(), Validators.required],
        timeBlockStart: [this.getDefaultStartTime()],
        timeBlockEnd: [this.getDefaultEndTime()]
    });

    habitType = signal<string>('yes_no');
    frequencyType = signal<string>('daily');
    color = signal<string>('#10b981');
    presetColors = ['#10b981', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#64748b'];

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
                    this.selectedDays.set(habit.weekdays || []);
                    this.color.set(habit.color || '#ec5b13');
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

                frequency: 'Custom',
                frequencyType: this.frequencyType(),
                weekdays: this.frequencyType() === 'daily' ? [0, 1, 2, 3, 4, 5, 6] :
                    this.frequencyType() === 'specific_days' ? this.selectedDays() : [],
                frequencyInterval: formVal.frequencyInterval || 1,
                frequencyCount: formVal.frequencyCount || 1,
                frequencyPeriod: formVal.frequencyPeriod || 7,

                startDate: this.dateToString(formVal.startDate as any),
                endDate: this.dateToString(formVal.endDate as any),
                timeBlockStart: this.timeToString(formVal.timeBlockStart as any),
                timeBlockEnd: this.timeToString(formVal.timeBlockEnd as any),

                icon: 'star',
                color: this.color(),
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
        if (!timeStr) return new Date();
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    }

    private getDefaultStartTime(): Date {
        const now = new Date();
        now.setSeconds(0, 0);
        return now;
    }
    
    private getDefaultEndTime(): Date {
        const now = new Date();
        now.setHours(now.getHours() + 2);
        now.setSeconds(0, 0);
        return now;
    }

    private getDefaultStartDate(): Date {
        return new Date();
    }

    private getDefaultEndDate(): Date {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d;
    }
}







