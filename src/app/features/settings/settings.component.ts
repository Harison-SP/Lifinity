import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
    selector: 'app-settings',
    imports: [SidebarComponent],
    template: `
    <div class="bg-[#f8faf9] dark:bg-[#0d1610] font-display text-[#0d1b12] antialiased min-h-screen flex flex-col md:flex-row overflow-hidden">
        <app-sidebar />
        
        <main class="flex-1 flex flex-col h-screen overflow-hidden relative">
            <header class="p-8 border-b border-[#e5e7eb] dark:border-[#2d3a30] bg-white dark:bg-[#1a2c20]">
                <h2 class="text-3xl font-black text-[#0d1b12] dark:text-white tracking-tight">Settings</h2>
                <p class="text-[#4c9a66] dark:text-gray-400 font-medium">Manage your preferences and account settings.</p>
            </header>

            <div class="flex-1 overflow-y-auto p-10 scrollbar-hide">
                <div class="max-w-3xl space-y-10">
                    <!-- Appearance Section -->
                    <section class="space-y-6">
                        <div class="flex items-center gap-3">
                            <div class="size-10 rounded-xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b]">
                                <span class="material-symbols-outlined filled">palette</span>
                            </div>
                            <h3 class="text-xl font-black text-[#0d1b12] dark:text-white">Appearance</h3>
                        </div>
                        
                        <div class="bg-white dark:bg-[#1a2c20] rounded-[2.5rem] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm overflow-hidden">
                            <div class="flex items-center justify-between p-8 border-b border-[#e5e7eb] dark:border-[#2d3a30]">
                                <div class="flex flex-col gap-1">
                                    <p class="text-[#0d1b12] dark:text-white font-bold text-lg">Dark Mode</p>
                                    <p class="text-[#4c9a66] font-medium text-sm">Optimize the interface for low-light environments.</p>
                                </div>
                                <label class="relative flex h-[36px] w-[60px] cursor-pointer items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1 has-[:checked]:bg-[#13ec5b] transition-all duration-300">
                                    <input class="peer sr-only" type="checkbox"/>
                                    <span class="absolute left-1 top-1 size-7 rounded-full bg-white shadow-md transition-transform duration-300 peer-checked:translate-x-6"></span>
                                </label>
                            </div>
                            
                            <div class="flex items-center justify-between p-8">
                                <div class="flex flex-col gap-1">
                                    <p class="text-[#0d1b12] dark:text-white font-bold text-lg">Compact View</p>
                                    <p class="text-[#4c9a66] font-medium text-sm">Show more content on the dashboard.</p>
                                </div>
                                <label class="relative flex h-[36px] w-[60px] cursor-pointer items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1 has-[:checked]:bg-[#13ec5b] transition-all duration-300">
                                    <input class="peer sr-only" type="checkbox"/>
                                    <span class="absolute left-1 top-1 size-7 rounded-full bg-white shadow-md transition-transform duration-300 peer-checked:translate-x-6"></span>
                                </label>
                            </div>
                        </div>
                    </section>

                    <!-- Notifications Section -->
                    <section class="space-y-6">
                        <div class="flex items-center gap-3">
                            <div class="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span class="material-symbols-outlined filled">notifications</span>
                            </div>
                            <h3 class="text-xl font-black text-[#0d1b12] dark:text-white">Notifications</h3>
                        </div>
                        
                        <div class="bg-white dark:bg-[#1a2c20] rounded-[2.5rem] border border-[#e5e7eb] dark:border-[#2d3a30] shadow-sm overflow-hidden">
                            <div class="flex items-center justify-between p-8">
                                <div class="flex flex-col gap-1">
                                    <p class="text-[#0d1b12] dark:text-white font-bold text-lg">Daily Reminders</p>
                                    <p class="text-[#4c9a66] font-medium text-sm">Get notified when you have habits to complete.</p>
                                </div>
                                <label class="relative flex h-[36px] w-[60px] cursor-pointer items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1 has-[:checked]:bg-[#13ec5b] transition-all duration-300">
                                    <input class="peer sr-only" type="checkbox" checked/>
                                    <span class="absolute left-1 top-1 size-7 rounded-full bg-white shadow-md transition-transform duration-300 peer-checked:translate-x-6"></span>
                                </label>
                            </div>
                        </div>
                    </section>
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
export class SettingsComponent { }
