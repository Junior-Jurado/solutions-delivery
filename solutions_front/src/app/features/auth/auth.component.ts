import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "@core/services/auth.service";
import { jwtDecode } from "jwt-decode";
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
    authTab: 'login' | 'register' | 'confirm' = 'login';

    // Campos para poder registrarse
    regFullName: string = '';
    regEmail: string = '';
    regPhone: string = '';
    regTypeDocument: string = '';
    regNumberDocument: string = '';
    regPassword: string = '';

    // Campos para confirmación
    confirmEmail: string = '';
    confirmCode: string = '';
    isResendingCode: boolean = false;
    
    // Sistema de mensajes
    message: string = '';
    messageType: 'success' | 'error' | 'info' = 'info';
    showMessage: boolean = false;

    constructor(private router: Router, private authService: AuthService) {}

    // Método para mostrar mensajes
    displayMessage(text: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000): void {
        this.message = text;
        this.messageType = type;
        this.showMessage = true;

        setTimeout(() => {
            this.showMessage = false;
        }, duration);
    }

    async handleLogin(event: Event): Promise<void> {
        event.preventDefault();
        try {

            // Login Cognito
            await this.authService.login(this.email, this.password);

            // Pedir rol al backend
            const role = await this.authService.getUserRole();

            console.log(role)

            // Navegar según rol
            this.router.navigate([`/dashboard/${role}`]);
        } catch (error: any) {
            console.error('Error en login:', error);
            this.displayMessage(
                error.message || 'Error en el login. Por favor intenta nuevamente.',
                'error'
            );
        }
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

            this.confirmEmail = this.regEmail;
            this.authTab = 'confirm';
            
            this.displayMessage(
                'Registro exitoso. Revisa tu correo para obtener el código de confirmación.',
                'success'
            );

            // Limpiar campos de registro
            this.regFullName = '';
            this.regEmail = '';
            this.regPhone = '';
            this.regTypeDocument = '';
            this.regNumberDocument = '';
            this.regPassword = '';

        } catch (error: any) {
            console.error('Error en registro:', error);
            this.displayMessage(
                error.message || 'Error en el registro. Por favor intenta nuevamente.',
                'error'
            );
        }
    }

    async handleConfirmEmail(event: Event): Promise<void> {
        event.preventDefault();

        if (!this.confirmCode) {
            this.displayMessage('Por favor ingresa el código de confirmación', 'error');
            return;
        }

        try {
            await this.authService.confirmUser(this.confirmEmail, this.confirmCode);

            // Limpiar campos y cambiar al login
            this.confirmCode = '';
            this.confirmEmail = '';
            this.authTab = 'login';

            // Mostrar mensaje de éxito
            this.displayMessage(
                '¡Correo confirmado exitosamente! Ya puedes iniciar sesión.',
                'success'
            );

        } catch (error: any) {
            console.error('Error en confirmación:', error);
            this.displayMessage(
                error.message || 'Error al confirmar el código. Verifica que sea correcto.',
                'error'
            );
        }
    }

    async handleResendCode(): Promise<void> {
        if (this.isResendingCode) return;

        this.isResendingCode = true;

        try {
            await this.authService.resendConfirmationCode(this.confirmEmail);
            this.displayMessage(
                'Código reenviado. Revisa tu correo electrónico.',
                'success'
            );
        } catch (error: any) {
            console.error('Error al reenviar código:', error);
            this.displayMessage(
                error.message || 'Error al reenviar el código',
                'error'
            );
        } finally {
            this.isResendingCode = false;
        }
    }

    switchToRegister(): void {
        this.authTab = 'register';
        this.showMessage = false;
    }

    switchToLogin(): void {
        this.authTab = 'login';
        this.showMessage = false;
    }

    goHome(): void {
        this.router.navigate(['/']);
    }

}