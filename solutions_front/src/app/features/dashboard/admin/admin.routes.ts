import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/admin-dashboard.page').then(m => m.AdminDashboardPage)
    }
];
