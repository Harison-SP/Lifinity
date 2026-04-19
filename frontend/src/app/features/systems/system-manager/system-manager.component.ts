import { Component, OnInit, inject, signal } from '@angular/core';

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
import { ViewTabsComponent } from './components/view-tabs/view-tabs.component';
import { TableViewComponent } from './components/table-view/table-view.component';
import { MindMapViewComponent } from './components/mind-map-view/mind-map-view.component';
import { ViewMode, WeekNode, PhaseNode, SystemPreset } from './system-manager.types';


const SYSTEM_PRESETS: SystemPreset[] = [
  {
    id: 'dsa-12-week',
    label: 'DSA Master (12 Weeks)',
    description: 'Complete data structures and algorithms curriculum for interview readiness.',
    tags: ['coding', 'dsa', 'interview'],
    phases: [
      {
        name: 'Phase 1: Linear Structures',
        objective: 'Master foundational data structures and their operations.',
        weeks: [
          {
            focus: 'Arrays & Strings',
            goal: 'Master two-pointer and sliding window techniques.',
            outcome: 'Can solve most array manipulation problems.',
            tasks: [
              { day: 1, title: 'Complexity & Memory', description: 'Review memory layout and Big O.' },
              { day: 3, title: 'Two Pointer Drills', description: 'Solve 15-sum, valid palindrome, reverse string.' },
              { day: 5, title: 'Sliding Window', description: 'Longest substring without repeating characters.' }
            ]
          },
          {
            focus: 'Linked Lists',
            goal: 'Implement and manipulate singly and doubly linked lists.',
            outcome: 'Master pointer manipulation and slow/fast pointer logic.',
            tasks: [
              { day: 2, title: 'Reversal logic', description: 'Implement iterative and recursive reversal.' },
              { day: 4, title: 'Cycle Detection', description: 'Floyd\'s cycle finding algorithm.' }
            ]
          },
          {
            focus: 'Stacks & Queues',
            goal: 'Solve problems involving monotonic stacks and BFS foundations.',
            outcome: 'Understand LIFO/FIFO patterns and queue implementation.',
            tasks: [
              { day: 1, title: 'Valid Parentheses', description: 'Use stack for bracket matching problems.' },
              { day: 4, title: 'Min Stack', description: 'Implement a stack that returns minimum in O(1).' }
            ]
          },
          {
            focus: 'Hashing',
            goal: 'Master hash map and hash set applications.',
            outcome: 'Reduce O(n^2) problems to O(n) using frequency maps.',
            tasks: [
              { day: 2, title: 'Frequency counting', description: 'Two sum and top k frequent elements.' },
              { day: 5, title: 'Collision Handling', description: 'Understand chaining and open addressing.' }
            ]
          }
        ]
      },
      {
        name: 'Phase 2: Algorithm Patterns',
        objective: 'Apply recursive and iterative strategies to solve complex problems.',
        weeks: [
          {
            focus: 'Recursion & Backtracking',
            goal: 'Understand decision trees and state space exploration.',
            outcome: 'Solve permutations, combinations, and N-Queens.',
            tasks: [
              { day: 1, title: 'Decision Trees', description: 'Visualize recursion calls as trees.' },
              { day: 4, title: 'Subset generation', description: 'Generate all possible subsets of a set.' }
            ]
          },
          {
            focus: 'Binary Search',
            goal: 'Master searching in sorted/search-space arrays.',
            outcome: 'Recognize hidden binary search patterns.',
            tasks: [
              { day: 2, title: 'Standard Search', description: 'First and last position of element in sorted array.' },
              { day: 5, title: 'Search Space', description: 'Aggressive cows and capacity to ship packages.' }
            ]
          },
          {
            focus: 'Sorting Algorithms',
            goal: 'Deep dive into Quicksort, Mergesort, and Heapsort.',
            outcome: 'Analyze stability and space-time complexity variations.',
            tasks: [
              { day: 1, title: 'Divide & Conquer', description: 'Implement Merge Sort from scratch.' },
              { day: 4, title: 'QuickSelect', description: 'Find Kth largest element in O(n).' }
            ]
          },
          {
            focus: 'Bit Manipulation',
            goal: 'Master bitwise operations for optimization.',
            outcome: 'Understand XOR tricks and power-of-two checks.',
            tasks: [
              { day: 3, title: 'Bitwise Basics', description: 'Number of 1 bits, single number problems.' }
            ]
          }
        ]
      },
      {
        name: 'Phase 3: Nonlinear & DP',
        objective: 'Solve graph, tree, and dynamic programming challenges.',
        weeks: [
          {
            focus: 'Trees',
            goal: 'Master Binary Search Trees and traversals.',
            outcome: 'Understand DFS (Pre/In/Post) and BFS in trees.',
            tasks: [
              { day: 1, title: 'Tree traversal', description: 'Level order and vertical order traversal.' },
              { day: 4, title: 'Balanced Trees', description: 'Diameter of tree and height balancing.' }
            ]
          },
          {
            focus: 'Graphs',
            goal: 'Master BFS, DFS, and topological sorting.',
            outcome: 'Detect cycles and find shortest paths in graphs.',
            tasks: [
              { day: 2, title: 'Adjacency Lists', description: 'Build and traverse graph representations.' },
              { day: 5, title: 'Dijkstra', description: 'Shortest path in weighted graphs.' }
            ]
          },
          {
            focus: 'Dynamic Programming I',
            goal: 'Master 1D DP and memoization patterns.',
            outcome: 'Convert recursive solutions to top-down/bottom-up.',
            tasks: [
              { day: 1, title: 'Knapsack 0/1', description: 'Standard knapsack logic and variations.' },
              { day: 4, title: 'Coins & Stairs', description: 'Climbing stairs and coin change problems.' }
            ]
          },
          {
            focus: 'Final Revision',
            goal: 'Simulate mock interviews under time pressure.',
            outcome: 'Confidence in solving unseen medium-hard problems.',
            tasks: [
              { day: 1, title: 'Mock Interview 1', description: 'Solve 2 medium problems in 45 mins.' },
              { day: 6, title: 'System Design Overview', description: 'Basics of scalability for senior roles.' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'workout-6-week',
    label: 'Home Athlete (6 Weeks)',
    description: 'Transform your physique with bodyweight strength and conditioning.',
    tags: ['fitness', 'workout', 'health'],
    phases: [
      {
        name: 'Form & Volume',
        objective: 'Build movement mechanics and muscle endurance.',
        weeks: [
          {
            focus: 'Adaptation',
            goal: 'Zero ego, perfect form on push-ups/squats.',
            outcome: 'Pain-free movement and mental commitment.',
            tasks: [
              { day: 1, title: 'Upper Body A', description: 'Push-ups, dips, diamond push-ups (3x12).' },
              { day: 3, title: 'Lower Body A', description: 'Air squats, reverse lunges, calf raises (4x15).' },
              { day: 5, title: 'Core & Cardio', description: 'Planks, mountain climbers, 20 min brisk walk.' }
            ]
          },
          {
            focus: 'Volume Accumulation',
            goal: 'Increase total reps per session by 10%.',
            outcome: 'Visual improvement in muscle tone.',
            tasks: [
              { day: 2, title: 'Upper Body B', description: 'Wide push-ups, Pike push-ups, Floor pull-ins.' },
              { day: 4, title: 'Lower Body B', description: 'Bulgarian split squats, Glute bridges.' },
              { day: 6, title: 'Active Recovery', description: 'Full body stretching and light yoga flow.' }
            ]
          }
        ]
      },
      {
        name: 'Strength & Hypertrophy',
        objective: 'Introduce progressive overload through tempo and complexity.',
        weeks: [
          {
            focus: 'Tempo Training',
            goal: 'Implement 3-second eccentric (lowering) phase.',
            outcome: 'Increased time under tension and strength gains.',
            tasks: [
              { day: 1, title: 'Push Focus', description: 'Slow tempo push-ups and Archer push-ups.' },
              { day: 4, title: 'Leg Strength', description: 'Single leg squats (pistol progression).' }
            ]
          },
          {
            focus: 'Failure Sets',
            goal: 'Push last set of every exercise to technical failure.',
            outcome: 'Maximum metabolic stress and muscle growth.',
            tasks: [
              { day: 2, title: 'Pull & Core', description: 'Superman holds, Bicycle crunches to failure.' },
              { day: 5, title: 'Full Body Blast', description: 'Burpees and mountain climbers circuit.' }
            ]
          }
        ]
      },
      {
        name: 'Peaking & Conditioning',
        objective: 'Maximize fat burning and explosive power.',
        weeks: [
          {
            focus: 'Power & Explosiveness',
            goal: 'Execute plyometric movements with high intent.',
            outcome: 'Increased vertical leap and metabolic rate.',
            tasks: [
              { day: 1, title: 'Plyo Upper', description: 'Clap push-ups and explosive dips.' },
              { day: 3, title: 'Plyo Lower', description: 'Jump squats and Tuck jumps.' }
            ]
          },
          {
            focus: 'The Final Grind',
            goal: 'Complete "Murph" style bodyweight circuit.',
            outcome: 'Peak conditioning and 6-week completion.',
            tasks: [
              { day: 1, title: 'AMRAP 20', description: 'As many rounds as possible of 5-10-15.' },
              { day: 6, title: 'The Final Test', description: 'Measure max reps on core movements.' }
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
    FormsModule,
    MatIconModule,
    MatTimepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    ViewTabsComponent,
    TableViewComponent,
    MindMapViewComponent
],
  template: `
    <div class="min-h-screen bg-white px-4 py-5 sm:p-6 md:p-8 font-body transition-colors duration-300 overflow-x-hidden paper-texture custom-scrollbar">
      <div class="mx-auto flex h-full max-w-[1700px] flex-col gap-6">

        <header class="flex flex-col md:flex-row items-start justify-between gap-4 mb-2">
          <div class="space-y-2">
            <h1 class="font-heading text-3xl md:text-5xl font-bold text-charcoal">
              System Studio
            </h1>
            <p class="text-taupe text-base">
              Define metadata, build phase-week-task structure, then launch to planner.
            </p>
          </div>
          <button
            (click)="createNewSystem()"
            class="inline-flex items-center gap-2 bg-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-gentle hover:bg-orange-400 transition-all">
            <span class="material-symbols-outlined">add</span>
            New System
          </button>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <div class="bg-alabaster rounded-lg shadow-gentle p-6 border border-taupe/10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-taupe">Systems</span>
              <span class="material-symbols-outlined text-orange-500 text-xl">layers</span>
            </div>
            <span class="text-4xl font-bold text-charcoal">{{ systems().length }}</span>
          </div>
          <div class="bg-alabaster rounded-lg shadow-gentle p-6 border border-taupe/10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-taupe">Phases</span>
              <span class="material-symbols-outlined text-sage text-xl">account_tree</span>
            </div>
            <span class="text-4xl font-bold text-charcoal">{{ getMetrics().phases }}</span>
          </div>
          <div class="bg-alabaster rounded-lg shadow-gentle p-6 border border-taupe/10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-taupe">Weeks</span>
              <span class="material-symbols-outlined text-orange-500 text-xl">date_range</span>
            </div>
            <span class="text-4xl font-bold text-charcoal">{{ getMetrics().weeks }}</span>
          </div>
          <div class="bg-orange-500 text-white rounded-lg shadow-gentle p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-white/80">Tasks</span>
              <span class="material-symbols-outlined text-white">task_alt</span>
            </div>
            <span class="text-4xl font-bold">{{ getMetrics().tasks }}</span>
          </div>
        </section>

        <div class="flex flex-wrap gap-3">
          <button
            (click)="showHelp.set(true)"
            class="inline-flex items-center gap-2 bg-white text-charcoal font-bold py-2.5 px-5 rounded-lg shadow-gentle border border-taupe/10 hover:shadow-gentle-lg transition-all text-sm">
            <span class="material-symbols-outlined text-base">help</span>
            Workflow
          </button>
          <label
            class="inline-flex cursor-pointer items-center gap-2 bg-white text-charcoal font-bold py-2.5 px-5 rounded-lg shadow-gentle border border-taupe/10 hover:shadow-gentle-lg transition-all text-sm">
            <span class="material-symbols-outlined text-base text-orange-500">upload_file</span>
            Import Excel
            <input type="file" class="hidden" (change)="onFileChange($event)" accept=".xlsx,.xls,.csv" />
          </label>
          <button
            (click)="isPasting.set(true)"
            class="inline-flex items-center gap-2 bg-white text-charcoal font-bold py-2.5 px-5 rounded-lg shadow-gentle border border-taupe/10 hover:shadow-gentle-lg transition-all text-sm">
            <span class="material-symbols-outlined text-base">content_paste</span>
            Paste CSV
          </button>
          <button
            (click)="isGeneratingAI.set(true)"
            class="inline-flex items-center gap-2 bg-sage text-white font-bold py-2.5 px-5 rounded-lg shadow-gentle hover:opacity-90 transition-all text-sm">
            <span class="material-symbols-outlined text-base">auto_awesome</span>
            AI Generate
          </button>
        </div>

        <div class="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-12">

          <aside class="xl:col-span-3 flex flex-col gap-4 min-h-0">
            <!-- Systems Library -->
            <div class="flex flex-col bg-white rounded-lg shadow-gentle p-5 border border-taupe/10 min-h-0 max-h-[500px]">
              <div class="border-b border-taupe/10 pb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-taupe">Library</span>
                <h3 class="font-heading text-xl font-bold text-charcoal mt-1">Systems</h3>
                <div class="mt-3 space-y-3">
                  <input
                    [(ngModel)]="systemSearch"
                    placeholder="Search title or tag"
                    class="w-full border border-taupe/20 bg-sand rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:border-orange-500 text-charcoal transition-colors" />
                </div>
              </div>

              <div class="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1 mt-4">
                @for (system of filteredSystems(); track system.id ?? system.title) {
                  <button
                    (click)="selectSystem(system)"
                    class="block w-full rounded-lg p-3.5 text-left transition-all"
                    [class.bg-orange-500]="selectedSystem()?.id === system.id"
                    [class.text-white]="selectedSystem()?.id === system.id"
                    [class.shadow-gentle]="selectedSystem()?.id === system.id"
                    [class.bg-sand]="selectedSystem()?.id !== system.id"
                    [class.text-charcoal]="selectedSystem()?.id !== system.id"
                    [class.hover:bg-sand-dark]="selectedSystem()?.id !== system.id">
                    <p class="text-sm font-bold truncate">{{ system.title }}</p>
                    <div class="mt-1.5 flex items-center justify-between text-xs opacity-80">
                      <span>{{ system.items.length }} tasks</span>
                    </div>
                  </button>
                } @empty {
                  <div class="rounded-lg border border-dashed border-taupe/30 p-4 text-center text-sm text-taupe">
                    No systems found
                  </div>
                }
              </div>
            </div>

            <!-- Health Check (Sidebar) -->
            @if (selectedSystem() || isCreating()) {
              <section class="bg-white rounded-lg shadow-gentle p-6 border border-taupe/10">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-xs font-bold uppercase tracking-wider text-taupe">Health Check</span>
                    <h3 class="mt-1 font-heading text-xl font-bold text-charcoal">Validation</h3>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="bg-sand rounded-lg px-2 py-1 text-[10px] font-bold text-charcoal">
                      {{ getMetrics().resources }} Res
                    </div>
                  </div>
                </div>

                <div class="mt-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  @for (issue of getValidationIssues(); track issue) {
                    <div class="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] font-medium text-red-800">
                      {{ issue }}
                    </div>
                  } @empty {
                    <div class="rounded-lg border border-green-200 bg-green-50 p-2 text-[11px] font-medium text-green-800">
                      Ready to launch.
                    </div>
                  }
                </div>
              </section>
            }

            <!-- Starter Presets -->
            <div class="bg-white rounded-lg shadow-gentle p-5 border border-taupe/10">
              <span class="text-xs font-bold uppercase tracking-wider text-taupe mb-2 block">Starter Presets</span>
              <div class="space-y-2">
                @for (preset of presets; track preset.id) {
                  <button
                    (click)="applyPreset(preset.id)"
                    class="w-full bg-sand rounded-lg text-left p-3.5 hover:bg-sand-dark transition-colors">
                    <p class="text-sm font-bold text-charcoal">{{ preset.label }}</p>
                    <p class="mt-1 text-xs text-taupe">{{ preset.description }}</p>
                  </button>
                }
              </div>
            </div>
          </aside>

          <main class="xl:col-span-9 min-h-0">
            @if (selectedSystem() || isCreating()) {
              <div class="flex h-full min-h-[720px] flex-col gap-4">

                <div class="grid gap-6 lg:grid-cols-2">
                  <section class="bg-white rounded-lg shadow-gentle p-6 border border-taupe/10">
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div class="flex-1">
                        <span class="text-xs font-bold uppercase tracking-wider text-taupe">Step 1 — Define</span>
                        <input
                          [(ngModel)]="editForm.title"
                          placeholder="System title"
                          class="mt-2 w-full bg-transparent font-heading text-3xl font-bold outline-none text-charcoal md:text-2xl" />
                        <textarea
                          [(ngModel)]="editForm.description"
                          rows="2"
                          placeholder="Describe intent..."
                          class="mt-3 w-full resize-none border border-taupe/20 bg-sand rounded-lg p-3 text-sm font-medium outline-none focus:border-orange-500 text-charcoal"></textarea>
                      </div>

                      <div class="grid w-full sm:w-auto sm:min-w-[200px] grid-cols-2 gap-2">
                        <div class="bg-sand rounded-lg p-3">
                          <span class="text-xs font-bold uppercase tracking-wider text-taupe">Readiness</span>
                          <p class="mt-1 text-2xl font-bold text-charcoal">{{ readinessScore() }}%</p>
                        </div>
                        <div class="bg-sand rounded-lg p-3">
                          <span class="text-xs font-bold uppercase tracking-wider text-taupe">Issues</span>
                          <p class="mt-1 text-2xl font-bold text-charcoal">{{ getValidationIssues().length }}</p>
                        </div>
                        <button
                          (click)="saveSystem()"
                          class="inline-flex items-center justify-center gap-2 bg-sage text-white rounded-lg px-2 py-2.5 text-xs font-bold hover:opacity-90 transition-all">
                          <span class="material-symbols-outlined text-sm">save</span>
                          Save
                        </button>
                        <button
                          (click)="deleteSystem()"
                          [disabled]="!selectedSystem()?.id"
                          class="inline-flex items-center justify-center gap-2 bg-red-500 text-white rounded-lg px-2 py-2.5 text-xs font-bold hover:bg-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                          <span class="material-symbols-outlined text-sm">delete</span>
                          Delete
                        </button>
                      </div>
                    </div>

                    <div class="mt-4">
                      <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Tags</label>
                      <input
                        [(ngModel)]="tagsInput"
                        (blur)="syncTagsFromInput()"
                        placeholder="python, interview..."
                        class="w-full border border-taupe/20 bg-white rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-500 text-charcoal" />
                    </div>
                  </section>

                  <section class="bg-white rounded-lg shadow-gentle p-6 border border-taupe/10">
                    <span class="text-xs font-bold uppercase tracking-wider text-taupe">Step 3 — Launch</span>
                    <h3 class="mt-1 font-heading text-xl font-bold text-charcoal">Instantiate</h3>

                    @if (selectedSystem()?.id) {
                      <div class="mt-4 space-y-3">
                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Parent habit</label>
                            <select
                              [(ngModel)]="selectedHabitId"
                              class="w-full border border-taupe/20 bg-white rounded-lg px-3 py-2.5 text-sm font-medium outline-none text-charcoal">
                              <option [ngValue]="null" disabled>Select parent habit</option>
                              @for (habit of habits(); track habit.id) {
                                <option [value]="habit.id">{{ habit.name }}</option>
                              }
                            </select>
                          </div>

                          <div>
                            <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Start date</label>
                            <input
                              type="date"
                              [(ngModel)]="instantiateDate"
                              class="w-full border border-taupe/20 bg-white rounded-lg px-3 py-2.5 text-sm font-medium outline-none text-charcoal" />
                          </div>
                        </div>

                        <div class="flex items-center justify-between gap-3">
                          <div class="flex-1 rounded-lg bg-sand/70 border border-taupe/10 p-2.5 text-[10px] font-medium text-taupe line-clamp-2">
                            {{ launchSummary() }}
                          </div>

                          <button
                            (click)="applySystem()"
                            [disabled]="isRunning() || getValidationIssues().length > 0"
                            class="whitespace-nowrap inline-flex items-center justify-center gap-2 bg-orange-500 text-white rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-orange-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <span class="material-symbols-outlined text-sm">{{ isRunning() ? 'hourglass_top' : 'play_arrow' }}</span>
                            {{ isRunning() ? 'Launching...' : 'Launch' }}
                          </button>
                        </div>

                        @if (lastResult()) {
                          <div class="rounded-lg border border-green-200 bg-green-50 p-2 text-[11px] font-bold text-green-800">
                            {{ lastResult()!.message }} | Tasks: {{ lastResult()!.totalTasks }}
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="mt-4 rounded-lg border border-dashed border-taupe/30 p-4 text-sm font-medium text-taupe">
                        Save this draft first to enable launch.
                      </div>
                    }
                  </section>
                </div>

                <!-- ── View Tabs ── -->
                <div class="flex items-center justify-between">
                  <app-view-tabs
                    [activeView]="currentView()"
                    (viewChange)="currentView.set($event)" />
                  <span class="text-xs text-taupe font-medium hidden md:inline">
                    {{ currentView() === 'form' ? 'Detailed editor' : currentView() === 'table' ? 'Bulk editing mode' : 'Visual hierarchy' }}
                  </span>
                </div>

                <!-- ── Conditional Views ── -->
                @if (currentView() === 'table') {
                  <app-table-view
                    [hierarchy]="hierarchy()"
                    (hierarchyChange)="hierarchy.set($event)" />
                }

                @if (currentView() === 'mindmap') {
                  <app-mind-map-view
                    [hierarchy]="hierarchy()"
                    [systemTitle]="editForm.title" />
                }

                @if (currentView() === 'form') {
                  <section class="flex flex-col gap-4">
                    <div class="bg-white rounded-lg shadow-gentle p-6 border border-taupe/10">
                      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-taupe/10 pb-4">
                        <div>
                          <span class="text-xs font-bold uppercase tracking-wider text-taupe">Step 2 — Structure</span>
                          <h3 class="font-heading text-xl font-bold text-charcoal mt-1">Phase / Week / Task Builder</h3>
                        </div>
                        <button
                          (click)="addPhase()"
                          class="inline-flex items-center gap-2 bg-orange-500 text-white rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-orange-400 transition-all">
                          <span class="material-symbols-outlined text-sm">add</span>
                          Add Phase
                        </button>
                      </div>

                      <div class="mt-4 space-y-4">
                        @for (phase of hierarchy(); track $index; let phaseIndex = $index) {
                          <div class="bg-sand/50 rounded-lg border border-taupe/10 overflow-hidden">
                            <div class="p-4 border-b border-taupe/10 bg-white">
                              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div class="flex-1 space-y-3">
                                  <div class="flex items-center gap-3">
                                    <button
                                      (click)="phase.isExpanded = !phase.isExpanded"
                                      class="h-9 w-9 rounded-lg bg-sand border border-taupe/20 inline-flex items-center justify-center text-charcoal hover:bg-sand-dark transition-colors">
                                      <span class="material-symbols-outlined transition-transform" [class.rotate-90]="phase.isExpanded">chevron_right</span>
                                    </button>
                                    <input
                                      [(ngModel)]="phase.name"
                                      class="flex-1 bg-transparent text-lg font-bold outline-none text-charcoal"
                                      placeholder="Phase name" />
                                    <span class="px-2.5 py-1 text-xs font-bold rounded-full bg-sand text-charcoal">
                                      {{ phase.weeks.length }} weeks
                                    </span>
                                  </div>
                                  <textarea
                                    [(ngModel)]="phase.objective"
                                    rows="2"
                                    placeholder="Phase objective"
                                    class="w-full resize-none border border-taupe/20 bg-sand rounded-lg p-3 text-sm font-medium outline-none focus:border-orange-500 text-charcoal"></textarea>
                                </div>

                                <div class="flex flex-wrap gap-2">
                                  <button
                                    (click)="addWeek(phase)"
                                    class="inline-flex items-center gap-2 bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-orange-400 transition-all">
                                    <span class="material-symbols-outlined text-sm">calendar_add_on</span>
                                    Add Week
                                  </button>
                                  <button
                                    (click)="removePhase(phaseIndex)"
                                    class="inline-flex items-center gap-2 bg-red-500 text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-400 transition-all">
                                    <span class="material-symbols-outlined text-sm">close</span>
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>

                            @if (phase.isExpanded) {
                              <div class="p-4 space-y-4">
                                @for (week of phase.weeks; track $index; let weekIndex = $index) {
                                  <div class="bg-white rounded-lg border border-taupe/10 shadow-gentle p-4">
                                    <div class="flex flex-col gap-3 border-b border-taupe/10 pb-4">
                                      <div class="grid gap-3 md:grid-cols-[80px,1fr,1fr]">
                                        <div>
                                          <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Week</label>
                                          <input
                                            type="number"
                                            [(ngModel)]="week.weekNum"
                                            class="w-full border border-taupe/20 bg-sand rounded-lg px-2 py-2 text-sm font-bold outline-none text-charcoal" />
                                        </div>
                                        <div>
                                          <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Focus</label>
                                          <input
                                            [(ngModel)]="week.focus"
                                            placeholder="Weekly focus"
                                            class="w-full border border-taupe/20 bg-sand rounded-lg px-3 py-2 text-sm font-medium outline-none text-charcoal" />
                                        </div>
                                        <div>
                                          <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Goal</label>
                                          <input
                                            [(ngModel)]="week.goal"
                                            placeholder="Weekly goal"
                                            class="w-full border border-taupe/20 bg-sand rounded-lg px-3 py-2 text-sm font-medium outline-none text-charcoal" />
                                        </div>
                                      </div>

                                      <textarea
                                        [(ngModel)]="week.outcome"
                                        rows="2"
                                        placeholder="Success criteria for this week"
                                        class="w-full resize-none border border-taupe/20 bg-sand rounded-lg p-3 text-sm font-medium outline-none text-charcoal"></textarea>


                                      <div class="flex flex-wrap gap-2 mb-3">
                                        <button
                                          (click)="duplicateWeek(phase, weekIndex)"
                                          class="bg-sand border border-taupe/20 rounded-lg px-3 py-2 text-xs font-bold text-charcoal hover:bg-sand-dark transition-colors">
                                          Duplicate
                                        </button>
                                        <button
                                          (click)="removeWeek(phase, weekIndex)"
                                          class="bg-red-500 text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-400 transition-colors">
                                          Remove
                                        </button>
                                      </div>

                                      <div class="rounded-lg bg-sand/70 border border-taupe/10 p-3 text-xs font-medium text-taupe">
                                        {{ describeWeek(week) }}
                                      </div>
                                    </div>

                                    <div class="mt-4 space-y-3">
                                      @for (item of week.items; track $index; let taskIndex = $index) {
                                        <div class="bg-alabaster rounded-lg border border-taupe/10 p-3">
                                          <div class="grid gap-3 lg:grid-cols-[70px,1.2fr,1fr,auto]">
                                            <div>
                                              <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Day</label>
                                              <input
                                                type="number"
                                                [(ngModel)]="item.day_number"
                                                class="w-full border border-taupe/20 bg-white rounded-lg px-2 py-2 text-sm font-bold outline-none text-charcoal" />
                                            </div>
                                            <div>
                                              <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Task title</label>
                                              <input
                                                [(ngModel)]="item.title"
                                                placeholder="Task title"
                                                class="w-full border border-taupe/20 bg-white rounded-lg px-3 py-2 text-sm font-bold outline-none text-charcoal" />
                                            </div>
                                            <div>
                                              <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Resource link</label>
                                              <input
                                                [(ngModel)]="item.resource_link"
                                                placeholder="Optional URL"
                                                class="w-full border border-taupe/20 bg-white rounded-lg px-3 py-2 text-sm font-medium outline-none text-charcoal" />
                                            </div>
                                            <div class="flex items-end">
                                              <button
                                                (click)="removeTask(week, taskIndex)"
                                                class="w-full bg-red-500 text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-400 transition-colors">
                                                Remove
                                              </button>
                                            </div>
                                          </div>

                                          <div class="mt-3">
                                            <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-taupe">Description</label>
                                            <textarea
                                              [(ngModel)]="item.description"
                                              rows="2"
                                              placeholder="Task description"
                                              class="w-full resize-none border border-taupe/20 bg-white rounded-lg p-3 text-sm font-medium outline-none text-charcoal"></textarea>
                                          </div>
                                        </div>
                                      } @empty {
                                        <div class="rounded-lg border border-dashed border-taupe/30 p-4 text-center text-sm text-taupe">
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
                          <div class="rounded-lg border border-dashed border-taupe/30 p-8 text-center text-sm text-taupe">
                            No phases configured
                          </div>
                        }
                      </div>
                    </div>
                  </section>
                } <!-- end form view -->
              </div>
            } @else {
              <div class="flex min-h-[720px] items-center justify-center bg-alabaster rounded-lg border border-dashed border-taupe/30 p-10 text-center shadow-gentle">
                <div class="max-w-xl">
                  <span class="material-symbols-outlined text-7xl text-taupe/40">settings_suggest</span>
                  <p class="mt-4 font-heading text-3xl font-bold text-taupe">
                    Select a system or create one
                  </p>
                  <p class="mt-3 text-sm text-taupe">
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
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div class="bg-white rounded-xl shadow-gentle-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto custom-scrollbar border border-taupe/10">
          <div class="flex justify-between items-center border-b border-taupe/10 pb-3">
            <h3 class="text-2xl font-bold font-heading text-charcoal">How to use</h3>
            <button (click)="showHelp.set(false)" class="text-taupe hover:text-charcoal transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-3 text-sm">
            <div class="rounded-lg p-4 bg-sand border border-taupe/10 text-charcoal">
              <p class="font-bold mb-2">1. Define</p>
              <p>Add title, description, and tags.</p>
            </div>
            <div class="rounded-lg p-4 bg-sand border border-taupe/10 text-charcoal">
              <p class="font-bold mb-2">2. Structure</p>
              <p>Create phases, weeks, tasks. Use bundles and validation.</p>
            </div>
            <div class="rounded-lg p-4 bg-sand border border-taupe/10 text-charcoal">
              <p class="font-bold mb-2">3. Launch</p>
              <p>Save then instantiate to a start date and optional parent habit.</p>
            </div>
          </div>

          <div class="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs font-medium text-orange-900">
            Import columns: Phase, Week, WeekFocus, Day, Title, Description, StartTime, EndTime
          </div>
        </div>
      </div>
    }

    @if (isPasting()) {
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div class="bg-white rounded-xl shadow-gentle-lg p-6 w-full max-w-2xl border border-taupe/10">
          <div class="flex justify-between items-center border-b border-taupe/10 pb-3">
            <h3 class="text-xl font-bold font-heading text-charcoal">Paste CSV</h3>
            <button (click)="isPasting.set(false)" class="text-taupe hover:text-charcoal transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <p class="mt-3 text-xs font-mono text-taupe">
            Phase, Week, WeekFocus, Day, Title, Description, StartTime, EndTime
          </p>

          <textarea
            [(ngModel)]="pastedCsv"
            class="w-full h-80 mt-3 p-4 border border-taupe/20 bg-sand rounded-lg font-mono text-xs outline-none custom-scrollbar text-charcoal"
            placeholder="Phase,Week,WeekFocus,Day,Title,Description,StartTime,EndTime&#10;Phase 1,1,Basics,1,Task 1,Desc,08:00,09:00"></textarea>

          <div class="mt-4 flex justify-end gap-3">
            <button
              (click)="isPasting.set(false)"
              class="px-5 py-2.5 bg-sand text-charcoal rounded-lg text-sm font-bold hover:bg-sand-dark transition-colors">
              Cancel
            </button>
            <button
              (click)="processPastedCsv()"
              class="px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-400 transition-colors">
              Import
            </button>
          </div>
        </div>
      </div>
    }

    @if (isGeneratingAI()) {
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div class="bg-white rounded-xl shadow-gentle-lg p-6 w-full max-w-lg border border-taupe/10">
          <div class="flex justify-between items-center border-b border-taupe/10 pb-3">
            <h3 class="text-xl font-bold font-heading text-charcoal">AI Protocol Generator</h3>
            <button (click)="isGeneratingAI.set(false)" [disabled]="isGeneratingAILoading()" class="text-taupe hover:text-charcoal transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="mt-4 space-y-3">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">Topic / Goal</label>
              <input
                [(ngModel)]="aiTopic"
                [disabled]="isGeneratingAILoading()"
                placeholder="Learn Angular for scalable frontend systems"
                class="w-full border border-taupe/20 bg-sand rounded-lg p-2.5 text-sm font-medium outline-none text-charcoal" />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">Duration (weeks)</label>
              <input
                type="number"
                min="1"
                max="12"
                [(ngModel)]="aiWeeks"
                [disabled]="isGeneratingAILoading()"
                class="w-full border border-taupe/20 bg-sand rounded-lg p-2.5 text-sm font-medium outline-none text-charcoal" />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">Description / constraints</label>
              <textarea
                [(ngModel)]="aiDescription"
                [disabled]="isGeneratingAILoading()"
                rows="4"
                class="w-full resize-none border border-taupe/20 bg-sand rounded-lg p-2.5 text-sm font-medium outline-none text-charcoal"
                placeholder="Include advanced routing, state strategy, and testing."></textarea>
            </div>
          </div>

          <div class="mt-4 flex justify-end gap-3">
            <button
              (click)="isGeneratingAI.set(false)"
              [disabled]="isGeneratingAILoading()"
              class="px-5 py-2.5 bg-sand text-charcoal rounded-lg text-sm font-bold hover:bg-sand-dark transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button
              (click)="generateWithAI()"
              [disabled]="isGeneratingAILoading() || !aiTopic.trim()"
              class="px-5 py-2.5 bg-sage text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 inline-flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">{{ isGeneratingAILoading() ? 'hourglass_top' : 'auto_awesome' }}</span>
              {{ isGeneratingAILoading() ? 'Generating...' : 'Generate' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
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
  currentView = signal<ViewMode>('form');

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
  tagsInput = '';

  editForm: LearningSystem = {
    title: '',
    description: '',
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
      if (!q) return true;
      const tags = (s.tags || []).join(' ');
      const haystack = `${s.title} ${s.description || ''} ${tags}`.toLowerCase();
      return haystack.includes(q);
    });
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
            isExpanded: true
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
            resource_link: item.resource_link?.trim() || ''
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
    const newWeek: WeekNode = {
      weekNum: nextWeek,
      focus: `Week ${nextWeek}`,
      goal: '',
      outcome: '',
      items: [],
      isExpanded: true
    };
    phase.weeks.push(newWeek);
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
      resource_link: ''
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
        resource_link: ''
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
    if (!systemId || !this.selectedHabitId || this.isRunning() || this.getValidationIssues().length > 0) return;

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
      resource_link: row.Resource || row.resource || row.Link || row.link || ''
    }));

    this.editForm = {
      title: 'Imported Strategy',
      description: 'Imported from spreadsheet/CSV.',
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
    let resources = 0;

    phases.forEach((phase) => {
      weeks += phase.weeks.length;
      phase.weeks.forEach((week) => {
        tasks += week.items.length;
        week.items.forEach((item) => {
          if (item.resource_link?.trim()) resources += 1;
        });
      });
    });

    return { phases: phases.length, weeks, tasks, resources };
  }

  readinessScore(): number {
    const metrics = this.getMetrics();
    let score = 0;
    if (this.editForm.title.trim()) score += 20;
    if ((this.editForm.description || '').trim()) score += 10;
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
    return `${focus}.${goal}${outcome}`;
  }

  launchSummary(): string {
    const metrics = this.getMetrics();
    const habitName = this.habits().find((h) => h.id === this.selectedHabitId)?.name;
    return `Will create ${metrics.tasks} tasks across ${metrics.weeks} weeks starting ${this.instantiateDate}.${habitName ? ` Linked to: ${habitName}.` : ''}`;
  }

  getValidationIssues(): string[] {
    const issues: string[] = [];

    if (!this.editForm.title.trim()) issues.push('System title is required.');
    if (!this.selectedHabitId) issues.push('Parent habit is required for launch.');
    if (this.hierarchy().length === 0) issues.push('At least one phase is required.');

    this.hierarchy().forEach((phase, phaseIndex) => {
      if (!phase.name.trim()) issues.push(`Phase ${phaseIndex + 1}: name is required.`);
      if (phase.weeks.length === 0) issues.push(`${phase.name || `Phase ${phaseIndex + 1}`}: add at least one week.`);

      phase.weeks.forEach((week, weekIndex) => {
        if (week.items.length === 0) issues.push(`${phase.name || `Phase ${phaseIndex + 1}`} week ${week.weekNum}: add at least one task.`);

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
          isExpanded: true
        }
      ]
    };
  }
}



