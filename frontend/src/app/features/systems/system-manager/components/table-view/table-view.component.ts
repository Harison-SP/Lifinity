import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  signal, computed
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PhaseNode, WeekNode, TableRow } from '../../system-manager.types';
import { SystemItem } from '../../../../../models/system.model';

@Component({
  selector: 'app-table-view',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="bg-white rounded-lg shadow-gentle border border-taupe/10 overflow-hidden">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-3 p-4 border-b border-taupe/10 bg-alabaster">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-taupe">Table View</span>
          <span class="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-500 text-white">
            {{ rows.length }} rows
          </span>
        </div>

        <div class="flex-1"></div>

        <div class="flex items-center gap-2">
          <input
            [(ngModel)]="searchQuery"
            placeholder="Filter rows..."
            class="border border-taupe/20 bg-white rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-500 text-charcoal w-48" />
          <button
            (click)="addRow()"
            class="inline-flex items-center gap-1.5 bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-orange-400 transition-all">
            <span class="material-symbols-outlined text-sm">add</span> Row
          </button>
          <button
            (click)="deleteSelected()"
            [disabled]="selectedRows.size === 0"
            class="inline-flex items-center gap-1.5 bg-red-500 text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <span class="material-symbols-outlined text-sm">delete</span> Delete ({{ selectedRows.size }})
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-sm border-collapse min-w-[1100px]">
          <thead>
            <tr class="bg-sand border-b border-taupe/10">
              <th class="px-3 py-3 text-left w-10">
                <input
                  type="checkbox"
                  [checked]="allSelected()"
                  (change)="toggleSelectAll()"
                  class="rounded border-taupe/30 cursor-pointer accent-orange-500" />
              </th>
              @for (col of columns; track col.key) {
                <th
                  class="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-taupe cursor-pointer hover:text-charcoal transition-colors select-none"
                  (click)="sortBy(col.key)">
                  <div class="flex items-center gap-1">
                    {{ col.label }}
                    @if (sortColumn === col.key) {
                      <span class="material-symbols-outlined text-xs text-orange-500">
                        {{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                      </span>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of filteredRows(); track rowTrack($index, row); let i = $index) {
              <tr
                class="border-b border-taupe/5 transition-colors"
                [class.bg-orange-50]="selectedRows.has(i)"
                [class.hover:bg-sand/40]="!selectedRows.has(i)">
                <td class="px-3 py-2">
                  <input
                    type="checkbox"
                    [checked]="selectedRows.has(i)"
                    (change)="toggleSelect(i)"
                    class="rounded border-taupe/30 cursor-pointer accent-orange-500" />
                </td>
                <!-- Phase -->
                <td class="px-3 py-2">
                  <input
                    [(ngModel)]="row.phaseName"
                    (blur)="onCellChange()"
                    class="w-full bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal font-medium transition-colors" />
                </td>
                <!-- Week -->
                <td class="px-3 py-2">
                  <input
                    type="number"
                    [(ngModel)]="row.weekNum"
                    (blur)="onCellChange()"
                    class="w-16 bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal font-bold text-center transition-colors" />
                </td>
                <!-- Focus -->
                <td class="px-3 py-2">
                  <input
                    [(ngModel)]="row.weekFocus"
                    (blur)="onCellChange()"
                    class="w-full bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal transition-colors" />
                </td>
                <!-- Day -->
                <td class="px-3 py-2">
                  <input
                    type="number"
                    [(ngModel)]="row.dayNumber"
                    (blur)="onCellChange()"
                    class="w-14 bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal font-bold text-center transition-colors" />
                </td>
                <!-- Title -->
                <td class="px-3 py-2">
                  <input
                    [(ngModel)]="row.title"
                    (blur)="onCellChange()"
                    class="w-full bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal font-bold transition-colors"
                    placeholder="Task title" />
                </td>
                <!-- Description -->
                <td class="px-3 py-2">
                  <input
                    [(ngModel)]="row.description"
                    (blur)="onCellChange()"
                    class="w-full bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal transition-colors"
                    placeholder="Description" />
                </td>
                <!-- Start -->
                <td class="px-3 py-2">
                  <input
                    type="time"
                    [(ngModel)]="row.timeBlockStart"
                    (blur)="onCellChange()"
                    class="w-24 bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal transition-colors" />
                </td>
                <!-- End -->
                <td class="px-3 py-2">
                  <input
                    type="time"
                    [(ngModel)]="row.timeBlockEnd"
                    (blur)="onCellChange()"
                    class="w-24 bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal transition-colors" />
                </td>
                <!-- Resource -->
                <td class="px-3 py-2">
                  <input
                    [(ngModel)]="row.resourceLink"
                    (blur)="onCellChange()"
                    class="w-full bg-transparent border-b border-transparent hover:border-taupe/20 focus:border-orange-500 outline-none py-1 text-charcoal transition-colors"
                    placeholder="URL" />
                </td>
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns.length + 1" class="px-6 py-12 text-center text-taupe text-sm">
                  <span class="material-symbols-outlined text-4xl text-taupe/40 block mb-3">table_chart</span>
                  No tasks yet — add rows above or switch to Form view
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-3 bg-alabaster border-t border-taupe/10 text-xs text-taupe font-medium">
        <span>{{ selectedRows.size }} of {{ rows.length }} selected</span>
        <span>
          {{ uniquePhases() }} phases · {{ uniqueWeeks() }} weeks · {{ rows.length }} tasks
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    table input[type="number"] { -moz-appearance: textfield; }
    table input[type="number"]::-webkit-inner-spin-button,
    table input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
  `]
})
export class TableViewComponent implements OnChanges {
  @Input() hierarchy: PhaseNode[] = [];
  @Output() hierarchyChange = new EventEmitter<PhaseNode[]>();

  rows: TableRow[] = [];
  searchQuery = '';
  sortColumn = '';
  sortDir: 'asc' | 'desc' = 'asc';
  selectedRows = new Set<number>();

  columns = [
    { key: 'phaseName',      label: 'Phase' },
    { key: 'weekNum',        label: 'Week' },
    { key: 'weekFocus',      label: 'Focus' },
    { key: 'dayNumber',      label: 'Day' },
    { key: 'title',          label: 'Title' },
    { key: 'description',    label: 'Description' },
    { key: 'timeBlockStart', label: 'Start' },
    { key: 'timeBlockEnd',   label: 'End' },
    { key: 'resourceLink',   label: 'Resource' }
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hierarchy']) {
      this.rebuildRows();
    }
  }

  /* ── Build flat rows from hierarchy ─────────────────────────── */

  private rebuildRows() {
    const newRows: TableRow[] = [];
    (this.hierarchy || []).forEach((phase, pi) => {
      phase.weeks.forEach((week, wi) => {
        week.items.forEach((item, ti) => {
          newRows.push({
            phaseIndex: pi,
            phaseName: phase.name,
            weekIndex: wi,
            weekNum: week.weekNum,
            weekFocus: week.focus,
            taskIndex: ti,
            dayNumber: item.day_number,
            title: item.title,
            description: item.description || '',
            timeBlockStart: item.time_block_start || '',
            timeBlockEnd: item.time_block_end || '',
            resourceLink: item.resource_link || ''
          });
        });
      });
    });
    this.rows = newRows;
  }

  /* ── Sync rows back to hierarchy and emit ───────────────────── */

  onCellChange() {
    const phaseMap = new Map<string, Map<number, { focus: string; items: SystemItem[] }>>();

    this.rows.forEach(row => {
      if (!phaseMap.has(row.phaseName)) phaseMap.set(row.phaseName, new Map());
      const weekMap = phaseMap.get(row.phaseName)!;
      if (!weekMap.has(row.weekNum)) weekMap.set(row.weekNum, { focus: row.weekFocus, items: [] });
      const weekEntry = weekMap.get(row.weekNum)!;
      weekEntry.focus = row.weekFocus;
      weekEntry.items.push({
        title: row.title,
        description: row.description,
        day_number: row.dayNumber,
        week_number: row.weekNum,
        phase: row.phaseName,
        week_focus: row.weekFocus,
        time_block_start: row.timeBlockStart || undefined,
        time_block_end: row.timeBlockEnd || undefined,
        resource_link: row.resourceLink || undefined
      });
    });

    const newHierarchy: PhaseNode[] = [];
    phaseMap.forEach((weekMap, phaseName) => {
      const weeks: WeekNode[] = [];
      const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) => a[0] - b[0]);
      
      const existingPhase = this.hierarchy.find(p => p.name === phaseName);
      
      sortedWeeks.forEach(([weekNum, entry]) => {
        const existingWeek = existingPhase?.weeks.find(w => w.weekNum === weekNum);
        
        weeks.push({
          weekNum,
          focus: entry.focus,
          goal: existingWeek?.goal || '',
          outcome: existingWeek?.outcome || '',
          items: entry.items.sort((a, b) => (Number(a.day_number) || 0) - (Number(b.day_number) || 0)),
          isExpanded: existingWeek?.isExpanded ?? true,
          time_block_start: existingWeek?.time_block_start || null,
          time_block_end: existingWeek?.time_block_end || null
        });
      });

      newHierarchy.push({
        name: phaseName,
        objective: existingPhase?.objective || '',
        weeks,
        isExpanded: existingPhase?.isExpanded ?? true
      });
    });

    this.hierarchyChange.emit(newHierarchy);
  }

  /* ── Add / Delete ───────────────────────────────────────────── */

  addRow() {
    const lastRow = this.rows[this.rows.length - 1];
    this.rows.push({
      phaseIndex: lastRow?.phaseIndex || 0,
      phaseName: lastRow?.phaseName || 'Phase 1',
      weekIndex: lastRow?.weekIndex || 0,
      weekNum: lastRow?.weekNum || 1,
      weekFocus: lastRow?.weekFocus || 'Week 1',
      taskIndex: (lastRow?.taskIndex ?? -1) + 1,
      dayNumber: (lastRow?.dayNumber ?? 0) + 1,
      title: 'New Task',
      description: '',
      timeBlockStart: '',
      timeBlockEnd: '',
      resourceLink: ''
    });
    this.onCellChange();
  }

  deleteSelected() {
    if (this.selectedRows.size === 0) return;
    this.rows = this.rows.filter((_, i) => !this.selectedRows.has(i));
    this.selectedRows.clear();
    this.onCellChange();
  }

  /* ── Selection ──────────────────────────────────────────────── */

  toggleSelect(index: number) {
    if (this.selectedRows.has(index)) this.selectedRows.delete(index);
    else this.selectedRows.add(index);
  }

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selectedRows.clear();
    } else {
      this.rows.forEach((_, i) => this.selectedRows.add(i));
    }
  }

  allSelected(): boolean {
    return this.rows.length > 0 && this.selectedRows.size === this.rows.length;
  }

  /* ── Sort ───────────────────────────────────────────────────── */

  sortBy(key: string) {
    if (this.sortColumn === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = key;
      this.sortDir = 'asc';
    }
    const dir = this.sortDir === 'asc' ? 1 : -1;
    this.rows.sort((a, b) => {
      const va = (a as any)[key];
      const vb = (b as any)[key];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }

  /* ── Filter ─────────────────────────────────────────────────── */

  filteredRows(): TableRow[] {
    if (!this.searchQuery.trim()) return this.rows;
    const q = this.searchQuery.toLowerCase();
    return this.rows.filter(r =>
      `${r.phaseName} ${r.weekFocus} ${r.title} ${r.description}`.toLowerCase().includes(q)
    );
  }

  /* ── Stats ──────────────────────────────────────────────────── */

  uniquePhases(): number {
    return new Set(this.rows.map(r => r.phaseName)).size;
  }

  uniqueWeeks(): number {
    return new Set(this.rows.map(r => `${r.phaseName}-${r.weekNum}`)).size;
  }

  rowTrack(index: number, row: TableRow) {
    return `${row.phaseName}-${row.weekNum}-${row.dayNumber}-${index}`;
  }
}
