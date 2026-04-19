import { Component, Input, Output, EventEmitter, computed, signal, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit } from '../../../../models/habit.model';
import { format, isFuture, isSameDay, startOfMonth, startOfWeek, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';

@Component({
  selector: 'app-habit-calendar-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between mb-6">
        <h3 class="font-heading text-lg font-bold text-charcoal">{{ calendarMonthName() }} {{ calendarYear() }}</h3>
        <div class="flex gap-1">
            <button (click)="$event.stopPropagation(); previousMonth()" [disabled]="!canPrevMonth()" class="w-8 h-8 rounded-full bg-sand flex items-center justify-center hover:bg-sand-dark transition-colors disabled:opacity-20">
                <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button (click)="$event.stopPropagation(); nextMonth()" [disabled]="!canNextMonth()" class="w-8 h-8 rounded-full bg-sand flex items-center justify-center hover:bg-sand-dark transition-colors disabled:opacity-20">
                <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
        </div>
    </div>
    
    <div class="grid grid-cols-7 gap-1 mb-2">
        @for (d of ['S','M','T','W','T','F','S']; track $index) {
            <div class="text-center text-[10px] font-bold text-taupe uppercase">{{d}}</div>
        }
    </div>
    <div class="grid grid-cols-7 gap-2">
        @for (day of calendarDays(); track day.date) {
            @if (day.isEmpty) {
                <div></div>
            } @else {
                <div (click)="onDateSelect(day.date)" 
                     class="aspect-square flex items-center justify-center text-xs font-bold rounded-lg border-2 border-transparent transition-all relative"
                     [class.cursor-pointer]="!day.isFuture"
                     [class.hover:bg-sand]="!day.isFuture"
                     [class.opacity-30]="day.isFuture"
                     [class.pointer-events-none]="day.isFuture"
                     
                     [class.bg-sage]="day.isCompleted"
                     [class.text-white]="day.isCompleted"
                     
                     [class.border-orange-500]="day.isToday && !day.isCompleted"
                     [class.text-orange-600]="day.isToday && !day.isCompleted"
                     
                     [class.bg-sand]="!day.isCompleted && !day.isToday && !day.isFuture"
                     [class.text-taupe]="!day.isCompleted && !day.isToday && !day.isFuture">
                    {{ day.dayNumber }}
                </div>
            }
        }
    </div>
    <p class="text-[10px] text-taupe mt-4 text-center">Tap a date to update adherence</p>
  `
})
export class HabitCalendarViewComponent implements OnChanges {
    @Input({ required: true }) habit!: Habit | null;
    @Input() completedDates: string[] = [];
    @Output() dateSelected = new EventEmitter<string>();

    currentDate = signal(new Date());

    ngOnChanges(changes: SimpleChanges): void {
        // Handle input changes if needed, but computed will auto-update
    }

    calendarMonthName = computed(() => format(this.currentDate(), 'MMMM').toUpperCase());
    calendarYear = computed(() => format(this.currentDate(), 'yyyy'));

    calendarDays = computed(() => {
        const monthStart = startOfMonth(this.currentDate());
        const monthEnd = endOfMonth(this.currentDate());
        const gridStart = startOfWeek(monthStart);
        const gridEnd = endOfWeek(monthEnd);

        const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
        const completedSet = new Set(this.completedDates);
        const today = new Date();

        return days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            return {
                date: dateStr,
                dayNumber: date.getDate(),
                isEmpty: !isSameMonth(date, this.currentDate()),
                isCompleted: completedSet.has(dateStr),
                isToday: isSameDay(date, today),
                isFuture: isFuture(date)
            };
        });
    });

    canPrevMonth = computed(() => {
        if (!this.habit || !this.habit.startDate) return true;
        const start = startOfMonth(new Date(this.habit.startDate));
        return this.currentDate() > start;
    });

    canNextMonth = computed(() => {
        if (!this.habit || !this.habit.endDate) return true;
        const end = startOfMonth(new Date(this.habit.endDate));
        return this.currentDate() < end;
    });

    previousMonth() {
        this.currentDate.update(d => subMonths(d, 1));
    }

    nextMonth() {
        this.currentDate.update(d => addMonths(d, 1));
    }

    onDateSelect(date: string) {
        this.dateSelected.emit(date);
    }
}
