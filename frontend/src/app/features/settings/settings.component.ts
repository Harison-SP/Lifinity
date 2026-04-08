import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-white font-body transition-colors duration-300 paper-texture">
        <header class="px-4 py-6 sm:p-6 md:p-8 border-b border-taupe/20 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 bg-alabaster">
            <div>
                <h1 class="font-heading text-3xl md:text-5xl font-bold text-charcoal">
                    Settings
                </h1>
                <p class="text-taupe text-sm mt-1">Customize your experience</p>
            </div>
        </header>

        <div class="px-4 py-6 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-8">
            <!-- Appearance Section -->
            <section class="space-y-4">
                <div class="flex items-center gap-3 border-b border-taupe/20 pb-2">
                    <span class="material-symbols-outlined text-terracotta text-2xl">palette</span>
                    <h2 class="font-heading text-xl font-bold text-charcoal">Appearance</h2>
                </div>

                <div class="space-y-3">
                    <!-- Dark Mode Toggle -->
                    <div class="bg-alabaster p-5 rounded-lg shadow-gentle border border-taupe/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                         (click)="toggleDarkMode()">
                        <div class="flex-1">
                            <p class="font-bold text-charcoal text-lg">Dark Mode</p>
                            <p class="text-sm text-taupe mt-1">Switch between light and dark theme</p>
                        </div>
                        <div class="flex items-center shrink-0">
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" [checked]="themeService.currentTheme() === 'dark'" (change)="toggleDarkMode()">
                                <div class="w-11 h-6 bg-taupe/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>

                    <!-- Compact Mode Toggle -->
                    <div class="bg-alabaster p-5 rounded-lg shadow-gentle border border-taupe/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div class="flex-1">
                            <p class="font-bold text-charcoal text-lg">Compact View</p>
                            <p class="text-sm text-taupe mt-1">Show more content with less spacing</p>
                        </div>
                        <div class="flex items-center shrink-0">
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer">
                                <div class="w-11 h-6 bg-taupe/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Notifications Section -->
            <section class="space-y-4">
                <div class="flex items-center gap-3 border-b border-taupe/20 pb-2">
                    <span class="material-symbols-outlined text-primary text-2xl">notifications</span>
                    <h2 class="font-heading text-xl font-bold text-charcoal">Notifications</h2>
                </div>

                <div class="space-y-3">
                    <div class="bg-alabaster p-5 rounded-lg shadow-gentle border border-taupe/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div class="flex-1">
                            <p class="font-bold text-charcoal text-lg">Daily Reminders</p>
                            <p class="text-sm text-taupe mt-1">Get notified when it's time for your habits</p>
                        </div>
                        <div class="flex items-center shrink-0">
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Data Section -->
            <section class="space-y-4">
                <div class="flex items-center gap-3 border-b border-taupe/20 pb-2">
                    <span class="material-symbols-outlined text-2xl">manage_history</span>
                    <h2 class="font-heading text-xl font-bold text-charcoal">Data Management</h2>
                </div>

                <div class="bg-alabaster p-5 rounded-lg shadow-gentle border border-taupe/10">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p class="font-bold text-charcoal text-lg">Export Data</p>
                            <p class="text-sm text-taupe mt-1">Download your habit history and logs</p>
                        </div>
                        <button class="px-6 py-2.5 bg-white border border-taupe/30 text-charcoal font-medium rounded-lg hover:bg-sand transition-colors">
                            Export JSON
                        </button>
                    </div>
                </div>

                <div class="bg-alabaster p-5 rounded-lg shadow-gentle border border-taupe/10">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p class="font-bold text-red-600 text-lg">Clear All Data</p>
                            <p class="text-sm text-taupe mt-1">Permanently delete all habits and logs. This cannot be undone.</p>
                        </div>
                        <button class="px-6 py-2.5 bg-red-50 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors">
                            Clear Data
                        </button>
                    </div>
                </div>
            </section>

            <!-- About Section -->
            <section class="space-y-4 pb-8">
                <div class="flex items-center gap-3 border-b border-taupe/20 pb-2">
                    <span class="material-symbols-outlined text-taupe text-2xl">info</span>
                    <h2 class="font-heading text-xl font-bold text-charcoal">About</h2>
                </div>

                <div class="bg-alabaster p-5 rounded-lg shadow-gentle border border-taupe/10">
                    <div class="space-y-2 text-sm">
                        <p class="flex justify-between">
                            <span class="text-taupe">Version</span>
                            <span class="font-medium text-charcoal">2.4.0</span>
                        </p>
                        <p class="flex justify-between">
                            <span class="text-taupe">Build</span>
                            <span class="font-medium text-charcoal">Stable</span>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    </div>
    `,
    styles: [`
        :host { display: block; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
    themeService = inject(ThemeService);

    toggleDarkMode() {
        this.themeService.toggleTheme();
    }
}