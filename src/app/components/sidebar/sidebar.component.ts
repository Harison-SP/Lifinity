import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside [class.w-72]="!sidebarService.isCollapsed()" [class.w-24]="sidebarService.isCollapsed()" 
           (mouseenter)="sidebarService.setCollapsed(false)" (mouseleave)="sidebarService.setCollapsed(true)"
           class="hidden md:flex flex-col border-r border-[#e5e7eb] dark:border-[#2d3a30] bg-white dark:bg-[#1a2c20] h-screen sticky top-0 transition-all duration-300 ease-in-out group/sidebar">
      
      <!-- Logo Section -->
      <div class="p-6 flex items-center justify-between overflow-hidden">
        <div class="flex items-center gap-4 min-w-max">
          <div class="group relative">
            <div class="absolute -inset-1 bg-gradient-to-r from-[#13ec5b] to-[#0ea5e9] rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div class="relative size-12 rounded-xl bg-gradient-to-br from-[#13ec5b] to-[#0ba841] flex items-center justify-center text-[#0d1b12] shadow-lg transform group-hover:scale-110 transition-transform duration-300">
              <span class="material-symbols-outlined filled text-3xl">loop</span>
            </div>
          </div>
          <div class="flex flex-col text-nowrap transition-all duration-300" [class.opacity-0]="sidebarService.isCollapsed()" [class.translate-x-[-20px]]="sidebarService.isCollapsed()">
            <h1 class="text-2xl font-black tracking-tighter text-[#0d1b12] dark:text-white leading-none">HabitLoop</h1>
            <span class="text-[10px] uppercase tracking-[0.2em] font-bold text-[#4c9a66] dark:text-[#13ec5b] mt-1">Consistency Key</span>
          </div>
        </div>
      </div>

      <!-- Collapse Toggle Button -->
      <button (click)="sidebarService.toggle()" 
              class="absolute -right-4 top-10 size-12 rounded-full bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] flex items-center justify-center text-[#4c9a66] hover:text-[#0d1b12] dark:hover:text-white shadow-sm transition-transform hover:scale-110 z-50">
        <span class="material-symbols-outlined !text-xl transition-transform duration-300" [style.transform]="sidebarService.isCollapsed() ? 'rotate(180deg)' : 'rotate(0deg)'">chevron_left</span>
      </button>

      <!-- Navigation Section -->
      <nav class="flex-1 px-4 py-6 space-y-1 overflow-hidden">
        <a routerLink="/" routerLinkActive="active bg-[#13ec5b]/15 text-[#0d1b12] dark:text-[#13ec5b] !font-bold shadow-sm" [routerLinkActiveOptions]="{exact: true}" 
           class="group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[#4c9a66] hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#0d1b12] dark:hover:text-white whitespace-nowrap">
          <span class="material-symbols-outlined transition-transform group-hover:scale-110 min-w-[24px]">dashboard</span>
          <span class="text-sm font-medium transition-all duration-300" [class.opacity-0]="sidebarService.isCollapsed()" [class.translate-x-[-10px]]="sidebarService.isCollapsed()">Dashboard</span>
          <div class="ml-auto w-1.5 h-1.5 rounded-full bg-[#13ec5b] opacity-0 group-[.active]:opacity-100"></div>
        </a>
        
        <a routerLink="/planner" routerLinkActive="active bg-[#13ec5b]/15 text-[#0d1b12] dark:text-[#13ec5b] !font-bold shadow-sm" 
           class="group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[#4c9a66] hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#0d1b12] dark:hover:text-white whitespace-nowrap">
          <span class="material-symbols-outlined transition-transform group-hover:scale-110 min-w-[24px]">calendar_month</span>
          <span class="text-sm font-medium transition-all duration-300" [class.opacity-0]="sidebarService.isCollapsed()" [class.translate-x-[-10px]]="sidebarService.isCollapsed()">Planner</span>
          <div class="ml-auto w-1.5 h-1.5 rounded-full bg-[#13ec5b] opacity-0 group-[.active]:opacity-100"></div>
        </a>
        
        <a routerLink="/statistics" routerLinkActive="active bg-[#13ec5b]/15 text-[#0d1b12] dark:text-[#13ec5b] !font-bold shadow-sm" 
           class="group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[#4c9a66] hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#0d1b12] dark:hover:text-white whitespace-nowrap">
          <span class="material-symbols-outlined transition-transform group-hover:scale-110 min-w-[24px]">bar_chart</span>
          <span class="text-sm font-medium transition-all duration-300" [class.opacity-0]="sidebarService.isCollapsed()" [class.translate-x-[-10px]]="sidebarService.isCollapsed()">Statistics</span>
        </a>

        <a routerLink="/settings" routerLinkActive="active bg-[#13ec5b]/15 text-[#0d1b12] dark:text-[#13ec5b] !font-bold shadow-sm" 
           class="group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[#4c9a66] hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#0d1b12] dark:hover:text-white whitespace-nowrap">
          <span class="material-symbols-outlined transition-transform group-hover:scale-110 min-w-[24px]">settings</span>
          <span class="text-sm font-medium transition-all duration-300" [class.opacity-0]="sidebarService.isCollapsed()" [class.translate-x-[-10px]]="sidebarService.isCollapsed()">Settings</span>
        </a>
      </nav>

      <!-- Profile Section -->
      <div class="p-6 border-t border-[#f0f2f1] dark:border-[#2d3a30] overflow-hidden">
        <div class="bg-gray-50 dark:bg-[#2d3a30]/30 p-3 rounded-2xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-[#2d3a30]/50 transition-colors cursor-pointer group whitespace-nowrap min-w-max">
          <div class="size-11 rounded-xl bg-cover bg-center shadow-md ring-2 ring-white dark:ring-[#1a2c20] shrink-0" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCTF-WvGx08Bo8Fl-LQOkQBMd2USQORwKmxO8Ah5ox_UcjeXizXRxspvF5k9Jy9epJYF8nhD-xqJzNxjwGKH1pWsBHkpQ7GDMaWhhNpOrKHLiAALcAG43S6TBKRUWlhReAbbUgVLlw8s111zgAZYr-Mc713xdVcJ8iefX2i-8UIb1JuRGhmtn0N3IE-ZLxdcVkFGaekkhwSajUOe2IcR0E0xMoLJjolpTictXnzq09L8-snEVTgh9ljHNUgW7n_0Aov99BkRSpJ2dpY')"></div>
          <div class="flex-1 min-w-0 transition-all duration-300" [class.opacity-0]="sidebarService.isCollapsed()" [class.translate-x-[-10px]]="sidebarService.isCollapsed()">
            <p class="text-xs font-bold text-[#0d1b12] dark:text-white truncate">Alex Morgan</p>
            <p class="text-[10px] text-[#4c9a66] font-semibold uppercase tracking-wider">Free Plan</p>
          </div>
          <span class="material-symbols-outlined text-[#4c9a66] group-hover:translate-y-0.5 transition-all duration-300" [class.opacity-0]="sidebarService.isCollapsed()">expand_more</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host { font-family: 'Inter', sans-serif; }
    .material-symbols-outlined { 
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
    .material-symbols-outlined.filled { 
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  sidebarService = inject(SidebarService);
}
