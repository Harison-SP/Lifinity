import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-navigation-overlay',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div *ngIf="user$ | async">
        <!-- Backdrop: only visible when desktop menu is open -->
        <div *ngIf="isOpen()" 
             (click)="toggleOpen()" 
             class="fixed inset-0 bg-charcoal/40 backdrop-blur-[2px] z-[90] transition-opacity animate-in fade-in duration-200">
        </div>

        <!-- Desktop FAB Menu (Visible on md and up) -->
        <div class="hidden md:flex fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2 font-body">
            @if (isOpen()) {
                <div class="bg-charcoal text-white p-4 rounded-xl shadow-gentle mb-3 flex flex-col gap-2 min-w-[200px] transition-all animate-in slide-in-from-bottom-2 duration-200 relative">
                    @for (link of links; track link.path) {
                        <a [routerLink]="link.path"
                           (click)="toggleOpen()"
                           class="flex items-center gap-3 p-2 hover:bg-primary/20 transition-colors font-medium cursor-pointer group text-sm rounded"
                           [class.bg-primary/20]="link.path === currentRoute()">
                            <span class="material-symbols-outlined text-primary group-hover:text-primary-light transition-colors">{{link.icon}}</span>
                            {{link.label}}
                        </a>
                    }
                    
                    <div class="h-px bg-white/10 my-1"></div>
                    
                    <a (click)="logout()"
                       class="flex items-center gap-3 p-2 hover:bg-red-500/20 text-red-100 transition-colors font-medium cursor-pointer group text-sm rounded">
                        <span class="material-symbols-outlined text-red-400 group-hover:text-red-300 transition-colors">logout</span>
                        Logout
                    </a>
                </div>
            }
            <button
                (click)="toggleOpen()"
                class="w-14 h-14 bg-primary text-white flex items-center justify-center hover:bg-primary-light transition-all shadow-gentle rounded-full group active:scale-95 relative"
                [class.bg-primary-light]="isOpen()">
                <span class="material-symbols-outlined text-2xl transition-transform duration-300" [class.rotate-45]="isOpen()">
                    {{ isOpen() ? 'close' : 'menu' }}
                </span>
            </button>
        </div>

        <!-- Mobile Add FAB (Visible on small screens) -->
        <a routerLink="/add" 
           class="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-white flex items-center justify-center hover:bg-primary-light transition-all shadow-gentle-lg rounded-2xl z-[101] active:scale-95">
            <span class="material-symbols-outlined text-3xl">add</span>
        </a>

        <!-- Mobile Bottom Navigation (Floating Pill Style - Visible on small screens) -->
        <div class="md:hidden fixed bottom-6 left-4 right-4 z-[100]">
            <nav class="bg-alabaster/95 dark:bg-dark-surface/95 backdrop-blur-md border border-sand-dark dark:border-dark-border px-2 py-2 rounded-2xl shadow-gentle-lg flex justify-between items-center max-w-md mx-auto">
                @for (link of links; track link.path) {
                    <a [routerLink]="link.path"
                       routerLinkActive="active-link"
                       [routerLinkActiveOptions]="{exact: true}"
                       class="flex flex-col items-center justify-center gap-1 flex-1 transition-all duration-300 relative group py-1">
                        
                        <div class="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 
                                    group-[.active-link]:bg-primary group-[.active-link]:text-white 
                                    text-charcoal/40 dark:text-taupe/60
                                    group-[.active-link]:shadow-soft group-[.active-link]:-translate-y-0.5">
                            <span class="material-symbols-outlined text-[24px]">{{link.icon}}</span>
                        </div>
                        
                        <span class="text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 
                                     group-[.active-link]:text-primary text-charcoal/40 dark:text-taupe/60">
                            {{link.label}}
                        </span>
                        
                        <!-- Active Dot -->
                        <div class="absolute bottom-0 w-1 h-1 rounded-full bg-primary opacity-0 group-[.active-link]:opacity-100 transition-opacity"></div>
                    </a>
                }
                
                <div class="w-px h-8 bg-sand-dark dark:bg-dark-border mx-1"></div>
                
                <button (click)="logout()" 
                        class="flex flex-col items-center justify-center gap-1 flex-1 text-red-500/60 dark:text-red-400/60 py-1">
                    <div class="w-10 h-10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-[24px]">logout</span>
                    </div>
                    <span class="text-[9px] font-bold uppercase tracking-wider">Exit</span>
                </button>
            </nav>
        </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class NavigationOverlayComponent {
    isOpen = signal(false);
    currentRoute = signal<string>('/');

    links = [
        { path: '/', label: 'Dashboard', icon: 'dashboard' },
        { path: '/planner', label: 'Planner', icon: 'calendar_month' },
        { path: '/statistics', label: 'Statistics', icon: 'insights' },
        { path: '/systems', label: 'Systems', icon: 'checklist' },
        { path: '/settings', label: 'Settings', icon: 'settings' },
    ];

    private router = inject(Router);
    private authService = inject(AuthService);

    user$ = this.authService.currentUser$;

    constructor() {
        this.router.events.subscribe(() => {
            this.currentRoute.set(this.router.url);
        });
    }

    toggleOpen() {
        this.isOpen.update(v => !v);
    }

    logout() {
        if (this.isOpen()) this.toggleOpen();
        this.authService.logout();
    }
}