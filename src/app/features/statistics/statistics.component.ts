import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../services/habit.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-statistics',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="h-full overflow-y-auto custom-scrollbar relative bg-[#050608]">
        <!-- Top Bar Decoration -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-[#ec5b13] z-50 shadow-[0_0_10px_#ec5b13] opacity-80"></div>

        <header class="p-8 border-b border-[#2a3441] bg-[#0c0e12] relative z-10 shrink-0 flex justify-between items-end">
          <div>
              <h2 class="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                <span class="material-symbols-outlined text-[#ec5b13] text-4xl">analytics</span>
                ANALYTICS_CORE
              </h2>
              <p class="text-[#ec5b13] font-bold tracking-widest text-xs mt-1 uppercase opacity-80 pl-1">>> SYSTEM_PERFORMANCE_METRICS_LOADED</p>
          </div>
          <div class="hidden md:flex gap-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              <span>_cpu: 12%</span>
              <span>_mem: 4GB</span>
              <span>_net: ONLINE</span>
          </div>
        </header>

        <div class="p-8 relative">
          <!-- Background Grid -->
          <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

          <div class="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 pb-20">
            @for (habit of habitService.habits(); track habit.id) {
              <a [routerLink]="['/details', habit.id]" 
                 class="group bg-[#0c0e12] p-6 rounded border border-[#2a3441] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)] hover:border-[#ec5b13] hover:shadow-[0_0_30px_rgba(236,91,19,0.15)] transition-all duration-300 relative overflow-hidden block">
                
                <!-- Corner Decorations -->
                <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ec5b13] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#ec5b13] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <!-- Scanline -->
                <div class="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
                
                <div class="flex items-center gap-4 mb-6 relative z-10">
                  <div class="size-12 rounded bg-[#ec5b13]/10 border border-[#ec5b13]/20 flex items-center justify-center text-[#ec5b13] group-hover:scale-110 group-hover:bg-[#ec5b13] group-hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(236,91,19,0.1)]">
                    <span class="material-symbols-outlined text-2xl">{{ habit.icon }}</span>
                  </div>
                  <div class="overflow-hidden">
                    <h3 class="font-bold text-white truncate text-lg tracking-tight uppercase group-hover:text-[#ec5b13] transition-colors">{{ habit.name }}</h3>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        {{ habit.category }}
                        <span class="text-[#ec5b13]">_ID:{{habit.id | slice:0:4}}</span>
                    </p>
                  </div>
                </div>

                <div class="space-y-6 relative z-10">
                  <div class="grid grid-cols-2 gap-4 border-t border-b border-[#2a3441] py-4 bg-[#050608]/50">
                    <div>
                      <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Streak_Count</p>
                      <p class="text-2xl font-black text-white tracking-tighter font-mono flex items-baseline gap-1">
                          {{ habit.streak }} <span class="text-[10px] text-[#ec5b13] font-bold uppercase">Cycles</span>
                      </p>
                    </div>
                    <div class="text-right border-l border-[#2a3441] pl-4">
                      <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Efficiency</p>
                      <p class="text-2xl font-black text-[#ec5b13] tracking-tighter font-mono">{{ habit.completionRate }}%</p>
                    </div>
                  </div>

                  <div class="w-full bg-[#050608] border border-[#2a3441] h-2 overflow-hidden rounded-sm relative">
                    <!-- Grid background for bar -->
                    <div class="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,rgba(255,255,255,0.05)_20%)] bg-[length:4px_100%]"></div>
                    <div class="bg-[#ec5b13] h-full transition-all duration-1000 ease-out shadow-[0_0_10px_#ec5b13]" 
                         [style.width.%]="habit.completionRate"></div>
                  </div>
                </div>

                <div class="mt-6 flex items-center justify-between text-slate-500 group-hover:text-[#ec5b13] transition-colors relative z-10">
                  <span class="text-[10px] font-bold uppercase tracking-[0.2em] font-mono group-hover:underline decoration-[#ec5b13] decoration-2 underline-offset-4">Access_Data_Log</span>
                  <span class="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </a>
            } @empty {
              <div class="col-span-full py-20 text-center flex flex-col items-center justify-center opacity-50 border-2 border-dashed border-[#2a3441] rounded">
                 <span class="material-symbols-outlined text-6xl text-slate-700 mb-4">dataset</span>
                 <p class="text-slate-500 font-mono uppercase tracking-widest text-sm">NO_METRICS_AVAILABLE</p>
                 <p class="text-slate-600 text-xs mt-2">Initialize a habit protocol to begin data collection.</p>
              </div>
            }
          </div>
        </div>
    </div>
  `,
    styles: [`
    :host { font-family: 'JetBrains Mono', monospace; display: block; height: 100%; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #050608;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #2a3441;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #ec5b13;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent {
    habitService = inject(HabitService);
}
