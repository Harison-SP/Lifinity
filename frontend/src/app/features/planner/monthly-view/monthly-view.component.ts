import { Component, signal, inject, OnInit, OnDestroy, computed, Injector, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlannerService, MonthlyReflection, HabitCompletions, HabitNote } from '../../../services/planner.service';
import { HabitService } from '../../../services/habit.service';
import { MultiSelectChipsComponent, MultiSelectOption } from '../../../shared/components/multi-select-chips/multi-select-chips.component';
import { RouterModule } from '@angular/router';
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
  imports: [CommonModule, FormsModule, MultiSelectChipsComponent, RouterModule],
  template: `
    <div class="h-full flex flex-col font-body p-4 sm:p-6 gap-6 overflow-x-hidden bg-white paper-texture transition-colors duration-300">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <button (click)="changeMonth(-1)" 
                  class="p-2 bg-white rounded-lg shadow-gentle border border-taupe/10 hover:bg-sand transition-all text-charcoal">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 class="text-2xl font-bold text-charcoal font-heading px-2 min-w-[180px] text-center">
            {{ getMonthName(currentMonth()) }} {{ currentYear() }}
          </h2>
          <button (click)="changeMonth(1)" 
                  class="p-2 bg-white rounded-lg shadow-gentle border border-taupe/10 hover:bg-sand transition-all text-charcoal">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- Monthly Grid -->
      <div class="bg-white rounded-xl shadow-gentle border border-taupe/10 overflow-hidden">
        <div class="overflow-x-auto custom-scrollbar">
          <div class="grid" [style.grid-template-columns]="'180px repeat(' + daysInMonth().length + ', 44px)'">
            <!-- Header -->
            <div class="sticky left-0 bg-white font-bold text-xs uppercase tracking-widest text-taupe p-4 border-r border-b border-taupe/10 z-20 font-heading">Habit</div>
            @for(day of daysInMonth(); track day) {
              <div class="font-bold text-xs text-center p-4 border-b border-taupe/10 text-taupe flex items-center justify-center min-h-[50px]"
                   [class.bg-orange-50]="isToday(day)"
                   [class.text-orange-600]="isToday(day)"
                   [class.font-black]="isToday(day)">{{ day }}</div>
            }

            <!-- Body -->
            @for(habit of monthHabits(); track habit.id) {
              <a [routerLink]="['/notes', habit.id]"
                 class="sticky left-0 bg-white font-bold text-sm text-charcoal p-4 border-r border-b border-taupe/5 z-20 truncate flex items-center gap-2 hover:bg-sand/30 transition-all group"
                 [title]="habit.name">
                <span class="material-symbols-outlined text-base text-orange-500 opacity-60 group-hover:opacity-100 transition-opacity">sticky_note_2</span>
                <span class="truncate font-heading">{{ habit.name }}</span>
              </a>
              @for(day of daysInMonth(); track day) {
                <div class="flex items-center justify-center border-b border-r border-taupe/5 min-h-[52px] group/cell"
                     [class.bg-orange-50/30]="isToday(day)">
                  <button (click)="toggleCompletion(habit, day)" 
                          class="w-full h-full flex items-center justify-center transition-all py-1 hover:bg-sand/20"
                          [class.cursor-not-allowed]="isFutureDay(day)"
                          [disabled]="isFutureDay(day)">
                    @if(habit.completions[day] === true) { 
                      <div class="w-6 h-6 rounded-full bg-sage flex items-center justify-center shadow-sm">
                        <span class="material-symbols-outlined text-white text-base">check</span> 
                      </div>
                    }
                    @else if(habit.completions[day] === false) { 
                      <div class="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                        <span class="material-symbols-outlined text-orange-500 text-base">close</span> 
                      </div>
                    }
                    @else if(habit.type === 'measurable' && isNumber(habit.completions[day])) { 
                      <span class="text-orange-600 text-xs font-bold font-mono">{{ habit.completions[day] }}</span> 
                    }
                    @else { 
                      <div class="w-2 h-2 rounded-full bg-taupe/10 group-hover/cell:bg-taupe/20 transition-colors"></div>
                    }
                  </button>
                </div>
              }
            } @empty {
              <div class="p-12 text-center text-taupe italic font-body" [style.grid-column]="'1 / -1'">
                No habits active for this period.
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Sections -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Focus Themes -->
        <div class="bg-white rounded-xl shadow-gentle p-8 border border-taupe/10">
          <h3 class="text-xl font-bold text-charcoal font-heading border-b border-taupe/10 pb-4 mb-8 flex items-center gap-2">
            <span class="material-symbols-outlined text-orange-500">sparkles</span>
            Monthly Intentions
          </h3>
          <div class="space-y-8">
            <div class="group">
              <label class="text-[11px] font-bold text-taupe uppercase tracking-[0.2em] block mb-4 ml-1 group-focus-within:text-orange-500 transition-colors">Primary Focus</label>
              <div class="p-1 bg-alabaster rounded-xl border border-taupe/5 group-focus-within:border-orange-500/20 transition-all">
                <app-multi-select-chips
                  [options]="monthHabitOptions()"
                  [selectedIds]="reflection().primary_focus"
                  (selectedIdsChange)="updatePrimaryFocus($event)"
                  placeholder="Select primary habits..."
                ></app-multi-select-chips>
              </div>
            </div>
            <div class="group">
              <label class="text-[11px] font-bold text-taupe uppercase tracking-[0.2em] block mb-4 ml-1 group-focus-within:text-orange-500 transition-colors">Secondary Focus</label>
              <div class="p-1 bg-alabaster rounded-xl border border-taupe/5 group-focus-within:border-orange-500/20 transition-all">
                <app-multi-select-chips
                  [options]="monthHabitOptions()"
                  [selectedIds]="reflection().secondary_focus"
                  (selectedIdsChange)="updateSecondaryFocus($event)"
                  placeholder="Select supporting habits..."
                ></app-multi-select-chips>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Tracker -->
        <div class="bg-white rounded-xl shadow-gentle p-8 border border-taupe/10">
          <h3 class="text-xl font-bold text-charcoal font-heading border-b border-taupe/10 pb-4 mb-8 flex items-center gap-2">
            <span class="material-symbols-outlined text-sage">analytics</span>
            Monthly Pulse
          </h3>
           <div class="space-y-8">
              <div>
                  <div class="flex justify-between items-baseline mb-4">
                    <label class="text-[11px] font-bold text-taupe uppercase tracking-[0.2em] ml-1">Overall Consistency</label>
                    <span class="text-2xl font-bold text-sage font-heading">{{ completionPercentage() | number:'1.0-0' }}%</span>
                  </div>
                  <div class="w-full bg-sand rounded-full h-3 overflow-hidden shadow-inner border border-taupe/5">
                      <div class="bg-sage h-full rounded-full transition-all duration-1000 ease-out" [style.width.%]="completionPercentage()">
                      </div>
                  </div>
              </div>
              <div class="p-6 bg-alabaster rounded-xl border border-taupe/5 flex items-center justify-between group hover:border-taupe/20 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <span class="material-symbols-outlined">auto_stories</span>
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-taupe uppercase tracking-widest block">Study Commitment</label>
                      <span class="text-lg font-bold text-charcoal font-heading leading-tight">Monthly Accumulation</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl font-bold text-orange-500 font-heading">{{ reflection().study_hours | number:'1.1-1' }}</span>
                    <span class="text-xs font-bold text-taupe uppercase ml-1">HRS</span>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #dcd7d0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c1bab0; }

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
          this.savingStatus.set('SAVED');
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

  // Editor config Obsidian-like setup
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
        this.savingStatus.set('SAVED ');
        this.habitNotes.update(notes =>
          notes.map(n => n.id === noteId ? { ...n, updated_at: updated.updated_at } : n)
        );
        setTimeout(() => this.savingStatus.set('READY'), 2000);
      },
      error: (err) => {
        console.error('Failed to save note', err);
        this.savingStatus.set('SAVE FAILED');
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








