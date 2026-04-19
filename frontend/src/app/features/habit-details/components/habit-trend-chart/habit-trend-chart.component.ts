import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-habit-trend-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="h-full flex flex-col w-full min-h-[250px]">
        <h3 class="font-heading text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-sage">trending_up</span>
            Adherence Efficiency
        </h3>
        
        <div class="flex-1 w-full h-full min-h-[250px]" #containerRef>
            @if (chartData.length > 0) {
                <ngx-charts-line-chart
                    [scheme]="colorScheme"
                    [results]="chartData"
                    [gradient]="true"
                    [xAxis]="true"
                    [yAxis]="true"
                    [showXAxisLabel]="true"
                    [showYAxisLabel]="true"
                    xAxisLabel="Timeline"
                    yAxisLabel="Completion Rate (%)"
                    [autoScale]="true">
                </ngx-charts-line-chart>
            } @else {
                <div class="w-full h-full flex items-center justify-center text-taupe text-sm">
                    Not enough data for adherence efficiency trend.
                </div>
            }
        </div>
    </div>
  `
})
export class HabitTrendChartComponent {
    @Input() set stats(val: any | null) {
        if (val && val.completion_trend && val.completion_trend.length > 0) {
            this.chartData = [
                {
                    name: 'Efficiency',
                    series: val.completion_trend.map((item: any) => ({
                        name: item.period,
                        value: item.rate
                    }))
                }
            ];
        } else {
            this.chartData = [];
        }
    }

    chartData: any[] = [];
    colorScheme: Color = {
        name: 'trend',
        selectable: true,
        group: ScaleType.Ordinal,
        domain: ['#f97316'] 
    };
}
