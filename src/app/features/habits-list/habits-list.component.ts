import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HabitService } from '../../services/habit.service';

@Component({
  selector: 'app-habits-list',
  imports: [CommonModule, RouterLink, SidebarComponent],
  template: `
    <div class="bg-[#f8faf9] dark:bg-[#0d1610] font-display text-[#0d1b12] dark:text-white antialiased min-h-screen flex flex-col md:flex-row overflow-hidden">
      <app-sidebar />
      
      <main class="flex-1 flex flex-col h-screen overflow-hidden">
        <header class="p-8 border-b border-[#e5e7eb] dark:border-[#2d3a30] bg-white dark:bg-[#1a2c20] sticky top-0 z-30">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-black text-[#0d1b12] dark:text-white tracking-tight">All Habits</h2>
              <p class="text-[#4c9a66] dark:text-gray-400 font-medium">Track and manage your daily habits</p>
            </div>
            <a routerLink="/add" class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#13ec5b] text-[#0d1b12] font-bold shadow-sm transition-all hover:scale-105 active:scale-95">
              <span class="material-symbols-outlined text-[22px]">add</span>
              New Habit
            </a>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div class="max-w-[1400px] mx-auto">
            @if (habitService.habits().length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (habit of habitService.habits(); track habit.id) {
                  <a [routerLink]="['/details', habit.id]" 
                     class="group p-8 rounded-[2rem] bg-white dark:bg-[#1a2c20] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden">
                    
                    <!-- Background Icon -->
                    <span class="material-symbols-outlined !text-7xl absolute -right-4 -bottom-4 opacity-5 text-[#13ec5b]">{{ habit.icon || 'star' }}</span>
                    
                    <!-- Habit Header -->
                    <div class="flex items-start justify-between mb-4 relative z-10">
                      <div class="flex items-center gap-3">
                        <div class="size-12 rounded-xl flex items-center justify-center text-2xl" 
                             [style.background-color]="habit.color || '#13ec5b'">
                          <span class="material-symbols-outlined filled text-white">{{ habit.icon || 'star' }}</span>
                        </div>
                        <div>
                          <h3 class="text-lg font-black text-[#0d1b12] dark:text-white">{{ habit.name }}</h3>
                          <p class="text-xs text-[#4c9a66] font-semibold uppercase tracking-wider">{{ habit.category || 'General' }}</p>
                        </div>
                      </div>
                      @if (habit.completedToday) {
                        <span class="material-symbols-outlined text-[#13ec5b] text-2xl">check_circle</span>
                      }
                    </div>

                    <!-- Description -->
                    @if (habit.description) {
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">{{ habit.description }}</p>
                    }

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-3 gap-4 mb-4">
                      <div class="text-center">
                        <p class="text-2xl font-black text-[#0d1b12] dark:text-white">{{ habit.streak }}</p>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Streak</p>
                      </div>
                      <div class="text-center">
                        <p class="text-2xl font-black text-[#0d1b12] dark:text-white">{{ habit.bestStreak }}</p>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Best</p>
                      </div>
                      <div class="text-center">
                        <p class="text-2xl font-black text-[#0d1b12] dark:text-white">{{ habit.completionRate }}%</p>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rate</p>
                      </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div class="h-full bg-[#13ec5b] rounded-full transition-all" [style.width.%]="habit.completionRate"></div>
                    </div>

                    <!-- Frequency Badge -->
                    <div class="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#13ec5b]/10 text-[#13ec5b]">
                      <span class="material-symbols-outlined text-sm">calendar_today</span>
                      {{ habit.frequency }}
                    </div>
                  </a>
                }
              </div>
            } @else {
              <div class="h-96 flex flex-col items-center justify-center p-20 text-center bg-white dark:bg-[#1a2c20] rounded-[2.5rem] border border-[#e5e7eb] dark:border-[#2d3a30]">
                <span class="material-symbols-outlined text-6xl text-gray-200 mb-4">checklist</span>
                <p class="text-gray-400 font-bold text-lg mb-4">No habits yet</p>
                <a routerLink="/add" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#13ec5b] text-[#0d1b12] font-bold shadow-sm transition-all hover:scale-105">
                  <span class="material-symbols-outlined">add</span>
                  Create Your First Habit
                </a>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { font-family: 'Inter', sans-serif; }
    .material-symbols-outlined { 
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
    .material-symbols-outlined.filled { 
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
    }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HabitsListComponent {
  habitService = inject(HabitService);
}
