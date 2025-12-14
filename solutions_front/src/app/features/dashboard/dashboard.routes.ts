import { Routes } from "@angular/router";

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        children: [

            // Dashboard por defecto (conocimiento de la empresa)
            {
                path: '',
                loadComponent: () =>
                    import('./default/dashboard-default.component').then(m => m.DashboardDefaultComponent)
            },

            // Roles
            {
                path: 'user',
                loadComponent: () =>
                    import('./user/user-dashboard.component').then(m => m.UserDashboardComponent)
            },

            // {
            //     path: 'admin',
            //     loadComponent: () =>
            //         import('./admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
            // },

            // {
            //     path: 'secretary',
            //     loadComponent: () =>
            //         import('./secretary/secretary-dashboard.component').then(m => m.SecretaryDashboardComponent)
            // },

            // {
            //     path: 'delivery',
            //     loadComponent: () =>
            //         import('./delivery/delivery-dashboard.component').then(m => m.DeliveryDashboardComponent)
            // },
            
        ]
    }
]