import { Component, signal, inject, OnInit, OnDestroy, computed, Injector, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlannerService, MonthlyReflection, HabitCompletions, HabitNote } from '../../../services/planner.service';
import { HabitService } from '../../../services/habit.service';
import { MultiSelectChipsComponent, MultiSelectOption } from '../../../shared/components/multi-select-chips/multi-select-chips.component';
import { AngularTiptapEditorComponent } from '@flogeez/angular-tiptap-editor';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, take } from 'rxjs/operators';

interface MonthlyHabit {
  id: string;
  name: string;
  type: string;
  completions: { [day: number]: boolean | number | null }; // 1-indexed day -> status
}

@Component({
  selector: 'app-monthly-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectChipsComponent, AngularTiptapEditorComponent],
  template: `
    <div class="h-full flex flex-col font-manrope p-4 gap-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center gap-2">
          <button (click)="changeMonth(-1)" class="p-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rigid-border-sm border-[2px] dark:border-concrete-100 dark:text-white">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 class="text-2xl font-black text-black dark:text-white uppercase font-arvo">
            {{ getMonthName(currentMonth()) }} {{ currentYear() }}
          </h2>
          <button (click)="changeMonth(1)" class="p-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rigid-border-sm border-[2px] dark:border-concrete-100 dark:text-white">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- Monthly Grid -->
      <div class="overflow-x-auto custom-scrollbar rigid-border-sm border-[2px] dark:border-concrete-500">
        <div class="grid" [style.grid-template-columns]="'150px repeat(' + daysInMonth().length + ', 40px)'">
          <!-- Header -->
          <div class="sticky left-0 bg-white dark:bg-concrete-900 font-black text-xs uppercase text-black dark:text-white p-2 border-r-2 border-b-2 border-black dark:border-concrete-100 z-10">Habit</div>
          @for(day of daysInMonth(); track day) {
            <div class="font-bold text-xs text-center p-2 border-b-2 border-black dark:border-concrete-100 dark:text-white"
                 [class.bg-yellow-100]="isToday(day)"
                 [class.dark:bg-concrete-800]="isToday(day)"
                 [class.font-black]="isToday(day)">{{ day }}</div>
          }

          <!-- Body -->
          @for(habit of monthHabits(); track habit.id) {
            <div class="sticky left-0 bg-white dark:bg-concrete-900 font-bold text-sm text-black dark:text-white p-2 border-r-2 border-b border-concrete-300 dark:border-concrete-700 z-10 truncate flex items-center gap-1 cursor-pointer hover:bg-concrete-100 dark:hover:bg-concrete-800 transition-colors group"
                 [title]="habit.name"
                 (click)="selectHabitForNotes(habit)">
              <span class="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-concrete-400">edit_note</span>
              <span class="truncate" [class.text-primary]="selectedHabitId() === habit.id">{{ habit.name }}</span>
            </div>
            @for(day of daysInMonth(); track day) {
              <div class="flex items-center justify-center border-b border-r border-concrete-300 dark:border-concrete-700"
                   [class.bg-yellow-50]="isToday(day)"
                   [class.dark:bg-concrete-800]="isToday(day)">
                <button (click)="toggleCompletion(habit, day)" 
                        class="w-full h-full text-lg hover:bg-concrete-200 dark:hover:bg-concrete-700 transition-colors py-1"
                        [class.cursor-not-allowed]="isFutureDay(day)"
                        [disabled]="isFutureDay(day)">
                  @if(habit.completions[day] === true) { <span class="text-green-500">✔</span> }
                  @else if(habit.completions[day] === false) { <span class="text-red-500">✘</span> }
                  @else if(habit.type === 'measurable' && isNumber(habit.completions[day])) { 
                    <span class="text-blue-500 text-[10px] font-bold">{{ habit.completions[day] }}</span> 
                  }
                  @else { <span class="text-concrete-300">·</span> }
                </button>
              </div>
            }
          } @empty {
            <div class="p-4 text-center text-concrete-500" [style.grid-column]="'1 / -1'">
              No habits yet. Add habits from the Habits section.
            </div>
          }
        </div>
      </div>

      <!-- Habit Notes Panel (Obsidian-like) -->
      @if(selectedHabitId()) {
        <div class="bg-white rigid-border border-[4px] brutalist-shadow-lg overflow-hidden note-panel-animate transition-all duration-300"
             [class.fixed]="isFullScreen()"
             [class.inset-0]="isFullScreen()"
             [class.z-50]="isFullScreen()"
             [class.h-full]="isFullScreen()"
             [class.w-full]="isFullScreen()"
             [class.rounded-none]="isFullScreen()">
          <!-- Note Panel Header -->
          <div class="flex items-center justify-between bg-black text-white px-6 py-3">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl">edit_note</span>
              <h3 class="text-lg font-black uppercase font-arvo tracking-wider">
                {{ selectedHabitName() }} — Notes
              </h3>
              <span class="text-xs bg-white text-black px-2 py-0.5 font-bold">
                {{ habitNotes().length }} {{ habitNotes().length === 1 ? 'NOTE' : 'NOTES' }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="createNewNote()" 
                      class="flex items-center gap-1 px-3 py-1 bg-white text-black font-bold text-xs uppercase hover:bg-concrete-100 transition-colors rigid-border-sm border-white">
                <span class="material-symbols-outlined text-sm">add</span>
                New Note
              </button>
              <button (click)="toggleReadingMode()" 
                      class="p-1 hover:bg-white/20 transition-colors"
                      [title]="isReadingMode() ? 'Edit Mode' : 'Reading Mode'"
                      [class.bg-concrete-200]="isReadingMode()">
                <span class="material-symbols-outlined">{{ isReadingMode() ? 'visibility' : 'edit' }}</span>
              </button>
              <div class="relative">
                <button (click)="toggleDownloadMenu()" 
                        class="p-1 hover:bg-white/20 transition-colors"
                        title="Download Note">
                  <span class="material-symbols-outlined">download</span>
                </button>
                @if(isDownloadMenuOpen()) {
                  <div class="absolute right-0 top-full mt-1 bg-white rigid-border border-[2px] z-50 min-w-[120px] brutalist-shadow-sm flex flex-col text-black">
                      <button (click)="downloadNote('txt')" class="px-3 py-2 text-left hover:bg-concrete-100 font-bold text-xs uppercase border-b border-concrete-100 w-full">Text (.txt)</button>
                      <button (click)="downloadNote('md')" class="px-3 py-2 text-left hover:bg-concrete-100 font-bold text-xs uppercase border-b border-concrete-100 w-full">Markdown (.md)</button>
                      <button (click)="downloadNote('pdf')" class="px-3 py-2 text-left hover:bg-concrete-100 font-bold text-xs uppercase w-full">PDF</button>
                  </div>
                }
              </div>
              <button (click)="toggleFullScreen()" 
                      class="p-1 hover:bg-white/20 transition-colors"
                      [title]="isFullScreen() ? 'Exit Full Screen' : 'Full Screen'">
                <span class="material-symbols-outlined">{{ isFullScreen() ? 'fullscreen_exit' : 'fullscreen' }}</span>
              </button>
              <button (click)="closeNotesPanel()" 
                      class="p-1 hover:bg-white/20 transition-colors">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div class="flex min-h-[500px] max-h-[700px]">
            <!-- Notes Sidebar -->
            <div class="w-[260px] border-r-4 border-black bg-concrete-100 overflow-y-auto custom-scrollbar flex-shrink-0">
              @if(habitNotes().length === 0) {
                <div class="p-6 text-center">
                  <span class="material-symbols-outlined text-4xl text-concrete-300 mb-2 block">note_add</span>
                  <p class="text-xs font-bold text-concrete-400 uppercase">No notes yet</p>
                  <p class="text-[10px] text-concrete-300 mt-1">Click "New Note" to start</p>
                </div>
              }
              @for(note of habitNotes(); track note.id) {
                <div class="px-4 py-3 border-b-2 border-black/10 cursor-pointer transition-all duration-150 hover:bg-white"
                     [class.bg-white]="activeNoteId() === note.id"
                     [class.border-l-4]="activeNoteId() === note.id"
                     [class.border-l-primary]="activeNoteId() === note.id"
                     [class.font-bold]="activeNoteId() === note.id"
                     (click)="selectNote(note)">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-black truncate">
                        {{ note.title || 'Untitled Note' }}
                      </p>
                      <p class="text-[10px] text-concrete-400 mt-0.5 font-mono">
                        {{ formatDate(note.updated_at) }}
                      </p>
                      @if(note.content) {
                        <p class="text-[11px] text-concrete-400 mt-1 line-clamp-2 leading-tight">
                          {{ stripHtml(note.content) }}
                        </p>
                      }
                    </div>
                    @if(note.is_pinned) {
                      <span class="material-symbols-outlined text-sm text-primary flex-shrink-0 mt-0.5">push_pin</span>
                    }
                  </div>
                  @if(note.tags && note.tags.length > 0) {
                    <div class="flex flex-wrap gap-1 mt-1.5">
                      @for(tag of note.tags.slice(0, 3); track tag) {
                        <span class="text-[9px] px-1.5 py-0.5 bg-black text-white font-bold uppercase">{{ tag }}</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Editor Area -->
            <div class="flex-1 flex flex-col overflow-hidden">
              @if(activeNoteId()) {
                <!-- Note Title -->
                <div class="flex items-center gap-2 px-6 py-3 border-b-2 border-black/10 bg-white">
                  <input type="text"
                         [ngModel]="activeNoteTitle()"
                         (ngModelChange)="updateNoteTitle($event)"
                         placeholder="Note title..."
                         class="flex-1 text-xl font-black text-black uppercase font-arvo outline-none bg-transparent placeholder:text-concrete-300" />
                  <div class="flex items-center gap-1">
                    <button (click)="togglePinNote()" 
                            class="p-1.5 hover:bg-concrete-100 transition-colors rigid-border-sm border-transparent hover:border-black"
                            [class.text-primary]="activeNote()?.is_pinned"
                            [title]="activeNote()?.is_pinned ? 'Unpin note' : 'Pin note'">
                      <span class="material-symbols-outlined text-lg">push_pin</span>
                    </button>
                    <button (click)="deleteActiveNote()" 
                            class="p-1.5 hover:bg-red-100 hover:text-red-600 transition-colors rigid-border-sm border-transparent hover:border-red-600"
                            title="Delete note">
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>

                <!-- Tags -->
                <div class="flex items-center gap-2 px-6 py-2 border-b border-black/5 bg-concrete-100/50">
                  <span class="material-symbols-outlined text-sm text-concrete-400">sell</span>
                  <input type="text"
                         [ngModel]="tagInput()"
                         (ngModelChange)="tagInput.set($event)"
                         (keydown.enter)="addTag()"
                         placeholder="Add tags (press Enter)"
                         class="flex-1 text-xs font-mono text-black outline-none bg-transparent placeholder:text-concrete-300" />
                  @for(tag of activeNote()?.tags || []; track tag) {
                    <span class="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-black text-white font-bold uppercase group">
                      {{ tag }}
                      <button (click)="removeTag(tag)" class="opacity-50 hover:opacity-100 ml-0.5">×</button>
                    </span>
                  }
                </div>

                <!-- Tiptap Editor -->
                <div class="flex-1 overflow-y-auto obsidian-editor">
                  <angular-tiptap-editor
                    [content]="activeNoteContent()"
                    (contentChange)="onEditorContentChange($event)"
                    [disabled]="isReadingMode()"
                    [config]="editorConfig"
                  />
                </div>

                <!-- Status Bar -->
                <div class="flex items-center justify-between px-6 py-1.5 border-t-2 border-black/10 bg-concrete-100 text-[10px] font-mono text-concrete-400 uppercase">
                  <span>{{ savingStatus() }}</span>
                  <span>Last saved: {{ formatDate(activeNote()?.updated_at) }}</span>
                </div>
              } @else {
                <div class="flex-1 flex items-center justify-center bg-concrete-100/30">
                  <div class="text-center">
                    <span class="material-symbols-outlined text-6xl text-concrete-200 mb-3 block">description</span>
                    <p class="text-sm font-bold text-concrete-400 uppercase">Select a note or create a new one</p>
                    <p class="text-xs text-concrete-300 mt-1 max-w-[300px]">
                      Use the rich editor to write detailed notes about your habits — track progress, insights, and ideas.
                    </p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Sections -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Focus Themes -->
        <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-lg">
          <h3 class="text-lg font-black text-black uppercase font-arvo border-b-4 border-black pb-2 mb-4">Focus Themes</h3>
          <div class="space-y-4">
            <div>
              <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest block mb-2">Primary Focus</label>
              <app-multi-select-chips
                [options]="monthHabitOptions()"
                [selectedIds]="reflection().primary_focus"
                (selectedIdsChange)="updatePrimaryFocus($event)"
                placeholder="Select primary focus habits"
              ></app-multi-select-chips>
            </div>
            <div>
              <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest block mb-2">Secondary Focus</label>
              <app-multi-select-chips
                [options]="monthHabitOptions()"
                [selectedIds]="reflection().secondary_focus"
                (selectedIdsChange)="updateSecondaryFocus($event)"
                placeholder="Select secondary focus habits"
              ></app-multi-select-chips>
            </div>
          </div>
        </div>

        <!-- Progress Tracker -->
        <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-lg">
          <h3 class="text-lg font-black text-black uppercase font-arvo border-b-4 border-black pb-2 mb-4">Progress Tracker</h3>
           <div class="space-y-4">
              <div>
                  <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Monthly Completion</label>
                  <div class="w-full bg-concrete-200 rigid-border-sm border-2 border-black h-6 mt-1">
                      <div class="bg-green-500 h-full text-center text-xs font-bold text-white flex items-center justify-center transition-all duration-300" [style.width.%]="completionPercentage()">
                          {{ completionPercentage() | number:'1.0-0' }}%
                      </div>
                  </div>
              </div>
              <div>
                  <label class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">Study Hours (Auto-calculated)</label>
                  <div class="w-full mt-1 px-3 py-2 bg-concrete-100 rigid-border-sm border-[2px] text-black font-mono text-sm">
                    {{ reflection().study_hours | number:'1.1-1' }} hours
                  </div>
              </div>
          </div>
        </div>

        <!-- Month Reflection -->
        <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-lg">
          <h3 class="text-lg font-black text-black uppercase font-arvo border-b-4 border-black pb-2 mb-4">Month Reflection</h3>
          <div class="space-y-3">
             <textarea [ngModel]="reflection().targeted_goals" (ngModelChange)="onReflectionFieldChange('targeted_goals', $event)" placeholder="Targeted Goals (Start of Month)" rows="2" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             <textarea [ngModel]="reflection().achieved_goals" (ngModelChange)="onReflectionFieldChange('achieved_goals', $event)" placeholder="Actually Achieved Goals" rows="2" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             <textarea [ngModel]="reflection().worked" (ngModelChange)="onReflectionFieldChange('worked', $event)" placeholder="What worked?" rows="2" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             <textarea [ngModel]="reflection().failed" (ngModelChange)="onReflectionFieldChange('failed', $event)" placeholder="What failed?" rows="2" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             <textarea [ngModel]="reflection().improve" (ngModelChange)="onReflectionFieldChange('improve', $event)" placeholder="What to improve next month?" rows="2" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { height: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #e5e5e5; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: black; }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .note-panel-animate {
      animation: slideDown 0.25s ease-out;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Obsidian-like Editor Styling */
    .obsidian-editor {
      --ate-bg: #ffffff;
      --ate-text: #1a1a1a;
      --ate-border: #e5e5e5;
      --ate-primary: #2b8cee;
      --ate-border-radius: 0px;
    }

    :host-context(.dark) .obsidian-editor {
      --ate-bg: #1a1a1a;
      --ate-text: #ffffff;
      --ate-border: #333;
    }

    :host-context(.dark) .bg-white { background-color: #1a1a1a !important; }
    :host-context(.dark) .text-black { color: #ffffff !important; }
    :host-context(.dark) .border-black { border-color: #ffffff !important; }
    :host-context(.dark) .bg-concrete-100 { background-color: #262626 !important; }

    /* Code Block Styling Fix */
    :host ::ng-deep .obsidian-editor .ate-content pre {
      background: #0d0d0d !important;
      color: #e5e5e5 !important;
      padding: 1rem !important;
      border: 2px solid #000 !important;
      border-radius: 4px !important;
      font-family: 'Space Mono', monospace !important;
    }
    
    :host-context(.dark) ::ng-deep .obsidian-editor .ate-content pre {
       border-color: #555 !important;
    }
    
    :host ::ng-deep .obsidian-editor .ate-content pre code {
      background: transparent !important;
      color: inherit !important;
      padding: 0 !important;
      border: none !important;
      font-size: 0.9em !important;
    }

    /* Table Styling Fix */
    :host ::ng-deep .obsidian-editor .ate-content table {
      border: 2px solid #000 !important;
      border-collapse: collapse !important;
      width: 100% !important;
      margin: 1.5em 0 !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content th,
    :host ::ng-deep .obsidian-editor .ate-content td {
      border: 1px solid #000 !important;
      padding: 8px 12px !important;
      position: relative !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content th {
      background: #f0f0f0 !important;
      font-weight: 700 !important;
      text-align: left !important;
    }

    /* Bubble Menu & Selection Fix */
    :host ::ng-deep .tippy-box {
      background-color: #000 !important;
      color: #fff !important;
      border-radius: 0 !important;
      border: 2px solid #fff !important;
      box-shadow: 4px 4px 0 rgba(0,0,0,0.2) !important;
    }
    
    :host ::ng-deep .tippy-box .tippy-content {
      padding: 4px !important;
    }
    :host ::ng-deep .tippy-box .tippy-content .bubble-menu {
      display: flex !important;
      flex-direction: row !important;
    }
    
    :host ::ng-deep .tippy-arrow {
      color: #000 !important;
    }

    :host ::ng-deep .obsidian-editor ::selection {
      background-color: rgba(43, 140, 238, 0.3) !important;
      color: inherit !important;
    }

    :host ::ng-deep .obsidian-editor .ate-editor {
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    :host ::ng-deep .obsidian-editor .ate-toolbar {
      border-bottom: 2px solid #e5e5e5 !important;
      border-radius: 0 !important;
      background: #fafafa !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content {
      font-family: 'Space Mono', 'JetBrains Mono', monospace !important;
      font-size: 14px !important;
      line-height: 1.8 !important;
      padding: 24px 32px !important;
      min-height: 350px !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content h1,
    :host ::ng-deep .obsidian-editor .ate-content h2,
    :host ::ng-deep .obsidian-editor .ate-content h3 {
      font-family: 'Arvo', serif !important;
      font-weight: 900 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      border-bottom: 3px solid #000 !important;
      padding-bottom: 6px !important;
      margin-bottom: 16px !important;
    }

    :host-context(.dark) ::ng-deep .obsidian-editor .ate-content h1,
    :host-context(.dark) ::ng-deep .obsidian-editor .ate-content h2,
    :host-context(.dark) ::ng-deep .obsidian-editor .ate-content h3 {
        border-bottom-color: #ffffff !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content h1 { font-size: 1.75em !important; }
    :host ::ng-deep .obsidian-editor .ate-content h2 { font-size: 1.4em !important; }
    :host ::ng-deep .obsidian-editor .ate-content h3 { font-size: 1.15em !important; border-bottom-width: 2px !important; }

    :host ::ng-deep .obsidian-editor .ate-content blockquote {
      border-left: 4px solid #000 !important;
      background: #f5f5f5 !important;
      padding: 12px 16px !important;
      margin: 12px 0 !important;
      font-style: italic !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content code {
      background: #f0f0f0 !important;
      padding: 2px 6px !important;
      border: 1px solid #ccc !important;
      font-family: 'Space Mono', monospace !important;
      font-size: 0.9em !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content ul,
    :host ::ng-deep .obsidian-editor .ate-content ol {
      padding-left: 24px !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content li {
      margin-bottom: 4px !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content hr {
      border: none !important;
      border-top: 3px solid #000 !important;
      margin: 24px 0 !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content a {
      color: #2b8cee !important;
      text-decoration: underline !important;
      font-weight: 700 !important;
    }

    :host ::ng-deep .obsidian-editor .ate-footer {
      border-top: 2px solid #e5e5e5 !important;
      border-radius: 0 !important;
    }

    /* Fix for Disabled/Reading Mode Visibility */
    :host ::ng-deep .obsidian-editor .ate-content[contenteditable="false"],
    :host ::ng-deep .obsidian-editor .ate-content [contenteditable="false"],
    :host ::ng-deep .obsidian-editor .is-disabled .ate-editor .ate-content  {
      opacity: 1 !important;
      background-color: white !important;
      color: black !important;
    }

    :host ::ng-deep .obsidian-editor .ate-content[contenteditable="false"] a {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
  `],
  host: {
    '[class]': '"block h-full"'
  }
})
export class MonthlyViewComponent implements OnInit, OnDestroy {
  private plannerService = inject(PlannerService);
  private habitService = inject(HabitService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private injector = inject(Injector);
  
  private destroy$ = new Subject<void>();
  private reflectionSave$ = new Subject<void>();
  private noteSave$ = new Subject<void>();

  // Helper for template
  isNumber(val: any): boolean {
    return typeof val === 'number';
  }

  currentDate = signal(new Date());
  currentYear = computed(() => this.currentDate().getFullYear());
  currentMonth = computed(() => this.currentDate().getMonth() + 1);

  daysInMonth = computed(() => {
    const days = new Date(this.currentYear(), this.currentMonth(), 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  });

  habits = signal<MonthlyHabit[]>([]);

  // Gathers all habits active for the current month and merges their completion data.
  monthHabits = computed<MonthlyHabit[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const currentCompletions = this.habits();
    const allHabitsFromService = this.habitService.habits();

    // First, filter all habits from the service to get only the ones active in the current month
    const activeHabits = allHabitsFromService.filter(fullHabit => {
      // If no date range is specified, the habit is always active.
      if (!fullHabit.startDate && !fullHabit.endDate) return true;
      
      const startDate = fullHabit.startDate ? new Date(fullHabit.startDate) : null;
      const endDate = fullHabit.endDate ? new Date(fullHabit.endDate) : null;
      
      // The habit is considered inactive if its start date is after the month ends,
      // or its end date is before the month starts.
      if (startDate && startDate > monthEnd) return false;
      if (endDate && endDate < monthStart) return false;
      
      return true;
    });

    // Now, map over the active habits and merge in any existing completion data
    return activeHabits.map(habit => {
      const completionData = currentCompletions.find(h => h.id === habit.id);
      return {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        completions: completionData ? { ...completionData.completions } : {}
      } as MonthlyHabit;
    });
  });
  
  // Convert month habits to MultiSelectOption format for the focus theme selectors
  monthHabitOptions = computed<MultiSelectOption[]>(() => 
    this.monthHabits().map(h => ({ id: h.id, name: h.name }))
  );
  
  reflection = signal<MonthlyReflection>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    primary_focus: [],
    secondary_focus: [],
    targeted_goals: '',
    achieved_goals: '',
    worked: '',
    failed: '',
    improve: '',
    study_hours: 0
  });

  // === NOTES STATE ===
  selectedHabitId = signal<string | null>(null);
  selectedHabitName = signal<string>('');
  habitNotes = signal<HabitNote[]>([]);
  activeNoteId = signal<string | null>(null);
  activeNoteTitle = signal<string>('');
  activeNoteContent = signal<string>('');
  tagInput = signal<string>('');
  savingStatus = signal<string>('READY');
  isFullScreen = signal<boolean>(false);
  isReadingMode = signal<boolean>(false);
  isDownloadMenuOpen = signal<boolean>(false);

  toggleFullScreen() {
    this.isFullScreen.update(v => !v);
  }

  toggleReadingMode() {
    this.isReadingMode.update(v => !v);
  }

  toggleDownloadMenu() {
    this.isDownloadMenuOpen.update(v => !v);
  }

  closeDownloadMenu() {
    this.isDownloadMenuOpen.set(false);
  }

  saveCurrentNoteImmediately() {
    const id = this.activeNoteId();
    if (!id) return;

    const original = this.habitNotes().find(n => n.id === id);
    if (!original) return;

    const currentTitle = this.activeNoteTitle();
    const currentContent = this.activeNoteContent();

    if (currentTitle !== original.title || currentContent !== original.content) {
      this.plannerService.updateHabitNote(id, {
        title: currentTitle,
        content: currentContent
      }).subscribe({
        next: (updated) => {
          this.habitNotes.update(notes =>
            notes.map(n => n.id === id ? { ...n, updated_at: updated.updated_at, title: currentTitle, content: currentContent } : n)
          );
          this.savingStatus.set('SAVED ✓');
          setTimeout(() => this.savingStatus.set('READY'), 2000);
        },
        error: (err) => console.error('Failed to save note immediately', err)
      });
    }
  }

  downloadNote(format: 'md' | 'pdf' | 'txt') {
    const note = this.activeNote();
    if (!note) return;
    this.closeDownloadMenu();

    const title = this.activeNoteTitle() || 'Untitled Note';
    const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'txt') {
      const text = `${title}\n\n${this.stripHtml(this.activeNoteContent())}`;
      this.downloadFile(`${filename}.txt`, text, 'text/plain');
    } else if (format === 'md') {
      const md = `# ${title}\n\n${this.htmlToMarkdown(this.activeNoteContent())}`;
      this.downloadFile(`${filename}.md`, md, 'text/markdown');
    } else if (format === 'pdf') {
      this.printToPdf(title, this.activeNoteContent());
    }
  }

  downloadFile(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  htmlToMarkdown(html: string): string {
    let md = html || '';
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<ul[^>]*>/gi, '');
    md = md.replace(/<\/ul>/gi, '\n');
    md = md.replace(/<ol[^>]*>/gi, '');
    md = md.replace(/<\/ol>/gi, '\n');
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n');
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    md = md.replace(/<p[^>]*>/gi, '');
    md = md.replace(/<\/p>/gi, '\n\n');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<[^>]+>/g, '');
    const txt = document.createElement('textarea');
    txt.innerHTML = md;
    return txt.value.trim();
  }

  printToPdf(title: string, content: string) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; font-family: sans-serif; }
          blockquote { border-left: 4px solid #ccc; padding-left: 10px; color: #555; margin: 10px 0; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-family: monospace; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div>${content}</div>
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body>
      </html>
    `);
    w.document.close();
  }

  activeNote = computed(() => {
    const id = this.activeNoteId();
    if (!id) return null;
    return this.habitNotes().find(n => n.id === id) || null;
  });

  // Editor config — Obsidian-like setup
  editorConfig = {
    placeholder: 'Start writing your note... Type / for slash commands',
    showFooter: true,
    showCharacterCount: true,
    showWordCount: true,
    enableSlashCommands: true,
    showEditToggle: false,
    blockControls: 'inside' as const,
    spellcheck: true,
    toolbar: {
      bold: true,
      italic: true,
      underline: true,
      strike: true,
      code: true,
      codeBlock: true,
      heading1: true,
      heading2: true,
      heading3: true,
      bulletList: true,
      orderedList: true,
      blockquote: true,
      link: true,
      image: true,
      horizontalRule: true,
      table: true,
      highlight: true,
      textColor: true,
      alignLeft: true,
      alignCenter: true,
      alignRight: true,
      undo: true,
      redo: true,
      clear: true,
      separator: true,
    },
    slashCommands: {
      heading1: true,
      heading2: true,
      heading3: true,
      bulletList: true,
      orderedList: true,
      blockquote: true,
      code: true,
      image: true,
      horizontalRule: true,
      table: true,
    }
  };

  // Check if a given day is today in the current viewed month
  isToday(day: number): boolean {
    const now = new Date();
    return now.getFullYear() === this.currentYear() &&
           (now.getMonth() + 1) === this.currentMonth() &&
           now.getDate() === day;
  }

  // Check if a given day is in the future
  isFutureDay(day: number): boolean {
    const now = new Date();
    const cellDate = new Date(this.currentYear(), this.currentMonth() - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return cellDate > today;
  }

  ngOnInit() {
    this.reflectionSave$.pipe(
      debounceTime(800),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.doSaveReflection();
    });

    this.noteSave$.pipe(
      debounceTime(600),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.doSaveNote();
    });

    this.route.queryParams.pipe(take(1)).subscribe(params => {
      const habitId = params['habitId'];
      const dateStr = params['date'];

      if (dateStr) {
        this.currentDate.set(new Date(dateStr));
      }

      this.loadDataForMonth();

      if (habitId) {
        const effectRef = effect(() => {
          const habits = this.monthHabits();
          if (habits.length > 0) {
            const habitToSelect = habits.find(h => h.id === habitId);
            if (habitToSelect) {
              this.selectHabitForNotes(habitToSelect);
              this.router.navigate([], { queryParams: { habitId: null, date: null }, queryParamsHandling: 'merge' });
            }
            effectRef.destroy();
          }
        }, { injector: this.injector });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDataForMonth() {
    const year = this.currentYear();
    const month = this.currentMonth();
    
    // Reset reflection immediately for the new month while loading
    this.reflection.set({
      year,
      month,
      primary_focus: [],
      secondary_focus: [],
      targeted_goals: '',
      achieved_goals: '',
      worked: '',
      failed: '',
      improve: '',
      study_hours: 0
    });

    // Load habit completions - show all habits that have completions for this month
    this.plannerService.getHabitCompletions(year, month).subscribe({
      next: (completions) => {
        const habitList: MonthlyHabit[] = Object.entries(completions).map(([id, data]) => {
          const processedCompletions: { [day: number]: boolean | number | null } = {};

          // Process each day's completion
          for (const dayKey in data.completions) {
            const day = parseInt(dayKey, 10);
            const value = data.completions[dayKey as any];

            // For yes/no habits, convert numeric values from the DB (1, 0) to booleans
            if (data.type === 'yes_no') {
              if (value === 1 || value === true) {
                processedCompletions[day] = true;
              } else if (value === 0 || value === false) {
                processedCompletions[day] = false;
              } else {
                processedCompletions[day] = null;
              }
            } else {
              // Measurable habits keep the numeric value
              processedCompletions[day] = value;
            }
          }

          return {
            id,
            name: data.name,
            type: data.type,
            completions: processedCompletions
          };
        });
        this.habits.set(habitList);
      },
      error: (err) => {
        console.error('Failed to load habit completions', err);
        this.habits.set([]);
      }
    });

    // Load monthly reflection
    this.plannerService.getReflection(year, month).subscribe({
      next: (refl) => {
        // Ensure arrays exist (backend might return null for empty arrays)
        this.reflection.set({
          ...refl,
          primary_focus: refl.primary_focus || [],
          secondary_focus: refl.secondary_focus || [],
          targeted_goals: refl.targeted_goals || '',
          achieved_goals: refl.achieved_goals || '',
          worked: refl.worked || '',
          failed: refl.failed || '',
          improve: refl.improve || '',
          study_hours: refl.study_hours || 0
        });
        // Load study hours
        this.loadStudyHours();
      },
      error: (err) => {
        console.error('Failed to load reflection', err);
      }
    });
  }

  loadStudyHours() {
    const year = this.currentYear();
    const month = this.currentMonth();
    
    this.plannerService.getStudyHours(year, month).subscribe({
      next: (data) => {
        this.reflection.update(r => ({ ...r, study_hours: data.study_hours }));
      },
      error: (err) => {
        console.error('Failed to load study hours', err);
      }
    });
  }

  /**
   * Called from template when a reflection text field changes.
   * Updates the signal immediately (so the UI stays in sync) but
   * debounces the actual save to the backend.
   */
  onReflectionFieldChange(field: keyof MonthlyReflection, value: string) {
    this.reflection.update(r => ({ ...r, [field]: value }));
    this.reflectionSave$.next();
  }

  private doSaveReflection() {
    const year = this.currentYear();
    const month = this.currentMonth();
    const refl = this.reflection();
    
    this.plannerService.updateReflection(year, month, {
      primary_focus: refl.primary_focus,
      secondary_focus: refl.secondary_focus,
      targeted_goals: refl.targeted_goals,
      achieved_goals: refl.achieved_goals,
      worked: refl.worked,
      failed: refl.failed,
      improve: refl.improve
    }).subscribe({
      error: (err) => console.error('Failed to save reflection', err)
    });
  }

  updatePrimaryFocus(selectedIds: string[]) {
    this.reflection.update(r => ({ ...r, primary_focus: selectedIds }));
    this.doSaveReflection();
  }

  updateSecondaryFocus(selectedIds: string[]) {
    this.reflection.update(r => ({ ...r, secondary_focus: selectedIds }));
    this.doSaveReflection();
  }

  changeMonth(delta: number) {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    this.currentDate.set(newDate);
    this.closeNotesPanel();
    this.loadDataForMonth();
  }

  toggleCompletion(habit: MonthlyHabit, day: number) {
    // Don't allow toggling future days
    if (this.isFutureDay(day)) return;

    const year = this.currentYear();
    const month = this.currentMonth();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const currentStatus = habit.completions[day];
    let newValue: number | boolean | null;

    if (habit.type === 'measurable') {
      const currentVal = typeof currentStatus === 'number' ? currentStatus : 0;
      const input = window.prompt(`Enter value for ${habit.name} on day ${day}:`, currentVal.toString());
      if (input === null) return; // Cancelled
      
      const parsed = parseFloat(input);
      if (isNaN(parsed)) return;
      newValue = parsed;
    } else {
      // Binary (yes_no) logic: null/undefined -> true -> false -> null
      if (currentStatus === null || currentStatus === undefined) {
        newValue = true;
      } else if (currentStatus === true) {
        newValue = false;
      } else {
        newValue = null;
      }
    }

    if (newValue === null) {
      // Clear/untoggle: send empty payload (no value, no notes)
      // Backend deletes the existing log when value and notes are both missing
      this.habitService.updateLog(habit.id, dateStr, {}).subscribe({
        next: () => {
          this.updateLocalCompletion(habit.id, day, null);
        },
        error: (err) => {
          console.error('Failed to clear completion', err);
        }
      });
    } else {
      // Set value: true/false for yes_no, numeric for measurable
      const apiValue = typeof newValue === 'boolean' ? (newValue ? 1 : 0) : newValue;

      this.habitService.updateLog(habit.id, dateStr, { value: apiValue }).subscribe({
        next: () => {
          this.updateLocalCompletion(habit.id, day, newValue);
        },
        error: (err) => {
          console.error('Failed to update completion', err);
        }
      });
    }
  }

  private updateLocalCompletion(habitId: string, day: number, value: any) {
    this.habits.update(prevHabits => {
      const index = prevHabits.findIndex(h => h.id === habitId);
      if (index !== -1) {
        const updatedHabits = [...prevHabits];
        updatedHabits[index] = {
          ...updatedHabits[index],
          completions: {
            ...updatedHabits[index].completions,
            [day]: value
          }
        };
        return updatedHabits;
      } else {
        // If the habit wasn't in the completions list, add it.
        const habitInfo = this.habitService.habits().find(h => h.id === habitId);
        return [...prevHabits, {
          id: habitId,
          name: habitInfo?.name || 'Unknown Habit',
          type: habitInfo?.type || 'yes_no',
          completions: { [day]: value }
        }];
      }
    });
  }

  /**
   * Calculates overall completion percentage for the month.
   * Uses monthHabits() (all active habits, not just those with completions).
   * For yes_no habits: true = completed.
   * For measurable habits: any numeric value > 0 = completed.
   */
  completionPercentage = computed(() => {
    const allHabits = this.monthHabits();
    const numDays = this.daysInMonth().length;
    if (allHabits.length === 0 || numDays === 0) return 0;

    // Only count days up to today for the current month
    const now = new Date();
    let effectiveDays = numDays;
    if (now.getFullYear() === this.currentYear() && 
        (now.getMonth() + 1) === this.currentMonth()) {
      effectiveDays = Math.min(now.getDate(), numDays);
    }
    
    if (effectiveDays === 0) return 0;
    
    const totalPossible = allHabits.length * effectiveDays;
    const totalCompleted = allHabits.reduce((sum, habit) => {
      let habitCompleted = 0;
      for (let d = 1; d <= effectiveDays; d++) {
        const val = habit.completions[d];
        if (val === true) {
          habitCompleted++;
        } else if (habit.type === 'measurable' && typeof val === 'number' && val > 0) {
          habitCompleted++;
        }
      }
      return sum + habitCompleted;
    }, 0);
    
    return (totalCompleted / totalPossible) * 100;
  });

  getMonthName(month: number): string {
    return new Date(this.currentYear(), month - 1).toLocaleString('default', { month: 'long' });
  }

  // === NOTES METHODS ===

  selectHabitForNotes(habit: MonthlyHabit) {
    if (this.selectedHabitId() === habit.id) {
      // Already selected, toggle off
      this.closeNotesPanel();
      return;
    }
    this.selectedHabitId.set(habit.id);
    this.selectedHabitName.set(habit.name);
    this.activeNoteId.set(null);
    this.activeNoteTitle.set('');
    this.activeNoteContent.set('');
    this.loadHabitNotes(habit.id);
  }

  closeNotesPanel() {
    this.selectedHabitId.set(null);
    this.selectedHabitName.set('');
    this.habitNotes.set([]);
    this.activeNoteId.set(null);
    this.activeNoteTitle.set('');
    this.activeNoteContent.set('');
  }

  loadHabitNotes(habitId: string) {
    this.plannerService.getHabitNotes(habitId).subscribe({
      next: (notes) => {
        this.habitNotes.set(notes);
        // Auto-select first note if any
        if (notes.length > 0) {
          this.selectNote(notes[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load habit notes', err);
        this.habitNotes.set([]);
      }
    });
  }

  selectNote(note: HabitNote) {
    if (this.activeNoteId() === note.id) return;
    this.saveCurrentNoteImmediately();

    // Force re-initialization of editor component to ensure content updates properly
    this.activeNoteId.set(null); // Triggers destruction
    setTimeout(() => {
        this.activeNoteId.set(note.id || null); // Triggers re-creation with new content
        this.activeNoteTitle.set(note.title || '');
        this.activeNoteContent.set(note.content || '');
        this.tagInput.set('');
    }, 0);
  }

  createNewNote() {
    const habitId = this.selectedHabitId();
    if (!habitId) return;

    const newNote: Partial<HabitNote> = {
      habit_id: habitId,
      title: 'Untitled Note',
      content: '<p></p>',
      tags: [],
      is_pinned: false
    };

    this.plannerService.createHabitNote(newNote).subscribe({
      next: (created) => {
        this.habitNotes.update(notes => [created, ...notes]);
        this.selectNote(created);
      },
      error: (err) => console.error('Failed to create note', err)
    });
  }

  updateNoteTitle(title: string) {
    this.activeNoteTitle.set(title);
    // Update locally
    const noteId = this.activeNoteId();
    if (noteId) {
      this.habitNotes.update(notes => 
        notes.map(n => n.id === noteId ? { ...n, title } : n)
      );
    }
    this.noteSave$.next();
  }

  onEditorContentChange(html: string) {
    // Only save if it's actually different from what we have
    if (html === this.activeNoteContent()) return;
    
    this.activeNoteContent.set(html);
    // Update locally
    const noteId = this.activeNoteId();
    if (noteId) {
      this.habitNotes.update(notes =>
        notes.map(n => n.id === noteId ? { ...n, content: html } : n)
      );
    }
    this.noteSave$.next();
  }

  private doSaveNote() {
    const noteId = this.activeNoteId();
    if (!noteId) return;

    this.savingStatus.set('SAVING...');

    this.plannerService.updateHabitNote(noteId, {
      title: this.activeNoteTitle(),
      content: this.activeNoteContent()
    }).subscribe({
      next: (updated) => {
        this.savingStatus.set('SAVED ✓');
        this.habitNotes.update(notes =>
          notes.map(n => n.id === noteId ? { ...n, updated_at: updated.updated_at } : n)
        );
        setTimeout(() => this.savingStatus.set('READY'), 2000);
      },
      error: (err) => {
        console.error('Failed to save note', err);
        this.savingStatus.set('SAVE FAILED ✘');
        setTimeout(() => this.savingStatus.set('READY'), 3000);
      }
    });
  }

  togglePinNote() {
    const note = this.activeNote();
    if (!note?.id) return;

    const newPinned = !note.is_pinned;
    this.plannerService.updateHabitNote(note.id, { is_pinned: newPinned }).subscribe({
      next: () => {
        this.habitNotes.update(notes =>
          notes.map(n => n.id === note.id ? { ...n, is_pinned: newPinned } : n)
        );
      },
      error: (err) => console.error('Failed to toggle pin', err)
    });
  }

  addTag() {
    const tag = this.tagInput().trim();
    if (!tag) return;
    
    const note = this.activeNote();
    if (!note?.id) return;

    const currentTags = note.tags || [];
    if (currentTags.includes(tag)) {
      this.tagInput.set('');
      return;
    }

    const newTags = [...currentTags, tag];
    this.plannerService.updateHabitNote(note.id, { tags: newTags }).subscribe({
      next: () => {
        this.habitNotes.update(notes =>
          notes.map(n => n.id === note.id ? { ...n, tags: newTags } : n)
        );
        this.tagInput.set('');
      },
      error: (err) => console.error('Failed to add tag', err)
    });
  }

  removeTag(tag: string) {
    const note = this.activeNote();
    if (!note?.id) return;

    const newTags = (note.tags || []).filter(t => t !== tag);
    this.plannerService.updateHabitNote(note.id, { tags: newTags }).subscribe({
      next: () => {
        this.habitNotes.update(notes =>
          notes.map(n => n.id === note.id ? { ...n, tags: newTags } : n)
        );
      },
      error: (err) => console.error('Failed to remove tag', err)
    });
  }

  deleteActiveNote() {
    const noteId = this.activeNoteId();
    if (!noteId) return;

    if (!confirm('Delete this note permanently?')) return;

    this.plannerService.deleteHabitNote(noteId).subscribe({
      next: () => {
        this.habitNotes.update(notes => notes.filter(n => n.id !== noteId));
        this.activeNoteId.set(null);
        this.activeNoteTitle.set('');
        this.activeNoteContent.set('');
        
        // Select first remaining note if any
        const remaining = this.habitNotes();
        if (remaining.length > 0) {
          this.selectNote(remaining[0]);
        }
      },
      error: (err) => console.error('Failed to delete note', err)
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
