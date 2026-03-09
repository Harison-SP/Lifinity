import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { YearlyViewComponent } from './yearly-view/yearly-view.component';
import { MonthlyViewComponent } from './monthly-view/monthly-view.component';
import { WeeklyViewComponent } from './weekly-view/weekly-view.component';
import { DailyViewComponent } from './daily-view/daily-view.component';

@Component({
  selector: 'app-planner',
  imports: [CommonModule, YearlyViewComponent, MonthlyViewComponent, WeeklyViewComponent, DailyViewComponent],
  template: `
    <div class="h-full overflow-y-auto overflow-x-hidden relative z-10 bg-concrete-200 dark:bg-concrete-900 min-h-screen font-manrope footer-pb transition-colors duration-300">
        
        <div class="px-3 py-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto relative z-10">
          <!-- Header -->
          <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-black dark:border-white pb-6">
            <div class="flex items-center gap-4">
              <button (click)="goBack()" class="w-12 h-12 flex items-center justify-center rigid-border-sm bg-white dark:bg-concrete-800 dark:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all group">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <div>
                <div class="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                    System_Planner // Beta
                </div>
                <h2 class="text-4xl md:text-6xl font-black text-black dark:text-white tracking-tight uppercase font-arvo">
                    Temporal_Grid
                </h2>
              </div>
            </div>

            <!-- Period Tabs -->
            <div class="flex w-full md:w-auto overflow-x-auto p-1 gap-2 no-scrollbar">
              @for (period of periods; track period.value) {
                <button 
                  (click)="activePeriod.set(period.value)"
                  class="shrink-0 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all rigid-border-sm border-[2px] flex items-center gap-2"
                  [class.bg-black]="activePeriod() === period.value"
                  [class.dark:bg-white]="activePeriod() === period.value"
                  [class.text-white]="activePeriod() === period.value"
                  [class.dark:text-black]="activePeriod() === period.value"
                  [class.shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]]="activePeriod() === period.value"
                  [class.dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.4)]]="activePeriod() === period.value"
                  [class.bg-white]="activePeriod() !== period.value"
                  [class.dark:bg-concrete-800]="activePeriod() !== period.value"
                  [class.text-black]="activePeriod() !== period.value"
                  [class.dark:text-white]="activePeriod() !== period.value"
                  [class.hover:translate-x-[1px]]="activePeriod() !== period.value"
                  [class.hover:translate-y-[1px]]="activePeriod() !== period.value">
                  <span class="material-symbols-outlined text-sm">{{period.icon}}</span>
                  <span class="hidden md:inline">{{period.label}}</span>
                </button>
              }
            </div>
          </header>

          <!-- Content Area -->
          <div class="bg-white dark:bg-concrete-800 rigid-border border-[4px] dark:border-white p-3 sm:p-4 md:p-6 min-h-[520px] md:min-h-[600px] relative brutalist-shadow-md dark:shadow-[8px_8px_0_0_white] overflow-hidden">
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
    :host { display: block; height: 100%; }
    .footer-pb { padding-bottom: 100px; }
  `]
})
export class PlannerComponent implements OnInit {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  activePeriod = signal<'yearly' | 'monthly' | 'weekly' | 'daily'>('daily');
  
  periods = [
    { value: 'yearly' as const, label: 'Yearly', icon: 'calendar_today' },
    { value: 'monthly' as const, label: 'Monthly', icon: 'event' },
    { value: 'weekly' as const, label: 'Weekly', icon: 'view_week' },
    { value: 'daily' as const, label: 'Daily', icon: 'schedule' }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const view = params['view'];
      if (view && this.periods.some(p => p.value === view)) {
        this.activePeriod.set(view);
      }
    });
  }

  goBack() {
    this.location.back();
  }
}





