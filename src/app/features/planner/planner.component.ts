import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { PlannerService, PlannerGoal, PlannerTask } from '../../services/planner.service';
import { YearlyViewComponent } from './yearly-view/yearly-view.component';
import { MonthlyViewComponent } from './monthly-view/monthly-view.component';
import { WeeklyViewComponent } from './weekly-view/weekly-view.component';
import { DailyViewComponent } from './daily-view/daily-view.component';


@Component({
  selector: 'app-planner',
  imports: [CommonModule, YearlyViewComponent, MonthlyViewComponent, WeeklyViewComponent, DailyViewComponent, SidebarComponent],
  template: `
    <div class="bg-[#f8faf9] dark:bg-[#0d1610] font-display text-[#0d1b12] dark:text-white antialiased min-h-screen flex flex-col md:flex-row overflow-hidden">
      <app-sidebar />
      
      <main class="flex-1 flex flex-col h-screen overflow-hidden relative overflow-y-auto w-full">
        <div class="p-8 max-w-7xl mx-auto w-full">
        <!-- Header -->
        <div class="mb-8 flex items-center gap-4">
          <button (click)="goBack()" class="size-11 rounded-xl bg-white dark:bg-[#1a2c20] shadow-sm flex items-center justify-center text-[#4c9a66] hover:text-[#0d1b12] dark:hover:text-white transition-colors">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 class="text-4xl font-black text-[#0d1b12] dark:text-white mb-2">Planner</h1>
            <p class="text-[#4c9a66] dark:text-[#13ec5b]">Plan your goals and tasks</p>
          </div>
        </div>

        <!-- Period Tabs -->
        <div class="bg-white dark:bg-[#1a2c20] rounded-2xl shadow-lg p-2 mb-6 flex gap-2">
          <button 
            *ngFor="let period of periods"
            (click)="activePeriod.set(period.value)"
            [class.bg-[#13ec5b]]="activePeriod() === period.value"
            [class.text-[#0d1b12]]="activePeriod() === period.value"
            [class.font-bold]="activePeriod() === period.value"
            class="flex-1 px-6 py-3 rounded-xl transition-all duration-300 text-[#4c9a66] hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <span class="material-symbols-outlined align-middle mr-2">{{period.icon}}</span>
            {{period.label}}
          </button>
        </div>

        <!-- Content Area -->
        <div class="bg-white dark:bg-[#1a2c20] rounded-2xl shadow-lg p-8">
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
      </main>
    </div>
  `,
  styles: [`
    :host { font-family: 'Inter', sans-serif; }
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
