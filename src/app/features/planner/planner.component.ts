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
    <div class="h-full overflow-y-auto relative z-10 bg-concrete-200 min-h-screen font-manrope footer-pb">
        
        <div class="p-6 lg:p-10 max-w-[1600px] mx-auto relative z-10">
          <!-- Header -->
          <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-black pb-6">
            <div class="flex items-center gap-4">
              <button (click)="goBack()" class="w-12 h-12 flex items-center justify-center rigid-border-sm bg-white hover:bg-black hover:text-white transition-all group">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <div>
                <div class="bg-black text-white px-2 py-0.5 inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                    System_Planner // Beta
                </div>
                <h2 class="text-4xl md:text-6xl font-black text-black tracking-tight uppercase font-arvo">
                    Temporal_Grid
                </h2>
              </div>
            </div>

            <!-- Period Tabs -->
            <div class="flex p-1 gap-2">
              @for (period of periods; track period.value) {
                <button 
                  (click)="activePeriod.set(period.value)"
                  class="px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rigid-border-sm border-[2px] flex items-center gap-2"
                  [class.bg-black]="activePeriod() === period.value"
                  [class.text-white]="activePeriod() === period.value"
                  [class.shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]]="activePeriod() === period.value"
                  [class.bg-white]="activePeriod() !== period.value"
                  [class.text-black]="activePeriod() !== period.value"
                  [class.hover:translate-x-[1px]]="activePeriod() !== period.value"
                  [class.hover:translate-y-[1px]]="activePeriod() !== period.value">
                  <span class="material-symbols-outlined text-sm">{{period.icon}}</span>
                  <span class="hidden md:inline">{{period.label}}</span>
                </button>
              }
            </div>
          </header>

          <!-- Content Area -->
          <div class="bg-white rigid-border border-[4px] p-6 min-h-[600px] relative brutalist-shadow-md">
            @if (activePeriod() === 'yearly') {
              <app-yearly-view></app-yearly-view>
            } @else if (activePeriod() === 'monthly') {
                <!-- Placeholder for now as we focus on Daily -->
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
