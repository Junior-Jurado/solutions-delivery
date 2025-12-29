import { Routes } from '@angular/router';

export const SECRETARY_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/secretary-dashboard.page').then(m => m.SecretaryDashboardPage)
    }
];