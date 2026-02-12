import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-full overflow-y-auto custom-scrollbar relative bg-[#050608]">
            <!-- Top Bar Decoration -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-[#ec5b13] z-50 shadow-[0_0_10px_#ec5b13] opacity-80"></div>

        <header class="p-8 border-b border-[#2a3441] bg-[#0c0e12] relative z-10 shrink-0 flex justify-between items-end">
            <div>
                <h2 class="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                    <span class="material-symbols-outlined text-[#ec5b13] text-4xl">settings</span>
                    SYSTEM_CONFIGURATION
                </h2>
                <p class="text-[#ec5b13] font-bold tracking-widest text-xs mt-1 uppercase opacity-80 pl-1">>> PREFERENCE_MODULE_ACTIVE</p>
            </div>
            <div class="hidden md:flex gap-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                <span>_sys_ver: 2.4.0</span>
                <span>_integrity: 100%</span>
            </div>
        </header>

        <div class="p-10 relative">
            <!-- Background Grid -->
            <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

            <div class="max-w-[800px] space-y-12 relative z-10 pb-20">
                <!-- Appearance Section -->
                <section class="space-y-6">
                    <div class="flex items-center gap-3 border-b border-[#2a3441] pb-2">
                        <span class="material-symbols-outlined text-[#ec5b13]">palette</span>
                        <h3 class="text-xl font-black text-white uppercase tracking-tight">INTERFACE_PROTOCOLS</h3>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- Toggle Item -->
                        <div class="bg-[#0c0e12] p-6 rounded border border-[#2a3441] flex items-center justify-between group hover:border-[#ec5b13] transition-colors shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
                            <div class="flex flex-col gap-1">
                                <p class="text-white font-bold text-lg uppercase tracking-wide group-hover:text-[#ec5b13] transition-colors">Dark_Mode_Override</p>
                                <p class="text-slate-500 font-mono text-xs max-w-md">Force high-contrast dark theme for low-light operations.</p>
                            </div>
                            <label class="relative flex h-[24px] w-[48px] cursor-pointer items-center rounded-sm bg-[#050608] border border-[#2a3441] p-1 transition-all duration-300">
                                <input class="peer sr-only" type="checkbox" checked disabled/>
                                <span class="absolute left-0.5 top-0.5 size-[20px] bg-[#2a3441] transition-all duration-300 peer-checked:translate-x-[24px] peer-checked:bg-[#ec5b13] shadow-[0_0_10px_#ec5b13]"></span>
                            </label>
                        </div>
                        
                        <!-- Toggle Item -->
                        <div class="bg-[#0c0e12] p-6 rounded border border-[#2a3441] flex items-center justify-between group hover:border-[#ec5b13] transition-colors shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
                            <div class="flex flex-col gap-1">
                                <p class="text-white font-bold text-lg uppercase tracking-wide group-hover:text-[#ec5b13] transition-colors">Compact_View_Matrix</p>
                                <p class="text-slate-500 font-mono text-xs max-w-md">Increase information density on dashboard modules.</p>
                            </div>
                            <label class="relative flex h-[24px] w-[48px] cursor-pointer items-center rounded-sm bg-[#050608] border border-[#2a3441] p-1 transition-all duration-300 hover:border-slate-500">
                                <input class="peer sr-only" type="checkbox"/>
                                <span class="absolute left-0.5 top-0.5 size-[20px] bg-[#2a3441] transition-all duration-300 peer-checked:translate-x-[24px] peer-checked:bg-[#ec5b13] peer-checked:shadow-[0_0_10px_#ec5b13]"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Notifications Section -->
                <section class="space-y-6">
                    <div class="flex items-center gap-3 border-b border-[#2a3441] pb-2">
                            <span class="material-symbols-outlined text-[#ec5b13]">notifications</span>
                        <h3 class="text-xl font-black text-white uppercase tracking-tight">NOTIFICATION_RELAYS</h3>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="bg-[#0c0e12] p-6 rounded border border-[#2a3441] flex items-center justify-between group hover:border-[#ec5b13] transition-colors shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
                            <div class="flex flex-col gap-1">
                                <p class="text-white font-bold text-lg uppercase tracking-wide group-hover:text-[#ec5b13] transition-colors">Daily_Status_Ping</p>
                                <p class="text-slate-500 font-mono text-xs max-w-md">Receive morning briefings on active directives.</p>
                            </div>
                            <label class="relative flex h-[24px] w-[48px] cursor-pointer items-center rounded-sm bg-[#050608] border border-[#2a3441] p-1 transition-all duration-300 hover:border-slate-500">
                                <input class="peer sr-only" type="checkbox" checked/>
                                <span class="absolute left-0.5 top-0.5 size-[20px] bg-[#2a3441] transition-all duration-300 peer-checked:translate-x-[24px] peer-checked:bg-[#ec5b13] peer-checked:shadow-[0_0_10px_#ec5b13]"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Data Management Section -->
                    <section class="space-y-6">
                    <div class="flex items-center gap-3 border-b border-[#2a3441] pb-2">
                            <span class="material-symbols-outlined text-red-500">database</span>
                        <h3 class="text-xl font-black text-white uppercase tracking-tight">DATA_PERSISTENCE</h3>
                    </div>
                    
                    <div class="bg-[#0c0e12] p-6 rounded border border-[#2a3441] flex items-center justify-between group hover:border-red-500 transition-colors shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
                            <div class="flex flex-col gap-1">
                            <p class="text-white font-bold text-lg uppercase tracking-wide group-hover:text-red-500 transition-colors">Purge_Local_Cache</p>
                            <p class="text-slate-500 font-mono text-xs max-w-md">Clear all locally stored session data. Irreversible.</p>
                        </div>
                        <button class="px-6 py-2 border border-red-900 bg-red-500/10 text-red-500 font-bold uppercase text-xs hover:bg-red-500 hover:text-white transition-all rounded-sm tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            EXECUTE
                        </button>
                    </div>
                    </section>
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
export class SettingsComponent { }
