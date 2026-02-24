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
        path: 'edit/:id',
        loadComponent: () => import('./features/add-habit/add-habit.component').then(m => m.AddHabitComponent)
    },
    {
        path: 'statistics',
        loadComponent: () => import('./features/statistics/statistics.component').then(m => m.StatisticsComponent)
    },
    {
        path: 'habits',
        redirectTo: 'statistics',
        pathMatch: 'full'
    },
    {
        path: 'details/:id',
        loadComponent: () => import('./features/habit-details/habit-details.component').then(m => m.HabitDetailsComponent)
    },
    {
        path: 'track/:id',
        loadComponent: () => import('./features/daily-habit-tracker/daily-habit-tracker.component').then(m => m.DailyHabitTrackerComponent)
    },
    {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
    },
    {
        path: 'planner',
        loadComponent: () => import('./features/planner/planner.component').then(m => m.PlannerComponent)
    },
    {
        path: 'systems',
        loadComponent: () => import('./features/systems/system-manager/system-manager.component').then(m => m.SystemManagerComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
