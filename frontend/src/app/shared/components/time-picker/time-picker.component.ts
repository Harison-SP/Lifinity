import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, input, output, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-analog-time-picker',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4" (click)="onCancel()">
        <!-- Modal Card Container -->
        <div class="w-full max-w-[320px] bg-purple-50 dark:bg-zinc-950 rounded-3xl p-5 shadow-2xl border border-purple-200/50 dark:border-zinc-800 animate-zoom-in" (click)="$event.stopPropagation()">
            
            <!-- Top Mode Display -->
            <div class="flex items-center justify-between mb-6">
                <span class="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Select time</span>
                
                <div class="flex items-center gap-1">
                    <!-- Keyboard mode status/icon -->
                    <span class="material-symbols-outlined text-purple-500 text-base cursor-pointer hover:text-purple-700 transition-colors">keyboard</span>
                </div>
            </div>

            <!-- Time Digital Display & AM/PM Selector -->
            <div class="flex items-center justify-center gap-3 mb-6 font-manrope">
                <!-- Hours Card -->
                <button type="button" 
                        (click)="activeMode.set('hours')"
                        class="w-20 h-16 rounded-2xl flex items-center justify-center text-4xl font-bold transition-all"
                        [class.bg-purple-200]="activeMode() === 'hours'"
                        [class.text-purple-900]="activeMode() === 'hours'"
                        [class.bg-purple-100/50]="activeMode() !== 'hours'"
                        [class.dark:bg-zinc-800]="activeMode() !== 'hours'"
                        [class.text-purple-400]="activeMode() !== 'hours'">
                    {{ formatNumber(selectedHour()) }}
                </button>

                <span class="text-4xl font-bold text-purple-900 dark:text-purple-200 animate-pulse">:</span>

                <!-- Minutes Card -->
                <button type="button" 
                        (click)="activeMode.set('minutes')"
                        class="w-20 h-16 rounded-2xl flex items-center justify-center text-4xl font-bold transition-all"
                        [class.bg-purple-200]="activeMode() === 'minutes'"
                        [class.text-purple-900]="activeMode() === 'minutes'"
                        [class.bg-purple-100/50]="activeMode() !== 'minutes'"
                        [class.dark:bg-zinc-800]="activeMode() !== 'minutes'"
                        [class.text-purple-400]="activeMode() !== 'minutes'">
                    {{ formatNumber(selectedMinute()) }}
                </button>

                <!-- AM/PM Buttons -->
                <div class="flex flex-col border border-purple-200 dark:border-zinc-800 rounded-xl overflow-hidden font-bold text-xs">
                    <button type="button" 
                            (click)="isAm.set(true)"
                            class="w-10 h-8 flex items-center justify-center transition-all"
                            [class.bg-purple-500]="isAm()"
                            [class.text-white]="isAm()"
                            [class.bg-transparent]="!isAm()"
                            [class.text-purple-900]="!isAm()"
                            [class.dark:text-purple-200]="!isAm()">
                        AM
                    </button>
                    <button type="button" 
                            (click)="isAm.set(false)"
                            class="w-10 h-8 flex items-center justify-center transition-all"
                            [class.bg-purple-500]="!isAm()"
                            [class.text-white]="!isAm()"
                            [class.bg-transparent]="isAm()"
                            [class.text-purple-900]="isAm()"
                            [class.dark:text-purple-200]="isAm()">
                        PM
                    </button>
                </div>
            </div>

            <!-- Clock Dial Area -->
            <div class="relative w-64 h-64 mx-auto bg-purple-100/50 dark:bg-zinc-900 rounded-full flex items-center justify-center select-none"
                 #clockFace
                 (mousedown)="onMouseDown($event)"
                 (touchstart)="onTouchStart($event)">
                 
                <!-- SVG Hand -->
                <svg class="absolute inset-0 pointer-events-none w-full h-full">
                    <!-- Line -->
                    <line [attr.x1]="128" [attr.y1]="128" 
                          [attr.x2]="handX()" [attr.y2]="handY()" 
                          stroke="var(--color-primary, #a855f7)" stroke-width="2"/>
                    <!-- Center Circle -->
                    <circle cx="128" cy="128" r="4" fill="var(--color-primary, #a855f7)"/>
                    <!-- End Circle -->
                    <circle [attr.cx]="handX()" [attr.cy]="handY()" r="16" 
                            fill="var(--color-primary, #a855f7)" opacity="0.4"/>
                    <!-- End Center Point -->
                    <circle [attr.cx]="handX()" [attr.cy]="handY()" r="4" 
                            fill="var(--color-primary, #a855f7)"/>
                </svg>

                <!-- Clock Numbers overlay -->
                @if (activeMode() === 'hours') {
                    @for (hour of hoursList; track hour.value) {
                        <button type="button"
                                (click)="setHour(hour.value)"
                                class="absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:bg-purple-200/50"
                                [style.left.%]="hour.left"
                                [style.top.%]="hour.top"
                                [class.text-white]="selectedHour() === hour.value"
                                [class.text-purple-950]="selectedHour() !== hour.value"
                                [class.dark:text-purple-200]="selectedHour() !== hour.value">
                            {{ hour.label }}
                        </button>
                    }
                } @else {
                    @for (min of minutesList; track min.value) {
                        <button type="button"
                                (click)="setMinute(min.value)"
                                class="absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:bg-purple-200/50"
                                [style.left.%]="min.left"
                                [style.top.%]="min.top"
                                [class.text-white]="selectedMinute() === min.value"
                                [class.text-purple-950]="selectedMinute() !== min.value"
                                [class.dark:text-purple-200]="selectedMinute() !== min.value">
                            {{ min.label }}
                        </button>
                    }
                }
            </div>

            <!-- Actions Footer -->
            <div class="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-purple-200/30">
                <button type="button" 
                        (click)="onCancel()"
                        class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 hover:bg-purple-200/30 rounded-xl transition-all">
                    Cancel
                </button>
                <button type="button" 
                        (click)="onConfirm()"
                        class="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-gentle transition-all">
                    OK
                </button>
            </div>
        </div>
    </div>
    `,
    styles: [`
        :host { display: block; }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-zoom-in { animation: zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalogTimePickerComponent {
    initialTime = input<Date | string | null | undefined>(null);
    selected = output<Date>();
    close = output<void>();

    @ViewChild('clockFace') clockFaceRef!: ElementRef<HTMLDivElement>;

    selectedHour = signal<number>(7);
    selectedMinute = signal<number>(0);
    isAm = signal<boolean>(true);
    activeMode = signal<'hours' | 'minutes'>('hours');
    
    isDragging = false;

    // Arrange numbers relative to a 256x256 container
    // Center is (128, 128) -> Radius of circle is ~96px -> 96 / 128 = 75%
    hoursList = Array.from({ length: 12 }, (_, i) => {
        const val = i === 0 ? 12 : i;
        const angle = (val * 30) * Math.PI / 180;
        return {
            value: val,
            label: String(val),
            left: 50 + 38 * Math.sin(angle) - 6.25, // offset percentage for 32px button in 256px
            top: 50 - 38 * Math.cos(angle) - 6.25
        };
    });

    minutesList = Array.from({ length: 12 }, (_, i) => {
        const val = i * 5;
        const angle = (i * 30) * Math.PI / 180;
        return {
            value: val,
            label: String(val).padStart(2, '0'),
            left: 50 + 38 * Math.sin(angle) - 6.25,
            top: 50 - 38 * Math.cos(angle) - 6.25
        };
    });

    handX = computed(() => {
        const angleDeg = this.activeMode() === 'hours' 
            ? this.selectedHour() * 30 
            : this.selectedMinute() * 6;
        const angleRad = angleDeg * Math.PI / 180;
        return 128 + 96 * Math.sin(angleRad);
    });

    handY = computed(() => {
        const angleDeg = this.activeMode() === 'hours' 
            ? this.selectedHour() * 30 
            : this.selectedMinute() * 6;
        const angleRad = angleDeg * Math.PI / 180;
        return 128 - 96 * Math.cos(angleRad);
    });

    constructor() {
        // Parse the initial time passed in
        setTimeout(() => {
            const time = this.initialTime();
            if (time) {
                let dateObj: Date;
                if (typeof time === 'string') {
                    const [h, m] = time.split(':').map(Number);
                    dateObj = new Date();
                    dateObj.setHours(h, m, 0, 0);
                } else if (time instanceof Date) {
                    dateObj = time;
                } else {
                    return;
                }
                
                let hours = dateObj.getHours();
                const minutes = dateObj.getMinutes();
                
                const am = hours < 12;
                this.isAm.set(am);
                
                if (hours > 12) hours -= 12;
                if (hours === 0) hours = 12;
                
                this.selectedHour.set(hours);
                this.selectedMinute.set(minutes);
            }
        });
    }

    formatNumber(num: number): string {
        return String(num).padStart(2, '0');
    }

    setHour(hour: number) {
        this.selectedHour.set(hour);
        // Micro-interaction: swap to minutes selection after picking hour
        setTimeout(() => this.activeMode.set('minutes'), 150);
    }

    setMinute(minute: number) {
        this.selectedMinute.set(minute);
    }

    onCancel() {
        this.close.emit();
    }

    onConfirm() {
        // Output a full Date object
        const out = new Date();
        let hrs = this.selectedHour();
        if (this.isAm()) {
            if (hrs === 12) hrs = 0;
        } else {
            if (hrs !== 12) hrs += 12;
        }
        out.setHours(hrs, this.selectedMinute(), 0, 0);
        this.selected.emit(out);
    }

    // Dial dragging event handlers
    onMouseDown(event: MouseEvent) {
        this.isDragging = true;
        this.handleInteraction(event);
    }

    onTouchStart(event: TouchEvent) {
        this.isDragging = true;
        this.handleInteraction(event);
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.isDragging) {
            this.handleInteraction(event);
        }
    }

    @HostListener('document:touchmove', ['$event'])
    onTouchMove(event: TouchEvent) {
        if (this.isDragging) {
            this.handleInteraction(event);
        }
    }

    @HostListener('document:mouseup')
    onMouseUp() {
        this.isDragging = false;
    }

    @HostListener('document:touchend')
    onTouchEnd() {
        this.isDragging = false;
    }

    private handleInteraction(event: MouseEvent | TouchEvent) {
        if (!this.clockFaceRef) return;
        const rect = this.clockFaceRef.nativeElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        
        let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
        if (angle < 0) {
            angle += 360;
        }
        
        if (this.activeMode() === 'hours') {
            let hour = Math.round(angle / 30);
            if (hour === 0) hour = 12;
            this.selectedHour.set(hour);
        } else {
            let minute = Math.round(angle / 6) % 60;
            this.selectedMinute.set(minute);
        }
    }
}
