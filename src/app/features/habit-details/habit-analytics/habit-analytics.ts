import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
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
export class HabitAnalytics implements OnChanges {
  @Input() habit!: Habit;
  @Input() analytics!: AnalyticsResponse;

  // Chart Data
  successRatioData: any[] = [];
  missedDayPatternData: any[] = [];
  trendData: any[] = [];
  
  // Chart Options
  view: [number, number] = [700, 300]; // Responsive view
  
  // Colors
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#ec5b13', '#2a3441', '#1a2c20', '#A10A28', '#C7B42C', '#AAAAAA']
  };
  
  // Specific colors for pie chart (Success/Failure)
  successColorScheme: Color = {
    name: 'success',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#ec5b13', '#1e293b'] 
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['analytics'] && this.analytics) {
      this.processData();
    }
  }

  processData() {
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
    // 1. Success Ratio (Pie Chart)
    this.successRatioData = [
      {
        name: 'Success',
        value: data.success_ratio
      },
      {
        name: 'Missed',
        value: 100 - data.success_ratio
      }
    ];

    // 2. Missed Day Pattern (Bar Chart)
    // data.missed_day_pattern is { "Monday": 5, "Tuesday": 2 ... }
    this.missedDayPatternData = Object.keys(data.missed_day_pattern).map(day => ({
      name: day.substring(0, 3), // Mon, Tue
      value: data.missed_day_pattern[day]
    }));
  }

  private processMeasurableData(data: MeasurableHabitAnalytics) {
    // 1. Trend Direction 
    
    // Let's create a gauge-like data for Target Achievement
    this.successRatioData = [ // Reusing this variable for simplicity or rename it
      {
        name: 'Achieved',
        value: data.target_achievement_rate
      },
      {
        name: 'Remaining',
        value: Math.max(0, 100 - data.target_achievement_rate)
      }
    ];
  }
}
