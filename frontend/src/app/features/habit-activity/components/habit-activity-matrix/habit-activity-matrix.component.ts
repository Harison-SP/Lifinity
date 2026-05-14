import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit } from '../../../../models/habit.model';
import { eachMonthOfInterval, eachDayOfInterval, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isSameMonth, format, parseISO } from 'date-fns';

@Component({
    selector: 'app-habit-activity-matrix',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
                <h3 class="font-heading text-lg md:text-xl font-bold text-charcoal">Activity Matrix</h3>
                <p class="text-[10px] md:text-xs text-taupe mt-0.5 md:mt-1">Visualization of historical adherence</p>
            </div>
            <div class="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-taupe bg-sand p-2 rounded-lg self-start sm:self-auto">
                <span>Muted</span>
                <div class="flex gap-1">
                    <div class="w-2.5 h-2.5 md:w-3 md:h-3 bg-sand-dark rounded-[2px]"></div>
                    <div class="w-2.5 h-2.5 md:w-3 md:h-3 bg-orange-500/40 rounded-[2px]"></div>
                    <div class="w-2.5 h-2.5 md:w-3 md:h-3 bg-orange-500/70 rounded-[2px]"></div>
                    <div class="w-2.5 h-2.5 md:w-3 md:h-3 bg-orange-600 rounded-[2px]"></div>
                </div>
                <span>Active</span>
            </div>
        </div>
        
        <div class="flex flex-wrap gap-6 md:gap-8 justify-center sm:justify-start min-h-[100px]">
            @for (monthData of timelineMonths(); track monthData.monthYear) {
                <div class="w-full max-w-[180px] md:max-w-[200px]">
                    <h4 class="text-[10px] md:text-xs font-bold text-charcoal mb-2 md:mb-3 uppercase tracking-wider text-center">
                        {{ monthData.monthName }} {{ monthData.year }}
                    </h4>
                    <div class="grid grid-cols-7 gap-1 md:gap-1.5">
                        @for (d of ['S','M','T','W','T','F','S']; track $index) {
                            <div class="text-center text-[8px] md:text-[9px] font-bold text-taupe">{{ d }}</div>
                        }
                        @for (day of monthData.days; track $index) {
                            @if (day.isEmpty) {
                                <div class="aspect-square"></div>
                            } @else {
                                <div class="w-full aspect-square rounded-[2px] md:rounded-[3px] transition-all hover:scale-125 cursor-help relative"
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
            } @empty {
                <div class="w-full py-10 text-center border border-dashed border-taupe/20 rounded-xl">
                    <span class="material-symbols-outlined text-taupe/30 text-4xl mb-2">calendar_today</span>
                    <p class="text-xs text-taupe italic">No activity timeline available for this protocol range.</p>
                </div>
            }
        </div>
    `
})
export class HabitActivityMatrixComponent {
    @Input({ required: true }) habit!: Habit | null;
    @Input({ required: true }) heatmapData!: {date: string, level: number}[];

    isMobile = signal(window.innerWidth < 768);

    timelineMonths = computed(() => {
        const h = this.habit;
        if (!h || !h.startDate || !h.endDate) return [];
        
        try {
            const start = parseISO(h.startDate);
            const end = parseISO(h.endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.error('Invalid dates in Activity Matrix:', h.startDate, h.endDate);
                return [];
            }

            const dataMap = new Map(this.heatmapData.map(item => [item.date, item.level]));
            const months = eachMonthOfInterval({ start, end });
            
            return months.map(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                
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
        } catch (e) {
            console.error('Error computing timeline months:', e);
            return [];
        }
    });
}
