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
    <div class="h-full overflow-y-auto custom-scrollbar relative bg-[#050608]">
            <!-- Top Bar (Scanline decoration) -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-[#ec5b13] z-50 shadow-[0_0_10px_#ec5b13]"></div>

        <header class="p-8 border-b border-[#2a3441] bg-[#0c0e12] flex items-center justify-between relative z-10 shrink-0">
            <div class="flex items-center gap-4">
                <button (click)="goBack()" class="size-11 rounded border border-[#2a3441] bg-[#050608] flex items-center justify-center text-slate-400 hover:text-[#ec5b13] hover:border-[#ec5b13] transition-all group">
                    <span class="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                </button>
                <div>
                    <h2 class="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                        <span class="material-symbols-outlined text-[#ec5b13] text-4xl">terminal</span>
                        {{ isEditMode() ? 'MODIFY_PROTOCOL' : 'INIT_PROTOCOL' }}
                    </h2>
                    <p class="text-[#ec5b13] font-bold tracking-widest text-xs mt-1 uppercase opacity-80 pl-1">>> {{ isEditMode() ? 'UPDATING_DIRECTIVE_PARAMETERS...' : 'ESTABLISHING_NEW_ROUTINE...' }}</p>
                </div>
            </div>
        </header>

        <div class="p-10 relative">
                <!-- Background Grid -->
            <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

            <div class="max-w-4xl mx-auto relative z-10 pb-20">
                <!-- Form Card -->
                <form [formGroup]="habitForm" (ngSubmit)="onSubmit()" class="rounded bg-[#0c0e12] p-8 md:p-12 shadow-[0_0_60px_-15px_rgba(0,0,0,0.7)] border border-[#2a3441] relative">
                    <!-- Decorative Corners -->
                    <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#ec5b13]"></div>
                    <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#ec5b13]"></div>
                    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#ec5b13]"></div>
                    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#ec5b13]"></div>

                    <!-- Section 1: Basic Info -->
                    <div class="space-y-8">
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Protocol_Alias</label>
                            <div class="relative group">
                                    <input formControlName="name" class="w-full bg-[#050608] border border-[#2a3441] p-5 text-xl font-bold text-white placeholder-slate-700 outline-none focus:border-[#ec5b13] focus:shadow-[0_0_15px_rgba(236,91,19,0.2)] transition-all font-mono rounded-sm" placeholder="ENTER_NAME..." type="text"/>
                                    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 font-mono text-xs opacity-0 group-focus-within:opacity-100 transition-opacity">_INPUT_ACTIVE</div>
                            </div>
                        </div>
                        
                        <!-- Habit Type Selection -->
                        <div class="space-y-3">
                            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Operation_Type</label>
                            <div class="flex flex-col sm:flex-row gap-4">
                                <button type="button" (click)="setHabitType('yes_no')"
                                    class="flex-1 p-5 border border-[#2a3441] text-left transition-all relative overflow-hidden group hover:border-slate-500"
                                    [class.border-[#ec5b13]]="habitType() === 'yes_no'"
                                    [class.bg-[#ec5b13]/10]="habitType() === 'yes_no'"
                                    [class.bg-[#050608]]="habitType() !== 'yes_no'">
                                    
                                    <div class="flex items-center gap-3 mb-1">
                                        <div class="w-4 h-4 rounded-sm border flex items-center justify-center transition-colors"
                                                [class.border-[#ec5b13]]="habitType() === 'yes_no'"
                                                [class.bg-[#ec5b13]]="habitType() === 'yes_no'"
                                                [class.border-slate-600]="habitType() !== 'yes_no'">
                                                @if(habitType() === 'yes_no') { <span class="bg-black w-1.5 h-1.5 rounded-sm"></span> }
                                        </div>
                                        <span class="font-bold uppercase tracking-wider text-sm" [class.text-[#ec5b13]]="habitType() === 'yes_no'" [class.text-white]="habitType() !== 'yes_no'">Binary_State</span>
                                    </div>
                                    <p class="text-[10px] text-slate-500 font-mono pl-7">Simple completion toggling.</p>
                                </button>

                                <button type="button" (click)="setHabitType('measurable')"
                                    class="flex-1 p-5 border border-[#2a3441] text-left transition-all relative overflow-hidden group hover:border-slate-500"
                                    [class.border-[#ec5b13]]="habitType() === 'measurable'"
                                    [class.bg-[#ec5b13]/10]="habitType() === 'measurable'"
                                    [class.bg-[#050608]]="habitType() !== 'measurable'">
                                    
                                    <div class="flex items-center gap-3 mb-1">
                                        <div class="w-4 h-4 rounded-sm border flex items-center justify-center transition-colors"
                                                [class.border-[#ec5b13]]="habitType() === 'measurable'"
                                                [class.bg-[#ec5b13]]="habitType() === 'measurable'"
                                                [class.border-slate-600]="habitType() !== 'measurable'">
                                                @if(habitType() === 'measurable') { <span class="bg-black w-1.5 h-1.5 rounded-sm"></span> }
                                        </div>
                                        <span class="font-bold uppercase tracking-wider text-sm" [class.text-[#ec5b13]]="habitType() === 'measurable'" [class.text-white]="habitType() !== 'measurable'">Quantitative</span>
                                    </div>
                                    <p class="text-[10px] text-slate-500 font-mono pl-7">Track numeric progress values.</p>
                                </button>
                            </div>
                        </div>

                        @if (habitType() === 'measurable') {
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#050608]/50 p-6 border border-[#2a3441] border-l-4 border-l-[#ec5b13]">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Target_Value</label>
                                    <input formControlName="targetValue" type="number" class="w-full bg-[#050608] border border-[#2a3441] p-3 text-white font-mono font-bold outline-none focus:border-[#ec5b13] rounded-sm"/>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Unit_Metric</label>
                                    <input formControlName="targetUnit" type="text" placeholder="e.g. PAGES" class="w-full bg-[#050608] border border-[#2a3441] p-3 text-white font-mono font-bold outline-none focus:border-[#ec5b13] rounded-sm uppercase"/>
                                </div>
                                <div class="col-span-1 md:col-span-2 space-y-2">
                                    <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Success_Condition</label>
                                    <select formControlName="targetComparator" class="w-full bg-[#050608] border border-[#2a3441] p-3 text-white font-mono font-bold outline-none focus:border-[#ec5b13] rounded-sm appearance-none cursor-pointer">
                                        <option value=">=">AT_LEAST (>=)</option>
                                        <option value="<=">AT_MOST (<=)</option>
                                        <option value="==">EXACTLY (==)</option>
                                    </select>
                                </div>
                            </div>
                        }

                        <div class="space-y-2">
                            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Mission_Intel</label>
                            <textarea formControlName="description" class="w-full min-h-[100px] bg-[#050608] border border-[#2a3441] p-5 text-sm font-mono text-slate-300 placeholder-slate-700 outline-none focus:border-[#ec5b13] focus:bg-[#050608] transition-all resize-none rounded-sm" placeholder="// ADD_CONTEXT..."></textarea>
                        </div>
                    </div>
                    
                    <div class="my-10 h-px w-full bg-[#2a3441]"></div>

                    <!-- Section 2: Frequency -->
                    <div class="space-y-8">
                        <h3 class="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <span class="material-symbols-outlined text-[#ec5b13]">update</span>
                            Recurrence_Pattern
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            @for (type of ['daily', 'specific_days', 'interval']; track type) {
                                <button type="button" (click)="setFrequencyType(type)" 
                                    class="p-4 border border-[#2a3441] text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/5"
                                    [class.bg-[#ec5b13]]="frequencyType() === type"
                                    [class.text-white]="frequencyType() === type"
                                    [class.border-[#ec5b13]]="frequencyType() === type"
                                    [class.text-slate-400]="frequencyType() !== type"
                                    [class.bg-[#050608]]="frequencyType() !== type">
                                    {{ type === 'daily' ? 'Daily' : type === 'specific_days' ? 'Fixed_Days' : 'Interval' }}
                                </button>
                            }
                        </div>
                        
                        @if (frequencyType() === 'specific_days') {
                            <div class="flex flex-wrap gap-2 justify-center bg-[#050608] p-4 border border-[#2a3441] rounded-sm">
                                @for (day of daysOfWeek; track day.value) {
                                    <button type="button" (click)="toggleDay(day.value)"
                                            class="size-12 flex items-center justify-center border transition-all font-mono font-bold text-sm"
                                            [class.bg-[#ec5b13]]="selectedDays().includes(day.value)"
                                            [class.border-[#ec5b13]]="selectedDays().includes(day.value)"
                                            [class.text-white]="selectedDays().includes(day.value)"
                                            [class.text-slate-500]="!selectedDays().includes(day.value)"
                                            [class.border-[#2a3441]]="!selectedDays().includes(day.value)"
                                            [class.hover:bg-white/5]="!selectedDays().includes(day.value)">
                                        {{ day.label }}
                                    </button>
                                }
                            </div>
                        }

                        @if (frequencyType() === 'interval') {
                            <div class="flex items-center gap-4 bg-[#050608] p-4 border border-[#2a3441] rounded-sm">
                                <span class="font-bold text-slate-400 uppercase text-xs">Repeat_Every</span>
                                <input formControlName="frequencyInterval" type="number" min="1" class="w-20 bg-[#0c0e12] border border-[#2a3441] p-2 text-center font-bold text-white outline-none focus:border-[#ec5b13]"/>
                                <span class="font-bold text-slate-400 uppercase text-xs">Days</span>
                            </div>
                        }
                    </div>

                    <!-- Section 3: Duration & Time -->
                    <div class="my-10 h-px w-full bg-[#2a3441]"></div>
                    
                    <div class="space-y-8">
                        <h3 class="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <span class="material-symbols-outlined text-[#ec5b13]">schedule</span>
                            Temporal_Window
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <mat-form-field appearance="outline" class="w-full cyberpunk-input">
                                <mat-label>Start_Date</mat-label>
                                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                                <mat-datepicker-toggle matSuffix [for]="startPicker" class="text-[#ec5b13]"></mat-datepicker-toggle>
                                <mat-datepicker #startPicker panelClass="cyberpunk-datepicker"></mat-datepicker>
                            </mat-form-field>
                            <mat-form-field appearance="outline" class="w-full cyberpunk-input">
                                <mat-label>End_Date</mat-label>
                                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                                <mat-datepicker-toggle matSuffix [for]="endPicker" class="text-[#ec5b13]"></mat-datepicker-toggle>
                                <mat-datepicker #endPicker panelClass="cyberpunk-datepicker"></mat-datepicker>
                            </mat-form-field>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <mat-form-field appearance="outline" class="w-full cyberpunk-input">
                                <mat-label>T_Start</mat-label>
                                <input matInput [matTimepicker]="timeStartPicker" formControlName="timeBlockStart">
                                <mat-timepicker-toggle matSuffix [for]="timeStartPicker" class="text-[#ec5b13]"></mat-timepicker-toggle>
                                <mat-timepicker #timeStartPicker></mat-timepicker>
                            </mat-form-field>
                            <mat-form-field appearance="outline" class="w-full cyberpunk-input">
                                <mat-label>T_End</mat-label>
                                <input matInput [matTimepicker]="timeEndPicker" formControlName="timeBlockEnd">
                                <mat-timepicker-toggle matSuffix [for]="timeEndPicker" class="text-[#ec5b13]"></mat-timepicker-toggle>
                                <mat-timepicker #timeEndPicker></mat-timepicker>
                            </mat-form-field>
                        </div>
                    </div>
                    
                    <!-- Action Footer -->
                    <div class="mt-12 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end border-t border-[#2a3441] pt-8">
                        <button type="button" (click)="goBack()" class="px-8 py-4 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-[0.2em] border border-transparent hover:border-red-500/50 rounded-sm">
                            Abort
                        </button>
                        <button type="submit" [disabled]="habitForm.invalid" class="group relative flex items-center justify-center gap-3 bg-[#ec5b13] px-10 py-4 text-xs font-black text-white uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(236,91,19,0.4)] transition-all hover:shadow-[0_0_30px_rgba(236,91,19,0.6)] hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:shadow-none rounded-sm">
                            <span class="material-symbols-outlined text-lg">terminal</span>
                            {{ isEditMode() ? 'UPDATE_DIRECTIVE' : 'INIT_DIRECTIVE' }}
                            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                    </div>
                </form>
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
    
    /* Cyberpunk Inputs Override */
    ::ng-deep .cyberpunk-input .mat-mdc-form-field-focus-overlay {
      background-color: transparent !important;
    }
    ::ng-deep .cyberpunk-input .mat-mdc-input-element {
      color: white !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: bold !important;
    }
    ::ng-deep .cyberpunk-input .mat-mdc-text-field-wrapper {
        background-color: #050608 !important;
        border: 1px solid #2a3441 !important;
        border-radius: 0 !important;
        padding: 0 1rem !important;
    }
    ::ng-deep .cyberpunk-input .mat-mdc-form-field-infix {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
        min-height: unset !important;
    }
    ::ng-deep .cyberpunk-input .mdc-line-ripple { display: none !important; }
    
    ::ng-deep .cyberpunk-input .mat-mdc-form-field-label {
        color: #64748b !important;
        font-family: 'Public Sans', sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: 0.1em !important;
        text-transform: uppercase !important;
        font-size: 10px !important;
    }

    ::ng-deep .cyberpunk-input.mat-focused .mat-mdc-text-field-wrapper {
        border-color: #ec5b13 !important;
        box-shadow: 0 0 10px rgba(236,91,19,0.2) !important;
    }
    ::ng-deep .cyberpunk-input.mat-focused .mat-mdc-form-field-label {
        color: #ec5b13 !important;
    }

    /* Datepicker Panel Customization - Ideally globally but useful here for context */
    ::ng-deep .cyberpunk-datepicker {
        background-color: #0c0e12 !important;
        border: 1px solid #ec5b13 !important;
    }
    ::ng-deep .cyberpunk-datepicker .mat-calendar-body-label {
        color: white !important;
    }
    ::ng-deep .cyberpunk-datepicker .mat-calendar-table-header th {
        color: #64748b !important;
    }
    ::ng-deep .cyberpunk-datepicker .mat-calendar-body-cell-content {
        color: white !important;
    }
    ::ng-deep .cyberpunk-datepicker .mat-calendar-body-selected {
        background-color: #ec5b13 !important;
        color: white !important;
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
        { label: 'MON', value: 1 },
        { label: 'TUE', value: 2 },
        { label: 'WED', value: 3 },
        { label: 'THU', value: 4 },
        { label: 'FRI', value: 5 },
        { label: 'SAT', value: 6 },
        { label: 'SUN', value: 0 },
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
                color: '#ec5b13',
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
