import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-full overflow-y-auto bg-concrete-200 font-manrope">
        <header class="p-8 border-b-4 border-black pb-6 flex flex-col md:flex-row items-end justify-between gap-6 bg-white shrink-0">
            <div>
                 <div class="bg-black text-white px-2 py-1 inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                    System_Control
                </div>
                <h1 class="text-4xl md:text-6xl font-black text-black uppercase leading-none font-arvo">
                    Configuration
                </h1>
            </div>
            <div class="text-right hidden md:block">
                <p class="text-[10px] font-black uppercase tracking-widest text-concrete-400">Ver. 2.4.0 // STABLE</p>
            </div>
        </header>

        <div class="p-8 max-w-4xl mx-auto pb-24">
            <div class="space-y-12">
                <!-- Appearance Section -->
                <section class="space-y-6">
                    <h3 class="text-2xl font-black text-black uppercase font-arvo border-b-4 border-black pb-2 flex items-center gap-3">
                        <span class="material-symbols-outlined text-3xl">palette</span>
                        Interface_Protocols
                    </h3>
                    
                    <div class="space-y-4">
                        <!-- Toggle Item -->
                        <div class="bg-white p-6 rigid-border border-[3px] flex items-center justify-between group hover:shadow-[4px_4px_0_0_black] transition-all">
                            <div class="flex flex-col gap-1">
                                <p class="text-black font-black text-lg uppercase tracking-wide">Dark_Mode_Override</p>
                                <p class="text-concrete-500 font-mono text-xs uppercase font-bold">Force high-contrast dark theme (disabled). Brutalist Light Mode Active.</p>
                            </div>
                            <label class="relative flex h-[28px] w-[56px] cursor-not-allowed items-center border-[3px] border-concrete-300 p-1 opacity-50">
                                <input class="peer sr-only" type="checkbox" disabled/>
                                <span class="absolute left-0.5 top-0.5 size-[18px] bg-concrete-300 transition-all"></span>
                            </label>
                        </div>
                        
                        <!-- Toggle Item -->
                        <div class="bg-white p-6 rigid-border border-[3px] flex items-center justify-between group hover:shadow-[4px_4px_0_0_black] transition-all cursor-pointer">
                            <div class="flex flex-col gap-1">
                                <p class="text-black font-black text-lg uppercase tracking-wide">Compact_Matrix</p>
                                <p class="text-concrete-500 font-mono text-xs uppercase font-bold">Increase information density on dashboard modules.</p>
                            </div>
                            <label class="relative flex h-[28px] w-[56px] cursor-pointer items-center border-[3px] border-black p-1 transition-all">
                                <input class="peer sr-only" type="checkbox"/>
                                <span class="absolute left-0.5 top-0.5 size-[18px] bg-black transition-all peer-checked:translate-x-[26px] peer-checked:bg-electric-red"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Notifications Section -->
                <section class="space-y-6">
                    <h3 class="text-2xl font-black text-black uppercase font-arvo border-b-4 border-black pb-2 flex items-center gap-3">
                         <span class="material-symbols-outlined text-3xl">notifications</span>
                        Notification_Relays
                    </h3>
                    
                    <div class="space-y-4">
                        <div class="bg-white p-6 rigid-border border-[3px] flex items-center justify-between group hover:shadow-[4px_4px_0_0_black] transition-all cursor-pointer">
                            <div class="flex flex-col gap-1">
                                <p class="text-black font-black text-lg uppercase tracking-wide">Daily_Status_Ping</p>
                                <p class="text-concrete-500 font-mono text-xs uppercase font-bold">Receive morning briefings on active directives.</p>
                            </div>
                            <label class="relative flex h-[28px] w-[56px] cursor-pointer items-center border-[3px] border-black p-1 transition-all">
                                <input class="peer sr-only" type="checkbox" checked/>
                                <span class="absolute left-0.5 top-0.5 size-[18px] bg-black transition-all peer-checked:translate-x-[26px] peer-checked:bg-electric-red"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Data Management Section -->
                <section class="space-y-6">
                    <h3 class="text-2xl font-black text-black uppercase font-arvo border-b-4 border-black pb-2 flex items-center gap-3">
                        <span class="material-symbols-outlined text-3xl text-electric-red">database</span>
                        Data_Persistence
                    </h3>
                    
                    <div class="bg-white p-6 rigid-border border-[3px] flex items-center justify-between group hover:shadow-[4px_4px_0_0_black] transition-all">
                            <div class="flex flex-col gap-1">
                            <p class="text-black font-black text-lg uppercase tracking-wide group-hover:text-electric-red transition-colors">Purge_Local_Cache</p>
                            <p class="text-concrete-500 font-mono text-xs uppercase font-bold">Clear all locally stored session data. Irreversible.</p>
                        </div>
                        <button class="px-6 py-3 border-[3px] border-black bg-electric-red text-white font-black uppercase text-xs hover:bg-black transition-all tracking-widest shadow-[4px_4px_0_0_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_black]">
                            EXECUTE
                        </button>
                    </div>
                </section>
            </div>
        </div>
    </div>
    `,
    styles: [`
    :host { display: block; height: 100%; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent { }
