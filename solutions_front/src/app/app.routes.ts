import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },

    // Auth
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/auth.component').then(m => m.AuthComponent),
    },

    // Dashboard (shell)
    {
        path: 'dashboard',
        /**
         * Lazy loads the dashboard routes
         * @returns {Promise<Routes[]>} The dashboard routes
         */
        loadChildren: () =>
            import('./features/dashboard/shell/dashboard.routes')
                .then(m => m.DASHBOARD_ROUTES),
    }
    
];
