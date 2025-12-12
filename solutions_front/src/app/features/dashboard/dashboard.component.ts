import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
@Component({
    selector: 'app-dashboard',
    standalone: true,
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'], 
    imports: [ FormsModule]
})
export class DashboardComponent {
    trackingNumber: string = '';

    constructor(private router: Router) {}

    handleTracking(event: Event) {
        event.preventDefault();
        this.router.navigate(['Tracking', this.trackingNumber]);
        // Aqui agregar lógica de rastreo
    }

    navigateToLogin(): void {
        this.router.navigate(['/login']);
    }
}