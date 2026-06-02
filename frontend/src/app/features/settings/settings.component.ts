import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../services/theme.service';
import { UserSettingsService, UserSettings } from '../../services/user-settings.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-white dark:bg-dark-bg font-body transition-colors duration-300 paper-texture pb-12">
        <header class="px-4 py-8 sm:p-8 md:p-12 border-b border-taupe/20 dark:border-dark-border flex flex-col md:flex-row items-center md:items-end justify-between gap-6 bg-alabaster dark:bg-dark-surface relative overflow-hidden">
            <!-- Decorative Background Element -->
            <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl lg:block hidden"></div>
            
            <div class="relative z-10 text-center md:text-left">
                <h1 class="font-heading text-4xl md:text-6xl font-black text-charcoal dark:text-dark-text tracking-tight">
                    Settings
                </h1>
                <p class="text-taupe dark:text-dark-text-secondary text-base md:text-lg mt-2 font-medium">Refine your ritual and workspace</p>
            </div>
            
            <button *ngIf="authService.isAuthenticated$ | async" 
                    (click)="authService.logout()"
                    class="relative z-10 px-6 py-3 bg-white dark:bg-dark-card border border-red-200 dark:border-red-500/30 text-red-600 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95 flex items-center gap-2 shadow-sm">
                <span class="material-symbols-outlined text-lg">logout</span>
                Sign Out
            </button>
        </header>

        <div class="px-4 py-8 sm:p-8 md:p-12 max-w-4xl mx-auto space-y-12">
            <!-- Account Section -->
            <section class="space-y-6" *ngIf="authService.currentUser$ | async as user">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-terracotta/10 rounded-lg">
                        <span class="material-symbols-outlined text-terracotta text-2xl">account_circle</span>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">Account</h2>
                    <div class="h-px flex-1 bg-taupe/10 dark:bg-dark-border ml-2"></div>
                </div>

                <div class="bg-alabaster dark:bg-dark-surface p-8 rounded-2xl shadow-gentle dark:shadow-dark-gentle border border-taupe/10 dark:border-dark-border transition-all hover:shadow-md">
                    <div class="flex flex-col sm:flex-row items-center gap-8">
                        <div class="relative">
                            <div class="w-32 h-32 rounded-3xl bg-sand dark:bg-dark-border flex items-center justify-center overflow-hidden border-4 border-white dark:border-dark-card shadow-soft shrink-0 rotate-3 transition-transform hover:rotate-0">
                                <img *ngIf="user.profile_picture" [src]="user.profile_picture" class="w-full h-full object-cover">
                                <span *ngIf="!user.profile_picture" class="material-symbols-outlined text-6xl text-taupe/40">person</span>
                            </div>
                            <div class="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-dark-surface">
                                <span class="material-symbols-outlined text-sm">verified</span>
                            </div>
                        </div>
                        <div class="flex-1 text-center sm:text-left">
                            <h3 class="font-heading text-3xl font-bold text-charcoal dark:text-dark-text tracking-tight">{{ user.name }}</h3>
                            <p class="text-taupe dark:text-dark-text-secondary text-lg mt-1 font-medium">{{ user.email }}</p>
                            <div class="flex items-center justify-center sm:justify-start gap-2 mt-4">
                                <span class="px-3 py-1 rounded-full bg-sand dark:bg-dark-border text-taupe dark:text-dark-text-secondary text-xs font-bold uppercase tracking-widest border border-taupe/10 dark:border-dark-border">
                                    {{ user.auth_provider }} account
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Habit Tracker section -->
            <section class="space-y-6">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-emerald-500/10 rounded-lg">
                        <span class="material-symbols-outlined text-emerald-500 text-2xl">checklist</span>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">Habit Tracker</h2>
                    <div class="h-px flex-1 bg-taupe/10 dark:bg-dark-border ml-2"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Week Start -->
                    <div class="bg-alabaster dark:bg-dark-surface p-6 rounded-2xl border border-taupe/10 dark:border-dark-border flex flex-col justify-between group transition-all hover:border-emerald-500/30">
                        <div>
                            <p class="font-bold text-charcoal dark:text-dark-text text-lg italic">Week Start Day</p>
                            <p class="text-sm text-taupe dark:text-dark-text-secondary mt-1">When your weekly view begins</p>
                        </div>
                        <div class="flex gap-2 mt-4">
                            <button *ngFor="let day of ['Monday', 'Sunday']" 
                                    (click)="updateSetting({weekStartDay: $any(day)})"
                                    [class.bg-emerald-500]="settings().weekStartDay === day"
                                    [class.text-white]="settings().weekStartDay === day"
                                    [class.bg-white]="settings().weekStartDay !== day"
                                    [class.dark:bg-dark-card]="settings().weekStartDay !== day"
                                    class="flex-1 py-2 rounded-xl text-sm font-bold border border-taupe/10 dark:border-dark-border transition-all">
                                {{ day }}
                            </button>
                        </div>
                    </div>

                    <!-- Default View -->
                    <div class="bg-alabaster dark:bg-dark-surface p-6 rounded-2xl border border-taupe/10 dark:border-dark-border flex flex-col justify-between group transition-all hover:border-emerald-500/30">
                        <div>
                            <p class="font-bold text-charcoal dark:text-dark-text text-lg italic">Habit View Defaults</p>
                            <p class="text-sm text-taupe dark:text-dark-text-secondary mt-1">Choose your preferred perspective</p>
                        </div>
                        <div class="flex gap-2 mt-4">
                            <button *ngFor="let view of ['daily', 'weekly']" 
                                    (click)="updateSetting({defaultHabitView: $any(view)})"
                                    [class.bg-emerald-500]="settings().defaultHabitView === view"
                                    [class.text-white]="settings().defaultHabitView === view"
                                    [class.bg-white]="settings().defaultHabitView !== view"
                                    [class.dark:bg-dark-card]="settings().defaultHabitView !== view"
                                    class="flex-1 py-2 rounded-xl text-sm font-bold border border-taupe/10 dark:border-dark-border transition-all capitalize">
                                {{ view }}
                            </button>
                        </div>
                    </div>

                    <!-- Show Completed -->
                    <div class="md:col-span-2 bg-alabaster dark:bg-dark-surface p-6 rounded-2xl border border-taupe/10 dark:border-dark-border flex items-center justify-between group transition-all hover:border-emerald-500/30">
                        <div class="flex-1">
                            <p class="font-bold text-charcoal dark:text-dark-text text-xl italic">Show Completed Habits</p>
                            <p class="text-sm text-taupe dark:text-dark-text-secondary mt-1 font-medium">Keep your completed tasks visible in the daily list</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" 
                                   [checked]="settings().showCompletedHabits" 
                                   (change)="updateSetting({showCompletedHabits: !settings().showCompletedHabits})">
                            <div class="w-14 h-7 bg-taupe/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>
            </section>

            <!-- Focus Work Section -->
            <section class="space-y-6">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-orange-500/10 rounded-lg">
                        <span class="material-symbols-outlined text-orange-500 text-2xl">timer</span>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">Focus Timer</h2>
                    <div class="h-px flex-1 bg-taupe/10 dark:bg-dark-border ml-2"></div>
                </div>

                <div class="bg-alabaster dark:bg-dark-surface p-8 rounded-2xl border border-taupe/10 dark:border-dark-border space-y-8">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div>
                            <label class="block text-sm font-bold text-taupe dark:text-dark-text-secondary uppercase tracking-widest mb-3">Focus Session</label>
                            <div class="flex items-center gap-3">
                                <input type="number" [(ngModel)]="settings().focusSessionLength" (change)="updateSetting({focusSessionLength: settings().focusSessionLength})"
                                       class="w-full bg-white dark:bg-dark-card border border-taupe/20 dark:border-dark-border rounded-xl px-4 py-3 font-bold text-charcoal dark:text-dark-text focus:border-orange-500 focus:ring-0 outline-none">
                                <span class="text-taupe dark:text-dark-text-secondary font-medium">min</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-taupe dark:text-dark-text-secondary uppercase tracking-widest mb-3">Short Break</label>
                            <div class="flex items-center gap-3">
                                <input type="number" [(ngModel)]="settings().shortBreakLength" (change)="updateSetting({shortBreakLength: settings().shortBreakLength})"
                                       class="w-full bg-white dark:bg-dark-card border border-taupe/20 dark:border-dark-border rounded-xl px-4 py-3 font-bold text-charcoal dark:text-dark-text focus:border-orange-500 focus:ring-0 outline-none">
                                <span class="text-taupe dark:text-dark-text-secondary font-medium">min</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-taupe dark:text-dark-text-secondary uppercase tracking-widest mb-3">Long Break</label>
                            <div class="flex items-center gap-3">
                                <input type="number" [(ngModel)]="settings().longBreakLength" (change)="updateSetting({longBreakLength: settings().longBreakLength})"
                                       class="w-full bg-white dark:bg-dark-card border border-taupe/20 dark:border-dark-border rounded-xl px-4 py-3 font-bold text-charcoal dark:text-dark-text focus:border-orange-500 focus:ring-0 outline-none">
                                <span class="text-taupe dark:text-dark-text-secondary font-medium">min</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-taupe/10 dark:border-dark-border">
                        <div>
                            <p class="font-bold text-charcoal dark:text-dark-text italic">Focus Sounds</p>
                            <p class="text-sm text-taupe dark:text-dark-text-secondary mt-1">Play notification sound when timer ends</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" 
                                   [checked]="settings().soundEnabled" 
                                   (change)="updateSetting({soundEnabled: !settings().soundEnabled})">
                            <div class="w-14 h-7 bg-taupe/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>
                </div>
            </section>

            <!-- Appearance Section -->
            <section class="space-y-6">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <span class="material-symbols-outlined text-primary text-2xl">palette</span>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">Appearance</h2>
                    <div class="h-px flex-1 bg-taupe/10 dark:bg-dark-border ml-2"></div>
                </div>

                <div class="bg-alabaster dark:bg-dark-surface p-6 rounded-2xl border border-taupe/10 dark:border-dark-border flex items-center justify-between transition-all hover:bg-taupe/5 dark:hover:bg-dark-border/20 cursor-pointer group"
                     (click)="toggleDarkMode()">
                    <div class="flex-1">
                        <p class="font-bold text-charcoal dark:text-dark-text text-xl italic">Dark Mode</p>
                        <p class="text-sm text-taupe dark:text-dark-text-secondary mt-1 font-medium">Gentle on the eyes during late night sessions</p>
                    </div>
                    <div class="flex items-center shrink-0">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" [checked]="themeService.currentTheme() === 'dark'" (change)="toggleDarkMode()">
                            <div class="w-14 h-7 bg-taupe/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </section>

            <!-- Workflow Features Section -->
            <section class="space-y-6">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-purple-500/10 rounded-lg">
                        <span class="material-symbols-outlined text-purple-500 text-2xl">insights</span>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">Workflow Features</h2>
                    <div class="h-px flex-1 bg-taupe/10 dark:bg-dark-border ml-2"></div>
                </div>

                <div class="bg-alabaster dark:bg-dark-surface p-8 rounded-2xl border border-taupe/10 dark:border-dark-border space-y-6">
                    <p class="text-sm text-taupe dark:text-dark-text-secondary font-medium">Configure which common tools are enabled when tracking and executing your habits.</p>
                    
                    <!-- Toggle Focus Timer -->
                    <div class="flex items-center justify-between pt-4 border-t border-taupe/10 dark:border-dark-border">
                        <div>
                            <p class="font-bold text-charcoal dark:text-dark-text italic">Focus Timer (Pomodoro)</p>
                            <p class="text-sm text-taupe dark:text-dark-text-secondary mt-1">Enable a dedicated deep work timer inside habit tracking workflows</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" 
                                   [checked]="settings().enableFocusTimerWorkflow" 
                                   (change)="updateSetting({enableFocusTimerWorkflow: !settings().enableFocusTimerWorkflow})">
                            <div class="w-14 h-7 bg-taupe/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                    </div>

                    <!-- Toggle Notes -->
                    <div class="flex items-center justify-between pt-4 border-t border-taupe/10 dark:border-dark-border">
                        <div>
                            <p class="font-bold text-charcoal dark:text-dark-text italic">Note-Taking</p>
                            <p class="text-sm text-taupe dark:text-dark-text-secondary mt-1 font-medium">Enable quick notes and cognitive reflection blocks in habit execution</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" 
                                   [checked]="settings().enableNotesWorkflow" 
                                   (change)="updateSetting({enableNotesWorkflow: !settings().enableNotesWorkflow})">
                            <div class="w-14 h-7 bg-taupe/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                    </div>
                </div>
            </section>

            <!-- AI Section -->
            <section class="space-y-6" *ngIf="settings().aiSuggestionsEnabled !== undefined">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-purple-500/10 rounded-lg">
                        <span class="material-symbols-outlined text-purple-500 text-2xl">auto_awesome</span>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">AI Intelligence</h2>
                    <div class="h-px flex-1 bg-taupe/10 dark:bg-dark-border ml-2"></div>
                </div>

                <div class="bg-gradient-to-br from-alabaster to-purple-50 dark:from-dark-surface dark:to-purple-900/10 p-8 rounded-2xl border border-purple-500/20 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="font-bold text-charcoal dark:text-dark-text text-xl">Experimental AI Suggestions</p>
                            <p class="text-sm text-taupe dark:text-dark-text-secondary mt-2 font-medium max-w-lg">
                                Enable machine learning to analyze your habit patterns and suggest optimal times or protocol adjustments.
                            </p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" 
                                   [checked]="settings().aiSuggestionsEnabled" 
                                   (change)="updateSetting({aiSuggestionsEnabled: !settings().aiSuggestionsEnabled})">
                            <div class="w-14 h-7 bg-taupe/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                    </div>
                </div>
            </section>

            <!-- About Section -->
            <section class="space-y-6 pb-12">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-taupe/10 rounded-lg">
                        <span class="material-symbols-outlined text-taupe text-2xl">info</span>
                    </div>
                    <h2 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">System Info</h2>
                    <div class="h-px flex-1 bg-taupe/10 dark:bg-dark-border ml-2"></div>
                </div>

                <div class="bg-alabaster dark:bg-dark-surface p-8 rounded-2xl border border-taupe/10 dark:border-dark-border">
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-taupe dark:text-dark-text-secondary font-medium tracking-wide">Application Version</span>
                            <span class="px-3 py-1 bg-white dark:bg-dark-card border border-taupe/10 rounded-lg font-bold text-charcoal dark:text-dark-text text-sm">v1.0.0</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-taupe dark:text-dark-text-secondary font-medium tracking-wide">Build Status</span>
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span class="font-bold text-charcoal dark:text-dark-text text-sm uppercase">Production Stable</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <p class="text-center text-taupe/40 text-xs font-bold tracking-[0.2em] uppercase mt-8">Lifinity - Elevate Your Existence</p>
            </section>
        </div>
    </div>
    `,
    styles: [`
        :host { display: block; }
        .font-black { font-weight: 900; }
        .paper-texture {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='noise' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
    themeService = inject(ThemeService);
    authService = inject(AuthService);
    settingsService = inject(UserSettingsService);

    settings = this.settingsService.settings;

    toggleDarkMode() {
        this.themeService.toggleTheme();
    }

    updateSetting(partial: Partial<UserSettings>) {
        this.settingsService.updateSettings(partial);
    }
}