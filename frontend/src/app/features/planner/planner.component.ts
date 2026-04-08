import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { YearlyViewComponent } from './yearly-view/yearly-view.component';
import { MonthlyViewComponent } from './monthly-view/monthly-view.component';
import { WeeklyViewComponent } from './weekly-view/weekly-view.component';
import { DailyViewComponent } from './daily-view/daily-view.component';

@Component({
    selector: 'app-planner',
    standalone: true,
    imports: [CommonModule, YearlyViewComponent, MonthlyViewComponent, WeeklyViewComponent, DailyViewComponent],
    template: `
    <div class="min-h-screen bg-white font-body transition-colors duration-300 paper-texture">
        <div class="max-w-7xl mx-auto px-4 py-6 md:py-8 lg:py-10">
            <!-- Header -->
            <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
                <div class="flex items-center gap-4">
                    <button (click)="goBack()" class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg border border-taupe/30 bg-alabaster hover:bg-sand transition-colors">
                        <span class="material-symbols-outlined text-taupe">arrow_back</span>
                    </button>
                    <div>
                        <h2 class="font-heading text-2xl md:text-4xl font-bold text-charcoal">
                            Planner
                        </h2>
                        <p class="text-taupe text-sm mt-1">Plan and visualize your habits</p>
                    </div>
                </div>

                <!-- Period Tabs -->
                <div class="flex w-full md:w-auto gap-2 overflow-x-auto py-1 no-scrollbar">
                    @for (period of periods; track period.value) {
                        <button
                            (click)="activePeriod.set(period.value)"
                            class="shrink-0 px-4 py-2 text-sm font-medium rounded-full border transition-all flex items-center gap-2 whitespace-nowrap"
                            [class.bg-primary]="activePeriod() === period.value"
                            [class.text-white]="activePeriod() === period.value"
                            [class.border-primary]="activePeriod() === period.value"
                            [class.border-taupe/30]="activePeriod() !== period.value"
                            [class.text-charcoal]="activePeriod() !== period.value"
                            [class.hover:bg-sand]="activePeriod() !== period.value">
                            <span class="material-symbols-outlined text-base">{{period.icon}}</span>
                            <span>{{period.label}}</span>
                        </button>
                    }
                </div>
            </header>

            <!-- Content Area -->
            <div class="bg-alabaster rounded-lg shadow-gentle p-4 md:p-6 min-h-[520px] md:min-h-[600px] border border-taupe/10">
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
    `]
})
export class PlannerComponent implements OnInit {
    private location = inject(Location);
    private route = inject(ActivatedRoute);
    activePeriod = signal<'yearly' | 'monthly' | 'weekly' | 'daily'>('daily');

    periods = [
        { value: 'yearly' as const, label: 'Yearly', icon: 'calendar_month' },
        { value: 'monthly' as const, label: 'Monthly', icon: 'calendar_month' },
        { value: 'weekly' as const, label: 'Weekly', icon: 'view_week' },
        { value: 'daily' as const, label: 'Daily', icon: 'today' }
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