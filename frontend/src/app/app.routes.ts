import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'add',
        canActivate: [authGuard],
        loadComponent: () => import('./features/add-habit/add-habit.component').then(m => m.AddHabitComponent)
    },
    {
        path: 'edit/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/add-habit/add-habit.component').then(m => m.AddHabitComponent)
    },
    {
        path: 'statistics',
        canActivate: [authGuard],
        loadComponent: () => import('./features/statistics/statistics.component').then(m => m.StatisticsComponent)
    },
    {
        path: 'habits',
        redirectTo: 'statistics',
        pathMatch: 'full'
    },
    {
        path: 'details/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/habit-activity/habit-activity.component').then(m => m.HabitActivityComponent)
    },
    {
        path: 'track/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/habit-detail/habit-detail.component').then(m => m.HabitDetailComponent)
    },
    {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
    },
    {
        path: 'planner',
        canActivate: [authGuard],
        loadComponent: () => import('./features/planner/planner.component').then(m => m.PlannerComponent)
    },
    {
        path: 'systems',
        canActivate: [authGuard],
        loadComponent: () => import('./features/systems/system-manager/system-manager.component').then(m => m.SystemManagerComponent)
    },
    {
        path: 'notes',
        canActivate: [authGuard],
        loadComponent: () => import('./features/notes/note-taking.component').then(m => m.NoteTakingComponent)
    },
    {
        path: 'notes/:habitId',
        canActivate: [authGuard],
        loadComponent: () => import('./features/notes/note-taking.component').then(m => m.NoteTakingComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
