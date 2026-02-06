import { Component, ChangeDetectionStrategy, signal, computed, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../../../models/calendar-event.model';

interface EventSegment {
  id: string;
  title: string;
  color: string;
  startDay: number; // 1-31
  endDay: number;   // 1-31
  originalEvent: CalendarEvent;
  lane?: number;
}

interface MonthRow {
  name: string;
  index: number;
  days: number;
  segments: EventSegment[];
  maxLanes: number;
}

interface DragState {
  isDragging: boolean;
  type: 'move' | 'resize-start' | 'resize-end' | null;
  segment: EventSegment | null;
  row: MonthRow | null;
  startX: number;
  initialStartDay: number;
  initialEndDay: number;
  currentStartDay: number;
  currentEndDay: number;
  currentRow: MonthRow | null; // Track which row we are currently hovering
}

@Component({
  selector: 'app-linear-calendar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="yearly-grid-container w-full h-full flex flex-col bg-[#1a1a1a] text-white rounded-xl shadow-2xl p-4 overflow-auto custom-scrollbar select-none font-mono" #container>
      
      <!-- Header Row (Days) -->
      <div class="grid grid-cols-[60px_repeat(31,1fr)_60px] gap-0 border-b border-gray-800 mb-2 sticky top-0 bg-[#1a1a1a] z-20 pb-2">
        <div class="text-xs text-gray-500 font-bold uppercase tracking-wider text-center self-end"></div>
        @for (day of daysHeader; track day) {
          <div class="text-[10px] text-center text-gray-500 border-l border-gray-800/30 flex items-center justify-center">{{ day }}</div>
        }
        <div class="text-xs text-gray-500 font-bold uppercase tracking-wider text-center self-end pl-2"></div>
      </div>

      <!-- Month Rows -->
      <div class="flex flex-col gap-1 pb-10">
        @for (row of monthRows(); track row.name) {
          <!-- Row container with dynamic height based on lanes -->
          <div class="grid grid-cols-[60px_repeat(31,1fr)_60px] gap-0 hover:bg-white/5 transition-colors relative group border-b border-gray-800/30"
               [style.height.px]="math.max(row.maxLanes * 32 + 10, 48)">
            
            <!-- Month Label -->
            <div class="text-sm font-bold text-gray-300 flex items-center justify-center border-r border-gray-800 uppercase tracking-widest bg-[#1a1a1a]/50 sticky left-0 z-10 select-none cursor-pointer"
                 (dblclick)="onCellDoubleClick(row.index, 1)">
              {{ row.name }}
            </div>

            <!-- Days Grid Cells background -->
            @for (day of daysHeader; track day) {
               <div class="border-r border-gray-800/30 h-full relative"
                    [class.bg-weekend]="isWeekend(row.index, day)"
                    (click)="onCellClick(row.index, day)"
                    (dblclick)="onCellDoubleClick(row.index, day)">
                    @if (day <= row.days) {
                      <span class="absolute inset-x-0 bottom-1 text-[7px] text-center text-gray-500/40 pointer-events-none uppercase">
                        {{ getWeekdayLabel(row.index, day) }}
                      </span>
                    }
               </div>
            }
            
            <!-- Events Overlay for this Row -->
            <div class="absolute inset-0 left-[60px] right-[60px] pointer-events-none grid grid-cols-[repeat(31,1fr)]">
               @for (seg of row.segments; track seg.id + '-' + seg.startDay) {
                 <!-- Event Segment -->
                 <div class="absolute rounded shadow-md pointer-events-auto flex items-center px-2 overflow-hidden border border-white/10"
                      [class.z-20]="isSegmentActive(seg)"
                      [class.z-10]="!isSegmentActive(seg)"
                      [class.brightness-110]="isSegmentActive(seg)"
                      [class.ring-2]="isSegmentActive(seg)"
                      [class.ring-white]="isSegmentActive(seg)"
                      [style.left.%]="getSegmentLeft(seg, row)"
                      [style.width.%]="getSegmentWidth(seg, row)"
                      [style.top.px]="(seg.lane || 0) * 32 + 4"
                      [style.height.px]="28"
                      [style.background-color]="seg.color || '#4c9a66'"
                      (mousedown)="onMouseDown($event, seg, row, 'move')"
                      (click)="$event.stopPropagation(); onEventClick(seg.originalEvent)">
                   
                   <!-- Content -->
                   <span class="text-[10px] font-bold text-white whitespace-nowrap drop-shadow-md truncate w-full pointer-events-none">{{ seg.title }}</span>

                   <!-- Resize Handles (Only show on hover or active) -->
                   <div class="resize-handle left absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/50"
                        (mousedown)="onMouseDown($event, seg, row, 'resize-start')"></div>
                   <div class="resize-handle right absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/50"
                        (mousedown)="onMouseDown($event, seg, row, 'resize-end')"></div>
                 </div>
               }
            </div>

             <!-- End Label -->
             <div class="text-sm font-bold text-gray-500 flex items-center justify-center border-l border-gray-800 bg-[#1a1a1a]/50 sticky right-0 z-10">
               {{ row.name }}
             </div>

          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #333;
      border-radius: 5px;
      border: 2px solid #1a1a1a;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #444;
    }
    
    .bg-weekend {
       background-color: rgba(59, 130, 246, 0.12);
    }
    
    .bg-stripes {
       background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.03) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.03) 50%, rgba(255, 255, 255, 0.03) 75%, transparent 75%, transparent);
       background-size: 8px 8px;
    }
  `]
})
export class LinearCalendarComponent implements OnInit, OnChanges {
  @Input() events: CalendarEvent[] = [];
  @Output() eventClick = new EventEmitter<CalendarEvent>();
  @Output() backgroundClick = new EventEmitter<Date>(); 
  @Output() eventUpdate = new EventEmitter<CalendarEvent>();
  @Output() eventCreate = new EventEmitter<{date: Date, title: string}>();
  
  @ViewChild('container') containerRef!: ElementRef;

  math = Math;
  
  eventsSignal = signal<CalendarEvent[]>([]);
  currentYear = signal(new Date().getFullYear());
  
  // Drag State
  dragState = signal<DragState>({
    isDragging: false,
    type: null,
    segment: null,
    row: null,
    startX: 0,
    initialStartDay: 0,
    initialEndDay: 0,
    currentStartDay: 0,
    currentEndDay: 0,
    currentRow: null
  });
  
  daysHeader = Array.from({length: 31}, (_, i) => i + 1);

  monthRows = computed(() => {
     const year = this.currentYear();
     const eventList = this.eventsSignal();
     const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
     const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
     const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

     const rows: MonthRow[] = monthNames.map((name, index) => ({
       name,
       index,
       days: daysInMonth[index],
       segments: [],
       maxLanes: 1
     }));

     if (eventList) {
       eventList.forEach(event => {
          if (!event.startDate || !event.endDate) return;
          
          const start = new Date(event.startDate);
          const end = new Date(event.endDate);
          
          if (start.getFullYear() !== year && end.getFullYear() !== year) return;

          // Split logic - clamp to current year view
          let current = new Date(Math.max(start.getTime(), new Date(year, 0, 1).getTime()));
          const endLimit = new Date(Math.min(end.getTime(), new Date(year, 11, 31).getTime()));

          while (current <= endLimit) {
            const mIndex = current.getMonth();
            const daysInM = daysInMonth[mIndex];
            
            // Calculate segment start and end days for this month
            const segmentStartDay = (current.getMonth() === start.getMonth() && current.getFullYear() === start.getFullYear()) 
                                    ? current.getDate() 
                                    : 1;
            
            let segmentEndDay = daysInM;
            if (endLimit.getMonth() === mIndex && endLimit.getFullYear() === year) {
               segmentEndDay = endLimit.getDate();
            }
            
            // Push segment
            rows[mIndex].segments.push({
               id: event.id,
               title: event.title,
               color: event.color,
               startDay: segmentStartDay,
               endDay: segmentEndDay,
               originalEvent: event
            });

            // Move current to first day of next month
            current = new Date(year, mIndex + 1, 1);
          }
       });
     }

     // Calculate lanes for each row to handle overlaps
     rows.forEach(row => {
        // Sort segments by start day, then length (descending)
        row.segments.sort((a, b) => {
             if (a.startDay !== b.startDay) return a.startDay - b.startDay;
             return (b.endDay - b.startDay) - (a.endDay - a.startDay);
        });

        const lanes: number[] = []; // stores end day of last segment in each lane

        row.segments.forEach(seg => {
            let placed = false;
            // Try to place in existing lane
            for (let i = 0; i < lanes.length; i++) {
                if (lanes[i] < seg.startDay) {
                    seg.lane = i;
                    lanes[i] = seg.endDay;
                    placed = true;
                    break;
                }
            }
            // If not placed, create new lane
            if (!placed) {
                seg.lane = lanes.length;
                lanes.push(seg.endDay);
            }
        });

        row.maxLanes = lanes.length > 0 ? lanes.length : 1;
     });

     return rows;
  });

  // Helper to find row by Y coordinate
  private getRowAtY(y: number): MonthRow | null {
    // We need to query the DOM rows
    // This is expensive on mouse move, but we can optimize if needed.
    // Better: Pre-calculate row bounds or just assume uniform height? 
    // Heights are dynamic now (maxLanes). So we must query or cache.
    // Let's us query elementFromPoint for simplicity first.
    // Note: elementFromPoint might return the segment, so we need pointer-events: none on overlay during drag?
    
    // Easier: Loop through row elements if we have ViewChildren.
    // Ideally we'd have a list of row elements.
    // For now, let's try a simple mathematical approximation if heights were fixed, but they aren't.
    // Let's add an ID to rows and use document.elementFromPoint
    
    // Actually, let's just use the cached row from start if only horizontal? 
    // NO, user wants to move event from one month to another.
    
    // Let's assume the template has a class 'month-row'.
    const elements = document.elementsFromPoint(this.dragState().startX, y); // Use startX to stay in column area
    // Find the one that is a month row
    // We can add a data attribute [attr.data-month-index]="row.index" to the row div
    const rowEl = elements.find(el => el.hasAttribute('data-month-index'));
    if (rowEl) {
        const index = parseInt(rowEl.getAttribute('data-month-index') || '0', 10);
        return this.monthRows()[index];
    }
    return null;
  }

  ngOnInit() {
    this.eventsSignal.set(this.events || []);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['events']) {
      this.eventsSignal.set(this.events || []);
    }
  }

  isWeekend(monthIndex: number, day: number): boolean {
    const date = new Date(this.currentYear(), monthIndex, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sun or Sat
  }

  getWeekdayLabel(monthIndex: number, day: number): string {
    const date = new Date(this.currentYear(), monthIndex, day);
    const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return labels[date.getDay()];
  }

  onCellClick(monthIndex: number, day: number) {
     if (this.dragState().isDragging) return; // Prevent cell click when dragging drops
     const maxDays = new Date(this.currentYear(), monthIndex + 1, 0).getDate();
     if (day > maxDays) return;

     const date = new Date(this.currentYear(), monthIndex, day);
     this.backgroundClick.emit(date);
  }

  onEventClick(event: CalendarEvent) {
    if (this.dragState().isDragging) return; // Prevent click when dragging
    this.eventClick.emit(event);
  }

  onCellDoubleClick(monthIndex: number, day: number) {
     const maxDays = new Date(this.currentYear(), monthIndex + 1, 0).getDate();
     if (day > maxDays) return;

     const date = new Date(this.currentYear(), monthIndex, day);
     this.eventCreate.emit({ date, title: 'enter' });
  }

  // --- Drag and Resize Logic ---

  onMouseDown(event: MouseEvent, segment: EventSegment, row: MonthRow, type: 'move' | 'resize-start' | 'resize-end') {
    event.preventDefault();
    event.stopPropagation();

    this.dragState.set({
        isDragging: true,
        type,
        segment,
        row,
        startX: event.clientX,
        initialStartDay: segment.startDay,
        initialEndDay: segment.endDay,
        currentStartDay: segment.startDay,
        currentEndDay: segment.endDay,
        currentRow: row
    });
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: Event) {
    const mouseEvent = event as MouseEvent;
    const state = this.dragState();
    if (!state.isDragging || !state.segment || !state.row) return;

    mouseEvent.preventDefault();

    // Calculate delta days based on pixel movement
    const containerWidth = this.containerRef.nativeElement.clientWidth || 1000;
    const dayWidth = (containerWidth - 120) / 31;
    const deltaX = mouseEvent.clientX - state.startX;
    let deltaDays = Math.round(deltaX / dayWidth);

    // Detect Row Change (Vertical Move)
    // We want to update currentRow if the mouse moves vertically to another month
    const targetRow = this.getRowAtY(mouseEvent.clientY);
    
    // Update Drag State with new row if found
    if (targetRow && targetRow.index !== state.currentRow?.index) {
         this.dragState.update(s => ({ ...s, currentRow: targetRow }));
    }
    
    const currentRow = targetRow || state.row; // Fallback to start row

    // Logic remains similar but now we account for month difference in "delta" conceptually?
    // Actually, simpler: Calculate the target Date based on (currentRow, currentDay) and compare to initial Date
    
    // Let's compute the "Target Day" in the "Target Row"
    // Since X determines the day (1-31), we just need to clamp it.
    // X relative to the grid start. 
    // Grid starts at 60px.
    const containerRect = this.containerRef.nativeElement.getBoundingClientRect();
    const xInContainer = mouseEvent.clientX - containerRect.left;
    const gridX = xInContainer - 60; // offset for left label
    
    let rawDay = Math.floor(gridX / dayWidth) + 1;
    
    // Clamp day to month limits
    if (rawDay < 1) rawDay = 1;
    if (rawDay > 31) rawDay = 31; // visual clamp, actual date might not exist (e.g. Feb 30)

    // Now we have a Target Date
    // currentRow might be different from initial Row
    
    // For visual feedback, if we are in a different row, we should perhaps "move" the segment visually?
    // It's tricky to move the DOM element to another parent during drag without complex code.
    // Instead, we can just update the segment's data if we stay within the same component structure?
    // But the OnPush might block it.
    
    // For now, let's keep the visual feedback simple: 
    // If 'move', we only update the 'currentStartDay' etc relative to the INITIAL row for simplicity in rendering,
    // UNLESS we want to support full D&D.
    // User requested "move event from one month to another".
    
    // Let's update state vars to reflect the "Target Day" on the "Target Row" if possible.
    // But our `isSegmentActive` relies on the segment being content-projected in the loop.
    
    // Alternative: We just track the logic here, and on Mouse Up we apply the massive change.
    // Visual feedback might be limited to the X-axis shift, highlighting the stored "currentRow" maybe?
    
    // Let's implement the Logical Calculation for MouseUp mostly, ensuring visual X-axis feedback works.
    
    let newStart = state.initialStartDay + deltaDays;
    let newEnd = state.initialEndDay + deltaDays;
    
    if (state.type === 'resize-start') {
         newStart = state.initialStartDay + deltaDays;
         newEnd = state.initialEndDay;
    } else if (state.type === 'resize-end') {
         newStart = state.initialStartDay;
         newEnd = state.initialEndDay + deltaDays;
    }
    
    this.dragState.update(s => ({
        ...s,
        currentStartDay: newStart,
        currentEndDay: newEnd
    }));
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: Event) {
    const mouseEvent = event as MouseEvent;
    const state = this.dragState();
    if (!state.isDragging || !state.segment || !state.row) return;

    // Changes occurred?
    // Finalize Changes
    // 1. Determine Target Row
    const targetRow = this.dragState().currentRow || state.row;
    
    // 2. Determine Day Shift
    // Width logic again to be safe
    const containerWidth = this.containerRef.nativeElement.clientWidth || 1000;
    const dayWidth = (containerWidth - 120) / 31;
    const deltaX = mouseEvent.clientX - state.startX;
    const deltaDays = Math.round(deltaX / dayWidth);

    const year = this.currentYear();
    
    // Original Event Boundaries
    const originalEvt = state.segment.originalEvent;
    
    let newStartDate = new Date(originalEvt.startDate);
    let newEndDate = new Date(originalEvt.endDate);
    
    // Calculate Duration
    const durationMs = newEndDate.getTime() - newStartDate.getTime();
    
    if (state.type === 'move') {
        // New Start Date = Target Month + Target Day (derived from initial start + delta)
        // Actually, "move" should just shift by Days IF we stay in same row.
        // If we changed rows, we snap to that row's month.
        
        // Calculate Target Date roughly
        // If we moved rows:
        if (targetRow.index !== state.row.index) {
             // We moved to a new month.
             // What is the new start day? 
             // We probably want to keep the visual "Day" (column) alignment approx.
             let targetDay = state.initialStartDay + deltaDays;
             // Clamp target day to valid range 1-31 (or days in month) usually
             // But if user drags far right, day increases.
             
             // Let's construct a date from the target Row and rough Day
             newStartDate = new Date(year, targetRow.index, targetDay);
             newEndDate = new Date(newStartDate.getTime() + durationMs);
        } else {
             // Same row, just add delta days
             newStartDate.setDate(newStartDate.getDate() + deltaDays);
             newEndDate.setDate(newEndDate.getDate() + deltaDays);
        }

    } else if (state.type === 'resize-start') {
        // We are changing the Start Date
        // If we cross months (e.g. drag left past 1), we should handle that?
        // Current visual logic simplifies to "currentStartDay" which can go negative in our new logic?
        // Let's use the explicit targetRow detection for more robustness.
        
        let targetDay = state.initialStartDay + deltaDays;
        newStartDate = new Date(year, targetRow.index, targetDay); 
        // Note: Date constructor handles day overflow/underflow automatically (e.g. day 0 = last day of prev month)
        // This implicitly handles cross-month resize if the user drags across row boundaries or just far left/right!
        
        // Ensure start <= end
        if (newStartDate > newEndDate) {
            newStartDate = new Date(newEndDate); // snap to end max
        }

    } else if (state.type === 'resize-end') {
        // Changing End Date
        let targetDay = state.initialEndDay + deltaDays;
        // Use targetRow or startRow? 
        // If resizing end, we usually drag the end of the bar.
        // If the bar is split, we might be dragging the version in Month A. 
        // If we drag it into Month B, targetRow becomes Month B.
        // So targetRow is correct.
        
        newEndDate = new Date(year, targetRow.index, targetDay);
        
        if (newEndDate < newStartDate) {
            newEndDate = new Date(newStartDate);
        }
    }

    const updatedEvent: CalendarEvent = {
        ...originalEvt,
        startDate: this.formatDate(newStartDate),
        endDate: this.formatDate(newEndDate)
    };
    
    this.eventUpdate.emit(updatedEvent);

    // Reset state
    this.dragState.set({
        isDragging: false,
        type: null,
        segment: null,
        row: null,
        startX: 0,
        initialStartDay: 0,
        initialEndDay: 0,
        currentStartDay: 0,
        currentEndDay: 0,
        currentRow: null
    });
  }

  // Helpers for template to render active drag state
  isSegmentActive(seg: EventSegment): boolean {
    const state = this.dragState();
    return state.isDragging && state.segment?.id === seg.id && state.segment?.startDay === seg.startDay;
  }

  getSegmentLeft(seg: EventSegment, row: MonthRow): number {
    if (this.isSegmentActive(seg)) {
        // Use live drag values
        const state = this.dragState();
        // (start - 1) / 31 * 100
        return ((state.currentStartDay - 1) / 31) * 100;
    }
    return ((seg.startDay - 1) / 31) * 100;
  }

  getSegmentWidth(seg: EventSegment, row: MonthRow): number {
    if (this.isSegmentActive(seg)) {
        const state = this.dragState();
        const duration = state.currentEndDay - state.currentStartDay + 1;
        return (duration / 31) * 100;
    }
    const duration = seg.endDay - seg.startDay + 1;
    return (duration / 31) * 100;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
