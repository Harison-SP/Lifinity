import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside [class.w-72]="!sidebarService.isCollapsed()" [class.w-20]="sidebarService.isCollapsed()" 
           (mouseenter)="sidebarService.setCollapsed(false)" (mouseleave)="sidebarService.setCollapsed(true)"
           class="hidden md:flex flex-col border-r bg-white dark:bg-[#0c0e12] dark:border-[#2a3441] h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 shadow-2xl overflow-hidden group/sidebar">
      
      <!-- Logo Section -->
      <div class="p-6 border-b dark:border-[#2a3441] relative overflow-hidden group min-h-[88px] flex items-center">
        <div class="absolute inset-0 bg-[#ec5b13]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
        <div class="flex items-center gap-3 relative z-10 w-full">
          <div class="w-10 h-10 border border-[#ec5b13] bg-[#ec5b13]/10 flex items-center justify-center animate-pulse rounded-lg shrink-0">
            <span class="material-symbols-outlined text-[#ec5b13]">terminal</span>
          </div>
          
          <div class="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300" 
               [class.opacity-0]="sidebarService.isCollapsed()" 
               [class.w-0]="sidebarService.isCollapsed()"
               [class.translate-x-[-10px]]="sidebarService.isCollapsed()">
            <h1 class="font-black text-xl leading-none text-slate-800 dark:text-white tracking-widest uppercase">COMMANDER<span class="text-[#ec5b13]">CONSOLE</span></h1>
            <p class="text-[9px] uppercase tracking-[0.3em] text-[#ec5b13] mt-1 opacity-80">v.5.2.1-SECURE</p>
          </div>
        </div>
      </div>

      <!-- Navigation Section -->
      <nav class="flex-1 px-0 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        
        <div class="flex items-center px-6 mb-2 transition-opacity duration-300" [class.opacity-0]="sidebarService.isCollapsed()">
            <span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest border-l-2 border-slate-200 dark:border-slate-700 pl-2 whitespace-nowrap">Operations</span>
        </div>

        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" 
           class="flex items-center gap-4 px-6 py-3 border-l-2 transition-all group relative border-transparent hover:border-[#ec5b13] hover:bg-[#ec5b13]/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white [&.active]:border-[#ec5b13] [&.active]:bg-[#ec5b13]/10 [&.active]:text-[#ec5b13]">
            <span class="active-bg absolute inset-0 bg-gradient-to-r from-[#ec5b13]/10 to-transparent w-1/2 hidden group-[.active]:block"></span>
            <span class="material-symbols-outlined relative z-10 group-[.active]:animate-pulse group-hover:animate-bounce">dashboard</span>
            <span class="text-xs font-bold uppercase tracking-wider relative z-10 whitespace-nowrap transition-all duration-300"
                  [class.opacity-0]="sidebarService.isCollapsed()"
                  [class.translate-x-[-10px]]="sidebarService.isCollapsed()">Console</span>
            
            <span class="ml-auto opacity-0 group-hover:opacity-100 text-[9px] text-[#ec5b13] transition-opacity duration-300 hidden lg:block"
                  [class.hidden]="sidebarService.isCollapsed()">[02]</span>
            <span class="ml-auto w-2 h-2 rounded-full bg-[#ec5b13] animate-ping relative z-10 hidden group-[.active]:block"
                  [class.hidden]="sidebarService.isCollapsed()"></span>
        </a>
        
        <a routerLink="/planner" routerLinkActive="active" 
           class="flex items-center gap-4 px-6 py-3 border-l-2 transition-all group relative border-transparent hover:border-[#ec5b13] hover:bg-[#ec5b13]/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white [&.active]:border-[#ec5b13] [&.active]:bg-[#ec5b13]/10 [&.active]:text-[#ec5b13]">
            <span class="active-bg absolute inset-0 bg-gradient-to-r from-[#ec5b13]/10 to-transparent w-1/2 hidden group-[.active]:block"></span>
            <span class="material-symbols-outlined relative z-10 group-[.active]:animate-pulse group-hover:animate-bounce">calendar_month</span>
            <span class="text-xs font-bold uppercase tracking-wider relative z-10 whitespace-nowrap transition-all duration-300"
                  [class.opacity-0]="sidebarService.isCollapsed()"
                  [class.translate-x-[-10px]]="sidebarService.isCollapsed()">Planner</span>
            <span class="ml-auto w-2 h-2 rounded-full bg-[#ec5b13] animate-ping relative z-10 hidden group-[.active]:block"
                  [class.hidden]="sidebarService.isCollapsed()"></span>
        </a>
        
        <a routerLink="/statistics" routerLinkActive="active" 
           class="flex items-center gap-4 px-6 py-3 border-l-2 transition-all group relative border-transparent hover:border-[#ec5b13] hover:bg-[#ec5b13]/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white [&.active]:border-[#ec5b13] [&.active]:bg-[#ec5b13]/10 [&.active]:text-[#ec5b13]">
            <span class="active-bg absolute inset-0 bg-gradient-to-r from-[#ec5b13]/10 to-transparent w-1/2 hidden group-[.active]:block"></span>
            <span class="material-symbols-outlined relative z-10 group-[.active]:animate-pulse group-hover:animate-bounce">monitoring</span>
            <span class="text-xs font-bold uppercase tracking-wider relative z-10 whitespace-nowrap transition-all duration-300"
                  [class.opacity-0]="sidebarService.isCollapsed()"
                  [class.translate-x-[-10px]]="sidebarService.isCollapsed()">Analytics</span>
            <span class="ml-auto w-2 h-2 rounded-full bg-[#ec5b13] animate-ping relative z-10 hidden group-[.active]:block"
                  [class.hidden]="sidebarService.isCollapsed()"></span>
        </a>

        <div class="flex items-center px-6 mt-6 mb-2 transition-opacity duration-300" [class.opacity-0]="sidebarService.isCollapsed()">
            <span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest border-l-2 border-slate-200 dark:border-slate-700 pl-2 whitespace-nowrap">System_Control</span>
        </div>

        <a routerLink="/settings" routerLinkActive="active" 
           class="flex items-center gap-4 px-6 py-3 border-l-2 transition-all group relative border-transparent hover:border-[#ec5b13] hover:bg-[#ec5b13]/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white [&.active]:border-[#ec5b13] [&.active]:bg-[#ec5b13]/10 [&.active]:text-[#ec5b13]">
            <span class="active-bg absolute inset-0 bg-gradient-to-r from-[#ec5b13]/10 to-transparent w-1/2 hidden group-[.active]:block"></span>
            <span class="material-symbols-outlined relative z-10 group-[.active]:animate-pulse group-hover:animate-bounce">settings_input_component</span>
            <span class="text-xs font-bold uppercase tracking-wider relative z-10 whitespace-nowrap transition-all duration-300"
                  [class.opacity-0]="sidebarService.isCollapsed()"
                  [class.translate-x-[-10px]]="sidebarService.isCollapsed()">Core Settings</span>
            <span class="ml-auto w-2 h-2 rounded-full bg-[#ec5b13] animate-ping relative z-10 hidden group-[.active]:block"
                  [class.hidden]="sidebarService.isCollapsed()"></span>
        </a>
      </nav>

      <!-- Theme Toggle -->
      <div class="px-6 py-4 mt-auto border-t dark:border-[#2a3441]">
        <button (click)="themeService.toggleTheme()" class="w-full flex items-center gap-4 px-0 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <span class="material-symbols-outlined">
            {{ themeService.currentTheme() === 'dark' ? 'light_mode' : 'dark_mode' }}
          </span>
          <span class="text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300"
                  [class.opacity-0]="sidebarService.isCollapsed()"
                  [class.translate-x-[-10px]]="sidebarService.isCollapsed()">
            {{ themeService.currentTheme() === 'dark' ? 'Light Mode' : 'Dark Mode' }}
          </span>
        </button>
      </div>

      <!-- Profile Section -->
      <div class="p-4 border-t dark:border-[#2a3441] bg-white dark:bg-[#0c0e12]">
        <div class="tac-panel p-3 flex items-center gap-3 group cursor-pointer hover:border-[#ec5b13] transition-colors rounded-lg overflow-hidden">
            
            <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
            
            <div class="relative shrink-0">
                <img alt="User" class="w-10 h-10 border border-slate-300 dark:border-slate-600 grayscale group-hover:grayscale-0 transition-all rounded object-cover" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100"/>
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-white dark:bg-black border border-[#ec5b13] flex items-center justify-center">
                    <div class="w-1 h-1 bg-[#ec5b13]"></div>
                </div>
            </div>
            <div class="min-w-0 transition-all duration-300" 
                 [class.opacity-0]="sidebarService.isCollapsed()" 
                 [class.w-0]="sidebarService.isCollapsed()"
                 [class.translate-x-[-10px]]="sidebarService.isCollapsed()">
                <p class="text-[10px] font-black text-slate-800 dark:text-white truncate tracking-widest leading-tight">ALEX_SEC</p>
                <p class="text-[9px] text-[#ec5b13] truncate">AUTHORIZED_USER</p>
            </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host { font-family: 'Inter', sans-serif; }
    .material-symbols-outlined { 
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  sidebarService = inject(SidebarService);
  themeService = inject(ThemeService);
}
