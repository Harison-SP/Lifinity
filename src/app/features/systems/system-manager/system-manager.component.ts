import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemService } from '../../../services/system.service';
import { LearningSystem, SystemItem, InstantiateResult } from '../../../models/system.model';
import * as XLSX from 'xlsx';
import { MatIconModule } from '@angular/material/icon';
import { HabitService } from '../../../services/habit.service';
import { Habit } from '../../../models/habit.model';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

interface WeekNode {
  weekNum: number;
  focus: string;
  goal: string;
  outcome: string;
  items: SystemItem[];
  isExpanded: boolean;
  time_block_start: string | null;
  time_block_end: string | null;
}

interface PhaseNode {
  name: string;
  objective: string;
  weeks: WeekNode[];
  isExpanded: boolean;
}

interface PresetTask {
  day: number;
  title: string;
  description: string;
}

interface PresetWeek {
  focus: string;
  goal: string;
  outcome: string;
  tasks: PresetTask[];
}

interface PresetPhase {
  name: string;
  objective: string;
  weeks: PresetWeek[];
}

interface SystemPreset {
  id: string;
  label: string;
  description: string;
  category: string;
  tags: string[];
  phases: PresetPhase[];
}

const SYSTEM_PRESETS: SystemPreset[] = [
  {
    id: 'skill-bootcamp',
    label: 'Skill Bootcamp',
    description: 'Learn -> Practice -> Project in a structured flow.',
    category: 'Learning',
    tags: ['learning', 'practice', 'project'],
    phases: [
      {
        name: 'Foundation',
        objective: 'Build fundamentals and base confidence.',
        weeks: [
          {
            focus: 'Core concepts',
            goal: 'Understand essentials and setup workflow.',
            outcome: 'Can explain basics and execute guided tasks.',
            tasks: [
              { day: 1, title: 'Read fundamentals', description: 'Cover terminology and first principles.' },
              { day: 2, title: 'Guided walkthrough', description: 'Replicate one complete example.' },
              { day: 3, title: 'Summary notes', description: 'Write key learnings and open questions.' }
            ]
          },
          {
            focus: 'Repetition',
            goal: 'Convert understanding into routine action.',
            outcome: 'Can solve small tasks without external help.',
            tasks: [
              { day: 1, title: 'Practice drills', description: 'Complete 3 focused exercises.' },
              { day: 2, title: 'Fix common mistakes', description: 'Document 3 errors and corrections.' },
              { day: 3, title: 'Checkpoint', description: 'Run a mini self-test and review.' }
            ]
          }
        ]
      },
      {
        name: 'Application',
        objective: 'Turn learning into output.',
        weeks: [
          {
            focus: 'Mini project',
            goal: 'Deliver a small but complete project.',
            outcome: 'A real artifact that proves progress.',
            tasks: [
              { day: 1, title: 'Project scope', description: 'Define clear scope and acceptance criteria.' },
              { day: 2, title: 'Build v1', description: 'Implement the first shippable version.' },
              { day: 3, title: 'Review and improve', description: 'Fix issues and note lessons learned.' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'project-delivery',
    label: 'Project Delivery',
    description: 'From planning to shipping with clear milestones.',
    category: 'Execution',
    tags: ['project', 'delivery', 'execution'],
    phases: [
      {
        name: 'Plan',
        objective: 'Clarify scope, timeline, risks.',
        weeks: [
          {
            focus: 'Scope and milestones',
            goal: 'Build a realistic delivery plan.',
            outcome: 'Prioritized roadmap and defined milestones.',
            tasks: [
              { day: 1, title: 'Write project brief', description: 'Define goals, constraints, success metrics.' },
              { day: 2, title: 'Break into milestones', description: 'Split work into logical deliverables.' },
              { day: 3, title: 'Risk review', description: 'List blockers and fallback plan.' }
            ]
          }
        ]
      },
      {
        name: 'Ship',
        objective: 'Execute with consistency.',
        weeks: [
          {
            focus: 'Build and review',
            goal: 'Deliver value each cycle.',
            outcome: 'Shippable increments and regular feedback.',
            tasks: [
              { day: 1, title: 'Build sprint output', description: 'Complete the highest-priority slice.' },
              { day: 2, title: 'Gather feedback', description: 'Review with stakeholder/peer.' },
              { day: 3, title: 'Retrospective', description: 'Capture wins, misses, and next actions.' }
            ]
          }
        ]
      }
    ]
  }
];

@Component({
  selector: 'app-system-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTimepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
  ],
  template: `
    <div class="h-full overflow-y-auto overflow-x-hidden bg-concrete-100 dark:bg-concrete-950 p-3 sm:p-4 md:p-6 font-manrope custom-scrollbar">
      <div class="mx-auto flex h-full max-w-[1700px] flex-col gap-6">

        <section class="rigid-border border-[4px] border-black dark:border-concrete-100 bg-white dark:bg-concrete-900 p-5 md:p-6 brutalist-shadow-lg">
          <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-3xl">
              <p class="mb-2 inline-flex items-center gap-2 bg-yellow-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                <span class="material-symbols-outlined text-sm">tune</span>
                System Studio
              </p>
              <h2 class="font-arvo text-3xl font-black uppercase text-black dark:text-white md:text-4xl">
                Build clearer protocol systems
              </h2>
              <p class="mt-3 max-w-2xl text-sm font-mono text-concrete-600 dark:text-concrete-300">
                1) Define metadata, 2) build phase-week-task structure, 3) launch to planner.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:w-[540px]">
              <div class="border-2 border-black dark:border-concrete-200 bg-concrete-50 dark:bg-concrete-800 p-3">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Systems</p>
                <p class="mt-2 text-3xl font-black text-black dark:text-white">{{ systems().length }}</p>
              </div>
              <div class="border-2 border-black dark:border-concrete-200 bg-concrete-50 dark:bg-concrete-800 p-3">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Phases</p>
                <p class="mt-2 text-3xl font-black text-black dark:text-white">{{ getMetrics().phases }}</p>
              </div>
              <div class="border-2 border-black dark:border-concrete-200 bg-concrete-50 dark:bg-concrete-800 p-3">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Weeks</p>
                <p class="mt-2 text-3xl font-black text-black dark:text-white">{{ getMetrics().weeks }}</p>
              </div>
              <div class="border-2 border-black dark:border-concrete-200 bg-black dark:bg-concrete-100 p-3 text-white dark:text-black">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Tasks</p>
                <p class="mt-2 text-3xl font-black">{{ getMetrics().tasks }}</p>
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              (click)="createNewSystem()"
              class="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-electric-red transition-colors">
              <span class="material-symbols-outlined text-sm">add</span>
              New System
            </button>
            <button
              (click)="showHelp.set(true)"
              class="inline-flex items-center gap-2 border-2 border-black bg-concrete-200 dark:bg-concrete-800 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black dark:text-white hover:bg-concrete-300 dark:hover:bg-concrete-700 transition-colors">
              <span class="material-symbols-outlined text-sm">help</span>
              Workflow
            </button>
            <label
              class="inline-flex cursor-pointer items-center gap-2 border-2 border-black bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black hover:bg-yellow-400 transition-colors">
              <span class="material-symbols-outlined text-sm">upload_file</span>
              Import Excel
              <input type="file" class="hidden" (change)="onFileChange($event)" accept=".xlsx,.xls,.csv" />
            </label>
            <button
              (click)="isPasting.set(true)"
              class="inline-flex items-center gap-2 border-2 border-black bg-white dark:bg-concrete-900 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black dark:text-white hover:bg-concrete-100 dark:hover:bg-concrete-800 transition-colors">
              <span class="material-symbols-outlined text-sm">content_paste</span>
              Paste CSV
            </button>
            <button
              (click)="isGeneratingAI.set(true)"
              class="inline-flex items-center gap-2 border-2 border-black bg-green-500 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black transition-colors">
              <span class="material-symbols-outlined text-sm">auto_awesome</span>
              AI Generate
            </button>
          </div>
        </section>

        <div class="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-12">

          <aside class="xl:col-span-3 min-h-0">
            <div class="flex h-full min-h-[720px] flex-col gap-4 rigid-border border-[4px] border-black dark:border-concrete-100 bg-white dark:bg-concrete-900 p-4 brutalist-shadow-lg">
              <div class="border-b-4 border-black dark:border-concrete-100 pb-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Library</p>
                <h3 class="font-arvo text-xl font-black uppercase text-black dark:text-white">Systems</h3>
                <div class="mt-3 space-y-3">
                  <input
                    [(ngModel)]="systemSearch"
                    placeholder="Search title/category/tag"
                    class="w-full border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none focus:border-electric-red dark:text-white" />
                  <select
                    [(ngModel)]="categoryFilter"
                    class="w-full border-2 border-black dark:border-concrete-300 bg-white dark:bg-concrete-800 px-3 py-2 text-xs font-black uppercase outline-none dark:text-white">
                    <option value="All">All categories</option>
                    @for (category of availableCategories(); track category) {
                      <option [value]="category">{{ category }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="space-y-3 overflow-y-auto custom-scrollbar pr-1">
                @for (system of filteredSystems(); track system.id ?? system.title) {
                  <button
                    (click)="selectSystem(system)"
                    class="block w-full border-2 p-3 text-left transition-colors"
                    [class.border-black]="selectedSystem()?.id === system.id"
                    [class.bg-black]="selectedSystem()?.id === system.id"
                    [class.text-white]="selectedSystem()?.id === system.id"
                    [class.border-concrete-300]="selectedSystem()?.id !== system.id"
                    [class.bg-concrete-50]="selectedSystem()?.id !== system.id"
                    [class.dark:border-concrete-700]="selectedSystem()?.id !== system.id"
                    [class.dark:bg-concrete-800]="selectedSystem()?.id !== system.id"
                    [class.dark:text-white]="selectedSystem()?.id !== system.id">
                    <p class="text-sm font-black uppercase truncate">{{ system.title }}</p>
                    <div class="mt-2 flex items-center justify-between text-[10px] font-bold uppercase opacity-80">
                      <span>{{ system.category || 'General' }}</span>
                      <span>{{ system.items.length }} tasks</span>
                    </div>
                  </button>
                } @empty {
                  <div class="border-2 border-dashed border-concrete-300 dark:border-concrete-700 p-4 text-center text-xs font-black uppercase text-concrete-500 dark:text-concrete-400">
                    No systems found
                  </div>
                }
              </div>

              <div class="border-t-4 border-black dark:border-concrete-100 pt-4">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500 mb-2">Starter Presets</p>
                <div class="space-y-2">
                  @for (preset of presets; track preset.id) {
                    <button
                      (click)="applyPreset(preset.id)"
                      class="w-full border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 text-left p-3 hover:bg-yellow-100 dark:hover:bg-concrete-700 transition-colors">
                      <p class="text-xs font-black uppercase dark:text-white">{{ preset.label }}</p>
                      <p class="mt-1 text-[11px] font-medium text-concrete-600 dark:text-concrete-300">{{ preset.description }}</p>
                    </button>
                  }
                </div>
              </div>
            </div>
          </aside>

          <main class="xl:col-span-9 min-h-0">
            @if (selectedSystem() || isCreating()) {
              <div class="flex h-full min-h-[720px] flex-col gap-4">

                <section class="rigid-border border-[4px] border-black dark:border-concrete-100 bg-white dark:bg-concrete-900 p-5 brutalist-shadow-lg">
                  <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div class="flex-1">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Step 1 - Define</p>
                      <input
                        [(ngModel)]="editForm.title"
                        placeholder="System title"
                        class="mt-2 w-full bg-transparent font-arvo text-3xl font-black uppercase outline-none dark:text-white md:text-4xl" />
                      <textarea
                        [(ngModel)]="editForm.description"
                        rows="3"
                        placeholder="Describe intent and expected result."
                        class="mt-3 w-full resize-none border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-3 text-sm font-medium outline-none focus:border-electric-red dark:text-white"></textarea>
                    </div>

                    <div class="grid w-full sm:w-auto sm:min-w-[260px] grid-cols-2 gap-3">
                      <div class="border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Readiness</p>
                        <p class="mt-2 text-3xl font-black text-black dark:text-white">{{ readinessScore() }}%</p>
                      </div>
                      <div class="border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Issues</p>
                        <p class="mt-2 text-3xl font-black text-black dark:text-white">{{ getValidationIssues().length }}</p>
                      </div>
                      <button
                        (click)="saveSystem()"
                        class="inline-flex items-center justify-center gap-2 border-2 border-black bg-green-500 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black transition-colors">
                        <span class="material-symbols-outlined text-sm">save</span>
                        Save
                      </button>
                      <button
                        (click)="deleteSystem()"
                        [disabled]="!selectedSystem()?.id"
                        class="inline-flex items-center justify-center gap-2 border-2 border-black bg-red-500 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <span class="material-symbols-outlined text-sm">delete</span>
                        Delete
                      </button>
                    </div>
                  </div>

                  <div class="mt-4 grid gap-4 lg:grid-cols-3">
                    <div>
                      <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Category</label>
                      <input
                        [(ngModel)]="editForm.category"
                        list="category-list"
                        class="w-full border-2 border-black dark:border-concrete-300 bg-white dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none focus:border-electric-red dark:text-white" />
                      <datalist id="category-list">
                        @for (cat of availableCategories(); track cat) {
                          <option [value]="cat"></option>
                        }
                      </datalist>
                    </div>
                    <div class="lg:col-span-2">
                      <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Tags (comma separated)</label>
                      <input
                        [(ngModel)]="tagsInput"
                        (blur)="syncTagsFromInput()"
                        placeholder="python, interview, backend"
                        class="w-full border-2 border-black dark:border-concrete-300 bg-white dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none focus:border-electric-red dark:text-white" />
                    </div>
                  </div>
                </section>

                <section class="grid gap-4 xl:grid-cols-12">
                  <div class="xl:col-span-8 flex flex-col gap-4">
                    <div class="rigid-border border-[4px] border-black dark:border-concrete-100 bg-white dark:bg-concrete-900 p-5 brutalist-shadow-lg">
                      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b-4 border-black dark:border-concrete-100 pb-4">
                        <div>
                          <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Step 2 - Structure</p>
                          <h3 class="font-arvo text-xl font-black uppercase text-black dark:text-white">Phase / Week / Task Builder</h3>
                        </div>
                        <button
                          (click)="addPhase()"
                          class="inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white hover:bg-concrete-700 transition-colors">
                          <span class="material-symbols-outlined text-sm">add</span>
                          Add Phase
                        </button>
                      </div>

                      <div class="mt-4 space-y-4">
                        @for (phase of hierarchy(); track $index; let phaseIndex = $index) {
                          <div class="border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800">
                            <div class="p-4 border-b-2 border-black dark:border-concrete-300 bg-white dark:bg-concrete-900">
                              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div class="flex-1 space-y-3">
                                  <div class="flex items-center gap-3">
                                    <button
                                      (click)="phase.isExpanded = !phase.isExpanded"
                                      class="h-9 w-9 border-2 border-black dark:border-concrete-300 bg-concrete-100 dark:bg-concrete-800 inline-flex items-center justify-center dark:text-white">
                                      <span class="material-symbols-outlined transition-transform" [class.rotate-90]="phase.isExpanded">chevron_right</span>
                                    </button>
                                    <input
                                      [(ngModel)]="phase.name"
                                      class="flex-1 bg-transparent text-lg font-black uppercase outline-none dark:text-white"
                                      placeholder="Phase name" />
                                    <span class="border-2 border-black dark:border-concrete-300 px-2 py-1 text-[10px] font-black uppercase dark:text-white">
                                      {{ phase.weeks.length }} weeks
                                    </span>
                                  </div>
                                  <textarea
                                    [(ngModel)]="phase.objective"
                                    rows="2"
                                    placeholder="Phase objective"
                                    class="w-full resize-none border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-3 text-sm font-medium outline-none focus:border-electric-red dark:text-white"></textarea>
                                </div>

                                <div class="flex flex-wrap gap-2">
                                  <button
                                    (click)="addWeek(phase)"
                                    class="inline-flex items-center gap-2 border-2 border-black bg-yellow-300 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-black hover:bg-yellow-400 transition-colors">
                                    <span class="material-symbols-outlined text-sm">calendar_add_on</span>
                                    Add Week
                                  </button>
                                  <button
                                    (click)="removePhase(phaseIndex)"
                                    class="inline-flex items-center gap-2 border-2 border-black bg-red-500 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white hover:bg-black transition-colors">
                                    <span class="material-symbols-outlined text-sm">close</span>
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>

                            @if (phase.isExpanded) {
                              <div class="p-4 space-y-4">
                                @for (week of phase.weeks; track $index; let weekIndex = $index) {
                                  <div class="border-2 border-concrete-300 dark:border-concrete-600 bg-white dark:bg-concrete-900 p-4">
                                    <div class="flex flex-col gap-3 border-b border-concrete-300 dark:border-concrete-700 pb-4">
                                      <div class="grid gap-3 md:grid-cols-[80px,1fr,1fr]">
                                        <div>
                                          <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Week</label>
                                          <input
                                            type="number"
                                            [(ngModel)]="week.weekNum"
                                            class="w-full border border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 px-2 py-2 text-sm font-black outline-none dark:text-white" />
                                        </div>
                                        <div>
                                          <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Focus</label>
                                          <input
                                            [(ngModel)]="week.focus"
                                            placeholder="Weekly focus"
                                            class="w-full border border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none dark:text-white" />
                                        </div>
                                        <div>
                                          <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Goal</label>
                                          <input
                                            [(ngModel)]="week.goal"
                                            placeholder="Weekly goal"
                                            class="w-full border border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none dark:text-white" />
                                        </div>
                                      </div>

                                      <textarea
                                        [(ngModel)]="week.outcome"
                                        rows="2"
                                        placeholder="Success criteria for this week"
                                        class="w-full resize-none border border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-3 text-sm font-medium outline-none dark:text-white"></textarea>

                                      <div class="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
                                        <div class="flex items-center gap-2">
                                          <input
                                            [matTimepicker]="weekStartPicker"
                                            [(ngModel)]="week.time_block_start"
                                            placeholder="Start"
                                            class="w-full border border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none dark:text-white" />
                                          <mat-timepicker #weekStartPicker />
                                        </div>
                                        <div class="flex items-center gap-2">
                                          <input
                                            [matTimepicker]="weekEndPicker"
                                            [(ngModel)]="week.time_block_end"
                                            placeholder="End"
                                            class="w-full border border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none dark:text-white" />
                                          <mat-timepicker #weekEndPicker />
                                        </div>
                                        <div class="flex flex-wrap gap-2">
                                          <button
                                            (click)="duplicateWeek(phase, weekIndex)"
                                            class="border-2 border-black bg-concrete-100 dark:bg-concrete-800 dark:border-concrete-300 px-3 py-2 text-[11px] font-black uppercase dark:text-white">
                                            Duplicate
                                          </button>
                                          <button
                                            (click)="removeWeek(phase, weekIndex)"
                                            class="border-2 border-black bg-red-500 px-3 py-2 text-[11px] font-black uppercase text-white">
                                            Remove
                                          </button>
                                        </div>
                                      </div>

                                      <div class="flex flex-wrap gap-2">
                                        <button
                                          (click)="injectTaskBundle(week, 'study')"
                                          class="border-2 border-black px-3 py-2 bg-blue-100 text-[11px] font-black uppercase">
                                          + Study Bundle
                                        </button>
                                        <button
                                          (click)="injectTaskBundle(week, 'project')"
                                          class="border-2 border-black px-3 py-2 bg-green-100 text-[11px] font-black uppercase">
                                          + Project Bundle
                                        </button>
                                        <button
                                          (click)="addTask(week)"
                                          class="border-2 border-black px-3 py-2 bg-black text-white text-[11px] font-black uppercase">
                                          + Task
                                        </button>
                                        <button
                                          (click)="sortWeekTasks(week)"
                                          class="border-2 border-black px-3 py-2 bg-concrete-100 dark:bg-concrete-800 dark:border-concrete-300 text-[11px] font-black uppercase dark:text-white">
                                          Sort Days
                                        </button>
                                      </div>

                                      <div class="rounded-sm border-2 border-dashed border-concrete-300 dark:border-concrete-700 bg-concrete-50 dark:bg-concrete-800 p-3 text-[11px] font-medium text-concrete-600 dark:text-concrete-300">
                                        {{ describeWeek(week) }}
                                      </div>
                                    </div>

                                    <div class="mt-4 space-y-3">
                                      @for (item of week.items; track $index; let taskIndex = $index) {
                                        <div class="border-2 border-concrete-200 dark:border-concrete-700 bg-concrete-50 dark:bg-concrete-800 p-3">
                                          <div class="grid gap-3 lg:grid-cols-[70px,1.2fr,1fr,auto]">
                                            <div>
                                              <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Day</label>
                                              <input
                                                type="number"
                                                [(ngModel)]="item.day_number"
                                                class="w-full border border-black dark:border-concrete-300 bg-white dark:bg-concrete-900 px-2 py-2 text-sm font-black outline-none dark:text-white" />
                                            </div>
                                            <div>
                                              <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Task title</label>
                                              <input
                                                [(ngModel)]="item.title"
                                                placeholder="Task title"
                                                class="w-full border border-black dark:border-concrete-300 bg-white dark:bg-concrete-900 px-3 py-2 text-sm font-bold outline-none dark:text-white" />
                                            </div>
                                            <div>
                                              <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Resource link</label>
                                              <input
                                                [(ngModel)]="item.resource_link"
                                                placeholder="Optional URL"
                                                class="w-full border border-black dark:border-concrete-300 bg-white dark:bg-concrete-900 px-3 py-2 text-sm font-medium outline-none dark:text-white" />
                                            </div>
                                            <div class="flex items-end">
                                              <button
                                                (click)="removeTask(week, taskIndex)"
                                                class="w-full border-2 border-black bg-red-500 px-3 py-2 text-[11px] font-black uppercase text-white">
                                                Remove
                                              </button>
                                            </div>
                                          </div>

                                          <div class="mt-3 grid gap-3 lg:grid-cols-[1.6fr,130px,130px]">
                                            <div>
                                              <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Description</label>
                                              <textarea
                                                [(ngModel)]="item.description"
                                                rows="2"
                                                placeholder="Task description"
                                                class="w-full resize-none border border-black dark:border-concrete-300 bg-white dark:bg-concrete-900 p-3 text-sm font-medium outline-none dark:text-white"></textarea>
                                            </div>
                                            <div>
                                              <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Start</label>
                                              <input
                                                type="time"
                                                [(ngModel)]="item.time_block_start"
                                                class="w-full border border-black dark:border-concrete-300 bg-white dark:bg-concrete-900 px-3 py-2 text-sm font-bold outline-none dark:text-white" />
                                            </div>
                                            <div>
                                              <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">End</label>
                                              <input
                                                type="time"
                                                [(ngModel)]="item.time_block_end"
                                                class="w-full border border-black dark:border-concrete-300 bg-white dark:bg-concrete-900 px-3 py-2 text-sm font-bold outline-none dark:text-white" />
                                            </div>
                                          </div>
                                        </div>
                                      } @empty {
                                        <div class="border-2 border-dashed border-concrete-300 dark:border-concrete-700 p-4 text-center text-xs font-black uppercase text-concrete-500 dark:text-concrete-400">
                                          No tasks in this week
                                        </div>
                                      }
                                    </div>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        } @empty {
                          <div class="border-2 border-dashed border-concrete-300 dark:border-concrete-700 p-8 text-center text-xs font-black uppercase text-concrete-500 dark:text-concrete-400">
                            No phases configured
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="xl:col-span-4 flex flex-col gap-4">

                    <section class="rigid-border border-[4px] border-black dark:border-concrete-100 bg-white dark:bg-concrete-900 p-5 brutalist-shadow-lg">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Health Check</p>
                      <h3 class="mt-2 font-arvo text-xl font-black uppercase text-black dark:text-white">Validation</h3>

                      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-3">
                          <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Timed</p>
                          <p class="mt-2 text-2xl font-black text-black dark:text-white">{{ getMetrics().timed }}</p>
                        </div>
                        <div class="border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-3">
                          <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Resources</p>
                          <p class="mt-2 text-2xl font-black text-black dark:text-white">{{ getMetrics().resources }}</p>
                        </div>
                      </div>

                      <div class="mt-4 space-y-2">
                        @for (issue of getValidationIssues(); track issue) {
                          <div class="border-2 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40 p-3 text-xs font-medium text-red-800 dark:text-red-200">
                            {{ issue }}
                          </div>
                        } @empty {
                          <div class="border-2 border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40 p-3 text-xs font-medium text-green-800 dark:text-green-200">
                            Looks good. Save and launch.
                          </div>
                        }
                      </div>
                    </section>

                    <section class="rigid-border border-[4px] border-black dark:border-concrete-100 bg-white dark:bg-concrete-900 p-5 brutalist-shadow-lg">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-concrete-500">Step 3 - Launch</p>
                      <h3 class="mt-2 font-arvo text-xl font-black uppercase text-black dark:text-white">Instantiate</h3>

                      @if (selectedSystem()?.id) {
                        <div class="mt-4 space-y-3">
                          <div>
                            <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Parent habit</label>
                            <select
                              [(ngModel)]="selectedHabitId"
                              class="w-full border-2 border-black dark:border-concrete-300 bg-white dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none dark:text-white">
                              <option [ngValue]="null">No parent habit</option>
                              @for (habit of habits(); track habit.id) {
                                <option [value]="habit.id">{{ habit.name }}</option>
                              }
                            </select>
                          </div>

                          <div>
                            <label class="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-concrete-500">Start date</label>
                            <input
                              type="date"
                              [(ngModel)]="instantiateDate"
                              class="w-full border-2 border-black dark:border-concrete-300 bg-white dark:bg-concrete-800 px-3 py-2 text-sm font-bold outline-none dark:text-white" />
                          </div>

                          <div class="rounded-sm border-2 border-dashed border-concrete-300 dark:border-concrete-700 bg-concrete-50 dark:bg-concrete-800 p-3 text-[11px] font-medium text-concrete-600 dark:text-concrete-300">
                            {{ launchSummary() }}
                          </div>

                          <button
                            (click)="applySystem()"
                            [disabled]="isRunning() || getValidationIssues().length > 0"
                            class="w-full inline-flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-electric-red transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            <span class="material-symbols-outlined text-sm">{{ isRunning() ? 'hourglass_top' : 'play_arrow' }}</span>
                            {{ isRunning() ? 'Launching...' : 'Launch System' }}
                          </button>

                          @if (lastResult()) {
                            <div class="border-2 border-green-500 bg-green-50 dark:bg-green-950/40 p-3 text-xs font-bold text-green-800 dark:text-green-200">
                              {{ lastResult()!.message }}<br/>
                              Starts: {{ lastResult()!.startDate }} | Tasks: {{ lastResult()!.totalTasks }}
                              @if (lastResult()!.habitName) {
                                <br/>Linked: {{ lastResult()!.habitName }}
                              }
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="mt-4 border-2 border-dashed border-concrete-300 dark:border-concrete-700 p-4 text-sm font-medium text-concrete-500 dark:text-concrete-400">
                          Save this draft first to enable launch.
                        </div>
                      }
                    </section>
                  </div>
                </section>
              </div>
            } @else {
              <div class="flex min-h-[720px] items-center justify-center rigid-border border-[4px] border-dashed border-concrete-300 dark:border-concrete-700 bg-white dark:bg-concrete-900 p-10 text-center brutalist-shadow-lg">
                <div class="max-w-xl">
                  <span class="material-symbols-outlined text-7xl text-concrete-300 dark:text-concrete-600">settings_suggest</span>
                  <p class="mt-4 font-arvo text-3xl font-black uppercase text-concrete-500 dark:text-concrete-200">
                    Select a system or create one
                  </p>
                  <p class="mt-3 text-sm font-mono text-concrete-500 dark:text-concrete-400">
                    Use search, presets, import, or AI generation to start quickly.
                  </p>
                </div>
              </div>
            }
          </main>
        </div>
      </div>
    </div>

    @if (showHelp()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div class="bg-white dark:bg-concrete-900 rigid-border border-[4px] border-black dark:border-concrete-100 p-6 brutalist-shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div class="flex justify-between items-center border-b-4 border-black dark:border-concrete-100 pb-3">
            <h3 class="text-2xl font-black uppercase font-arvo dark:text-white">How to use</h3>
            <button (click)="showHelp.set(false)" class="text-black dark:text-white">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-3 text-xs">
            <div class="border-2 border-black dark:border-concrete-300 p-4 bg-concrete-50 dark:bg-concrete-800 dark:text-white">
              <p class="font-black uppercase mb-2">1. Define</p>
              <p>Add title, category, description, and tags.</p>
            </div>
            <div class="border-2 border-black dark:border-concrete-300 p-4 bg-concrete-50 dark:bg-concrete-800 dark:text-white">
              <p class="font-black uppercase mb-2">2. Structure</p>
              <p>Create phases, weeks, tasks. Use bundles and validation.</p>
            </div>
            <div class="border-2 border-black dark:border-concrete-300 p-4 bg-concrete-50 dark:bg-concrete-800 dark:text-white">
              <p class="font-black uppercase mb-2">3. Launch</p>
              <p>Save then instantiate to a start date and optional parent habit.</p>
            </div>
          </div>

          <div class="mt-4 border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 p-3 text-xs font-medium text-yellow-900 dark:text-yellow-200">
            Import columns: Phase, Week, WeekFocus, Day, Title, Description, StartTime, EndTime
          </div>
        </div>
      </div>
    }

    @if (isPasting()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div class="bg-white dark:bg-concrete-900 rigid-border border-[4px] border-black dark:border-concrete-100 p-6 brutalist-shadow-lg w-full max-w-2xl">
          <div class="flex justify-between items-center border-b-4 border-black dark:border-concrete-100 pb-3">
            <h3 class="text-xl font-black uppercase font-arvo dark:text-white">Paste CSV</h3>
            <button (click)="isPasting.set(false)" class="text-black dark:text-white">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <p class="mt-3 text-[11px] font-mono uppercase text-concrete-500">
            Phase, Week, WeekFocus, Day, Title, Description, StartTime, EndTime
          </p>

          <textarea
            [(ngModel)]="pastedCsv"
            class="w-full h-80 mt-3 p-4 border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 font-mono text-xs outline-none custom-scrollbar dark:text-white"
            placeholder="Phase,Week,WeekFocus,Day,Title,Description,StartTime,EndTime&#10;Phase 1,1,Basics,1,Task 1,Desc,08:00,09:00"></textarea>

          <div class="mt-4 flex justify-end gap-3">
            <button
              (click)="isPasting.set(false)"
              class="px-5 py-2 border-2 border-black dark:border-concrete-300 bg-concrete-200 dark:bg-concrete-800 text-xs font-black uppercase dark:text-white">
              Cancel
            </button>
            <button
              (click)="processPastedCsv()"
              class="px-5 py-2 border-2 border-black bg-purple-500 text-white text-xs font-black uppercase">
              Import
            </button>
          </div>
        </div>
      </div>
    }

    @if (isGeneratingAI()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div class="bg-white dark:bg-concrete-900 rigid-border border-[4px] border-black dark:border-concrete-100 p-6 brutalist-shadow-lg w-full max-w-lg">
          <div class="flex justify-between items-center border-b-4 border-black dark:border-concrete-100 pb-3">
            <h3 class="text-xl font-black uppercase font-arvo dark:text-white">AI Protocol Generator</h3>
            <button (click)="isGeneratingAI.set(false)" [disabled]="isGeneratingAILoading()" class="text-black dark:text-white">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="mt-4 space-y-3">
            <div>
              <label class="text-[10px] font-black uppercase text-concrete-500 block mb-1">Topic / Goal</label>
              <input
                [(ngModel)]="aiTopic"
                [disabled]="isGeneratingAILoading()"
                placeholder="Learn Angular for scalable frontend systems"
                class="w-full border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-2 text-sm font-bold outline-none dark:text-white" />
            </div>
            <div>
              <label class="text-[10px] font-black uppercase text-concrete-500 block mb-1">Duration (weeks)</label>
              <input
                type="number"
                min="1"
                max="12"
                [(ngModel)]="aiWeeks"
                [disabled]="isGeneratingAILoading()"
                class="w-full border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-2 text-sm font-bold outline-none dark:text-white" />
            </div>
            <div>
              <label class="text-[10px] font-black uppercase text-concrete-500 block mb-1">Description / constraints</label>
              <textarea
                [(ngModel)]="aiDescription"
                [disabled]="isGeneratingAILoading()"
                rows="4"
                class="w-full resize-none border-2 border-black dark:border-concrete-300 bg-concrete-50 dark:bg-concrete-800 p-2 text-sm font-medium outline-none dark:text-white"
                placeholder="Include advanced routing, state strategy, and testing."></textarea>
            </div>
          </div>

          <div class="mt-4 flex justify-end gap-3">
            <button
              (click)="isGeneratingAI.set(false)"
              [disabled]="isGeneratingAILoading()"
              class="px-5 py-2 border-2 border-black dark:border-concrete-300 bg-concrete-200 dark:bg-concrete-800 text-xs font-black uppercase dark:text-white disabled:opacity-50">
              Cancel
            </button>
            <button
              (click)="generateWithAI()"
              [disabled]="isGeneratingAILoading() || !aiTopic.trim()"
              class="px-5 py-2 border-2 border-black bg-green-500 text-white text-xs font-black uppercase disabled:opacity-50 inline-flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">{{ isGeneratingAILoading() ? 'hourglass_top' : 'auto_awesome' }}</span>
              {{ isGeneratingAILoading() ? 'Generating...' : 'Generate' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: black; }
    :host-context(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: white; }
  `]
})
export class SystemManagerComponent implements OnInit {
  private systemService = inject(SystemService);
  private habitService = inject(HabitService);

  presets = SYSTEM_PRESETS;

  systems = signal<LearningSystem[]>([]);
  habits = signal<Habit[]>([]);
  selectedSystem = signal<LearningSystem | null>(null);
  isCreating = signal(false);

  instantiateDate = new Date().toISOString().split('T')[0];
  selectedHabitId: string | null = null;
  isRunning = signal(false);
  lastResult = signal<InstantiateResult | null>(null);

  isPasting = signal(false);
  pastedCsv = '';
  showHelp = signal(false);

  isGeneratingAI = signal(false);
  isGeneratingAILoading = signal(false);
  aiTopic = '';
  aiDescription = '';
  aiWeeks = 4;

  systemSearch = '';
  categoryFilter = 'All';
  tagsInput = '';

  editForm: LearningSystem = {
    title: '',
    description: '',
    category: 'General',
    tags: [],
    items: []
  };

  hierarchy = signal<PhaseNode[]>([]);

  ngOnInit() {
    this.loadSystems();
  }

  loadSystems() {
    this.systemService.getSystems().subscribe((systems) => this.systems.set(systems));
    this.habitService.getAllHabits().subscribe((habits) => this.habits.set(habits));
  }

  filteredSystems(): LearningSystem[] {
    const q = this.systemSearch.trim().toLowerCase();
    return this.systems().filter((s) => {
      const category = s.category || 'General';
      const categoryMatch = this.categoryFilter === 'All' || category === this.categoryFilter;
      if (!categoryMatch) return false;
      if (!q) return true;
      const tags = (s.tags || []).join(' ');
      const haystack = `${s.title} ${s.description || ''} ${category} ${tags}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  availableCategories(): string[] {
    const set = new Set<string>();
    this.systems().forEach((s) => set.add(s.category || 'General'));
    if (this.editForm.category?.trim()) set.add(this.editForm.category.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  selectSystem(system: LearningSystem) {
    this.selectedSystem.set(system);
    this.isCreating.set(false);
    this.lastResult.set(null);
    this.editForm = JSON.parse(JSON.stringify(system));
    this.tagsInput = (this.editForm.tags || []).join(', ');
    this.buildHierarchy();
  }

  createNewSystem() {
    this.isCreating.set(true);
    this.selectedSystem.set(null);
    this.lastResult.set(null);
    this.editForm = {
      title: 'New System',
      description: '',
      category: 'General',
      tags: [],
      items: []
    };
    this.tagsInput = '';
    this.hierarchy.set([this.createEmptyPhase(1)]);
  }

  applyPreset(presetId: string) {
    const preset = this.presets.find((p) => p.id === presetId);
    if (!preset) return;

    this.createNewSystem();
    this.editForm.title = preset.label;
    this.editForm.description = preset.description;
    this.editForm.category = preset.category;
    this.editForm.tags = [...preset.tags];
    this.tagsInput = this.editForm.tags.join(', ');

    const nodes: PhaseNode[] = preset.phases.map((phase) => ({
      name: phase.name,
      objective: phase.objective,
      isExpanded: true,
      weeks: phase.weeks.map((week, idx) => ({
        weekNum: idx + 1,
        focus: week.focus,
        goal: week.goal,
        outcome: week.outcome,
        isExpanded: true,
        time_block_start: null,
        time_block_end: null,
        items: week.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          day_number: task.day,
          week_number: idx + 1,
          phase: phase.name,
          week_focus: week.focus,
          resource_link: ''
        }))
      }))
    }));

    this.hierarchy.set(nodes.length ? nodes : [this.createEmptyPhase(1)]);
  }

  buildHierarchy() {
    const nodes: PhaseNode[] = [];
    const items = this.editForm.items || [];

    const phaseMap = new Map<string, SystemItem[]>();
    items.forEach((item) => {
      const phaseName = item.phase || 'Phase 1';
      if (!phaseMap.has(phaseName)) phaseMap.set(phaseName, []);
      phaseMap.get(phaseName)!.push({ ...item });
    });

    phaseMap.forEach((phaseItems, phaseName) => {
      const weekMap = new Map<number, SystemItem[]>();
      phaseItems.forEach((item) => {
        const weekNum = Number(item.week_number) || 1;
        if (!weekMap.has(weekNum)) weekMap.set(weekNum, []);
        weekMap.get(weekNum)!.push({ ...item });
      });

      const weeks: WeekNode[] = Array.from(weekMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([weekNum, wItems]) => {
          const first = wItems[0];
          return {
            weekNum,
            focus: first?.week_focus || `Week ${weekNum}`,
            goal: '',
            outcome: '',
            items: wItems.sort((a, b) => (a.day_number || 0) - (b.day_number || 0)),
            isExpanded: true,
            time_block_start: first?.time_block_start || null,
            time_block_end: first?.time_block_end || null
          };
        });

      nodes.push({
        name: phaseName,
        objective: '',
        weeks,
        isExpanded: true
      });
    });

    this.hierarchy.set(nodes.length ? nodes : [this.createEmptyPhase(1)]);
  }

  flattenHierarchy() {
    const items: SystemItem[] = [];

    this.hierarchy().forEach((phase) => {
      phase.weeks.forEach((week) => {
        week.items.forEach((item) => {
          items.push({
            ...item,
            phase: phase.name.trim() || 'Phase',
            week_number: Number(week.weekNum) || 1,
            week_focus: week.focus.trim() || `Week ${week.weekNum}`,
            time_block_start: item.time_block_start || week.time_block_start || undefined,
            time_block_end: item.time_block_end || week.time_block_end || undefined
          });
        });
      });
    });

    this.editForm.items = items;
  }

  addPhase() {
    const next = this.hierarchy().length + 1;
    this.hierarchy.update((h) => [...h, this.createEmptyPhase(next)]);
  }

  removePhase(index: number) {
    if (!confirm('Remove this phase and all tasks?')) return;
    this.hierarchy.update((h) => h.filter((_, i) => i !== index));
  }

  addWeek(phase: PhaseNode) {
    const nextWeek = phase.weeks.length ? Math.max(...phase.weeks.map((w) => w.weekNum)) + 1 : 1;
    phase.weeks.push({
      weekNum: nextWeek,
      focus: `Week ${nextWeek}`,
      goal: '',
      outcome: '',
      items: [],
      isExpanded: true,
      time_block_start: null,
      time_block_end: null
    });
  }

  duplicateWeek(phase: PhaseNode, weekIndex: number) {
    const source = phase.weeks[weekIndex];
    if (!source) return;
    const nextWeek = phase.weeks.length ? Math.max(...phase.weeks.map((w) => w.weekNum)) + 1 : source.weekNum + 1;
    const clone: WeekNode = {
      ...JSON.parse(JSON.stringify(source)),
      weekNum: nextWeek,
      focus: `${source.focus} (copy)`,
      items: source.items.map((item) => ({ ...item, week_number: nextWeek }))
    };
    phase.weeks.splice(weekIndex + 1, 0, clone);
  }

  removeWeek(phase: PhaseNode, index: number) {
    phase.weeks.splice(index, 1);
  }

  addTask(week: WeekNode) {
    const nextDay = week.items.length ? Math.max(...week.items.map((i) => Number(i.day_number) || 0)) + 1 : 1;
    week.items.push({
      title: 'New Task',
      description: '',
      week_number: week.weekNum,
      day_number: nextDay,
      phase: '',
      week_focus: '',
      resource_link: '',
      time_block_start: week.time_block_start || undefined,
      time_block_end: week.time_block_end || undefined
    });
  }

  removeTask(week: WeekNode, index: number) {
    week.items.splice(index, 1);
  }

  injectTaskBundle(week: WeekNode, type: 'study' | 'project') {
    const study = [
      'Study concept',
      'Practice drills',
      'Reflect and notes'
    ];
    const project = [
      'Plan milestone',
      'Build milestone',
      'Review and improvements'
    ];

    const bundle = type === 'study' ? study : project;
    let nextDay = week.items.length ? Math.max(...week.items.map((i) => Number(i.day_number) || 0)) + 1 : 1;

    bundle.forEach((title) => {
      week.items.push({
        title: `${week.focus}: ${title}`,
        description: '',
        week_number: week.weekNum,
        day_number: nextDay++,
        phase: '',
        week_focus: '',
        resource_link: '',
        time_block_start: week.time_block_start || undefined,
        time_block_end: week.time_block_end || undefined
      });
    });
  }

  sortWeekTasks(week: WeekNode) {
    week.items.sort((a, b) => (Number(a.day_number) || 0) - (Number(b.day_number) || 0));
  }

  syncTagsFromInput() {
    this.editForm.tags = this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    this.tagsInput = this.editForm.tags.join(', ');
  }

  saveSystem() {
    this.syncTagsFromInput();
    this.flattenHierarchy();

    this.editForm.title = this.editForm.title.trim() || 'Untitled System';
    this.editForm.category = this.editForm.category?.trim() || 'General';
    this.editForm.description = this.editForm.description?.trim() || '';

    if (this.isCreating()) {
      this.systemService.createSystem(this.editForm).subscribe((created) => {
        this.isCreating.set(false);
        this.selectedSystem.set(created);
        this.editForm = JSON.parse(JSON.stringify(created));
        this.tagsInput = (this.editForm.tags || []).join(', ');
        this.buildHierarchy();
        this.loadSystems();
      });
      return;
    }

    const id = this.selectedSystem()?.id;
    if (!id) return;

    this.systemService.updateSystem(id, this.editForm).subscribe((updated) => {
      this.selectedSystem.set(updated);
      this.editForm = JSON.parse(JSON.stringify(updated));
      this.tagsInput = (this.editForm.tags || []).join(', ');
      this.buildHierarchy();
      this.loadSystems();
    });
  }

  deleteSystem() {
    const id = this.selectedSystem()?.id;
    if (!id || !confirm('Delete this system forever?')) return;

    this.systemService.deleteSystem(id).subscribe(() => {
      this.selectedSystem.set(null);
      this.isCreating.set(false);
      this.lastResult.set(null);
      this.editForm = {
        title: '',
        description: '',
        category: 'General',
        tags: [],
        items: []
      };
      this.hierarchy.set([]);
      this.tagsInput = '';
      this.loadSystems();
    });
  }

  applySystem() {
    const systemId = this.selectedSystem()?.id;
    if (!systemId || this.isRunning() || this.getValidationIssues().length > 0) return;

    this.isRunning.set(true);
    this.lastResult.set(null);

    this.systemService.instantiateSystem({
      system_id: systemId,
      start_date: this.instantiateDate,
      habit_id: this.selectedHabitId || undefined
    }).subscribe({
      next: (res) => {
        this.lastResult.set(res);
        this.isRunning.set(false);
      },
      error: () => this.isRunning.set(false)
    });
  }

  onFileChange(evt: Event) {
    const target = evt.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const bstr = e.target?.result;
      if (typeof bstr !== 'string') return;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      this.processExcelData(data);
    };
    reader.readAsBinaryString(file);
    target.value = '';
  }

  generateWithAI() {
    if (!this.aiTopic.trim() || this.aiWeeks < 1 || this.aiWeeks > 12) return;
    this.isGeneratingAILoading.set(true);

    this.systemService.generateSystem(this.aiTopic, this.aiWeeks, this.aiDescription).subscribe({
      next: (system) => {
        this.editForm = {
          ...system,
          tags: system.tags || []
        };
        this.tagsInput = (this.editForm.tags || []).join(', ');
        this.isCreating.set(true);
        this.selectedSystem.set(null);
        this.buildHierarchy();
        this.isGeneratingAI.set(false);
        this.isGeneratingAILoading.set(false);
        this.aiTopic = '';
      },
      error: (err) => {
        console.error('Failed to generate AI system:', err);
        const msg = err.error?.detail || err.message || 'Please check server logs.';
        alert(`Failed to generate system with AI:\n\n${msg}`);
        this.isGeneratingAILoading.set(false);
      }
    });
  }

  processPastedCsv() {
    if (!this.pastedCsv.trim()) return;

    try {
      const wb = XLSX.read(this.pastedCsv, { type: 'string' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      this.processExcelData(data);
      this.isPasting.set(false);
      this.pastedCsv = '';
    } catch (err) {
      console.error('Error parsing CSV:', err);
      alert('Failed to parse CSV. Please check the format.');
    }
  }

  processExcelData(data: any[]) {
    const items: SystemItem[] = data.map((row) => ({
      week_number: Number(row.Week || row.week || 1),
      day_number: Number(row.Day || row.day || 1),
      title: row.Title || row.title || row.Task || row.task || 'Untitled Task',
      description: row.Description || row.description || '',
      phase: row.Phase || row.phase || 'Phase 1',
      week_focus: row.WeekFocus || row.week_focus || row.Focus || row.focus || 'General',
      time_block_start: row.StartTime || row.start_time || undefined,
      time_block_end: row.EndTime || row.end_time || undefined,
      resource_link: row.Resource || row.resource || row.Link || row.link || ''
    }));

    this.editForm = {
      title: 'Imported Strategy',
      description: 'Imported from spreadsheet/CSV.',
      category: 'Imported',
      tags: ['imported'],
      items
    };
    this.tagsInput = 'imported';
    this.isCreating.set(true);
    this.selectedSystem.set(null);
    this.lastResult.set(null);
    this.buildHierarchy();
  }

  getMetrics() {
    const phases = this.hierarchy();
    let weeks = 0;
    let tasks = 0;
    let timed = 0;
    let resources = 0;

    phases.forEach((phase) => {
      weeks += phase.weeks.length;
      phase.weeks.forEach((week) => {
        tasks += week.items.length;
        week.items.forEach((item) => {
          if (item.time_block_start || item.time_block_end) timed += 1;
          if (item.resource_link?.trim()) resources += 1;
        });
      });
    });

    return { phases: phases.length, weeks, tasks, timed, resources };
  }

  readinessScore(): number {
    const metrics = this.getMetrics();
    let score = 0;
    if (this.editForm.title.trim()) score += 20;
    if ((this.editForm.description || '').trim()) score += 10;
    if ((this.editForm.category || '').trim()) score += 10;
    if ((this.editForm.tags || []).length > 0) score += 10;
    if (metrics.phases > 0) score += 15;
    if (metrics.weeks > 0) score += 10;
    if (metrics.tasks > 0) score += 15;
    if (this.getValidationIssues().length === 0) score += 10;
    return score;
  }

  describeWeek(week: WeekNode): string {
    const focus = week.focus?.trim() || `Week ${week.weekNum}`;
    const goal = week.goal?.trim() ? ` Goal: ${week.goal.trim()}.` : '';
    const outcome = week.outcome?.trim() ? ` Outcome: ${week.outcome.trim()}.` : '';
    const time = week.time_block_start || week.time_block_end
      ? ` Default time ${week.time_block_start || '--'} to ${week.time_block_end || '--'}.`
      : '';
    return `${focus}.${goal}${outcome}${time}`;
  }

  launchSummary(): string {
    const metrics = this.getMetrics();
    const habitName = this.habits().find((h) => h.id === this.selectedHabitId)?.name;
    return `Will create ${metrics.tasks} tasks across ${metrics.weeks} weeks starting ${this.instantiateDate}.${habitName ? ` Linked to: ${habitName}.` : ''}`;
  }

  getValidationIssues(): string[] {
    const issues: string[] = [];

    if (!this.editForm.title.trim()) issues.push('System title is required.');
    if (!(this.editForm.category || '').trim()) issues.push('Category is required.');
    if (this.hierarchy().length === 0) issues.push('At least one phase is required.');

    this.hierarchy().forEach((phase, phaseIndex) => {
      if (!phase.name.trim()) issues.push(`Phase ${phaseIndex + 1}: name is required.`);
      if (phase.weeks.length === 0) issues.push(`${phase.name || `Phase ${phaseIndex + 1}`}: add at least one week.`);

      phase.weeks.forEach((week, weekIndex) => {
        if (!week.focus.trim()) issues.push(`${phase.name || `Phase ${phaseIndex + 1}`} week ${weekIndex + 1}: focus is required.`);
        if (week.items.length === 0) issues.push(`${phase.name || `Phase ${phaseIndex + 1}`} week ${week.weekNum}: add at least one task.`);
        if (week.time_block_start && week.time_block_end && week.time_block_start >= week.time_block_end) {
          issues.push(`${phase.name || `Phase ${phaseIndex + 1}`} week ${week.weekNum}: invalid time range.`);
        }

        const daySet = new Set<number>();
        week.items.forEach((item, taskIndex) => {
          const day = Number(item.day_number) || 0;
          if (!item.title?.trim()) {
            issues.push(`${phase.name || `Phase ${phaseIndex + 1}`} week ${week.weekNum} task ${taskIndex + 1}: title is required.`);
          }
          if (day <= 0) {
            issues.push(`${phase.name || `Phase ${phaseIndex + 1}`} week ${week.weekNum}: invalid day number.`);
          }
          if (daySet.has(day)) {
            issues.push(`${phase.name || `Phase ${phaseIndex + 1}`} week ${week.weekNum}: duplicate day ${day}.`);
          }
          daySet.add(day);

          if (item.time_block_start && item.time_block_end && item.time_block_start >= item.time_block_end) {
            issues.push(`${phase.name || `Phase ${phaseIndex + 1}`} week ${week.weekNum} task "${item.title || taskIndex + 1}": invalid time range.`);
          }
        });
      });
    });

    return Array.from(new Set(issues));
  }

  private createEmptyPhase(index: number): PhaseNode {
    return {
      name: `Phase ${index}`,
      objective: '',
      isExpanded: true,
      weeks: [
        {
          weekNum: 1,
          focus: 'Getting started',
          goal: '',
          outcome: '',
          items: [],
          isExpanded: true,
          time_block_start: null,
          time_block_end: null
        }
      ]
    };
  }
}



