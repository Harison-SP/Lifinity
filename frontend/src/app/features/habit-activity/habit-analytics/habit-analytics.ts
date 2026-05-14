import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { Habit, AnalyticsResponse, BinaryHabitAnalytics, MeasurableHabitAnalytics } from '../../../models/habit.model';

@Component({
  selector: 'app-habit-analytics',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './habit-analytics.html',
  styleUrl: './habit-analytics.css',
  encapsulation: ViewEncapsulation.None
})
export class HabitAnalyticsComponent implements OnChanges {
  @Input({ required: true }) habit!: Habit;
  @Input({ required: true }) analytics!: AnalyticsResponse;

  // Chart Data
  successRatioData = signal<any[]>([]);
  missedDayPatternData = signal<any[]>([]);
  
  // Colors - Warm natural palette
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#f97316', '#4a443e', '#9a9086', '#8c9a81', '#f4efea']
  };

  successColorScheme: Color = {
    name: 'success',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#f97316', '#8c9a81']
  };

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['analytics'] || changes['habit']) && this.analytics && this.habit) {
      this.processData();
    }
  }

  private processData() {
    if (this.habit.type === 'yes_no') {
      if (this.analytics.binary_stats) {
        this.processBinaryData(this.analytics.binary_stats);
      }
    } else {
      if (this.analytics.measurable_stats) {
        this.processMeasurableData(this.analytics.measurable_stats);
      }
    }
  }

  private processBinaryData(data: BinaryHabitAnalytics) {
    this.successRatioData.set([
      { name: 'Success', value: data.success_ratio },
      { name: 'Missed', value: Math.max(0, 100 - data.success_ratio) }
    ]);

    if (data.missed_day_pattern && Array.isArray(data.missed_day_pattern)) {
      this.missedDayPatternData.set(data.missed_day_pattern.map(item => ({
        name: item.day_name.substring(0, 3),
        value: item.count
      })));
    }
  }

  private processMeasurableData(data: MeasurableHabitAnalytics) {
    this.successRatioData.set([
      { name: 'Achieved', value: data.target_achievement_rate },
      { name: 'Remaining', value: Math.max(0, 100 - data.target_achievement_rate) }
    ]);
  }
}
