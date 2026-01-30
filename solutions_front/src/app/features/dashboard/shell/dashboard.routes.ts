import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard-layout.component";
import { RoleGuard } from "@core/guards/role.guard";

export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [

            // Dashboard por defecto (conocimiento de la empresa)
            {
                path: '',
                loadChildren: () =>
                    import('../default/default.routes').then(m => m.DEFAULT_ROUTES)
            },

            {
                path: 'secretary',
                canActivate: [RoleGuard],
                data: { roles: ['SECRETARY'] },
                /**
                 * Lazy loads the secretary routes
                 * @returns {Promise<Routes>} A promise containing the secretary routes
                 */
                loadChildren: () =>
                    import('../secretary/secretary.routes').then(m => m.SECRETARY_ROUTES)
            },

            // Roles
            {
                path: 'client',
                canActivate: [RoleGuard],
                data: { roles: ['CLIENT'] },
                loadComponent: () =>
                    import('../client/pages/client-dashboard.page').then(m => m.ClientDashboardPage)
            },
            {
                path: 'delivery',
                canActivate: [RoleGuard],
                data: { roles: ['DELIVERY'] },
                loadComponent: () =>
                    import('../delivery/pages/delivery-dashboard.page').then(m => m.DeliveryDashboardPage)
            },

            // {
            //     path: 'admin',
            //     loadComponent: () =>
            //         import('./admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
            // },

            

            
        ]
    }
]