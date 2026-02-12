import { Component, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { YearlyViewComponent } from './yearly-view/yearly-view.component';
import { MonthlyViewComponent } from './monthly-view/monthly-view.component';
import { WeeklyViewComponent } from './weekly-view/weekly-view.component';
import { DailyViewComponent } from './daily-view/daily-view.component';

@Component({
  selector: 'app-planner',
  imports: [CommonModule, YearlyViewComponent, MonthlyViewComponent, WeeklyViewComponent, DailyViewComponent],
  template: `
    <div class="h-full overflow-y-auto relative z-10 bg-[#050608]">
        <div class="scanline"></div>
        <div class="fixed inset-0 pointer-events-none z-0" style="background-image: radial-gradient(circle at center, transparent 0%, #050608 100%); opacity: 0.8"></div>
        
        <div class="p-6 lg:p-10 max-w-[1600px] mx-auto relative z-10">
          <!-- Header -->
          <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
            <div class="flex items-center gap-4">
              <button (click)="goBack()" class="w-10 h-10 flex items-center justify-center rounded border border-slate-700 text-slate-500 hover:border-[#ec5b13] hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-all">
                <span class="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h2 class="text-3xl font-black text-white tracking-tight uppercase glitch-hover cursor-default">
                    SYS_PLANNER: <span class="text-slate-500">SECTOR_BETA</span>
                </h2>
                <div class="flex items-center gap-3 mt-1 text-[10px] text-[#ec5b13] font-mono tracking-widest uppercase">
                    <span>STATUS: ACTIVE</span>
                    <span class="text-slate-700">//</span>
                    <span>TEMPORAL_ALIGNMENT_ENGAGED</span>
                </div>
              </div>
            </div>

            <!-- Period Tabs -->
            <div class="flex bg-[#0c0e12] p-1 rounded-lg border border-slate-800">
              @for (period of periods; track period.value) {
                <button 
                  (click)="activePeriod.set(period.value)"
                  class="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
                  [class.bg-[#ec5b13]]="activePeriod() === period.value"
                  [class.text-white]="activePeriod() === period.value"
                  [class.shadow-[0_0_15px_rgba(236,91,19,0.4)]]="activePeriod() === period.value"
                  [class.text-slate-500]="activePeriod() !== period.value"
                  [class.hover:text-white]="activePeriod() !== period.value"
                  [class.hover:bg-slate-800]="activePeriod() !== period.value">
                  <span class="material-symbols-outlined text-sm">{{period.icon}}</span>
                  <span class="hidden md:inline">{{period.label}}</span>
                </button>
              }
            </div>
          </header>

          <!-- Content Area -->
          <div class="tac-panel p-6 min-h-[600px] relative">
            <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
            
            @if (activePeriod() === 'yearly') {
              <app-yearly-view></app-yearly-view>
            } @else if (activePeriod() === 'monthly') {
              <app-monthly-view></app-monthly-view>
            } @else if (activePeriod() === 'weekly') {
              <app-weekly-view></app-weekly-view>
            } @else if (activePeriod() === 'daily') {
              <app-daily-view></app-daily-view>
            }
          </div>
        </div>
    </div>
  `,
  styles: [`
    :host { font-family: 'Public Sans', sans-serif; display: block; height: 100%; }
    .material-symbols-outlined { 
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
  `]
})
export class PlannerComponent {
  private location = inject(Location);
  activePeriod = signal<'yearly' | 'monthly' | 'weekly' | 'daily'>('daily');
  
  periods = [
    { value: 'yearly' as const, label: 'Yearly', icon: 'calendar_today' },
    { value: 'monthly' as const, label: 'Monthly', icon: 'event' },
    { value: 'weekly' as const, label: 'Weekly', icon: 'view_week' },
    { value: 'daily' as const, label: 'Daily', icon: 'schedule' }
  ];

  goBack() {
    this.location.back();
  }
}
