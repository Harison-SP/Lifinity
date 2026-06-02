import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { SystemService } from '../../services/system.service';
import { SystemInstanceTask } from '../../models/system.model';
import { ToastService } from '../../services/toast.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { YesterdayReflectionComponent } from './components/yesterday-reflection/yesterday-reflection.component';
import { SubtaskMatrixComponent } from '../habit-activity/components/subtask-matrix/subtask-matrix.component';

@Component({
    selector: 'app-habit-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, YesterdayReflectionComponent, SubtaskMatrixComponent],
    template: `
    <div class="min-h-screen bg-white px-3 md:px-6 py-3 md:py-8 font-body pb-24 relative transition-colors duration-300 overflow-x-hidden paper-texture">
      <!-- Timer Overlay (Full Screen) -->
      @if (timerRunning()) {
        <div class="fixed inset-0 z-[100] bg-charcoal flex flex-col items-center justify-center text-white p-4 md:p-6 animate-in fade-in duration-500">
          <button (click)="pauseTimer()" class="absolute top-4 right-4 md:top-6 md:right-12 text-white/60 hover:text-white flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-3 border border-white/20 rounded-full transition-all group hover:bg-white/5">
            <span class="material-symbols-outlined text-base md:text-xl group-hover:rotate-90 transition-transform">close</span>
            <span class="text-[10px] md:text-sm font-bold uppercase tracking-widest">Exit</span>
          </button>

          <div class="absolute top-4 left-4 right-4 md:top-6 md:left-8 md:right-auto md:translate-x-0 text-center md:text-left">
            <h2 class="text-primary font-heading text-[8px] md:text-xs font-black tracking-widest uppercase mb-1 opacity-60">System Habit focus</h2>
            <h3 class="text-white text-lg md:text-5xl font-black leading-tight mb-1 md:mb-4 truncate">{{ parentHabit()?.name || habit()?.name }}</h3>
            @if (todaySystemTask()?.title) {
              <p class="text-white/40 italic text-xs md:text-lg px-2 md:pl-4 line-clamp-1 md:line-clamp-none">Task: {{ todaySystemTask()?.title }}</p>
            }
          </div>
    
          <div class="text-6xl md:text-[12rem] lg:text-[16rem] font-mono font-bold tracking-tighter mb-8 md:mb-12 text-primary drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            {{ formattedTimer() }}
          </div>
    
          <div class="mt-10 md:mt-20 flex flex-col items-center">
            <div class="flex items-center justify-center gap-4 h-16 md:h-24">
              <span class="material-symbols-outlined transition-all duration-1000 animate-pulse text-sage" [style.fontSize]="isMobile() ? '2.5rem' : '4rem'">
                {{ getTreeIcon() }}
              </span>
            </div>
            <p class="text-white/60 uppercase tracking-widest text-[10px] md:text-sm mt-2 md:mt-4">Focus Garden Growing...</p>
          </div>
        </div>
      }
    
      <!-- Header -->
      <header class="mb-6 md:mb-10 bg-alabaster border-b border-taupe/20 p-3 md:p-6 rounded-lg shadow-sm">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
          <div class="flex items-start gap-2 md:gap-3 w-full md:w-auto">
            <button (click)="goBack()" class="w-8 h-8 md:w-12 md:h-12 rounded-full border border-taupe/30 bg-alabaster flex items-center justify-center hover:bg-sand transition-colors group shrink-0">
              <span class="material-symbols-outlined text-base md:text-xl text-taupe group-hover:text-charcoal">arrow_back</span>
            </button>
            <div class="min-w-0 flex-1">
              <span class="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-taupe mb-0.5 block">Habit Detail</span>
              <h1 class="font-heading text-xl md:text-4xl font-bold text-charcoal leading-tight truncate">
                {{ habit()?.name || 'Loading...' }}
              </h1>
              @if (habit()?.parentId) {
                <p class="text-taupe text-xs md:text-base mt-0.5 truncate">
                  Part of: {{ parentHabit()?.name }}
                </p>
              }
              <div class="flex items-center gap-1.5 mt-1.5">
                <span class="text-[8px] md:text-[10px] px-2 py-0.5 rounded-full bg-charcoal/5 border border-charcoal/10 text-charcoal font-bold uppercase tracking-wider">
                  {{ habit()?.category || 'General' }}
                </span>
                <span class="text-[8px] md:text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 font-bold uppercase tracking-wider">
                  {{ habit()?.frequencyType || 'Daily' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    
      @if (habit()) {
        <!-- Sobriety / Avoidance Tracker -->
        @if (habit()?.category === 'bad_habit' && habit()?.soberStartDate) {
            <div class="mb-6 md:mb-10 bg-charcoal text-white rounded-xl md:rounded-2xl p-5 md:p-8 shadow-gentle border border-white/10 relative overflow-hidden group">
                <!-- Background Accent -->
                <div class="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl md:blur-3xl group-hover:bg-orange-500/20 transition-colors duration-700"></div>
                
                <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
                    <div class="w-full">
                        <div class="flex items-center justify-center md:justify-start gap-2 mb-1.5 md:mb-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            <span class="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400">Avoidance Active</span>
                        </div>
                        <h2 class="text-3xl md:text-6xl font-heading font-bold mb-1 md:mb-2">{{ soberTime().days }} Days</h2>
                        <p class="text-[10px] md:text-sm text-white/60 font-body">Since last protocol breach</p>
                    </div>

                    <div class="flex flex-col items-center gap-5 md:gap-6 w-full md:w-auto">
                        <div class="flex gap-2 md:gap-3 justify-center">
                            <div class="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4 min-w-[60px] md:min-w-[80px] backdrop-blur-sm border border-white/5">
                                <p class="text-xl md:text-3xl font-bold font-heading">{{ soberTime().hours }}</p>
                                <p class="text-[7px] md:text-[8px] uppercase tracking-tighter text-white/50">Hours</p>
                            </div>
                            <div class="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4 min-w-[60px] md:min-w-[80px] backdrop-blur-sm border border-white/5">
                                <p class="text-xl md:text-3xl font-bold font-heading">{{ soberTime().minutes }}</p>
                                <p class="text-[7px] md:text-[8px] uppercase tracking-tighter text-white/50">Minutes</p>
                            </div>
                            <div class="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4 min-w-[60px] md:min-w-[80px] backdrop-blur-sm border border-white/5">
                                <p class="text-xl md:text-3xl font-bold font-heading text-orange-400">{{ soberTime().seconds }}</p>
                                <p class="text-[7px] md:text-[8px] uppercase tracking-tighter text-white/50">Seconds</p>
                            </div>
                        </div>
                        
                        <button (click)="resetSoberTimer()" 
                                class="w-full md:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover:border-orange-500/50">
                            <span class="material-symbols-outlined text-sm">refresh</span>
                            Record Breach & Reset
                        </button>
                    </div>
                </div>
            </div>
        }

        @if (inconsistentDaysCount() >= 2) {
          <div class="bg-primary text-white p-3 md:p-4 font-bold tracking-wider mb-4 md:mb-6 border border-primary rounded-lg flex items-center gap-2 md:gap-3 shadow-sm text-xs md:text-sm">
            <span class="material-symbols-outlined text-sm md:text-base">warning</span>
            <span>We missed {{ inconsistentDaysCount() }} recent days. Let's get back on track!</span>
          </div>
        }
    
        <!-- Primary Action Card (Merged Goal & Task) -->
        <div class="bg-alabaster rounded-xl md:rounded-2xl shadow-gentle p-4 md:p-10 mb-6 md:mb-8 border-2 border-primary/20 overflow-hidden relative group">
          <!-- Decorative background -->
          <div class="absolute -right-20 -top-20 w-48 md:w-64 h-48 md:h-64 bg-primary/5 rounded-full blur-2xl md:blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>
    
          <div class="relative z-10">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-3 md:mb-4">
                  <span class="bg-primary/10 text-primary px-2 md:py-1 rounded-full text-[8px] md:text-xs font-bold uppercase tracking-widest">Today's Focus</span>
                </div>
    
                <!-- Task/Habit Title -->
                <h2 class="text-xl md:text-4xl lg:text-5xl font-black text-charcoal mb-3 md:mb-4 leading-tight">
                  {{ todaySystemTask()?.title || habit()?.name }}
                </h2>
    
                @if (todaySystemTask()?.description) {
                  <p class="text-taupe italic text-sm md:text-lg mb-4 md:mb-6 max-w-2xl border-l-3 md:border-l-4 border-taupe/20 pl-3 md:pl-4">
                    "{{ todaySystemTask()?.description }}"
                  </p>
                }
    
                <!-- Dynamic Goal Stats -->
                <div class="flex flex-wrap items-end gap-4 md:gap-6 mt-6 md:mt-8">
                  @if (habit()?.type === 'measurable') {
                    <div class="flex flex-col gap-1 md:gap-2">
                      <label class="text-[8px] md:text-xs font-bold text-taupe uppercase tracking-widest">Target</label>
                      <div class="flex items-baseline gap-1 md:gap-2">
                        <span class="text-2xl md:text-3xl font-black text-charcoal">{{ habit()?.targetValue }}</span>
                        <span class="text-primary font-bold text-xs md:text-base">{{ habit()?.targetUnit }}</span>
                      </div>
                    </div>
    
                    <div class="h-8 md:h-12 w-px bg-taupe/20 hidden md:block"></div>
    
                    <div class="flex flex-col gap-1 md:gap-2">
                      <label class="text-[8px] md:text-xs font-bold text-taupe uppercase tracking-widest">Add Progress</label>
                      <div class="flex items-center gap-2 md:gap-3">
                        <input type="number" [(ngModel)]="logValue"
                          class="w-20 md:w-32 p-2 md:p-4 text-xl md:text-3xl font-black bg-white border-2 border-taupe/20 rounded-xl md:rounded-2xl text-center focus:border-primary outline-none transition-all shadow-inner focus:ring-2 md:focus:ring-4 focus:ring-primary/10"
                          placeholder="0" />
                        <div class="flex flex-col">
                          <button (click)="logValue = (logValue || 0) + 1" class="p-0.5 md:p-1 hover:bg-sand rounded">
                            <span class="material-symbols-outlined text-base md:text-xl">expand_less</span>
                          </button>
                          <button (click)="decrementValue()" class="p-0.5 md:p-1 hover:bg-sand rounded">
                            <span class="material-symbols-outlined text-base md:text-xl">expand_more</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div class="bg-sage/10 border border-sage/30 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3">
                      <span class="material-symbols-outlined text-sage text-xl md:text-3xl">task_alt</span>
                      <div>
                        <p class="text-charcoal font-bold text-xs md:text-base">Standard Task</p>
                        <p class="text-[8px] md:text-xs text-taupe uppercase font-bold tracking-widest">Consistency is key</p>
                      </div>
                    </div>
                  }
    
                  @if (isCompletedToday()) {
                    <div class="bg-sage text-white px-3 md:px-4 py-1 md:py-2 rounded-lg flex items-center gap-1.5 md:gap-2 animate-bounce-short">
                      <span class="material-symbols-outlined text-[10px] md:text-sm">check_circle</span>
                      <span class="text-[8px] md:text-xs font-bold uppercase">Already Logged</span>
                    </div>
                  }
                </div>
              </div>
    
              <!-- Huge Primary Action Button (Optimized for Mobile) -->
              <div class="shrink-0 flex flex-col items-center gap-3 md:gap-4">
                <button (click)="handlePrimaryAction()"
                  class="relative group overflow-hidden w-full md:w-64 h-32 md:h-64 rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl transition-all active:scale-95 shadow-gentle flex flex-row md:flex-col items-center justify-center gap-3 md:gap-4 border-b-4 md:border-b-8"
                                    [class]="(isCompletedToday() || todaySystemTask()?.completed) 
                                        ? 'bg-sage border-sage-dark text-white' 
                                        : 'bg-primary border-primary-dark text-white hover:brightness-110'">
                  <span class="material-symbols-outlined text-4xl md:text-7xl transition-transform group-hover:scale-110 duration-300">
                    {{ (isCompletedToday() || todaySystemTask()?.completed) ? 'verified' : 'bolt' }}
                  </span>
                  <span class="tracking-tighter">
                    {{ (isCompletedToday() || todaySystemTask()?.completed) ? 'COMPLETED' : 'MARK DONE' }}
                  </span>
    
                  <!-- Shine effect -->
                  <div class="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shine"></div>
                </button>
                
                @if (isCompletedToday() || todaySystemTask()?.completed) {
                  <button (click)="unmarkHabit()" class="text-taupe hover:text-red-500 text-[8px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors opacity-60 hover:opacity-100">
                    <span class="material-symbols-outlined text-xs md:text-sm">undo</span> Unmark
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Subtask Matrix -->
        @if (habit()?.subtasks?.length) {
            <div class="mb-6 md:mb-8">
                <app-subtask-matrix [habit]="habit()!" [date]="getLocalDateString()"></app-subtask-matrix>
            </div>
        }
    
        <!-- Habit Stacking Indicator -->
        @if (habit()?.stackedWith) {
          <div class="mb-6 md:mb-8 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-orange-500/20 relative overflow-hidden shadow-sm">
            <div class="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-orange-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6 relative z-10">
              <div class="flex items-start gap-3 md:gap-4">
                <div class="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0 text-orange-600 shadow-sm border border-orange-500/10">
                  <span class="material-symbols-outlined text-xl md:text-2xl">link</span>
                </div>
                <div>
                  <p class="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-0.5 md:mb-1">Behavioral Association</p>
                  <p class="text-base md:text-lg font-bold text-charcoal">Stacked: <span class="text-orange-500">{{ habit()?.stackedWith }}</span></p>
                  <p class="text-[10px] md:text-sm text-taupe mt-0.5 font-medium">
                    @if (stackDaysRemaining() > 0) {
                      {{ stackDaysRemaining() }} days left
                    } @else {
                      <span class="text-sage font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs md:text-base">verified</span>
                        Stack solidified!
                      </span>
                    }
                  </p>
                </div>
              </div>
              <div class="w-full sm:w-48 md:w-64 flex-shrink-0">
                <div class="flex items-center justify-between text-[9px] md:text-xs font-bold text-taupe mb-1.5 md:mb-2 uppercase tracking-tighter">
                  <span>Formation</span>
                  <span class="text-orange-500">{{ stackProgress() }}%</span>
                </div>
                <div class="w-full h-2 md:h-3 bg-taupe/10 rounded-full overflow-hidden p-0.5 border border-taupe/5">
                  <div class="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000 ease-out shadow-sm"
                       [style.width.%]="stackProgress()"></div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Workflow Features Grid -->
        @if (settingsService.settings().enableFocusTimerWorkflow || settingsService.settings().enableNotesWorkflow) {
          <div class="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-8"
               [class.lg:grid-cols-2]="settingsService.settings().enableFocusTimerWorkflow && settingsService.settings().enableNotesWorkflow">
            
            <!-- Focus Timer Card -->
            @if (settingsService.settings().enableFocusTimerWorkflow) {
              <div class="bg-charcoal text-white rounded-xl md:rounded-2xl shadow-gentle p-5 md:p-8 relative overflow-hidden">
                <div class="flex items-center justify-between mb-6 md:mb-8">
                  <div>
                    <h3 class="font-heading text-lg md:text-xl font-bold flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary">timer</span> Focus Timer
                    </h3>
                    <p class="text-white/50 text-[10px] uppercase tracking-widest font-bold mt-0.5">Start deep work</p>
                  </div>
                  <span class="text-[9px] bg-white/10 px-2 py-1 rounded-full text-white/80 border border-white/10">2-minute rule</span>
                </div>
        
                <div class="flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8">
                  <div class="text-5xl md:text-6xl font-mono font-bold tracking-tighter text-primary">
                    {{ formattedTimer() }}
                  </div>
        
                  <div class="flex items-center bg-white/10 border border-white/20 rounded-xl md:rounded-2xl overflow-hidden backdrop-blur-sm w-full sm:w-auto">
                    <input type="number" [(ngModel)]="customTimerMinutes" placeholder="MINS" class="flex-1 sm:w-16 p-3 md:p-4 text-center font-bold text-base md:text-lg text-white bg-transparent outline-none border-r border-white/10" min="1">
                    <button (click)="startCustomTimer()" class="px-5 md:px-6 py-3 md:py-4 bg-primary text-white font-black text-xs md:text-sm hover:bg-primary-light transition-all whitespace-nowrap uppercase">START</button>
                  </div>
                </div>
        
                <!-- Focus Garden Stats -->
                <div class="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-white/10">
                  <div class="flex justify-between items-end mb-3 md:mb-4">
                    <div>
                      <span class="text-[9px] md:text-xs uppercase tracking-widest text-white/40 font-bold block mb-0.5 md:mb-1">Daily Progress</span>
                      <span class="text-[11px] md:text-sm font-medium text-white/80">{{ totalFocusedMinutes() }} mins focused</span>
                    </div>
                    <span class="material-symbols-outlined transition-all duration-700 animate-pulse" [ngClass]="getTreeStyle()" [style.fontSize]="isMobile() ? '2rem' : ''">
                      {{ getTreeIcon() }}
                    </span>
                  </div>
                  @if (totalFocusedMinutes() < 120) {
                    <div class="w-full h-2 md:h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div class="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-1000" [style.width.%]="getProgressPer()"></div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Personal Notes Card -->
            @if (settingsService.settings().enableNotesWorkflow) {
              <div class="bg-alabaster rounded-xl md:rounded-2xl shadow-gentle p-5 md:p-8 border border-taupe/10 flex flex-col h-full">
                <div class="flex items-center justify-between mb-4 md:mb-6">
                  <h3 class="font-heading text-lg md:text-xl font-bold text-charcoal flex items-center gap-2">
                    <span class="material-symbols-outlined text-taupe">notes</span> Personal Notes
                  </h3>
                  <a [routerLink]="['/notes', habitId()]"
                      [queryParams]="{ mode: 'new', taskTitle: todaySystemTask()?.title, taskDesc: todaySystemTask()?.description }"
                      class="flex items-center gap-1 px-4 py-1.5 bg-primary text-white rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider hover:bg-primary-light transition-all shadow-sm">
                      <span class="material-symbols-outlined text-base">edit_note</span> Notes
                    </a>
                </div>
    
                <div class="flex-1 flex flex-col items-center justify-center p-6 bg-white/50 rounded-xl border border-taupe/5 border-dashed">
                   <span class="material-symbols-outlined text-taupe/20 text-4xl mb-2">sticky_note_2</span>
                   <p class="text-[10px] md:text-xs text-taupe italic text-center leading-relaxed">Document your process. Maintain cognitive clarity through written reflection.</p>
                </div>
        
                <div class="mt-4 flex justify-between items-center">
                  @if (habit()?.parentId) {
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-charcoal text-white rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-tighter">
                      <span class="material-symbols-outlined text-xs">settings_input_component</span> System Habit
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
    
        <!-- Pending Past Tasks -->
        <div class="bg-alabaster rounded-xl md:rounded-2xl shadow-gentle p-5 md:p-8 border border-taupe/10">
          <div class="flex items-center justify-between mb-4 md:mb-6">
            <h3 class="font-heading text-lg md:text-2xl font-bold text-charcoal flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">history</span> Catch Up
            </h3>
            @if (pendingPastTasks().length > 0) {
              <span class="px-2 md:py-1 bg-primary/10 text-primary text-[10px] md:text-xs font-bold rounded-full uppercase tracking-widest">
                {{ pendingPastTasks().length }} Missing
              </span>
            }
          </div>
    
          @if (pendingPastTasks().length === 0) {
            <div class="flex flex-col items-center justify-center p-8 md:p-12 bg-sage/5 rounded-xl md:rounded-2xl border border-dashed border-sage/20">
              <span class="material-symbols-outlined text-sage text-4xl md:text-5xl mb-3 md:mb-4">verified</span>
              <p class="text-taupe font-bold text-xs md:text-base text-center">Protocol maintained. All tasks cleared.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              @for (task of pendingPastTasks(); track task.date + task.title) {
                <div class="flex items-center justify-between p-3 md:p-4 bg-white border border-taupe/10 rounded-xl md:rounded-2xl hover:border-primary/30 transition-all group">
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-charcoal text-sm md:text-base truncate">{{ task.title }}</p>
                    <div class="flex items-center gap-2 mt-0.5 md:mt-1">
                      <span class="text-[10px] md:text-xs text-primary font-bold">{{ task.date }}</span>
                      <span class="text-[9px] md:text-[10px] text-taupe uppercase font-black opacity-40">Phase {{ task.phase }}</span>
                    </div>
                  </div>
                  <button (click)="toggleMission(task)" class="w-10 h-10 md:w-12 md:h-12 bg-sand hover:bg-sage hover:text-white rounded-lg md:rounded-xl transition-all flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl md:text-2xl">{{ task.completed ? 'check_circle' : 'circle' }}</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Yesterday's Reflection -->
      @if (habit()) {
        <app-yesterday-reflection
          [habit]="habit()!"
          [yesterdayData]="yesterdayStats()">
        </app-yesterday-reflection>
      }

      <!-- Celebration Overlay -->
      @if (celebrationMessage()) {
        <div class="fixed inset-0 pointer-events-none z-[110] flex items-center justify-center p-4 backdrop-blur-sm bg-black/10">
          <div class="animate-bounce-slow text-3xl md:text-6xl lg:text-8xl font-black text-primary uppercase font-display bg-white px-6 md:px-10 py-4 md:py-8 border-4 md:border-8 border-charcoal shadow-2xl text-center rotate-[-2deg]">
            {{ celebrationMessage() }}
          </div>
        </div>
      }
    </div>
    `,
    styles: [`
    :host { display: block; }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-taupe); border-radius: 3px; }

    @keyframes shine {
        0% { left: -100%; }
        100% { left: 100%; }
    }
    .animate-shine {
        animation: shine 1.5s ease-in-out infinite;
    }

    @keyframes bounce-short {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
    }
    .animate-bounce-short {
        animation: bounce-short 1s ease-in-out infinite;
    }

    @keyframes bounce-slow {
        0%, 100% { transform: translateY(0) rotate(-2deg); }
        50% { transform: translateY(-20px) rotate(-1deg); }
    }
    .animate-bounce-slow {
        animation: bounce-slow 2s ease-in-out infinite;
    }

    .bg-primary-dark { background-color: #c2410c; }
    .bg-sage-dark { background-color: #6a7c5c; }
    .border-primary-dark { border-bottom-color: #9a3412; }
    .border-sage-dark { border-bottom-color: #4a5c3c; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HabitDetailComponent implements OnInit, OnDestroy {
    location = inject(Location);
    route = inject(ActivatedRoute);
    habitService = inject(HabitService);
    systemService = inject(SystemService);
    toastService = inject(ToastService);
    settingsService = inject(UserSettingsService);
    today = new Date();

    isMobile = signal(window.innerWidth < 768);

    getLocalDateString(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    habitId = computed(() => Object.is(this.route.snapshot.paramMap.get('id'), null) ? null : this.route.snapshot.paramMap.get('id'));
    habit = computed(() => this.habitService.habits().find(h => h.id === this.habitId()));

    dbFocusedMinutes = signal<number>(0);

    yesterdayStats = signal<{ performance: number; completed: number; total: number; onTrack: boolean } | null>(null);

    todaySystemTask = signal<SystemInstanceTask | null>(null);
    pendingPastTasks = signal<SystemInstanceTask[]>([]);

    allHabits = computed(() => this.habitService.habits());

    parentHabit = computed(() => {
        const parentId = this.habit()?.parentId;
        if (!parentId) return null;
        return this.allHabits().find(h => h.id === parentId);
    });

    handlePrimaryAction() {
        const task = this.todaySystemTask();
        const h = this.habit();
        
        // 1. If there's a system task, toggle it
        if (task) {
            this.toggleMission(task);
        }

        // 2. If it's a measurable habit, save the log with the current logValue
        if (h?.type === 'measurable') {
            this.saveLog();
        } else {
            // 3. Otherwise treat as a standard habit completion
            if (!this.isCompletedToday()) {
                this.toggleDone();
            }
        }
    }

    decrementValue() {
        this.logValue = Math.max(0, (this.logValue || 0) - 1);
    }

    isCompletedToday = computed(() => {
        const h = this.habit();
        return !!h?.completedToday;
    });

    fullHeatmapData = signal<{ date: string, level: number }[]>([]);

    inconsistentDaysCount = computed(() => {
        const data = this.fullHeatmapData();
        const habit = this.habit();
        if (!data.length || !habit) return 0;

        let missed = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const habitStartDate = habit.startDate ? new Date(habit.startDate) : null;
        if (habitStartDate) habitStartDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);

            // If checkDate is before habit start date, stop counting missed days
            if (habitStartDate && checkDate < habitStartDate) {
                break;
            }

            const dateStr = checkDate.toISOString().split('T')[0];
            const dayData = data.find(d => d.date === dateStr);
            if (!dayData || dayData.level === 0) {
                missed++;
            } else {
                break;
            }
        }
        return missed;
    });

    timerValue = signal(this.settingsService.settings().focusSessionLength * 60);
    initialTimerValue = signal(this.settingsService.settings().focusSessionLength * 60);
    timerRunning = signal(false);
    timerInterval: any;
    private soberTimerInterval: any;
    soberTime = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    celebrationMessage = signal('');

    stackDaysRemaining = computed(() => {
        const h = this.habit();
        if (!h?.stackedWith || !h?.stackStartDate) return 0;
        const start = new Date(h.stackStartDate);
        const duration = h.stackDuration || 21;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, duration - elapsed);
    });

    stackProgress = computed(() => {
        const h = this.habit();
        if (!h?.stackedWith || !h?.stackStartDate) return 0;
        const start = new Date(h.stackStartDate);
        const duration = h.stackDuration || 21;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(100, Math.round((elapsed / duration) * 100));
    });

    customTimerMinutes: number | undefined;

    logValue: number | undefined;
    localSessionMinutes = signal(0);
    totalFocusedMinutes = computed(() => {
        return this.dbFocusedMinutes() + this.localSessionMinutes();
    });

    formattedTimer = computed(() => {
        const t = this.timerValue();
        const m = Math.floor(t / 60).toString().padStart(2, '0');
        const s = (t % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    });

    ngOnInit() {
        const id = this.habitId();
        const todayStr = this.getLocalDateString();

        if (id) {
            this.habitService.getHabitLog(id, todayStr).subscribe(log => {
                if (log) {
                    this.logValue = log.value;
                    this.dbFocusedMinutes.set(log.focused_minutes || 0);
                } else {
                    this.dbFocusedMinutes.set(0);
                }
            });

            this.habitService.getHabitStats(id).subscribe(stats => {
                if (stats && stats.heatmap) {
                    this.fullHeatmapData.set(stats.heatmap);
                }
            });

            this.habitService.getYesterdayStats(id).subscribe(stats => {
                this.yesterdayStats.set(stats);
            });

            this.systemService.getInstanceTasksByDate(todayStr).subscribe(tasks => {
                const relatedTask = tasks.find(t => t.habitId === id);
                this.todaySystemTask.set(relatedTask || null);
            });

            this.systemService.getPendingPastTasks(id, todayStr).subscribe(tasks => {
                tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                this.pendingPastTasks.set(tasks);
            });

            this.startSoberTimer();
        }
    }

    ngOnDestroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.soberTimerInterval) clearInterval(this.soberTimerInterval);
    }

    goBack() {
        this.location.back();
    }

    private startSoberTimer() {
        this.soberTimerInterval = setInterval(() => {
            const currentHabit = this.habit();
            if (currentHabit?.category === 'bad_habit' && currentHabit?.soberStartDate) {
                const start = new Date(currentHabit.soberStartDate);
                const now = new Date();
                const diff = now.getTime() - start.getTime();

                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                    const minutes = Math.floor((diff / (1000 * 60)) % 60);
                    const seconds = Math.floor((diff / 1000) % 60);
                    this.soberTime.set({ days, hours, minutes, seconds });
                }
            }
        }, 1000);
    }

    resetSoberTimer() {
        const currentHabit = this.habit();
        if (!currentHabit) return;

        if (confirm('Confirm protocol breach? This will reset your avoidance timer to zero.')) {
            const now = new Date().toISOString();
            this.habitService.updateHabit(currentHabit.id, { soberStartDate: now }).subscribe({
                next: (updated) => {
                    // Signal updates automatically via service state
                }
            });
        }
    }

    startCustomTimer() {
        if (this.customTimerMinutes && this.customTimerMinutes > 0) {
            this.startTimer(this.customTimerMinutes * 60);
        }
    }


    startTimer(seconds: number) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerValue.set(seconds);
        this.initialTimerValue.set(seconds);
        this.timerRunning.set(true);
        this.timerInterval = setInterval(() => {
            if (this.timerValue() > 0) {
                this.timerValue.set(this.timerValue() - 1);
            } else {
                clearInterval(this.timerInterval);
                this.timerRunning.set(false);
                this.playTimerSound();
                this.completeSession();
            }
        }, 1000);
    }

    private playTimerSound() {
        if (this.settingsService.settings().soundEnabled) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.log('Audio play failed', e));
        }
    }

    pauseTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerRunning.set(false);
    }

    resetTimer() {
        this.pauseTimer();
        this.timerValue.set(0);
    }

    saveLog() {
        const id = this.habitId();
        if (!id) return;

        const isCompletedNow = this.isCompletedToday();
        const todayStr = this.getLocalDateString();

        this.habitService.updateLog(id, todayStr, {
            value: this.logValue,
            focused_minutes: this.totalFocusedMinutes()
        }).subscribe(() => {
            if (!isCompletedNow && this.logValue !== undefined && this.logValue > 0) {
                this.showCelebration();
            }
        });
    }

    toggleDone() {
        const id = this.habitId();
        const isCompletedNow = this.isCompletedToday();
        const todayStr = this.getLocalDateString();

        if (id) {
            this.habitService.toggleCompletion(id, todayStr).subscribe(() => {
                if (!isCompletedNow) {
                    this.showCelebration('Great job!');
                }
            });
        }
    }


    saveFocusTime(addedMins: number) {
        const id = this.habitId();
        if (id) {
            const todayStr = this.getLocalDateString();
            const newTotal = this.totalFocusedMinutes();
            const payload = {
                focused_minutes: newTotal
            };
            if (this.logValue !== undefined && this.logValue !== null) (payload as any).value = this.logValue;

            this.habitService.updateLog(id, todayStr, payload).subscribe(() => {
                this.dbFocusedMinutes.set(newTotal);
                this.localSessionMinutes.set(0);
                if (addedMins > 0) {
                    this.showCelebration(`+${addedMins} minutes of focus!`);
                }
            });
        }
    }

    completeSession() {
        const minsCompleted = Math.round(this.initialTimerValue() / 60);
        this.localSessionMinutes.set(minsCompleted);

        const id = this.habitId();
        if (id) {
            const todayStr = this.getLocalDateString();
            const newTotal = this.totalFocusedMinutes();
            this.habitService.updateLog(id, todayStr, {
                value: this.logValue !== undefined ? this.logValue : 1,
                focused_minutes: newTotal
            }).subscribe(() => {
                this.dbFocusedMinutes.set(newTotal);
                this.localSessionMinutes.set(0);
                this.showCelebration(`+${minsCompleted} minute focus!`);
            });
        }
    }

    toggleMission(task: SystemInstanceTask) {
        if (!task.instanceId) return;
        this.systemService.toggleInstanceTask(
            task.instanceId,
            task.phase || '',
            task.weekNumber,
            task.date || '',
            task.title
        ).subscribe(() => {
            const id = this.habitId();
            const todayStr = this.getLocalDateString();
            if (id) {
                this.systemService.getInstanceTasksByDate(todayStr).subscribe(tasks => {
                    const relatedTask = tasks.find(t => t.habitId === id);
                    this.todaySystemTask.set(relatedTask || null);
                });
                this.systemService.getPendingPastTasks(id, todayStr).subscribe(tasks => {
                    tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    this.pendingPastTasks.set(tasks);
                });
                if (task.completed) {
                    this.toastService.info('Task unmarked');
                } else {
                    this.showCelebration('Task completed!');
                }
            }
        });
    }

    // Gamification Helpers
    getTreeIcon(): string {
        const mins = this.totalFocusedMinutes();
        if (mins === 0) return 'eco';
        if (mins < 25) return 'park';
        if (mins < 60) return 'forest';
        return 'forest';
    }

    getTreeStyle(): string {
        const mins = this.totalFocusedMinutes();
        if (mins === 0) return 'text-taupe text-2xl';
        if (mins < 25) return 'text-sage text-4xl';
        if (mins < 60) return 'text-green-500 text-5xl';
        if (mins < 120) return 'text-green-400 text-6xl drop-shadow-[0_0_15px_rgba(7,173,80,0.5)]';
        return 'text-green-400 text-7xl drop-shadow-[0_0_25px_rgba(7,173,80,0.8)]';
    }

    getProgressPer(): number {
        const mins = this.totalFocusedMinutes();
        let target = 25;
        if (mins >= 25) target = 60;
        if (mins >= 60) target = 120;
        if (mins >= 120) return 100;

        const prevMilestone = mins < 25 ? 0 : (mins < 60 ? 25 : 60);
        return ((mins - prevMilestone) / (target - prevMilestone)) * 100;
    }

    showCelebration(msg?: string, confetti = true) {
        const messages = ['Great job!', 'Awesome!', 'Keep it up!', 'Another one!', 'On fire!', 'Well done!'];
        this.celebrationMessage.set(msg || messages[Math.floor(Math.random() * messages.length)]);

        if (confetti) {
            if (!(window as any).confetti) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
                script.onload = () => this.fireConfetti();
                document.body.appendChild(script);
            } else {
                this.fireConfetti();
            }
        }

        setTimeout(() => this.celebrationMessage.set(''), 3000);
    }

    lastConfettiTime = 0;
    fireConfetti() {
        const now = Date.now();
        if (now - this.lastConfettiTime < 2000) return;
        this.lastConfettiTime = now;

        if ((window as any).confetti) {
            (window as any).confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#f97316', '#8c9a81', '#f8f6f6', '#4a443e'],
                zIndex: 2147483647
            });
        }
    }

    unmarkHabit() {
        const id = this.habitId();
        const todayStr = this.getLocalDateString();
        const task = this.todaySystemTask();

        // If it's a system task, toggle it back
        if (task && task.completed) {
            this.toggleMission(task);
            return;
        }

        // Otherwise toggle standard completion
        if (id && this.isCompletedToday()) {
            this.habitService.toggleCompletion(id, todayStr).subscribe(() => {
                this.toastService.info('Completion removed');
            });
        }
    }
}







