import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-navigation-overlay',
    standalone: true,
    imports: [RouterLink, CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div *ngIf="user$ | async" class="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2 font-body">
        @if (isOpen()) {
            <div class="bg-charcoal text-white p-4 rounded-xl shadow-gentle mb-3 flex flex-col gap-2 min-w-[200px] transition-all">
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
            class="w-14 h-14 bg-primary text-white flex items-center justify-center hover:bg-primary-light transition-all shadow-gentle rounded-full group active:scale-95"
            [class.bg-primary-light]="isOpen()">
            <span class="material-symbols-outlined text-2xl transition-transform duration-300" [class.rotate-45]="isOpen()">
                {{ isOpen() ? 'close' : 'menu' }}
            </span>
        </button>
    </div>
  `
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
        this.toggleOpen();
        this.authService.logout();
    }
}