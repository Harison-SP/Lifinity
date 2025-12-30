import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'add',
        loadComponent: () => import('./features/add-habit/add-habit.component').then(m => m.AddHabitComponent)
    },
    {
        path: 'statistics',
        loadComponent: () => import('./features/statistics/statistics.component').then(m => m.StatisticsComponent)
    },
    {
        path: 'details/:id',
        loadComponent: () => import('./features/habit-details/habit-details.component').then(m => m.HabitDetailsComponent)
    },
    {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
