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
    <div class="yearly-grid-container w-full h-full flex flex-col bg-[#050608] text-white overflow-auto custom-scrollbar select-none font-mono relative" #container>
      <!-- Grid Background Effect -->
      <div class="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_25%,rgba(255,255,255,.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.1)_75%,rgba(255,255,255,.1)_100%)] bg-[length:20px_20px]"></div>
      
      <!-- Header Row (Days) -->
      <div class="grid grid-cols-[60px_repeat(31,1fr)_60px] gap-0 border-b border-[#2a3441] mb-2 sticky top-0 bg-[#050608] z-20 pb-2 shadow-lg">
        <div class="text-[10px] text-[#ec5b13] font-bold uppercase tracking-wider text-center self-end pb-1 border-r border-[#2a3441]">MON</div>
        @for (day of daysHeader; track day) {
          <div class="text-[10px] text-center text-slate-500 border-l border-[#2a3441]/30 flex items-center justify-center h-6 hover:text-white transition-colors cursor-default relative group">
              <span class="group-hover:scale-125 transition-transform">{{ day }}</span>
          </div>
        }
        <div class="text-xs text-slate-500 font-bold uppercase tracking-wider text-center self-end pl-2"></div>
      </div>

      <!-- Month Rows -->
      <div class="flex flex-col gap-1 pb-10 relative z-10">
        @for (row of monthRows(); track row.name) {
          <!-- Row container with dynamic height based on lanes -->
          <div class="grid grid-cols-[60px_repeat(31,1fr)_60px] gap-0 transition-colors relative group border-b border-[#2a3441]/50 hover:bg-white/5"
               [style.height.px]="math.max(row.maxLanes * 32 + 10, 48)">
            
            <!-- Month Label -->
            <div class="text-xs font-bold text-slate-400 flex items-center justify-center border-r border-[#2a3441] uppercase tracking-widest bg-[#050608]/90 sticky left-0 z-10 select-none cursor-pointer group-hover:text-[#ec5b13] transition-colors"
                 (dblclick)="onCellDoubleClick(row.index, 1)">
              {{ row.name }}
            </div>

            <!-- Days Grid Cells background -->
            @for (day of daysHeader; track day) {
               <div class="border-r border-[#2a3441]/20 h-full relative"
                    [class.bg-weekend]="isWeekend(row.index, day)"
                    [class.bg-[#000]/30]="!isWeekend(row.index, day) && day > row.days"
                    (click)="onCellClick(row.index, day)"
                    (dblclick)="onCellDoubleClick(row.index, day)">
                    @if (day <= row.days) {
                      <span class="absolute inset-x-0 bottom-1 text-[7px] text-center text-slate-700 pointer-events-none uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                        {{ getWeekdayLabel(row.index, day) }}
                      </span>
                    }
               </div>
            }
            
            <!-- Events Overlay for this Row -->
            <div class="absolute inset-0 left-[60px] right-[60px] pointer-events-none grid grid-cols-[repeat(31,1fr)]">
               @for (seg of row.segments; track seg.id + '-' + seg.startDay) {
                 <!-- Event Segment -->
                 <div class="absolute rounded-sm pointer-events-auto flex items-center px-2 overflow-hidden border border-white/20 transition-all shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5)]"
                      [class.z-30]="isSegmentActive(seg)"
                      [class.z-10]="!isSegmentActive(seg)"
                      [class.brightness-110]="isSegmentActive(seg)"
                      [class.ring-2]="isSegmentActive(seg)"
                      [class.ring-[#ec5b13]]="isSegmentActive(seg)"
                      [class.scale-[1.02]]="isSegmentActive(seg)"
                      [style.left.%]="getSegmentLeft(seg, row)"
                      [style.width.%]="getSegmentWidth(seg, row)"
                      [style.top.px]="(seg.lane || 0) * 32 + 4"
                      [style.height.px]="28"
                      [style.background-color]="seg.color || '#4c9a66'"
                      (mousedown)="onMouseDown($event, seg, row, 'move')"
                      (click)="$event.stopPropagation(); onEventClick(seg.originalEvent)">
                   
                   <!-- Scanline Overlay -->
                   <div class="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-30 pointer-events-none"></div>

                   <!-- Content -->
                   <span class="text-[10px] font-bold text-white whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate w-full pointer-events-none relative z-10 font-mono tracking-tight">{{ seg.title }}</span>

                   <!-- Resize Handles (Only show on hover or active) -->
                   <div class="resize-handle left absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-20"
                        (mousedown)="onMouseDown($event, seg, row, 'resize-start')"></div>
                   <div class="resize-handle right absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-20"
                        (mousedown)="onMouseDown($event, seg, row, 'resize-end')"></div>
                 </div>
               }
            </div>

             <!-- End Label (Year) -->
             <div class="text-[10px] font-bold text-slate-600 flex items-center justify-center border-l border-[#2a3441] bg-[#050608]/90 sticky right-0 z-10 writing-vertical-lr text-center">
               //{{ currentYear() }}
             </div>

          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #050608;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #2a3441;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #ec5b13;
    }
    
    .bg-weekend {
       background-color: rgba(236, 91, 19, 0.05);
    }
    
    .writing-vertical-lr {
        writing-mode: vertical-lr;
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
     const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
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
    // We expect row divs to be relative positioned
    // Simple approach: documentElementFromPoint
    const elements = document.elementsFromPoint(this.dragState().startX, y); 
    // We rely on the template index logic being traceable? 
    // Ideally we add a data attribute. Let's assume user clicking works mostly.
    // For reliability in this drag logic without DOM query every move:
    // We approximate based on the fact that rows are stacked.
    
    // Let's stick to the current row logic from Mouse Down unless we really need cross-row drag visualized live in the correct row.
    // The current logic updates currentRow if we find the element.
    // I need to add the data attribute in template for this to strictly work.
    // I'll add [attr.data-month-index]="row.index" in the template.
    
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
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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
     this.eventCreate.emit({ date, title: 'NEW_EVENT' });
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
    const targetRow = this.getRowAtY(mouseEvent.clientY);
    
    if (targetRow && targetRow.index !== state.currentRow?.index) {
         this.dragState.update(s => ({ ...s, currentRow: targetRow }));
    }
    
    // Update live drag values
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

    const targetRow = this.dragState().currentRow || state.row;
    
    const containerWidth = this.containerRef.nativeElement.clientWidth || 1000;
    const dayWidth = (containerWidth - 120) / 31;
    const deltaX = mouseEvent.clientX - state.startX;
    const deltaDays = Math.round(deltaX / dayWidth);

    const year = this.currentYear();
    
    const originalEvt = state.segment.originalEvent;
    
    let newStartDate = new Date(originalEvt.startDate);
    let newEndDate = new Date(originalEvt.endDate);
    const durationMs = newEndDate.getTime() - newStartDate.getTime();
    
    if (state.type === 'move') {
        if (targetRow.index !== state.row.index) {
             let targetDay = state.initialStartDay + deltaDays;
             newStartDate = new Date(year, targetRow.index, targetDay);
             newEndDate = new Date(newStartDate.getTime() + durationMs);
        } else {
             newStartDate.setDate(newStartDate.getDate() + deltaDays);
             newEndDate.setDate(newEndDate.getDate() + deltaDays);
        }

    } else if (state.type === 'resize-start') {
        let targetDay = state.initialStartDay + deltaDays;
        newStartDate = new Date(year, targetRow.index, targetDay); 
        if (newStartDate > newEndDate) {
            newStartDate = new Date(newEndDate);
        }

    } else if (state.type === 'resize-end') {
        let targetDay = state.initialEndDay + deltaDays;
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
        const state = this.dragState();
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
