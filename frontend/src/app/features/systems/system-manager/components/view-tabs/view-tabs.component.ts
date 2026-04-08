import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ViewMode } from '../../system-manager.types';

@Component({
  selector: 'app-view-tabs',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex items-center gap-1 bg-sand rounded-xl p-1.5 shadow-gentle border border-taupe/10">
      @for (tab of tabs; track tab.mode) {
        <button
          (click)="viewChange.emit(tab.mode)"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200"
          [class.bg-white]="activeView === tab.mode"
          [class.text-charcoal]="activeView === tab.mode"
          [class.shadow-gentle]="activeView === tab.mode"
          [class.text-taupe]="activeView !== tab.mode"
          [class.hover:text-charcoal]="activeView !== tab.mode"
          [class.hover:bg-white/50]="activeView !== tab.mode">
          <span class="material-symbols-outlined text-base"
            [class.text-orange-500]="activeView === tab.mode">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      }
    </div>
  `
})
export class ViewTabsComponent {
  @Input() activeView: ViewMode = 'form';
  @Output() viewChange = new EventEmitter<ViewMode>();

  tabs: { mode: ViewMode; label: string; icon: string }[] = [
    { mode: 'form',    label: 'Form',     icon: 'edit_note' },
    { mode: 'table',   label: 'Table',    icon: 'table_chart' },
    { mode: 'mindmap', label: 'Mind Map', icon: 'account_tree' }
  ];
}
