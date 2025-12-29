import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/services/auth.service"


export const RoleGuard: CanActivateFn = async(route) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    try {
        const userRole = await authService.getUserRole();
        const allowedRoles = route.data?.['roles'] as string[];

        if (!allowedRoles || allowedRoles.includes(userRole)) {
            return true;
        }

        // Rol no permitido -> redirección
        router.navigate(['/dashboard']);
        return false;
    } catch (error) {
        router.navigate(['/login']);
        return false;
    }
}