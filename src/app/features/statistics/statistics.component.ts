import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HabitService } from '../../services/habit.service';

@Component({
    selector: 'app-statistics',
    imports: [RouterLink, SidebarComponent],
    template: `
    <div class="bg-[#f8faf9] dark:bg-[#0d1610] font-display text-[#0d1b12] dark:text-white antialiased min-h-screen flex flex-col md:flex-row overflow-hidden">
      <app-sidebar />
      
      <main class="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header class="p-8 border-b border-[#e5e7eb] dark:border-[#2d3a30] bg-white dark:bg-[#1a2c20]">
          <h2 class="text-3xl font-black text-[#0d1b12] dark:text-white tracking-tight">Habit Statistics</h2>
          <p class="text-[#4c9a66] dark:text-gray-400 font-medium">Select a habit to view detailed performance metrics.</p>
        </header>

        <div class="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div class="max-w-[1000px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (habit of habitService.habits(); track habit.id) {
              <a [routerLink]="['/details', habit.id]" 
                 class="group bg-white dark:bg-[#1a2c20] p-6 rounded-[2rem] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                
                <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#13ec5b]/5 to-transparent rounded-bl-[60px]"></div>
                
                <div class="flex items-center gap-4 mb-6 relative z-10">
                  <div class="size-12 rounded-xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b] group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined filled text-2xl">{{ habit.icon }}</span>
                  </div>
                  <div>
                    <h3 class="font-bold text-[#0d1b12] dark:text-white truncate">{{ habit.name }}</h3>
                    <p class="text-[10px] font-bold text-[#4c9a66] uppercase tracking-widest">{{ habit.category }}</p>
                  </div>
                </div>

                <div class="space-y-4 relative z-10">
                  <div class="flex justify-between items-end">
                    <div>
                      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Streak</p>
                      <p class="text-2xl font-black text-[#0d1b12] dark:text-white tracking-tighter">{{ habit.streak }} <span class="text-xs">Days</span></p>
                    </div>
                    <div class="text-right">
                      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Completion</p>
                      <p class="text-2xl font-black text-[#13ec5b] tracking-tighter">{{ habit.completionRate }}%</p>
                    </div>
                  </div>

                  <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-[#13ec5b] to-[#0ea5e9] h-full rounded-full transition-all duration-1000 ease-out" 
                         [style.width.%]="habit.completionRate"></div>
                  </div>
                </div>

                <div class="mt-6 flex items-center justify-between text-[#4c9a66] relative z-10">
                  <span class="text-[10px] font-bold uppercase tracking-widest">View Details</span>
                  <span class="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </a>
            } @empty {
              <div class="col-span-full py-20 text-center">
                 <p class="text-gray-400 font-medium">No habits to analyze yet.</p>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
    styles: [`
    :host { font-family: 'Inter', sans-serif; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .material-symbols-outlined.filled { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent {
    habitService = inject(HabitService);
}
