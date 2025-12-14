import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "@core/services/auth.service";

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    standalone: true,
    styleUrls: ['./auth.component.scss'],
    imports: [FormsModule, CommonModule]
})

export class AuthComponent {
    // Campos para hacer login
    email: string = '';
    password: string = '';

    // Tabs de estado
    userType: 'user' | 'worker' = 'user';
    authTab: 'login' | 'register' = 'login';

    // Campos para poder registrarse
    regFullName: string = '';
    regEmail: string = '';
    regPhone: string = '';
    regTypeDocument: string = '';
    regNumberDocument: string = '';
    regPassword: string = '';

    constructor(private router: Router, private authService: AuthService) {}

    handleUserLogin(event: Event): void {
        event.preventDefault();
        this.router.navigate(['/dashboard/user']);
    }

    handleWorkerLogin(event: Event): void {
        event.preventDefault();
        const role = 'admin';
        this.router.navigate([`/dashboard/${role}`]);
    }

    async handleRegister(event: Event): Promise<void> {
        event.preventDefault();

        try {
            await this.authService.registerUser({
                fullName: this.regFullName,
                email: this.regEmail,
                phone: this.regPhone,
                password: this.regPassword,
                typeDocument: this.regTypeDocument,
                numberDocument: this.regNumberDocument
            });

            alert('Registro exitoso. Revisa tu correo para confirmar.');

            this.authTab = 'login';

            this.regFullName = '';
            this.regEmail = '';
            this.regPhone = '';
            this.regTypeDocument = '';
            this.regNumberDocument = '';
            this.regPassword = '';

        } catch (error: any) {
            alert(error.message || 'Error en el registro');
        }
    }

    switchToRegister(): void {
        this.authTab = 'register';
    }

    switchToLogin(): void {
        this.authTab = 'login';
    }

    goHome(): void {
        this.router.navigate(['/']);
    }

}