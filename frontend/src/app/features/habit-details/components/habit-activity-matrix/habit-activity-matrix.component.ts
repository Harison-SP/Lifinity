import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit } from '../../../../models/habit.model';
import { eachMonthOfInterval, eachDayOfInterval, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isSameMonth, format } from 'date-fns';

@Component({
    selector: 'app-habit-activity-matrix',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <h3 class="font-heading text-xl font-bold text-charcoal">Activity Matrix</h3>
                <p class="text-xs text-taupe mt-1">Visualization of historical adherence</p>
            </div>
            <div class="flex items-center gap-2 text-[10px] font-bold text-taupe bg-sand p-2 rounded-lg">
                <span>Muted</span>
                <div class="flex gap-1">
                    <div class="w-3 h-3 bg-sand-dark rounded-[2px]"></div>
                    <div class="w-3 h-3 bg-orange-500/40 rounded-[2px]"></div>
                    <div class="w-3 h-3 bg-orange-500/70 rounded-[2px]"></div>
                    <div class="w-3 h-3 bg-orange-600 rounded-[2px]"></div>
                </div>
                <span>Active</span>
            </div>
        </div>
        
        <div class="flex flex-wrap gap-8 justify-center sm:justify-start">
            @for (monthData of timelineMonths(); track monthData.monthYear) {
                <div class="w-full max-w-[200px]">
                    <h4 class="text-xs font-bold text-charcoal mb-3 uppercase tracking-wider text-center">
                        {{ monthData.monthName }} {{ monthData.year }}
                    </h4>
                    <div class="grid grid-cols-7 gap-1.5">
                        @for (d of ['S','M','T','W','T','F','S']; track $index) {
                            <div class="text-center text-[9px] font-bold text-taupe">{{ d }}</div>
                        }
                        @for (day of monthData.days; track $index) {
                            @if (day.isEmpty) {
                                <div class="aspect-square"></div>
                            } @else {
                                <div class="w-full aspect-square rounded-[3px] transition-all hover:scale-125 cursor-help relative"
                                    [class.bg-sand]="day.level === 0"
                                    [class.bg-orange-500/40]="day.level === 1"
                                    [class.bg-orange-500/70]="day.level === 2"
                                    [class.bg-orange-600]="day.level >= 3"
                                    [title]="day.date + ': Adherence Level ' + (day.level || 0)">
                                </div>
                            }
                        }
                    </div>
                </div>
            }
        </div>
    `
})
export class HabitActivityMatrixComponent {
    @Input({ required: true }) habit!: Habit | null;
    @Input({ required: true }) heatmapData!: {date: string, level: number}[];

    timelineMonths = computed(() => {
        const h = this.habit;
        if (!h || !h.startDate || !h.endDate) return [];
        
        const start = new Date(h.startDate);
        const end = new Date(h.endDate);
        const dataMap = new Map(this.heatmapData.map(item => [item.date, item.level]));

        const months = eachMonthOfInterval({ start, end });
        
        return months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            
            // Generate full calendar grid for the month
            const gridStart = startOfWeek(monthStart);
            const gridEnd = endOfWeek(monthEnd);
            const daysInGrid = eachDayOfInterval({ start: gridStart, end: gridEnd });

            const days = daysInGrid.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return {
                    isEmpty: !isSameMonth(date, month),
                    date: dateStr,
                    level: dataMap.get(dateStr) || 0
                };
            });

            return {
                monthName: format(month, 'MMMM').toUpperCase(),
                year: format(month, 'yyyy'),
                monthYear: format(month, 'yyyy-MM'),
                days
            };
        });
    });
}
