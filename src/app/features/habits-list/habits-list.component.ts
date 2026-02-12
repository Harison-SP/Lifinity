import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../services/habit.service';

@Component({
  selector: 'app-habits-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-concrete-200 p-6 md:p-8 lg:p-12 font-manrope pb-24">
        <!-- Header -->
        <header class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div>
                <div class="bg-black text-white px-4 py-1 inline-block text-xs font-bold uppercase tracking-[0.2em] mb-2">Database // Full Access</div>
                <h1 class="text-5xl md:text-7xl font-black text-concrete-900 uppercase leading-none font-arvo">Active<br/>Directives</h1>
            </div>
            
            <a routerLink="/add" class="group relative flex items-center gap-3 px-8 py-4 bg-electric-red text-white font-black uppercase tracking-[0.2em] text-sm rigid-border border-[4px] brutalist-shadow-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <span class="material-symbols-outlined text-2xl">add_box</span>
                <span>Initialize_New</span>
            </a>
        </header>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (habit of habitService.habits(); track habit.id) {
                <a [routerLink]="['/details', habit.id]" 
                   class="group bg-white rigid-border border-[4px] brutalist-shadow-sm p-6 flex flex-col hover:bg-concrete-100 transition-colors cursor-pointer relative overflow-hidden">
                    
                    <!-- Decorative Corner -->
                    <div class="absolute top-0 right-0 w-8 h-8 bg-black triangle-corner"></div>

                    <div class="flex justify-between items-start mb-6">
                        <div class="w-12 h-12 rigid-border-sm bg-concrete-200 flex items-center justify-center">
                            <span class="material-symbols-outlined text-2xl text-black">{{ habit.icon || 'star' }}</span>
                        </div>
                        @if (habit.completedToday) {
                            <div class="bg-electric-red text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest">
                                COMPLETE
                            </div>
                        }
                    </div>

                    <h3 class="text-2xl font-black text-black uppercase leading-none mb-2 group-hover:underline decoration-4 decoration-electric-red underline-offset-4">{{ habit.name }}</h3>
                    <p class="text-xs font-bold text-concrete-400 uppercase tracking-widest mb-6">{{ habit.category || 'General' }} // {{ habit.frequencyType || 'Daily' }}</p>

                    <!-- Stats Row -->
                    <div class="mt-auto grid grid-cols-2 gap-4 border-t-4 border-black pt-4">
                        <div>
                            <span class="text-[10px] font-black uppercase text-concrete-400 block">Streak</span>
                            <span class="text-2xl font-black text-black font-arvo">{{ habit.streak }}</span>
                        </div>
                        <div>
                            <span class="text-[10px] font-black uppercase text-concrete-400 block">Efficiency</span>
                            <span class="text-2xl font-black text-black font-arvo">{{ habit.completionRate }}%</span>
                        </div>
                    </div>
                </a>
            } @empty {
                <div class="col-span-full py-20 text-center rigid-border border-[4px] border-dashed border-concrete-400 bg-concrete-100">
                    <span class="material-symbols-outlined text-6xl text-concrete-400 mb-4">folder_off</span>
                    <h3 class="text-xl font-black text-concrete-400 uppercase tracking-widest">No Directives Found</h3>
                    <p class="text-xs font-mono text-concrete-400 mt-2">Initialize a new protocol to begin data collection.</p>
                </div>
            }
        </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .triangle-corner {
        clip-path: polygon(100% 0, 0 0, 100% 100%);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HabitsListComponent {
  habitService = inject(HabitService);
}
