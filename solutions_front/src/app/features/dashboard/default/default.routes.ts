import { Routes } from "@angular/router";

export const DEFAULT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/dashboard-default.page').then(m => m.DashboardDefaultPage)
    }
]