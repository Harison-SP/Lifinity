import { Component, signal, inject, OnInit, OnDestroy, computed, effect, Injector } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlannerService, HabitNote } from '../../services/planner.service';
import { HabitService } from '../../services/habit.service';
import { AngularTiptapEditorComponent } from '@flogeez/angular-tiptap-editor';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, take, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

interface HabitSimple {
  id: string;
  name: string;
}

@Component({
  selector: 'app-note-taking',
  standalone: true,
  imports: [FormsModule, AngularTiptapEditorComponent],
  template: `
    <div class="h-full flex flex-col font-manrope p-3 sm:p-4 gap-5 sm:gap-6 overflow-x-hidden bg-white dark:bg-white">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <button (click)="goBack()" class="p-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rigid-border-sm border-[2px] dark:border-concrete-100 dark:text-white">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 class="text-2xl font-black text-black dark:text-white uppercase font-arvo">
            Notes for {{ selectedHabitName() }}
          </h2>
          @if (isSystemHabit()) {
            <div class="flex items-center gap-1.5 px-3 py-1 bg-charcoal text-white rounded-full text-[10px] font-black uppercase tracking-widest md:ml-4 shadow-sm border border-white/10 animate-in slide-in-from-left duration-500">
              <span class="material-symbols-outlined text-xs">settings_input_component</span> System: {{ parentHabit()?.name }}
            </div>
          }
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button (click)="createNewNote()"
                  class="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white font-bold text-xs uppercase hover:bg-orange-400 transition-colors rounded-lg shadow-gentle">
            <span class="material-symbols-outlined text-sm">add</span>
            New Note
          </button>
          @if(activeNoteId()) {
            <button (click)="toggleFullScreen()"
                    class="p-1 hover:bg-primary/20 transition-colors rounded"
                    [title]="isFullScreen() ? 'Exit Full Screen' : 'Full Screen'">
              <span class="material-symbols-outlined text-black dark:text-white">{{ isFullScreen() ? 'fullscreen_exit' : 'fullscreen' }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex flex-col md:flex-row min-h-[500px] max-h-[80vh] gap-4">
        <!-- Notes Sidebar -->
        <div class="w-full md:w-[280px] max-h-[300px] md:max-h-none border-b-4 md:border-b-0 md:border-r-4 border-black dark:border-white bg-alabaster overflow-y-auto custom-scrollbar flex-shrink-0">
          @if(habitNotes().length === 0) {
            <div class="p-6 text-center">
              <span class="material-symbols-outlined text-4xl text-taupe mb-2 block">note_add</span>
              <p class="text-xs font-bold text-taupe uppercase">No notes yet</p>
              <p class="text-[10px] text-taupe mt-1">Click "New Note" to start</p>
            </div>
          }
          @for(note of sortedNotes(); track note.id) {
            <div class="px-4 py-3 border-b-2 border-taupe/20 cursor-pointer transition-all duration-150 hover:bg-sand dark:hover:bg-sand/30"
                 [class.bg-white]="activeNoteId() === note.id"
                 [class.border-l-4]="activeNoteId() === note.id"
                 [class.border-l-primary]="activeNoteId() === note.id"
                 [class.font-bold]="activeNoteId() === note.id"
                 (click)="selectNote(note)">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-charcoal truncate">
                    {{ note.title || 'Untitled Note' }}
                  </p>
                  <p class="text-[10px] text-taupe mt-0.5 font-mono">
                    {{ formatDate(note.updated_at) }}
                  </p>
                  @if(note.content) {
                    <p class="text-[11px] text-taupe mt-1 line-clamp-2 leading-tight">
                      {{ stripHtml(note.content) }}
                    </p>
                  }
                </div>
                @if(note.is_pinned) {
                  <span class="material-symbols-outlined text-sm text-orange-500 flex-shrink-0 mt-0.5">push_pin</span>
                }
              </div>
              @if(note.tags && note.tags.length > 0) {
                <div class="flex flex-wrap gap-1 mt-1.5">
                  @for(tag of note.tags.slice(0, 3); track tag) {
                    <span class="text-[9px] px-1.5 py-0.5 bg-orange-500 text-white font-bold uppercase">{{ tag }}</span>
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
            <div class="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-3 border-b-2 border-taupe/20 bg-white dark:bg-alabaster">
              <input type="text"
                     [ngModel]="activeNoteTitle()"
                     (ngModelChange)="updateNoteTitle($event)"
                     placeholder="Note title..."
                     class="flex-1 text-xl font-black text-charcoal uppercase font-arvo outline-none bg-transparent placeholder:text-taupe" />
              <div class="flex items-center gap-1">
                <button (click)="togglePinNote()"
                        class="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors rigid-border-sm border-transparent hover:border-orange-500"
                        [class.text-orange-500]="activeNote()?.is_pinned"
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
            <div class="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2 border-b border-taupe/20 bg-sand/30">
              <span class="material-symbols-outlined text-sm text-taupe">sell</span>
              <input type="text"
                     [ngModel]="tagInput()"
                     (ngModelChange)="tagInput.set($event)"
                     (keydown.enter)="addTag()"
                     placeholder="Add tags (press Enter)"
                     class="flex-1 text-xs font-mono text-charcoal outline-none bg-transparent placeholder:text-taupe" />
              @for(tag of activeNote()?.tags || []; track tag) {
                <span class="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-orange-500 text-white font-bold uppercase group">
                  {{ tag }}
                  <button (click)="removeTag(tag)" class="opacity-50 hover:opacity-100 ml-0.5">×</button>
                </span>
              }
            </div>

            <!-- Tiptap Editor -->
            <div class="flex-1 overflow-y-auto note-editor">
              <angular-tiptap-editor
                [content]="activeNoteContent()"
                (contentChange)="onEditorContentChange($event)"
                [disabled]="isReadingMode()"
                [config]="editorConfig"
              />
            </div>

            <!-- Status Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 sm:px-6 py-1.5 border-t-2 border-taupe/20 bg-sand/30 text-[10px] font-mono text-taupe uppercase">
              <span>{{ savingStatus() }}</span>
              <span>Last saved: {{ formatDate(activeNote()?.updated_at) }}</span>
            </div>
          } @else {
            <div class="flex-1 flex items-center justify-center bg-alabaster/50">
              <div class="text-center">
                <span class="material-symbols-outlined text-6xl text-taupe mb-3 block">description</span>
                <p class="text-sm font-bold text-taupe uppercase">Select a note or create a new one</p>
                <p class="text-xs text-taupe mt-1 max-w-[300px]">
                  Use the rich editor to write detailed notes about your habits — track progress, insights, and ideas.
                </p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Download Menu (when active note) -->
      @if(isDownloadMenuOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="toggleDownloadMenu()">
          <div class="bg-white dark:bg-alabaster rigid-border border-[4px] p-6 min-w-[300px] brutalist-shadow-lg" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-black text-charcoal uppercase font-arvo border-b-4 border-taupe pb-2 mb-4">Download Note</h3>
            <div class="space-y-2">
              <button (click)="downloadNote('txt'); toggleDownloadMenu()" class="w-full px-4 py-3 bg-sand hover:bg-sand-dark text-charcoal font-bold text-sm uppercase border-2 border-taupe transition-colors">
                Text (.txt)
              </button>
              <button (click)="downloadNote('md'); toggleDownloadMenu()" class="w-full px-4 py-3 bg-sand hover:bg-sand-dark text-charcoal font-bold text-sm uppercase border-2 border-taupe transition-colors">
                Markdown (.md)
              </button>
              <button (click)="downloadNote('pdf'); toggleDownloadMenu()" class="w-full px-4 py-3 bg-sand hover:bg-sand-dark text-charcoal font-bold text-sm uppercase border-2 border-taupe transition-colors">
                PDF
              </button>
            </div>
            <button (click)="toggleDownloadMenu()" class="mt-4 w-full px-4 py-2 bg-taupe/20 hover:bg-taupe/30 text-taupe font-bold text-xs uppercase">
              Cancel
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--color-sand); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-taupe); border-radius: 10px; }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .note-editor {
      --ate-bg: var(--color-alabaster);
      --ate-text: var(--color-charcoal);
      --ate-border: var(--color-taupe);
      --ate-primary: var(--color-primary);
      --ate-border-radius: 0px;
    }

    :host-context(.dark) .note-editor {
      --ate-bg: #272623;
      --ate-text: #fcfaf8;
      --ate-border: #666;
    }

    /* Editor Dark Mode Overrides */
    :host-context(.dark) ::ng-deep .note-editor .ate-content {
      background-color: var(--ate-bg) !important;
      color: var(--ate-text) !important;
    }

    :host-context(.dark) ::ng-deep .note-editor .ate-toolbar {
      background-color: #1a1a1a !important;
      border-bottom-color: var(--ate-border) !important;
    }

    :host-context(.dark) ::ng-deep .note-editor .ate-content h1,
    :host-context(.dark) ::ng-deep .note-editor .ate-content h2,
    :host-context(.dark) ::ng-deep .note-editor .ate-content h3 {
      border-bottom-color: #ffffff !important;
    }

    :host-context(.dark) ::ng-deep .obsidian-editor .ate-content pre {
      background: #0d0d0d !important;
      color: #e5e5e5 !important;
      border-color: #555 !important;
    }
  `],
  host: {
    '[class]': '"block h-full"'
  }
})
export class NoteTakingComponent implements OnInit, OnDestroy {
  private plannerService = inject(PlannerService);
  private habitService = inject(HabitService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private injector = inject(Injector);

  private destroy$ = new Subject<void>();
  private noteSave$ = new Subject<void>();
  
  // Reactive route params & query params
  private routeHabitId = toSignal(this.route.paramMap.pipe(map(p => p.get('habitId'))));
  private routeMode = toSignal(this.route.queryParamMap.pipe(map(p => p.get('mode'))));
  private routeTaskTitle = toSignal(this.route.queryParamMap.pipe(map(p => p.get('taskTitle'))));
  private routeTaskDesc = toSignal(this.route.queryParamMap.pipe(map(p => p.get('taskDesc'))));

  // Habits list for selector
  availableHabits = computed(() => this.habitService.habits().filter(h => !h.archived));

  // Selected habit
  selectedHabitId = signal<string | null>(null);
  selectedHabit = computed(() => {
    const id = this.selectedHabitId();
    if (!id) return null;
    return this.availableHabits().find(h => h.id === id) || null;
  });
  selectedHabitName = computed(() => this.selectedHabit()?.name || 'Select Habit');

  // Notes state
  habitNotes = signal<HabitNote[]>([]);
  activeNoteId = signal<string | null>(null);
  activeNoteTitle = signal<string>('');
  activeNoteContent = signal<string>('');
  tagInput = signal<string>('');
  savingStatus = signal<string>('READY');
  isFullScreen = signal<boolean>(false);
  isReadingMode = signal<boolean>(false);
  isDownloadMenuOpen = signal<boolean>(false);

  // System Awareness
  isSystemHabit = computed(() => {
    const id = this.selectedHabitId();
    if (!id) return false;
    return !!this.habitService.habits().find(h => h.id === id)?.parentId;
  });

  parentHabit = computed(() => {
    const id = this.selectedHabitId();
    if (!id) return null;
    const habit = this.habitService.habits().find(h => h.id === id);
    if (!habit?.parentId) return null;
    return this.habitService.habits().find(h => h.id === habit.parentId) || null;
  });

  // Read-only computed
  activeNote = computed(() => {
    const id = this.activeNoteId();
    if (!id) return null;
    return this.habitNotes().find(n => n.id === id) || null;
  });

  // Sort notes: pinned first, then by updated date
  sortedNotes = computed(() => {
    const notes = [...this.habitNotes()];
    return notes.sort((a, b) => {
      // Pinned first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by updated date (newest first)
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  });

  // Editor config
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

  constructor() {
    // Effect: when selectedHabitId changes, load notes for that habit
    // Accessing selectedHabitId makes this effect re-run when it changes
    effect(() => {
      const habitId = this.selectedHabitId();
      if (habitId) {
        // Clear current notes state immediately before loading new ones
        this.habitNotes.set([]);
        this.activeNoteId.set(null);
        this.activeNoteTitle.set('');
        this.activeNoteContent.set('');
        
        this.loadHabitNotes(habitId);
      } else {
        this.habitNotes.set([]);
        this.activeNoteId.set(null);
        this.activeNoteTitle.set('');
        this.activeNoteContent.set('');
      }
    });

    // Effect: Synchronize selectedHabitId with route parameter
    effect(() => {
      const routeId = this.routeHabitId();
      const habits = this.availableHabits();
      
      if (routeId) {
        const found = habits.find(h => h.id === routeId);
        if (found && found.id !== this.selectedHabitId()) {
          this.selectedHabitId.set(found.id);
        }
      } else if (habits.length > 0 && !this.selectedHabitId()) {
        // Fallback to first habit if none in route and none selected
        this.selectedHabitId.set(habits[0].id);
      }
    });

    // Effect: Handle automatic note creation from query param
    effect(() => {
      const mode = this.routeMode();
      const habit = this.selectedHabit();
      const taskTitle = this.routeTaskTitle();
      const taskDesc = this.routeTaskDesc();
      
      if (mode === 'new' && habit) {
        // Construct heading/content: prioritize specific task title for the sidebar title,
        // and task description for the initial content.
        const systemTitle = habit.systemTitle || this.parentHabit()?.name;
        
        const noteHeading = taskTitle || systemTitle || habit.name;
        const initialContent = taskDesc ? `<p>${taskDesc}</p>` : `<h1>${noteHeading}</h1><p></p>`;
        const noteTitle = taskTitle || systemTitle || 'Untitled Note';
        
        // Use a small delay to ensure routing logic is settled
        setTimeout(() => {
          this.createNewNote(initialContent, noteTitle);
          // Clear query params to avoid re-triggering
          this.router.navigate([], { 
            relativeTo: this.route,
            queryParams: { mode: null, taskTitle: null, taskDesc: null }, 
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.noteSave$.pipe(
      debounceTime(600),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.doSaveNote();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.saveCurrentNoteImmediately();
  }

  goBack() {
    this.saveCurrentNoteImmediately();
    this.router.navigate(['/planner']);
  }

  selectHabitForNotes(habitId: string) {
    const habit = this.habitService.getHabitById(habitId) || this.availableHabits().find(h => h.id === habitId);
    if (!habit) return;

    this.selectedHabitId.set(habit.id);
    // Clearing is handled by the effect on selectedHabitId
  }

  loadHabitNotes(habitId: string) {
    this.plannerService.getHabitNotes(habitId).subscribe({
      next: (notes) => {
        this.habitNotes.set(notes);
        // Clear active note before setting new one to avoid cross-habit contamination
        this.activeNoteId.set(null);
        this.activeNoteTitle.set('');
        this.activeNoteContent.set('');
        
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

    this.activeNoteId.set(null);
    setTimeout(() => {
      this.activeNoteId.set(note.id || null);
      this.activeNoteTitle.set(note.title || '');
      this.activeNoteContent.set(note.content || '');
      this.tagInput.set('');
    }, 0);
  }

  createNewNote(initialContent?: string, noteTitle?: string) {
    const habitId = this.selectedHabitId();
    if (!habitId) return;

    const newNote: Partial<HabitNote> = {
      habit_id: habitId,
      title: noteTitle || 'Untitled Note',
      content: initialContent || '<p></p>',
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
    const noteId = this.activeNoteId();
    if (noteId) {
      this.habitNotes.update(notes =>
        notes.map(n => n.id === noteId ? { ...n, title } : n)
      );
    }
    this.noteSave$.next();
  }

  onEditorContentChange(html: string) {
    if (html === this.activeNoteContent()) return;

    this.activeNoteContent.set(html);
    const noteId = this.activeNoteId();
    if (noteId) {
      this.habitNotes.update(notes =>
        notes.map(n => n.id === noteId ? { ...n, content: html } : n)
      );
    }
    this.noteSave$.next();
  }

  private saveCurrentNoteImmediately() {
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
        this.savingStatus.set('SAVE FAILED ✗');
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

        const remaining = this.habitNotes();
        if (remaining.length > 0) {
          this.selectNote(remaining[0]);
        }
      },
      error: (err) => console.error('Failed to delete note', err)
    });
  }

  toggleFullScreen() {
    this.isFullScreen.update(v => !v);
  }

  toggleDownloadMenu() {
    this.isDownloadMenuOpen.update(v => !v);
  }

  downloadNote(format: 'md' | 'pdf' | 'txt') {
    const note = this.activeNote();
    if (!note) return;
    this.toggleDownloadMenu();

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
