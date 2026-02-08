import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { HeaderComponent } from "../components/header/header.component";
import { HeroComponent } from "../components/hero/hero.component";
import { FeaturesComponent } from "../components/features/features.component";
import { ServicesComponent } from "../components/services/services.component";
import { CtaComponent } from "../components/cta/cta.component";
import { FooterComponent } from "../components/footer/footer.component";

@Component({
    selector: 'app-dashboard-default',
    standalone: true,
    templateUrl: './dashboard-default.page.html',
    styleUrls: ['./dashboard-default.page.scss'], 
    imports: [
        CommonModule,
        HeaderComponent,
        HeroComponent,
        FeaturesComponent,
        ServicesComponent,
        CtaComponent,
        FooterComponent
    ]
})
export class DashboardDefaultPage {
    constructor(private router: Router) {}

    navigateToLogin(): void {
        this.router.navigate(['/login']);
    }

    handleCreateAccount(): void {
        this.router.navigate(['/login'], { queryParams: { tab: 'register' } });
    }

    handleContactSales(): void {
        // Implementar lógica de contacto de ventas
        console.log('Contactar ventas');
    }
}