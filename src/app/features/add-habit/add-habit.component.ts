import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { FrequencyType } from '../../models/habit.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-add-habit',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule, 
        MatDatepickerModule, 
        MatTimepickerModule, 
        MatFormFieldModule, 
        MatInputModule, 
        MatNativeDateModule
    ],
    template: `
    <div class="min-h-screen bg-concrete-200 p-6 md:p-8 lg:p-12 font-manrope pb-24">
        <header class="mb-12 flex justify-between items-end border-b-4 border-black pb-4">
            <div>
                <button (click)="goBack()" class="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-electric-red transition-colors">
                    <span class="material-symbols-outlined text-sm">arrow_back</span>
                    Return_To_Base
                </button>
                <h1 class="text-4xl md:text-6xl font-black text-black uppercase leading-none font-arvo">
                    {{ isEditMode() ? 'System_Override' : 'Initialize_Protocol' }}
                </h1>
            </div>
            <div class="hidden md:block text-right">
                <div class="text-[10px] font-black uppercase tracking-[0.2em] bg-black text-white px-2 py-1 inline-block">
                    Status: {{ isEditMode() ? 'Reconfiguration' : 'New_Entry' }}
                </div>
            </div>
        </header>

        <form [formGroup]="habitForm" (ngSubmit)="onSubmit()" class="max-w-4xl mx-auto bg-white rigid-border border-[4px] brutalist-shadow-active p-8 md:p-12 relative">
            
            <!-- Section 1: Identification -->
            <div class="mb-12">
                <label class="block text-xs font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-electric-red pl-2 text-concrete-900">Protocol_Identity</label>
                <input formControlName="name" class="w-full text-3xl font-black font-arvo uppercase border-b-4 border-black focus:border-electric-red outline-none py-2 placeholder:text-concrete-300 transition-colors bg-transparent" placeholder="ENTER_DESIGNATION" type="text"/>
            </div>

            <!-- Section 2: Parameters -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <!-- Type Selection -->
                <div>
                     <label class="block text-xs font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-electric-red pl-2 text-concrete-900">System_Type</label>
                     <div class="flex flex-col gap-4">
                        <button type="button" (click)="setHabitType('yes_no')"
                            class="text-left p-4 rigid-border-sm border-[2px] hover:bg-black hover:text-white transition-all group"
                            [class.bg-black]="habitType() === 'yes_no'"
                            [class.text-white]="habitType() === 'yes_no'"
                            [class.bg-white]="habitType() !== 'yes_no'">
                            <span class="font-black uppercase tracking-wider block text-lg mb-1">Binary_State</span>
                            <span class="text-[10px] mono-font block opacity-70 group-hover:opacity-100">Simple Completion Toggle (0/1)</span>
                        </button>
                        <button type="button" (click)="setHabitType('measurable')"
                            class="text-left p-4 rigid-border-sm border-[2px] hover:bg-black hover:text-white transition-all group"
                            [class.bg-black]="habitType() === 'measurable'"
                            [class.text-white]="habitType() === 'measurable'"
                            [class.bg-white]="habitType() !== 'measurable'">
                            <span class="font-black uppercase tracking-wider block text-lg mb-1">Quantitative</span>
                            <span class="text-[10px] mono-font block opacity-70 group-hover:opacity-100">Numeric Value Tracking</span>
                        </button>
                     </div>

                     <!-- Spectra Code (Color) -->
                     <div class="mt-8">
                        <label class="block text-xs font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-electric-red pl-2 text-concrete-900">Spectra_Code</label>
                        <div class="flex gap-2 flex-wrap">
                            @for (c of presetColors; track c) {
                                <button type="button" (click)="color.set(c)"
                                        class="w-8 h-8 rigid-border-sm border-[2px] transition-all hover:scale-110 flex items-center justify-center shadow-[2px_2px_0_0_black]"
                                        [style.background-color]="c"
                                        [class.border-black]="color() === c"
                                        [class.border-transparent]="color() !== c">
                                    @if(color() === c) {
                                        <div class="w-2 h-2 bg-black"></div>
                                    }
                                </button>
                            }
                        </div>
                     </div>
                </div>

                <!-- Measurable Options -->
                @if (habitType() === 'measurable') {
                    <div class="bg-concrete-100 p-6 rigid-border-sm border-[2px] border-dashed">
                        <label class="block text-xs font-black uppercase tracking-[0.2em] mb-6 text-concrete-900">Metric_Config</label>
                        <div class="space-y-4">
                            <div>
                                <span class="text-[10px] font-bold uppercase block mb-1">Target_Value</span>
                                <input formControlName="targetValue" type="number" class="w-full p-2 rigid-border-sm border-[2px] font-mono font-bold outline-none focus:bg-white"/>
                            </div>
                            <div>
                                <span class="text-[10px] font-bold uppercase block mb-1">Unit_Label</span>
                                <input formControlName="targetUnit" type="text" placeholder="UNITS" class="w-full p-2 rigid-border-sm border-[2px] font-mono font-bold outline-none focus:bg-white uppercase"/>
                            </div>
                            <div>
                                <span class="text-[10px] font-bold uppercase block mb-1">Logic_Gate</span>
                                <select formControlName="targetComparator" class="w-full p-2 rigid-border-sm border-[2px] font-mono font-bold outline-none focus:bg-white bg-transparent">
                                    <option value=">=">AT_LEAST (>=)</option>
                                    <option value="<=">AT_MOST (<=)</option>
                                    <option value="==">EXACTLY (==)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <!-- Section 3: Recurrence -->
            <div class="mb-12">
                <label class="block text-xs font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-electric-red pl-2 text-concrete-900">Temporality_Matrix</label>
                <div class="flex flex-wrap gap-2 mb-6">
                    @for (type of ['daily', 'specific_days', 'interval']; track type) {
                        <button type="button" (click)="setFrequencyType(type)" 
                            class="px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white transition-all"
                            [class.bg-black]="frequencyType() === type"
                            [class.text-white]="frequencyType() === type"
                            [class.bg-white]="frequencyType() !== type">
                            {{ type === 'daily' ? 'DAILY_CYCLE' : type === 'specific_days' ? 'FIXED_DAYS' : 'INTERVAL_LOOP' }}
                        </button>
                    }
                </div>
                
                @if (frequencyType() === 'specific_days') {
                    <div class="flex flex-wrap gap-2">
                        @for (day of daysOfWeek; track day.value) {
                            <button type="button" (click)="toggleDay(day.value)"
                                    class="w-10 h-10 flex items-center justify-center border-2 border-black font-black text-xs transition-all hover:translate-y-[-2px] hover:shadow-[2px_2px_0_0_black]"
                                    [class.bg-electric-red]="selectedDays().includes(day.value)"
                                    [class.text-white]="selectedDays().includes(day.value)"
                                    [class.bg-white]="!selectedDays().includes(day.value)">
                                {{ day.label.substring(0, 1) }}
                            </button>
                        }
                    </div>
                }

                @if (frequencyType() === 'interval') {
                    <div class="flex items-center gap-4 rigid-border-sm border-[2px] p-4 inline-flex bg-concrete-100">
                        <span class="font-black text-xs uppercase">REPEAT_EVERY</span>
                        <input formControlName="frequencyInterval" type="number" min="1" class="w-16 p-1 text-center font-black border-b-2 border-black bg-transparent outline-none"/>
                        <span class="font-black text-xs uppercase">DAYS</span>
                    </div>
                }
            </div>

            <div class="mb-12">
                <label class="block text-xs font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-electric-red pl-2 text-concrete-900">Timeframe_Constraints</label>
                <div class="grid grid-cols-1 gap-6">
                    <mat-form-field appearance="outline" class="brutalist-input w-full">
                        <mat-label>Timeline_Range</mat-label>
                        <mat-date-range-input [rangePicker]="rangePicker">
                            <input matStartDate formControlName="startDate" placeholder="START">
                            <input matEndDate formControlName="endDate" placeholder="END">
                        </mat-date-range-input>
                        <mat-datepicker-toggle matSuffix [for]="rangePicker"></mat-datepicker-toggle>
                        <mat-date-range-picker #rangePicker panelClass="brutalist-datepicker"></mat-date-range-picker>
                    </mat-form-field>
                </div>
            </div>

            <!-- Section 4: Time Block -->
            <div class="mb-12">
                <label class="block text-xs font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-electric-red pl-2 text-concrete-900">Time_Block_Window</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <mat-form-field appearance="outline" class="brutalist-input w-full">
                        <mat-label>Block_Start_Time</mat-label>
                        <input matInput [matTimepicker]="startTimePicker" formControlName="timeBlockStart">
                        <mat-timepicker-toggle matSuffix [for]="startTimePicker"></mat-timepicker-toggle>
                        <mat-timepicker #startTimePicker></mat-timepicker>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="brutalist-input w-full">
                        <mat-label>Block_End_Time</mat-label>
                        <input matInput [matTimepicker]="endTimePicker" formControlName="timeBlockEnd">
                        <mat-timepicker-toggle matSuffix [for]="endTimePicker"></mat-timepicker-toggle>
                        <mat-timepicker #endTimePicker></mat-timepicker>
                    </mat-form-field>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col md:flex-row gap-4 pt-8 border-t-4 border-black">
                <button type="button" (click)="goBack()" class="flex-1 py-4 border-4 border-black font-black uppercase tracking-widest hover:bg-concrete-200 transition-colors">
                    Abort_Sequence
                </button>
                <button type="submit" [disabled]="habitForm.invalid" class="flex-[2] py-4 bg-electric-red text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {{ isEditMode() ? 'Commit_Changes' : 'Initialize_Objective' }}
                </button>
            </div>
        </form>
    </div>
    `,
    styles: [`
    :host { display: block; }
    
    /* Strong Overrides for Material to Brutalist */
    ::ng-deep .brutalist-input .mat-mdc-form-field-flex {
        background-color: transparent !important;
        border: 2px solid black !important;
        padding: 0 16px !important;
        border-radius: 0 !important;
    }
    
    ::ng-deep .brutalist-input .mat-mdc-form-field-infix {
        padding-top: 16px !important;
        padding-bottom: 16px !important;
        min-height: unset !important;
    }
    
    ::ng-deep .brutalist-input.mat-focused .mat-mdc-form-field-flex {
        border-color: #ff3e3e !important; /* Electric Red */
        box-shadow: 4px 4px 0 0 rgba(0,0,0,0.1) !important;
    }

    ::ng-deep .brutalist-input .mat-mdc-input-element {
        font-family: 'Space Mono', monospace !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
    }
    
    ::ng-deep .brutalist-input .mat-mdc-floating-label {
        font-family: 'Manrope', sans-serif !important;
        font-weight: 900 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1em !important;
        color: #808080 !important; 
    }
    
    /* Remove the default underline ripple */
    ::ng-deep .brutalist-input .mdc-line-ripple { display: none !important; }
    
    /* Datepicker Customization */
    ::ng-deep .brutalist-datepicker .mat-datepicker-content {
        background-color: white !important;
        border: 4px solid black !important;
        box-shadow: 8px 8px 0 0 rgba(0,0,0,1) !important;
        border-radius: 0 !important;
    }
    
    ::ng-deep .brutalist-datepicker .mat-calendar-body-selected {
        background-color: #ff3e3e !important;
        border-radius: 0 !important;
    }
    
    ::ng-deep .brutalist-datepicker .mat-calendar-body-cell:hover .mat-calendar-body-cell-content {
        background-color: #e5e5e5 !important;
        border-radius: 0 !important;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddHabitComponent implements OnInit {
    // ... Logic remains largely the same, mapped to signals ...
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
        startDate: [new Date(), Validators.required],
        endDate: [(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d; })(), Validators.required],
        timeBlockStart: [new Date()],
        timeBlockEnd: [(() => { const d = new Date(); d.setHours(d.getHours() + 2); return d; })()]
    });

    habitType = signal<string>('yes_no');
    frequencyType = signal<string>('daily');
    color = signal<string>('#ec5b13');
    presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

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
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    }
}
