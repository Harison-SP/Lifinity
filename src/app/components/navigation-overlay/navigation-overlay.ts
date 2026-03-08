import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation-overlay',
  standalone: true,
  imports: [RouterLink, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2 font-manrope">
        @if (isOpen()) {
            <div class="bg-black dark:bg-concrete-200 text-white dark:text-black p-4 rigid-border mb-4 flex flex-col gap-2 brutalist-shadow-sm dark:shadow-[6px_6px_0_0_white] min-w-[200px] transition-colors">
                @for (link of links; track link.path) {
                    <a [routerLink]="link.path" 
                       (click)="toggleOpen()"
                       class="flex items-center gap-3 p-2 hover:bg-zinc-800 dark:hover:bg-concrete-300 transition-colors uppercase font-black tracking-tighter cursor-pointer group text-sm">
                        <span class="material-symbols-outlined text-electric-red group-hover:text-white transition-colors">{{link.icon}}</span>
                        {{link.label}}
                    </a>
                }
            </div>
        }
        <button 
            (click)="toggleOpen()"
            class="w-16 h-16 bg-black dark:bg-concrete-200 text-white dark:text-black rigid-border flex items-center justify-center hover:bg-electric-red dark:hover:bg-electric-red transition-all brutalist-shadow-sm dark:shadow-[6px_6px_0_0_white] group active:translate-y-1 active:shadow-none">
            <span class="material-symbols-outlined text-4xl transition-transform duration-300" [class.rotate-45]="isOpen()">
                {{ isOpen() ? 'close' : 'menu' }}
            </span>
        </button>
    </div>
  `
})
export class NavigationOverlayComponent {
  isOpen = signal(false);
  
  links = [
    { path: '/', label: 'DASHBOARD', icon: 'architecture' },
    { path: '/statistics', label: 'STATISTICS', icon: 'monitoring' },
    { path: '/planner', label: 'PLANNER', icon: 'calendar_month' },
    { path: '/systems', label: 'SYSTEMS', icon: 'auto_stories' },
    { path: '/settings', label: 'Sys_Config', icon: 'settings_input_component' },
  ];

  toggleOpen() {
    this.isOpen.update(v => !v);
  }
}
