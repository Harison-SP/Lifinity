import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../services/habit.service';

@Component({
  selector: 'app-habits-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-full overflow-y-auto custom-scrollbar relative bg-[#050608]">
        <!-- Top Bar Decoration -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-[#ec5b13] z-50 shadow-[0_0_10px_#ec5b13] opacity-80"></div>

        <header class="p-8 border-b border-[#2a3441] bg-[#0c0e12] sticky top-0 z-30 flex items-center justify-between shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div>
              <h2 class="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                <span class="material-symbols-outlined text-[#ec5b13] text-4xl">view_list</span>
                ACTIVE_DIRECTIVES
              </h2>
              <p class="text-[#ec5b13] font-bold tracking-widest text-xs mt-1 uppercase opacity-80 pl-1">>> VIEWING_ALL_PROTOCOLS</p>
          </div>
          <a routerLink="/add" class="group relative flex items-center gap-2 px-6 py-3 bg-[#ec5b13] text-black font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_15px_rgba(236,91,19,0.4)] transition-all hover:scale-105 active:scale-95 hover:bg-white hover:text-[#ec5b13] rounded-sm overflow-hidden">
            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <span class="material-symbols-outlined text-lg relative z-10">add_task</span>
            <span class="relative z-10">INIT_NEW</span>
          </a>
        </header>

        <div class="p-8 relative">
           <!-- Background Grid -->
          <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

          <div class="max-w-[1400px] mx-auto relative z-10 pb-20">
            @if (habitService.habits().length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (habit of habitService.habits(); track habit.id) {
                  <a [routerLink]="['/details', habit.id]" 
                     class="group p-6 rounded bg-[#0c0e12] border border-[#2a3441] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)] hover:border-[#ec5b13] hover:shadow-[0_0_30px_rgba(236,91,19,0.15)] transition-all cursor-pointer relative overflow-hidden block">
                    
                    <!-- Scanline -->
                    <div class="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
                    
                    <!-- Corner Decorations -->
                    <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ec5b13] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#ec5b13] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <!-- Habit Header -->
                    <div class="flex items-start justify-between mb-6 relative z-10">
                      <div class="flex items-center gap-4">
                        <div class="size-12 rounded bg-[#050608] border border-[#2a3441] flex items-center justify-center text-2xl group-hover:border-[#ec5b13] group-hover:bg-[#ec5b13] group-hover:text-black transition-all duration-300">
                          <span class="material-symbols-outlined">{{ habit.icon || 'star' }}</span>
                        </div>
                        <div class="overflow-hidden">
                          <h3 class="text-lg font-bold text-white uppercase tracking-tight truncate group-hover:text-[#ec5b13] transition-colors">{{ habit.name }}</h3>
                          <div class="flex items-center gap-2">
                              <span class="size-2 rounded-full bg-[#ec5b13] animate-pulse"></span>
                              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{{ habit.category || 'General' }}</p>
                          </div>
                        </div>
                      </div>
                      @if (habit.completedToday) {
                        <span class="material-symbols-outlined text-[#ec5b13] text-2xl drop-shadow-[0_0_5px_#ec5b13]">check_circle</span>
                      }
                    </div>

                    <!-- Description -->
                    @if (habit.description) {
                      <p class="text-xs text-slate-400 font-mono mb-6 line-clamp-2 border-l-2 border-[#2a3441] pl-3 italic">{{ habit.description }}</p>
                    }

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-3 gap-2 mb-4 bg-[#050608] p-3 rounded border border-[#2a3441]">
                      <div class="text-center">
                        <p class="text-xl font-black text-white">{{ habit.streak }}</p>
                        <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Streak</p>
                      </div>
                      <div class="text-center border-l border-[#2a3441]">
                        <p class="text-xl font-black text-white">{{ habit.bestStreak }}</p>
                        <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Record</p>
                      </div>
                      <div class="text-center border-l border-[#2a3441]">
                        <p class="text-xl font-black text-[#ec5b13]">{{ habit.completionRate }}%</p>
                        <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Eff.</p>
                      </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full h-1 bg-[#2a3441] overflow-hidden rounded-sm relative">
                      <div class="h-full bg-[#ec5b13] shadow-[0_0_10px_#ec5b13]" [style.width.%]="habit.completionRate"></div>
                    </div>

                    <!-- Footer Info -->
                    <div class="mt-4 flex items-center justify-between">
                          <div class="inline-flex items-center gap-1.5 px-2 py-1 border border-[#ec5b13]/30 bg-[#ec5b13]/5 text-[#ec5b13] text-[9px] font-bold uppercase tracking-wider rounded-[1px]">
                          <span class="material-symbols-outlined text-[10px]">update</span>
                          {{ habit.frequency }}
                        </div>
                        <span class="text-[9px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-white transition-colors flex items-center gap-1">
                            Details <span class="material-symbols-outlined text-[10px]">arrow_forward</span>
                        </span>
                    </div>
                  </a>
                }
              </div>
            } @else {
              <div class="h-96 flex flex-col items-center justify-center p-20 text-center bg-[#0c0e12] rounded border border-[#2a3441] shadow-lg">
                <span class="material-symbols-outlined text-6xl text-[#2a3441] mb-6 animate-pulse">dataset</span>
                <p class="text-[#ec5b13] font-bold text-sm uppercase tracking-[0.2em] mb-4">No_Directives_Found</p>
                <p class="text-slate-500 text-xs font-mono mb-8 max-w-md">The habit protocol database is currently empty. Initialize a new directive to begin tracking.</p>
                <a routerLink="/add" class="inline-flex items-center gap-2 px-6 py-3 bg-[#ec5b13] text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-[#ec5b13] transition-all shadow-[0_0_15px_rgba(236,91,19,0.3)] rounded-sm">
                  <span class="material-symbols-outlined text-lg">add_circle</span>
                  Initialize_Protocol
                </a>
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
export class HabitsListComponent {
  habitService = inject(HabitService);
}
