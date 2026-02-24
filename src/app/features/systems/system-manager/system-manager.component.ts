import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemService } from '../../../services/system.service';
import { LearningSystem, SystemItem, InstantiateResult } from '../../../models/system.model';
import * as XLSX from 'xlsx';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { HabitService } from '../../../services/habit.service';
import { Habit } from '../../../models/habit.model';

interface WeekNode {
  weekNum: number;
  focus: string;
  items: SystemItem[];
  isExpanded: boolean;
}

interface PhaseNode {
  name: string;
  weeks: WeekNode[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-system-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTabsModule],
  template: `
    <div class="h-full flex flex-col font-manrope p-6 gap-6 overflow-y-auto">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-black text-black dark:text-white uppercase font-arvo flex items-center gap-3">
            <span class="material-symbols-outlined text-4xl">auto_stories</span>
            Protocol_Systems
          </h2>
          <p class="text-concrete-500 dark:text-concrete-400 font-mono text-sm">Define structured curriculums and apply them to your calendar.</p>
        </div>
        
        <div class="flex gap-4">
          <label class="px-4 py-2 bg-yellow-400 text-black rigid-border-sm border-[2px] font-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_black] flex items-center gap-2 uppercase tracking-wider text-xs cursor-pointer active:translate-y-1 active:shadow-none">
            <span class="material-symbols-outlined text-sm">upload_file</span>
            Import Excel
            <input type="file" class="hidden" (change)="onFileChange($event)" accept=".xlsx, .xls, .csv" />
          </label>

          <button (click)="isPasting.set(true)" 
                  class="px-4 py-2 bg-purple-500 text-white rigid-border-sm border-[2px] font-black hover:bg-black transition-all shadow-[4px_4px_0_0_black] flex items-center gap-2 uppercase tracking-wider text-xs active:translate-y-1 active:shadow-none">
            <span class="material-symbols-outlined text-sm">content_paste</span>
            Paste CSV
          </button>
          
          <button (click)="createNewSystem()" 
                  class="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rigid-border-sm border-[2px] dark:border-concrete-100 font-black hover:bg-electric-red hover:text-white transition-all shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] flex items-center gap-2 uppercase tracking-wider text-xs active:translate-y-1 active:shadow-none">
            <span class="material-symbols-outlined text-sm">add</span>
            New Protocol
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-0">
        <!-- Systems List -->
        <div class="md:col-span-1 flex flex-col gap-4 min-h-0">
          <div class="bg-white dark:bg-concrete-900 rigid-border border-[4px] dark:border-concrete-100 p-4 brutalist-shadow-lg flex-1 overflow-y-auto custom-scrollbar">
            <h3 class="text-lg font-black text-black dark:text-white uppercase font-arvo border-b-4 border-black dark:border-white pb-2 mb-4 flex items-center gap-2 sticky top-0 bg-white dark:bg-concrete-900 z-10">
              <span class="material-symbols-outlined">list</span>
              Available
            </h3>
            
            <div class="space-y-3">
              @for (system of systems(); track system.id) {
                <div class="p-3 rigid-border-sm border-2 border-black dark:border-concrete-500 cursor-pointer transition-all hover:bg-concrete-100 dark:hover:bg-concrete-800"
                     [class.bg-black]="selectedSystem()?.id === system.id"
                     [class.text-white]="selectedSystem()?.id === system.id"
                     (click)="selectSystem(system)">
                  <p class="font-black uppercase text-sm mb-1">{{ system.title }}</p>
                  <div class="flex justify-between items-center text-[10px] font-bold opacity-70">
                    <span>{{ system.items.length }} ITEMS</span>
                    <span class="uppercase">{{ system.category }}</span>
                  </div>
                </div>
              } @empty {
                <div class="py-8 text-center text-concrete-400">
                  <p class="text-xs uppercase font-black">No systems found</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Editor / Details -->
        <div class="md:col-span-3 flex flex-col gap-0 min-h-0">
          @if (selectedSystem() || isCreating()) {
            <div class="bg-white dark:bg-concrete-900 rigid-border border-[4px] dark:border-concrete-100 p-6 brutalist-shadow-lg flex flex-col h-full overflow-hidden">
              
              <!-- Header Form -->
              <div class="flex justify-between items-center mb-6 border-b-4 border-black dark:border-white pb-4 shrink-0">
                <input [(ngModel)]="editForm.title" 
                       placeholder="SYSTEM TITLE"
                       class="text-2xl font-black text-black dark:text-white uppercase font-arvo bg-transparent outline-none w-full" />
                
                <div class="flex gap-2">
                   <button (click)="saveSystem()" 
                           class="p-2 bg-green-500 text-white border-2 border-black dark:border-white hover:bg-black transition-colors"
                           title="Save Changes">
                    <span class="material-symbols-outlined">save</span>
                  </button>
                   <button (click)="deleteSystem()" 
                           class="p-2 bg-red-500 text-white border-2 border-black dark:border-white hover:bg-black transition-colors"
                           title="Delete System">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>

              <!-- Metadata & Instantiation -->
              <div class="grid grid-cols-2 gap-4 mb-4 shrink-0">
                <div>
                    <label class="text-[10px] font-black uppercase text-concrete-500 block mb-1">Category</label>
                    <input [(ngModel)]="editForm.category" class="w-full p-2 bg-concrete-100 dark:bg-concrete-800 border-2 border-black dark:border-concrete-500 font-bold text-sm outline-none focus:border-electric-red" />
                </div>
                 <div>
                      <!-- Instantiate -->
                      @if (selectedSystem()?.id) {
                         <label class="text-[10px] font-black uppercase text-concrete-500 block mb-1">Execute Protocol</label>
                         <!-- Parent Habit selector -->
                         <select [(ngModel)]="selectedHabitId"
                                 class="w-full mb-2 p-1 px-2 border-2 border-black dark:border-concrete-500 text-xs font-black bg-white dark:bg-concrete-800 dark:text-white outline-none">
                           <option [ngValue]="null">— No parent habit —</option>
                           @for(habit of habits(); track habit.id) {
                             <option [value]="habit.id">{{ habit.name }}</option>
                           }
                         </select>
                         <div class="flex gap-2">
                             <input type="date" [(ngModel)]="instantiateDate" class="p-1 px-2 border-2 border-black text-xs font-black flex-1" />
                             <button (click)="applySystem()" [disabled]="isRunning()"
                                     class="bg-black text-white px-2 py-1 text-xs font-black uppercase hover:bg-electric-red disabled:opacity-40 transition-colors border-2 border-black">
                                 {{ isRunning() ? '...' : 'Run' }}
                             </button>
                         </div>
                         @if (lastResult()) {
                           <div class="mt-2 p-2 bg-green-100 dark:bg-green-900 border-2 border-green-600 text-[10px] font-bold text-green-800 dark:text-green-200">
                             ✓ {{ lastResult()!.message }}<br/>
                             @if (lastResult()!.habitName) { Linked to: <b>{{ lastResult()!.habitName }}</b> }
                           </div>
                         }
                      }
                 </div>
              </div>

              <!-- Content Editor (Hierarchy) -->
              <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
                 
                 <div class="flex justify-between items-center border-b-2 border-black dark:border-concrete-500 pb-2">
                     <h3 class="font-black uppercase text-sm">Curriculum Structure</h3>
                     <button (click)="addPhase()" class="text-xs font-black uppercase flex items-center gap-1 bg-black text-white px-2 py-1 hover:bg-concrete-700">
                        <span class="material-symbols-outlined text-xs">add</span> Phase
                     </button>
                 </div>

                 <div class="space-y-4 pb-12">
                     @for (phase of hierarchy(); track $index) {
                         <div class="border-2 border-black dark:border-concrete-500 bg-concrete-50 dark:bg-concrete-800">
                             <!-- Phase Header -->
                             <div class="p-2 bg-concrete-200 dark:bg-concrete-700 flex justify-between items-center cursor-pointer select-none"
                                  (click)="phase.isExpanded = !phase.isExpanded">
                                 <div class="flex items-center gap-2">
                                     <span class="material-symbols-outlined transition-transform" 
                                           [class.rotate-90]="phase.isExpanded">chevron_right</span>
                                     <input [(ngModel)]="phase.name" (click)="$event.stopPropagation()" 
                                            class="bg-transparent font-black uppercase text-sm outline-none border-b border-transparent focus:border-black w-48" />
                                     <span class="text-[10px] font-bold opacity-60">({{phase.weeks.length}} Weeks)</span>
                                 </div>
                                 <div class="flex gap-2">
                                     <button (click)="addWeek(phase); $event.stopPropagation()" class="text-[10px] font-black uppercase hover:text-electric-red px-2">
                                         + Week
                                     </button>
                                     <button (click)="removePhase($index); $event.stopPropagation()" class="text-red-500 hover:text-red-700">
                                         <span class="material-symbols-outlined text-sm">close</span>
                                     </button>
                                 </div>
                             </div>

                             <!-- Weeks List -->
                             @if (phase.isExpanded) {
                                 <div class="p-4 space-y-4">
                                     @for (week of phase.weeks; track $index) {
                                         <div class="border border-concrete-300 dark:border-concrete-600 bg-white dark:bg-concrete-900 p-3 shadow-sm">
                                             <!-- Week Header -->
                                            <div class="flex justify-between items-start mb-3">
                                                <div class="flex gap-2 items-center flex-1">
                                                    <span class="font-black text-xs uppercase bg-black text-white px-1">WK {{week.weekNum}}</span>
                                                    <input type="number" [(ngModel)]="week.weekNum" class="w-12 text-xs font-bold border border-concrete-300 text-center" title="Week Number" />
                                                    <input [(ngModel)]="week.focus" placeholder="Week Focus / Topic" class="flex-1 text-xs font-bold border-b border-concrete-300 outline-none bg-transparent" />
                                                </div>
                                                <div class="flex gap-2 pl-2">
                                                    <button (click)="addTask(week)" class="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">
                                                        + Task
                                                    </button>
                                                    <button (click)="removeWeek(phase, $index)" class="text-concrete-400 hover:text-red-500">
                                                        <span class="material-symbols-outlined text-sm">remove_circle_outline</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Tasks List -->
                                            <div class="space-y-2 pl-4 border-l-2 border-concrete-200 dark:border-concrete-700">
                                                @for (item of week.items; track $index) {
                                                     <div class="flex gap-2 items-center group">
                                                         <span class="text-[10px] font-mono text-concrete-400 w-4">D{{item.day_number}}</span>
                                                         <input type="number" [(ngModel)]="item.day_number" class="w-8 text-[10px] border border-concrete-200 text-center" />
                                                         
                                                         <input [(ngModel)]="item.title" placeholder="Task Title" class="flex-1 text-xs font-bold bg-transparent border-b border-transparent focus:border-concrete-300 outline-none" />
                                                         
                                                         <input [(ngModel)]="item.time_block_start" type="time" title="Start" class="w-16 text-[10px] bg-transparent border border-concrete-200" />
                                                         <span class="text-[10px] text-concrete-300">-</span>
                                                         <input [(ngModel)]="item.time_block_end" type="time" title="End" class="w-16 text-[10px] bg-transparent border border-concrete-200" />
                                                         
                                                         <button (click)="removeTask(week, $index)" class="opacity-0 group-hover:opacity-100 text-concrete-300 hover:text-red-500">
                                                             <span class="material-symbols-outlined text-[14px]">close</span>
                                                         </button>
                                                     </div>
                                                } @empty {
                                                    <p class="text-[10px] text-concrete-400 italic pl-2">No tasks defined for this week.</p>
                                                }
                                            </div>
                                         </div>
                                     }
                                 </div>
                             }
                         </div>
                     }
                 </div>

              </div>

            </div>
          } @else {
            <div class="h-full flex flex-col items-center justify-center p-12 bg-concrete-50 dark:bg-concrete-800 border-[4px] border-dashed border-concrete-200 dark:border-concrete-700">
               <span class="material-symbols-outlined text-6xl text-concrete-300 mb-4">settings_suggest</span>
               <p class="text-lg font-black text-concrete-400 uppercase tracking-widest">Select or create a system to begin</p>
               <p class="text-sm text-concrete-300 font-mono mt-2">Systems are blueprints that automate your planning.</p>
            </div>
          }
        </div>
      </div>
    </div>

    @if (isPasting()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div class="bg-white dark:bg-concrete-900 rigid-border border-[4px] dark:border-concrete-100 p-6 brutalist-shadow-lg w-full max-w-2xl flex flex-col gap-4">
          <div class="flex justify-between items-center border-b-4 border-black dark:border-white pb-2">
            <h3 class="text-xl font-black uppercase flex items-center gap-2">
              <span class="material-symbols-outlined">content_paste</span>
              Paste CSV Content
            </h3>
            <button (click)="isPasting.set(false)" class="text-black dark:text-white hover:text-red-500">
               <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <p class="text-[10px] font-mono opacity-60 uppercase">Expected columns: Phase, Week, WeekFocus, Day, Title, Description, StartTime, EndTime</p>
          
          <textarea [(ngModel)]="pastedCsv" 
                    class="w-full h-80 p-4 bg-concrete-100 dark:bg-concrete-800 border-2 border-black dark:border-concrete-500 font-mono text-xs outline-none focus:border-purple-500 custom-scrollbar"
                    placeholder="Phase,Week,WeekFocus,Day,Title,Description,StartTime,EndTime
Phase 1,1,Basics,1,Task 1,Desc,08:00,09:00..."></textarea>
          
          <div class="flex justify-end gap-4 mt-2">
            <button (click)="isPasting.set(false)" 
                    class="px-6 py-2 bg-concrete-200 text-black font-black uppercase text-xs border-2 border-black hover:bg-black hover:text-white transition-all active:translate-y-1">
              Cancel
            </button>
            <button (click)="processPastedCsv()" 
                    class="px-6 py-2 bg-purple-500 text-white font-black uppercase text-xs border-2 border-black hover:bg-black transition-all shadow-[4px_4px_0_0_black] active:translate-y-1 active:shadow-none">
              Import & Process
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: black; }
    :host-context(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: white; }
  `]
})
export class SystemManagerComponent implements OnInit {
  private systemService = inject(SystemService);
  private habitService = inject(HabitService);
  
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

  editForm: LearningSystem = {
    title: '',
    description: '',
    category: 'General',
    tags: [],
    items: []
  };

  // Hierarchy State
  hierarchy = signal<PhaseNode[]>([]);

  ngOnInit() {
    this.loadSystems();
  }

  loadSystems() {
    this.systemService.getSystems().subscribe(systems => {
      this.systems.set(systems);
    });
    this.habitService.getAllHabits().subscribe(habits => {
      this.habits.set(habits);
    });
  }

  selectSystem(system: LearningSystem) {
    this.selectedSystem.set(system);
    this.isCreating.set(false);
    this.editForm = JSON.parse(JSON.stringify(system));
    this.buildHierarchy();
  }

  createNewSystem() {
    this.isCreating.set(true);
    this.selectedSystem.set(null);
    this.editForm = {
      title: 'NEW SYSTEM',
      description: '',
      category: 'General',
      tags: [],
      items: []
    };
    this.buildHierarchy();
  }

  // Conversion Logic
  buildHierarchy() {
    const nodes: PhaseNode[] = [];
    const items = this.editForm.items || [];
    
    // Group by Phase
    const phaseMap = new Map<string, SystemItem[]>();
    items.forEach(item => {
        const p = item.phase || 'Phase 1';
        if (!phaseMap.has(p)) phaseMap.set(p, []);
        phaseMap.get(p)!.push(item);
    });

    phaseMap.forEach((phaseItems, phaseName) => {
        const weeks: WeekNode[] = [];
        // Group by Week
        const weekMap = new Map<number, SystemItem[]>();
        phaseItems.forEach(item => {
            const w = item.week_number;
            if (!weekMap.has(w)) weekMap.set(w, []);
            weekMap.get(w)!.push(item);
        });

        // Sort weeks
        const sortedWeeks = Array.from(weekMap.keys()).sort((a,b) => a - b);
        
        sortedWeeks.forEach(wNum => {
            const wItems = weekMap.get(wNum)!;
            // Infer Focus from first item (or any item that has it)
            const focus = wItems.find(i => i.week_focus)?.week_focus || `Week ${wNum}`;
            
            weeks.push({
                weekNum: wNum,
                focus: focus,
                items: wItems.sort((a,b) => a.day_number - b.day_number),
                isExpanded: true
            });
        });

        nodes.push({
            name: phaseName,
            weeks: weeks,
            isExpanded: true
        });
    });

    // If empty, add default
    if (nodes.length === 0 && this.isCreating()) {
        nodes.push({
            name: 'Phase 1',
            weeks: [{
                weekNum: 1,
                focus: 'Getting Started',
                items: [],
                isExpanded: true
            }],
            isExpanded: true
        });
    }

    this.hierarchy.set(nodes);
  }

  flattenHierarchy() {
      const items: SystemItem[] = [];
      this.hierarchy().forEach(phase => {
          phase.weeks.forEach(week => {
              week.items.forEach(item => {
                  // Ensure sync
                  item.phase = phase.name;
                  item.week_number = week.weekNum;
                  item.week_focus = week.focus;
                  items.push(item);
              });
          });
      });
      this.editForm.items = items;
  }

  // Hierarchy Actions
  addPhase() {
      const nodes = this.hierarchy();
      const nextNum = nodes.length + 1;
      this.hierarchy.update(h => [...h, {
          name: `Phase ${nextNum}`,
          weeks: [{ weekNum: 1, focus: 'General', items: [], isExpanded: true }],
          isExpanded: true
      }]);
  }

  removePhase(index: number) {
      if(confirm('Remove this Phase and all its tasks?')) {
        this.hierarchy.update(h => h.filter((_, i) => i !== index));
      }
  }

  addWeek(phase: PhaseNode) {
      const nextWeek = phase.weeks.length > 0 
        ? Math.max(...phase.weeks.map(w => w.weekNum)) + 1 
        : 1;
      
      phase.weeks.push({
          weekNum: nextWeek,
          focus: 'New Topic',
          items: [],
          isExpanded: true
      });
  }

  removeWeek(phase: PhaseNode, index: number) {
      phase.weeks.splice(index, 1);
  }

  addTask(week: WeekNode) {
      const nextDay = week.items.length > 0
        ? Math.max(...week.items.map(i => i.day_number)) + 1
        : 1;
        
      week.items.push({
          title: 'New Task',
          week_number: week.weekNum,
          day_number: nextDay,
          phase: '', // Will be set on flatten
          week_focus: '', // Will be set on flatten
          description: ''
      });
  }

  removeTask(week: WeekNode, index: number) {
      week.items.splice(index, 1);
  }

  saveSystem() {
    this.flattenHierarchy(); // Sync before saving
    
    if (this.isCreating()) {
      this.systemService.createSystem(this.editForm).subscribe(() => {
        this.loadSystems();
        this.isCreating.set(false);
      });
    } else if (this.selectedSystem()?.id) {
      this.systemService.updateSystem(this.selectedSystem()!.id!, this.editForm).subscribe(() => {
        this.loadSystems();
      });
    }
  }

  deleteSystem() {
    const id = this.selectedSystem()?.id;
    if (id && confirm('Delete this system forever?')) {
      this.systemService.deleteSystem(id).subscribe(() => {
        this.selectedSystem.set(null);
        this.loadSystems();
      });
    }
  }

  applySystem() {
    const systemId = this.selectedSystem()?.id;
    if (!systemId || this.isRunning()) return;
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

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) return;
    
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      this.processExcelData(data);
    };
    reader.readAsBinaryString(target.files[0]);
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
    // Expected columns: Week, Day, Title, Description, StartTime, EndTime
    const items: SystemItem[] = data.map(row => ({
      week_number: parseInt(row.Week || row.week || 1),
      day_number: parseInt(row.Day || row.day || 1),
      title: row.Title || row.title || row.Task || row.task || 'Untitled Task',
      description: row.Description || row.description || '',
      phase: row.Phase || row.phase || 'Phase 1',
      week_focus: row.WeekFocus || row.week_focus || row.Focus || row.focus || 'General',
      time_block_start: row.StartTime || row.start_time || null,
      time_block_end: row.EndTime || row.end_time || null
    }));

    this.editForm.items = items;
    this.editForm.title = 'Imported Strategy';
    this.isCreating.set(true);
    this.selectedSystem.set(null);
    this.buildHierarchy(); // Rebuild view from imported data
  }
}
