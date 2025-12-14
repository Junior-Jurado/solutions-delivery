import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
@Component({
    selector: 'app-dashboard-default',
    standalone: true,
    templateUrl: './dashboard-default.component.html',
    styleUrls: ['./dashboard-default.component.scss'], 
    imports: [ FormsModule]
})
export class DashboardDefaultComponent {
    trackingNumber: string = '';

    constructor(private router: Router) {}

    handleTracking(event: Event) {
        event.preventDefault();
        this.router.navigate(['/tracking', this.trackingNumber]);
        // Aqui agregar lógica de rastreo
    }

    navigateToLogin(): void {
        this.router.navigate(['/login']);
    }
}