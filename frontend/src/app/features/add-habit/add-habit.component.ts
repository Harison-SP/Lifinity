import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { ToastService } from '../../services/toast.service';
import { FrequencyType, HabitCategory, PriorityLevel, MicroHabit, Habit } from '../../models/habit.model';
import { FormsModule } from '@angular/forms';
import { startWith } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
    selector: 'app-add-habit',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatTimepickerModule,
    MatSelectModule,
    MatAutocompleteModule
],
    template: `
    <div class="min-h-screen bg-white px-3 py-4 md:py-8 lg:px-12 font-body pb-24 transition-colors duration-300 overflow-x-hidden paper-texture">
        <header class="mb-3 md:mb-10">
            <button (click)="goBack()" class="flex items-center gap-1.5 text-taupe hover:text-charcoal transition-colors font-body text-xs md:text-base group mb-1.5 md:mb-4">
                <span class="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
                Back
            </button>
            <h1 class="font-heading text-xl md:text-4xl lg:text-5xl font-bold text-charcoal">
                {{ isEditMode() ? 'Edit Habit' : 'Add Habit' }}
            </h1>
        </header>

        <form [formGroup]="habitForm" (ngSubmit)="onSubmit()" class="max-w-3xl mx-auto bg-alabaster rounded-lg shadow-gentle p-4 md:p-8 lg:p-10">
            <!-- Habit Name -->
            <div class="mb-4 md:mb-10 relative">
                <label class="block text-[9px] md:text-sm font-bold uppercase tracking-wider text-taupe mb-1 md:mb-2">Habit Name</label>
                <input formControlName="name" class="w-full text-base md:text-xl border-b-2 border-taupe/30 focus:border-orange-500 outline-none py-1 md:py-2 bg-transparent text-charcoal transition-colors" placeholder="e.g., Morning meditation" type="text"/>
                @if (habitForm.get('name')?.invalid && habitForm.get('name')?.touched) {
                    <p class="text-orange-500 text-[9px] mt-0.5">Please enter a habit name</p>
                }
            </div>

            <!-- Habit Type -->
            <div class="mb-4 md:mb-10">
                <label class="block text-[9px] md:text-sm font-bold uppercase tracking-wider text-taupe mb-2 md:mb-4">Habit Type</label>
                <div class="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
                    <button type="button" (click)="setHabitType('yes_no')"
                            class="p-2 md:p-6 rounded-xl border-2 border-taupe/30  flex flex-col items-center text-center group transition-all"
                            [class.bg-primary]="habitType() === 'yes_no'"
                            [class.border-primary]="habitType() === 'yes_no'"
                            [class.text-white]="habitType() === 'yes_no'">
                        <span class="material-symbols-outlined text-xl md:text-4xl mb-1 md:mb-3 transition-transform group-hover:scale-110"
                               [class.text-primary]="habitType() !== 'yes_no'"
                               [class.text-white]="habitType() === 'yes_no'">check_circle</span>
                        <span class="font-heading text-xs md:text-xl font-bold block mb-0 md:mb-2">Yes/No</span>
                        <span class="text-[8px] md:text-sm text-taupe transition-colors hidden sm:block"
                               [class.text-white]="habitType() === 'yes_no'">Simple check</span>
                    </button>
                    <button type="button" (click)="setHabitType('measurable')"
                            class="p-2 md:p-6 rounded-xl border-2 border-taupe/30  flex flex-col items-center text-center group transition-all"
                            [class.bg-primary]="habitType() === 'measurable'"
                            [class.border-primary]="habitType() === 'measurable'"
                            [class.text-white]="habitType() === 'measurable'">
                        <span class="material-symbols-outlined text-xl md:text-4xl mb-1 md:mb-3 transition-transform group-hover:scale-110"
                               [class.text-primary]="habitType() !== 'measurable'"
                               [class.text-white]="habitType() === 'measurable'">assessment</span>
                        <span class="font-heading text-xs md:text-xl font-bold block mb-0 md:mb-2">Measurable</span>
                        <span class="text-[8px] md:text-sm text-taupe transition-colors hidden sm:block"
                               [class.text-white/70]="habitType() === 'measurable'">Track numbers</span>
                    </button>
                </div>
            </div>

            <!-- Measurable Options (Conditional) -->
            @if (habitType() === 'measurable') {
                <div class="bg-sand/30 p-3 md:p-6 rounded-lg mb-4 md:mb-10 border border-taupe/20">
                    <label class="block text-[9px] md:text-sm font-bold uppercase tracking-wider text-taupe mb-2 md:mb-4">Target Settings</label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
                        <div class="flex-1">
                            <mat-form-field appearance="outline" class="w-full soft-input">
                                <mat-label>Goal Type</mat-label>
                                <mat-select formControlName="targetComparator">
                                    <mat-option value=">=">At least</mat-option>
                                    <mat-option value="<=">At most</mat-option>
                                    <mat-option value="==">Exactly</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>
                        <div class="flex-1">
                            <mat-form-field appearance="outline" class="w-full soft-input">
                                <mat-label>Target Value</mat-label>
                                <input matInput formControlName="targetValue" type="number" placeholder="e.g., 20">
                            </mat-form-field>
                        </div>
                        <div class="flex-1">
                            <mat-form-field appearance="outline" class="w-full soft-input">
                                <mat-label>Unit</mat-label>
                                <input matInput 
                                       formControlName="targetUnit" 
                                       [matAutocomplete]="autoUnit"
                                       placeholder="e.g., minutes">
                                <mat-autocomplete #autoUnit="matAutocomplete" panelClass="soft-datepicker">
                                    @for (option of filteredUnits(); track option) {
                                        <mat-option [value]="option">{{option}}</mat-option>
                                    }
                                </mat-autocomplete>
                            </mat-form-field>
                        </div>
                    </div>
                </div>
            }

            <!-- Frequency -->
            <div class="mb-4 md:mb-10">
                <label class="block text-[9px] md:text-sm font-bold uppercase tracking-wider text-taupe mb-2 md:mb-4">Frequency</label>
                <div class="flex flex-wrap gap-1.5 mb-2 md:mb-4">
                    <button type="button" (click)="setFrequencyType('daily')"
                            class="px-4 py-1.5 rounded-full border border-taupe/30 text-xs md:text-sm transition-all hover:bg-sand"
                            [class.bg-charcoal]="frequencyType() === 'daily'"
                            [class.text-white]="frequencyType() === 'daily'"
                            [class.border-charcoal]="frequencyType() === 'daily'">
                        Daily
                    </button>
                    <button type="button" (click)="setFrequencyType('interval')"
                            class="px-4 py-1.5 rounded-full border border-taupe/30 text-xs md:text-sm transition-all hover:bg-sand"
                            [class.bg-charcoal]="frequencyType() === 'interval'"
                            [class.text-white]="frequencyType() === 'interval'"
                            [class.border-charcoal]="frequencyType() === 'interval'">
                        Interval
                    </button>
                    <button type="button" (click)="setFrequencyType('specific_days')"
                            class="px-3 py-1 rounded-full border border-taupe/30 text-[10px] md:text-sm transition-all hover:bg-sand"
                            [class.bg-charcoal]="frequencyType() === 'specific_days'"
                            [class.text-white]="frequencyType() === 'specific_days'"
                            [class.border-charcoal]="frequencyType() === 'specific_days'">
                        Specific
                    </button>
                </div>

                @if (frequencyType() === 'specific_days') {
                    <div class="flex flex-wrap gap-2">
                        @for (day of daysOfWeek; track day.value) {
                            <button type="button" (click)="toggleDay(day.value)"
                                    class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full border border-taupe/30 text-[10px] md:text-sm font-medium transition-all hover:bg-sand"
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
                    <div class="flex items-center gap-3 p-3 bg-sand/20 rounded-lg mt-3">
                        <span class="text-xs text-taupe font-body">Repeat every</span>
                        <input formControlName="frequencyInterval" type="number" min="1" class="w-14 p-1.5 border border-taupe/30 rounded text-center font-body text-xs text-charcoal bg-alabaster"/>
                        <span class="text-xs text-taupe font-body">days</span>
                    </div>
                }
            </div>

            <!-- Date Range -->
            <div class="mb-6 md:mb-10">
                <div class="flex items-center justify-between mb-3 md:mb-4">
                    <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-taupe">Duration</label>
                    <div class="flex items-center gap-2 px-2 py-0.5 bg-sand/20 rounded-full border border-taupe/10">
                        <span class="text-[9px] font-black uppercase tracking-widest" [class.text-sage]="isEndless()" [class.text-taupe]="!isEndless()">Endless</span>
                        <button type="button" 
                                (click)="toggleEndless()"
                                class="relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                                [class.bg-sage]="isEndless()"
                                [class.bg-taupe/30]="!isEndless()">
                            <span class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                                  [class.translate-x-4]="isEndless()"
                                  [class.translate-x-0]="!isEndless()"></span>
                        </button>
                    </div>
                </div>

                <div class="w-full">
                    @if (!isEndless()) {
                        <mat-form-field appearance="outline" class="w-full soft-input">
                            <mat-label>Select Date Range</mat-label>
                            <mat-date-range-input [rangePicker]="rangePicker">
                                <input matStartDate formControlName="startDate" placeholder="Start date">
                                <input matEndDate formControlName="endDate" placeholder="End date">
                            </mat-date-range-input>
                            <mat-datepicker-toggle matSuffix [for]="rangePicker"></mat-datepicker-toggle>
                            <mat-date-range-picker #rangePicker panelClass="soft-datepicker"></mat-date-range-picker>
                        </mat-form-field>
                    } @else {
                        <mat-form-field appearance="outline" class="w-full soft-input">
                            <mat-label>Start Date</mat-label>
                            <input matInput [matDatepicker]="startPicker" formControlName="startDate" placeholder="When do you begin?">
                            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                            <mat-datepicker #startPicker panelClass="soft-datepicker"></mat-datepicker>
                        </mat-form-field>
                    }
                </div>
            </div>

            <!-- Time Block Configuration (Optional) -->
            <div class="mb-4 md:mb-10 bg-sand/10 rounded-xl md:rounded-2xl p-3 md:p-6 border border-taupe/10 transition-all duration-500">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 md:gap-3">
                        <div class="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary text-base md:text-xl">schedule</span>
                        </div>
                        <div>
                            <h3 class="font-heading text-xs md:text-lg font-bold text-charcoal">Execution Window</h3>
                            <p class="text-[9px] md:text-xs text-taupe">Specific time block</p>
                        </div>
                    </div>
                    <button type="button" 
                            (click)="showTimeBlock.set(!showTimeBlock())"
                            class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                            [class.bg-primary]="showTimeBlock()"
                            [class.bg-taupe/30]="!showTimeBlock()">
                        <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                              [class.translate-x-4]="showTimeBlock()"
                              [class.translate-x-0]="!showTimeBlock()"></span>
                    </button>
                </div>

                @if (showTimeBlock()) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-taupe/10 animate-fade-in">
                        <div class="space-y-1 md:space-y-2">
                            <label class="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-taupe block ml-1">Starts</label>
                            <mat-form-field appearance="outline" class="w-full soft-input no-label-field">
                                <input matInput formControlName="timeBlockStart" [matTimepicker]="startPicker" placeholder="09:00 AM">
                                <mat-timepicker-toggle matSuffix [for]="startPicker"></mat-timepicker-toggle>
                                <mat-timepicker #startPicker panelClass="soft-datepicker"></mat-timepicker>
                            </mat-form-field>
                        </div>

                        <div class="space-y-1 md:space-y-2">
                            <label class="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-taupe block ml-1">Ends</label>
                            <mat-form-field appearance="outline" class="w-full soft-input no-label-field">
                                <input matInput formControlName="timeBlockEnd" [matTimepicker]="endPicker" placeholder="10:00 AM">
                                <mat-timepicker-toggle matSuffix [for]="endPicker"></mat-timepicker-toggle>
                                <mat-timepicker #endPicker panelClass="soft-datepicker"></mat-timepicker>
                            </mat-form-field>
                        </div>
                    </div>
                }
            </div>

            <!-- Advanced Configuration Toggle -->
            <div class="mb-4 md:mb-8 pt-3 border-t border-taupe/10">
                <button type="button" 
                        (click)="showAdvancedOptions.set(!showAdvancedOptions())"
                        class="w-full py-2.5 md:py-4 px-3 md:px-6 rounded-xl md:rounded-2xl bg-charcoal/5 border border-charcoal/10 flex items-center justify-between hover:bg-charcoal/10 transition-all group">
                    <div class="flex items-center gap-2 md:gap-4">
                        <div class="w-7 h-7 md:w-10 md:h-10 rounded-full bg-charcoal/10 flex items-center justify-center group-hover:bg-charcoal/20 transition-colors">
                            <span class="material-symbols-outlined text-charcoal text-base md:text-xl">{{ showAdvancedOptions() ? 'settings_suggest' : 'tune' }}</span>
                        </div>
                        <div class="text-left">
                            <h3 class="font-heading text-xs md:text-base font-bold text-charcoal">Advanced</h3>
                            <p class="text-[9px] md:text-xs text-taupe">{{ showAdvancedOptions() ? 'Hide refined settings' : 'Micro-habits, sobriety, stacking' }}</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-base md:text-xl transition-transform duration-300" [class.rotate-180]="showAdvancedOptions()">expand_more</span>
                </button>
            </div>

            @if (showAdvancedOptions()) {
                <div class="animate-fade-in space-y-6 md:space-y-10 pb-10">
                    <!-- Color -->
                    <div class="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl p-3 md:p-6 border border-taupe/10 shadow-sm">
                        <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-taupe mb-2 md:mb-4">Protocol Identity (Color)</label>
                        <div class="flex flex-wrap gap-2 md:gap-3 items-center">
                            @for (c of presetColors; track c) {
                                <button type="button" (click)="color.set(c)"
                                        class="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-all hover:scale-110 shadow-gentle"
                                        [style.background-color]="c"
                                        [class.border-primary]="color() === c"
                                        [class.border-taupe]="color() !== c"
                                        [class.ring-2]="color() === c"
                                        [class.ring-primary/50]="color() === c">
                                </button>
                            }
                        </div>
                    </div>

                    <!-- Habit Stacking -->
                    <div class="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl p-3 md:p-6 border border-taupe/10 shadow-sm">
                        <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-taupe mb-1 md:mb-2">Habit Stacking
                            <span class="text-taupe/60 normal-case tracking-normal font-normal">(optional)</span>
                        </label>
                        <p class="text-xs text-taupe/80 mb-4 font-body">Build consistency by linking this protocol to a daily anchor event.</p>
                        <mat-form-field appearance="outline" class="w-full soft-input">
                            <mat-label>Anchor Event</mat-label>
                            <input matInput 
                                   formControlName="stackedWith" 
                                   [matAutocomplete]="autoStack"
                                   placeholder="e.g., After brushing teeth">
                            <mat-autocomplete #autoStack="matAutocomplete" panelClass="soft-datepicker">
                                @for (event of filteredStackingEvents(); track event) {
                                    <mat-option [value]="event">
                                        <span class="flex items-center gap-2">
                                            <span class="material-symbols-outlined text-base text-orange-500">link</span>
                                            {{ event }}
                                        </span>
                                    </mat-option>
                                }
                            </mat-autocomplete>
                        </mat-form-field>
                    </div>

                    <!-- Category -->
                    <div class="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl p-3 md:p-6 border border-taupe/10 shadow-sm">
                        <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-taupe mb-2 md:mb-4">Protocol Category</label>
                        <div class="grid grid-cols-2 gap-3 md:gap-4">
                            <button type="button" (click)="setCategory('protocol')"
                                    class="p-3 md:p-5 rounded-xl border-2 flex flex-col items-center text-center gap-1 md:gap-2 transition-all"
                                    [class.border-sage]="habitCategory() === 'protocol'"
                                    [class.bg-sage/10]="habitCategory() === 'protocol'"
                                    [class.border-taupe/30]="habitCategory() !== 'protocol'">
                                <span class="material-symbols-outlined text-2xl md:text-3xl" [class.text-sage]="habitCategory() === 'protocol'" [class.text-taupe]="habitCategory() !== 'protocol'">verified</span>
                                <span class="font-bold text-charcoal text-xs md:text-sm">Protocol</span>
                                <span class="text-[10px] md:text-xs text-taupe">Positive habit</span>
                            </button>
                            <button type="button" (click)="setCategory('bad_habit')"
                                    class="p-3 md:p-5 rounded-xl border-2 flex flex-col items-center text-center gap-1 md:gap-2 transition-all"
                                    [class.border-orange-500]="habitCategory() === 'bad_habit'"
                                    [class.bg-orange-500/10]="habitCategory() === 'bad_habit'"
                                    [class.border-taupe/30]="habitCategory() !== 'bad_habit'">
                                <span class="material-symbols-outlined text-2xl md:text-3xl" [class.text-orange-500]="habitCategory() === 'bad_habit'" [class.text-taupe]="habitCategory() !== 'bad_habit'">block</span>
                                <span class="font-bold text-charcoal text-xs md:text-sm">Bad Habit</span>
                                <span class="text-[10px] md:text-xs text-taupe">Break negative</span>
                            </button>
                        </div>
                    </div>

                    <!-- Priority -->
                    <div class="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl p-3 md:p-6 border border-taupe/10 shadow-sm">
                        <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-taupe mb-2 md:mb-4">Priority & Enforcement</label>
                        <div class="grid grid-cols-3 gap-2 md:gap-3">
                            @for (p of priorityOptions; track p.value) {
                                <button type="button" (click)="habitPriority.set(p.value)"
                                        class="py-2.5 md:py-3 rounded-xl border-2 text-[11px] md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2"
                                        [class]="getPriorityClass(p.value)">
                                    <span class="material-symbols-outlined text-sm md:text-base">{{ p.icon }}</span>
                                    {{ p.label }}
                                </button>
                            }
                        </div>
                        @if (habitPriority() === 'high') {
                            <div class="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-2">
                                <span class="material-symbols-outlined text-orange-500 text-sm">warning</span>
                                <p class="text-xs text-orange-700 font-medium"><strong>Forced Consistency Active:</strong> Failure to complete high-priority protocols results in severe streak penalties.</p>
                            </div>
                        }
                    </div>

                    <!-- Micro-Habits Builder -->
                    <div class="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl p-3 md:p-6 border border-taupe/10 shadow-sm">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wider text-taupe">Micro-Habits (Steps)</label>
                            <button type="button" (click)="showSubtaskForm.set(!showSubtaskForm())"
                                    class="text-[9px] md:text-xs px-3 py-1 bg-sage text-white rounded-full font-bold hover:bg-sage/90 transition-colors flex items-center gap-1 shadow-gentle">
                                <span class="material-symbols-outlined text-xs md:text-sm">add</span>
                                Add Step
                            </button>
                        </div>
                        <p class="text-xs text-taupe/80 mb-6">Break down your main protocol into actionable micro-steps.</p>

                        @if (showSubtaskForm()) {
                            <div class="bg-sand/10 dark:bg-white/5 border border-taupe/20 rounded-xl p-5 mb-6 animate-fade-in">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <mat-form-field appearance="outline" class="w-full soft-input">
                                        <mat-label>Step Name</mat-label>
                                        <input matInput [(ngModel)]="newSubtask.name" [ngModelOptions]="{standalone: true}" placeholder="e.g., Preset coffee machine">
                                    </mat-form-field>
                                    <mat-form-field appearance="outline" class="w-full soft-input">
                                        <mat-label>Context (Optional)</mat-label>
                                        <input matInput [(ngModel)]="newSubtask.description" [ngModelOptions]="{standalone: true}" placeholder="Short detail...">
                                    </mat-form-field>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <mat-form-field appearance="outline" class="w-full soft-input">
                                        <mat-label>Priority</mat-label>
                                        <mat-select [(ngModel)]="newSubtask.priority" [ngModelOptions]="{standalone: true}">
                                            <mat-option value="low">Low</mat-option>
                                            <mat-option value="medium">Medium</mat-option>
                                            <mat-option value="high">High</mat-option>
                                        </mat-select>
                                    </mat-form-field>

                                    <mat-form-field appearance="outline" class="w-full soft-input">
                                        <mat-label>Start Time</mat-label>
                                        <input matInput [(ngModel)]="newSubtask.executionWindowStart" 
                                               [ngModelOptions]="{standalone: true}"
                                               [matTimepicker]="subStartPicker" placeholder="09:00 AM">
                                        <mat-timepicker-toggle matSuffix [for]="subStartPicker"></mat-timepicker-toggle>
                                        <mat-timepicker #subStartPicker panelClass="soft-datepicker"></mat-timepicker>
                                    </mat-form-field>

                                    <mat-form-field appearance="outline" class="w-full soft-input">
                                        <mat-label>Reminder (Mins Prior)</mat-label>
                                        <input matInput type="number" [(ngModel)]="newSubtask.reminderOffsetMinutes" [ngModelOptions]="{standalone: true}" placeholder="30">
                                    </mat-form-field>
                                </div>
                                <div class="flex gap-3 justify-end">
                                    <button type="button" (click)="showSubtaskForm.set(false)" class="text-sm font-bold text-taupe hover:text-charcoal px-4 py-2">Cancel</button>
                                    <button type="button" (click)="addSubtask()" [disabled]="!newSubtask.name"
                                            class="px-6 py-2 bg-charcoal text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-charcoal/90 transition-all shadow-gentle">
                                        Save Step
                                    </button>
                                </div>
                            </div>
                        }

                        @if (subtasks().length > 0) {
                            <div class="space-y-3">
                                @for (s of subtasks(); track s.name) {
                                    <div class="flex items-center justify-between p-4 bg-white border rounded-2xl border-taupe/20 shadow-sm hover:shadow-gentle transition-all"
                                         [class.border-orange-500/30]="s.priority === 'high'">
                                        <div class="flex items-center gap-4">
                                            <div class="w-2.5 h-2.5 rounded-full"
                                                  [class.bg-sage]="s.priority === 'low'"
                                                  [class.bg-amber-500]="s.priority === 'medium'"
                                                  [class.bg-orange-500]="s.priority === 'high'"></div>
                                            <div>
                                                <p class="text-sm font-bold text-charcoal">{{ s.name }}</p>
                                                <p class="text-[10px] uppercase tracking-wider text-taupe font-bold">
                                                    {{ s.priority }} priority
                                                    @if (s.executionWindowStart) { · {{ s.executionWindowStart }} }
                                                    @if (s.reminderOffsetMinutes) { · {{ s.reminderOffsetMinutes }}m reminder }
                                                </p>
                                            </div>
                                        </div>
                                        <button type="button" (click)="removeSubtask(s)" class="w-8 h-8 rounded-full flex items-center justify-center text-taupe hover:bg-red-50 hover:text-red-500 transition-all">
                                            <span class="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </div>
                                }
                            </div>
                        } @else {
                            <div class="text-center py-8 border-2 border-dashed border-taupe/10 rounded-2xl">
                                <span class="material-symbols-outlined text-4xl text-taupe/20 block mb-2">list_alt</span>
                                <p class="text-xs text-taupe/50 font-bold uppercase tracking-widest">No steps added</p>
                            </div>
                        }
                    </div>

                    <!-- Sobriety / Avoidance Tracker (for bad_habit) -->
                    @if (habitCategory() === 'bad_habit') {
                        <div class="bg-charcoal/5 rounded-xl md:rounded-2xl p-3 md:p-6 border border-charcoal/10">
                            <div class="flex items-center justify-between mb-2 md:mb-4">
                                <div class="flex items-center gap-2 md:gap-3">
                                    <div class="w-7 h-7 md:w-10 md:h-10 rounded-full bg-charcoal/10 flex items-center justify-center">
                                        <span class="material-symbols-outlined text-charcoal text-base md:text-xl">timer</span>
                                    </div>
                                    <div>
                                        <h3 class="font-heading text-xs md:text-base font-bold text-charcoal leading-tight">Sobriety Countdown</h3>
                                        <p class="text-[9px] md:text-xs text-taupe">Track avoidance time</p>
                                    </div>
                                </div>
                                <button type="button" 
                                        (click)="isSoberTrackerActive.set(!isSoberTrackerActive())"
                                        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                                        [class.bg-orange-500]="isSoberTrackerActive()"
                                        [class.bg-taupe/30]="!isSoberTrackerActive()">
                                    <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                                          [class.translate-x-5]="isSoberTrackerActive()"
                                          [class.translate-x-0]="!isSoberTrackerActive()"></span>
                                </button>
                            </div>
                            
                            @if (isSoberTrackerActive()) {
                                <div class="mt-6 p-4 bg-white/50 rounded-xl border border-taupe/10 animate-fade-in">
                                    <p class="text-xs text-taupe mb-4">Activating this will start a high-precision countdown from the moment you save. If you engage with this bad habit, you'll need to manually reset the timer in the details view.</p>
                                    <div class="flex items-center gap-2 p-3 bg-orange-500/5 rounded-lg border border-orange-500/20">
                                        <span class="material-symbols-outlined text-orange-500 text-sm">auto_mode</span>
                                        <span class="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Active Monitoring Protocol Ready</span>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                </div>
            }

            <!-- Actions -->
            <div class="flex flex-col-reverse md:flex-row gap-3 pt-4 md:pt-6 border-t border-taupe/30">
                <button type="button" (click)="goBack()" class="flex-1 py-3 md:py-4 border-2 border-taupe text-taupe font-bold uppercase tracking-wider hover:bg-sand hover:border-charcoal transition-colors rounded-lg text-xs md:text-sm">
                    Cancel
                </button>
                <button type="submit" [disabled]="habitForm.invalid" class="flex-[2] py-3 md:py-4 bg-primary text-white font-bold uppercase tracking-wider border-2 border-transparent hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg shadow-gentle text-xs md:text-sm">
                    {{ isEditMode() ? 'Update Habit' : 'Save Habit' }}
                </button>
            </div>
        </form>
    </div>
    `,
    styles: [`
    :host { display: block; }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fadeIn 0.4s ease-out forwards;
    }

    .no-label-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
    }

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
        border-right: none !important;
        transition: border-color 0.3s ease !important;
    }
    
    ::ng-deep .soft-input .mdc-notched-outline__trailing {
        border-top-right-radius: 0.75rem !important;
        border-bottom-right-radius: 0.75rem !important;
        border-top-color: var(--color-taupe) !important;
        border-bottom-color: var(--color-taupe) !important;
        border-right-color: var(--color-taupe) !important;
        border-left: none !important;
        transition: border-color 0.3s ease !important;
    }
    
    ::ng-deep .soft-input .mdc-notched-outline__notch {
        border-bottom-color: var(--color-taupe) !important;
        border-left: none !important;
        border-right: none !important;
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

    /* mat-select styling */
    ::ng-deep .soft-input .mat-mdc-select {
        font-family: var(--font-body), sans-serif !important;
        color: var(--color-charcoal) !important;
        padding: 12px 0 !important;
    }

    ::ng-deep .soft-input .mat-mdc-select-value {
        color: var(--color-charcoal) !important;
    }

    ::ng-deep .soft-input .mat-mdc-select-arrow svg {
        fill: var(--color-taupe) !important;
    }

    ::ng-deep .soft-input.mat-focused .mat-mdc-select-arrow svg {
        fill: var(--color-primary) !important;
    }

    ::ng-deep .mat-mdc-option .mdc-list-item__primary-text {
        font-family: var(--font-body), sans-serif !important;
        color: var(--color-charcoal) !important;
    }

    ::ng-deep .mat-mdc-select-panel {
        background-color: var(--color-alabaster) !important;
        border: 1px solid var(--color-taupe) !important;
        border-radius: 0.75rem !important;
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

    /* Dark mode mat-select */
    :host-context(.dark) .soft-input .mat-mdc-select-value {
        color: #fcfaf8 !important;
    }

    :host-context(.dark) .soft-input .mat-mdc-select-arrow svg {
        fill: #9a9086 !important;
    }

    :host-context(.dark) .mat-mdc-select-panel {
        background-color: #1a1a1a !important;
        border-color: #666 !important;
    }

    :host-context(.dark) .mat-mdc-option .mdc-list-item__primary-text {
        color: #fcfaf8 !important;
    }

    :host-context(.dark) .mat-mdc-option:hover {
        background-color: #333 !important;
    }
    
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddHabitComponent implements OnInit {
    private fb = inject(FormBuilder);
    private habitService = inject(HabitService);
    private toastService = inject(ToastService);
    private router = inject(Router);
    private location = inject(Location);
    private route = inject(ActivatedRoute);

    isEditMode = signal(false);
    habitId = signal<string | null>(null);

    frequency = signal<FrequencyType>('Daily');
    selectedDays = signal<number[]>([1, 2, 3, 4, 5]);

    unitOptions = signal([
        'Liters', 'Milliliters', 'Glasses', 'Cups', 'Hours', 'Minutes', 'Seconds', 
        'Pages', 'Words', 'Steps', 'Kilometers', 'Miles', 'Meters', 'Calories', 
        'Portions', 'Tasks', 'Repetitions', 'Sets', 'Percent', 'Times', 'Chapters'
    ]);

    stackingEvents = [
        'After waking up',
        'After brushing teeth',
        'Before breakfast',
        'After breakfast',
        'After lunch',
        'After work/school',
        'Before dinner',
        'After dinner',
        'Before bed'
    ];

    daysOfWeek = [
        { label: 'MON', value: 1 }, { label: 'TUE', value: 2 }, { label: 'WED', value: 3 },
        { label: 'THU', value: 4 }, { label: 'FRI', value: 5 }, { label: 'SAT', value: 6 },
        { label: 'SUN', value: 0 },
    ];

    habitForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        type: ['yes_no'],
        targetValue: [1],
        targetUnit: [''],
        targetComparator: ['>='],
        frequencyType: ['daily'],
        frequencyInterval: [1],
        frequencyCount: [1],
        frequencyPeriod: [7],
        startDate: [this.getDefaultStartDate(), Validators.required],
        endDate: [this.getDefaultEndDate(), Validators.required],
        timeBlockStart: [this.getDefaultStartTime()],
        timeBlockEnd: [this.getDefaultEndTime()],
        stackedWith: ['']
    });

    habitType = signal<string>('yes_no');
    frequencyType = signal<string>('daily');
    habitCategory = signal<HabitCategory>('protocol');
    habitPriority = signal<PriorityLevel>('medium');
    color = signal<string>('#10b981');
    showTimeBlock = signal(false);
    showAdvancedOptions = signal(false);
    isSoberTrackerActive = signal(false);
    isEndless = signal(false);
    loadedHabit: Habit | null = null;

    // Subtask builder
    showSubtaskForm = signal(false);
    subtasks = signal<Partial<MicroHabit>[]>([]);
    newSubtask: Partial<MicroHabit> & { name: string } = { name: '', priority: 'medium', executionWindowStart: this.getDefaultStartTime() as any };

    priorityOptions = [
        { value: 'low' as PriorityLevel, label: 'Low', icon: 'arrow_downward' },
        { value: 'medium' as PriorityLevel, label: 'Medium', icon: 'drag_handle' },
        { value: 'high' as PriorityLevel, label: 'High', icon: 'priority_high' },
    ];

    presetColors = ['#10b981', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#64748b'];

    targetUnitValue = toSignal(this.habitForm.get('targetUnit')!.valueChanges.pipe(startWith('')));
    filteredUnits = computed(() => {
        const val = (this.targetUnitValue() || '').toLowerCase();
        return this.unitOptions().filter(u => u.toLowerCase().includes(val));
    });

    stackedWithValue = toSignal(this.habitForm.get('stackedWith')!.valueChanges.pipe(startWith('')));
    filteredStackingEvents = computed(() => {
        const val = (this.stackedWithValue() || '').toLowerCase();
        return this.stackingEvents.filter(e => e.toLowerCase().includes(val));
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
                        timeBlockEnd: habit.timeBlockEnd ? this.timeStringToDate(habit.timeBlockEnd) : null,
                        stackedWith: habit.stackedWith || ''
                    } as any, { emitEvent: false });

                    if (habit.timeBlockStart || habit.timeBlockEnd) {
                        this.showTimeBlock.set(true);
                    }

                    this.habitType.set(habit.type || 'yes_no');
                    this.frequencyType.set(habit.frequencyType || 'daily');
                    this.updateValidators();
                    this.selectedDays.set(habit.weekdays || []);
                    this.color.set(habit.color || '#ec5b13');
                    this.loadedHabit = habit;
                    if (habit.soberStartDate) {
                        this.isSoberTrackerActive.set(true);
                    }
                    if (!habit.endDate) {
                        this.isEndless.set(true);
                    }
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

    toggleEndless() {
        this.isEndless.update(v => !v);
        this.updateValidators();
    }

    setHabitType(type: string) {
        this.habitType.set(type);
        this.habitForm.patchValue({ type });
        this.updateValidators();
    }

    private updateValidators() {
        const type = this.habitType();
        const targetValue = this.habitForm.get('targetValue');
        const targetUnit = this.habitForm.get('targetUnit');
        const frequencyInterval = this.habitForm.get('frequencyInterval');
        
        if (type === 'measurable') {
            targetValue?.setValidators([Validators.required, Validators.min(1)]);
            targetUnit?.setValidators([Validators.required]);
        } else {
            targetValue?.clearValidators();
            targetUnit?.clearValidators();
        }

        if (this.frequencyType() === 'interval') {
            frequencyInterval?.setValidators([Validators.required, Validators.min(1)]);
        } else {
            frequencyInterval?.clearValidators();
        }

        const endDate = this.habitForm.get('endDate');
        if (this.isEndless()) {
            endDate?.clearValidators();
            endDate?.setValue(null);
        } else {
            endDate?.setValidators([Validators.required]);
            if (!endDate?.value) {
                endDate?.setValue(this.getDefaultEndDate());
            }
        }
        
        targetValue?.updateValueAndValidity();
        targetUnit?.updateValueAndValidity();
        frequencyInterval?.updateValueAndValidity();
        endDate?.updateValueAndValidity();
        this.habitForm.updateValueAndValidity();
    }

    setFrequencyType(type: string) {
        this.frequencyType.set(type);
        this.habitForm.patchValue({ frequencyType: type });
        this.updateValidators();
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
                endDate: this.isEndless() ? undefined : this.dateToString(formVal.endDate as any),
                timeBlockStart: this.showTimeBlock() ? this.timeToString(formVal.timeBlockStart as any) : undefined,
                timeBlockEnd: this.showTimeBlock() ? this.timeToString(formVal.timeBlockEnd as any) : undefined,

                icon: 'star',
                color: this.color(),
                category: this.habitCategory(),
                priority: this.habitPriority(),
                subtasks: this.subtasks() as any,
                soberStartDate: this.isSoberTrackerActive() 
                    ? (this.isEditMode() ? (this.loadedHabit?.soberStartDate || new Date().toISOString()) : new Date().toISOString()) 
                    : undefined,
                stackedWith: formVal.stackedWith || undefined,
                stackDuration: formVal.stackedWith ? 21 : undefined,
                stackStartDate: formVal.stackedWith ? this.dateToString(new Date()) : undefined
            };

            const obs$ = (this.isEditMode() && this.habitId())
                ? this.habitService.updateHabit(this.habitId()!, habitData as any)
                : this.habitService.addHabit(habitData as any);

            obs$.subscribe({
                next: () => {
                    this.toastService.success(`Habit ${this.isEditMode() ? 'updated' : 'created'} successfully!`);
                    this.router.navigate(['/']);
                },
                error: (error) => {
                    console.error('Error saving habit:', error);
                    this.toastService.error('Failed to save habit. Please try again.');
                }
            });
        }
    }

    goBack() {
        this.location.back();
    }

    setCategory(cat: HabitCategory) {
        this.habitCategory.set(cat);
    }

    getPriorityClass(p: PriorityLevel): string {
        const sel = this.habitPriority() === p;
        if (p === 'low') return sel ? 'border-sage bg-sage/10 text-sage' : 'border-taupe/30 text-taupe';
        if (p === 'medium') return sel ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-taupe/30 text-taupe';
        return sel ? 'border-orange-500 bg-orange-500/10 text-orange-600' : 'border-taupe/30 text-taupe';
    }

    addSubtask() {
        if (!this.newSubtask.name) return;
        const taskToAdd = { ...this.newSubtask };
        
        // Convert Date object from timepicker back to HH:mm string for storage
        if (taskToAdd.executionWindowStart && (taskToAdd.executionWindowStart as any) instanceof Date) {
            taskToAdd.executionWindowStart = this.timeToString(taskToAdd.executionWindowStart as any);
        }
        
        this.subtasks.update(s => [...s, taskToAdd]);
        this.newSubtask = { name: '', priority: 'medium', executionWindowStart: this.getDefaultStartTime() as any };
        this.showSubtaskForm.set(false);
    }

    removeSubtask(subtask: Partial<MicroHabit>) {
        this.subtasks.update(s => s.filter(x => x !== subtask));
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
