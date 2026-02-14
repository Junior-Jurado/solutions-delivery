import { Component, EventEmitter, Input, Output, ChangeDetectorRef, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { getCognitoErrorMessage } from '@core/utils/cognito-error-handler';

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.component.html',
    standalone: true,
    styleUrls: ['./login-form.component.scss'],
    imports: [FormsModule, CommonModule]
})
export class LoginFormComponent implements OnChanges {
    @Input() initialEmail = '';
    @Output() switchTab = new EventEmitter<string>();
    @Output() emailForForgot = new EventEmitter<string>();

    email = '';
    password = '';
    emailError = '';
    passwordError = '';
    isLoading = false;

    constructor(
        private router: Router,
        private authService: AuthService,
        private toast: ToastService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnChanges(): void {
        if (this.initialEmail) {
            this.email = this.initialEmail;
        }
    }

    private validateEmail(email: string): string {
        if (!email || email.trim() === '') {
            return 'El correo electrónico es obligatorio';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Por favor ingresa un correo electrónico válido';
        }
        return '';
    }

    private validatePassword(password: string): string {
        if (!password || password.trim() === '') {
            return 'La contraseña es obligatoria';
        }
        if (password.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres';
        }
        if (!/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula';
        if (!/[a-z]/.test(password)) return 'La contraseña debe contener al menos una letra minúscula';
        if (!/[0-9]/.test(password)) return 'La contraseña debe contener al menos un número';
        if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe contener al menos un carácter especial';
        return '';
    }

    async handleLogin(event: Event): Promise<void> {
        event.preventDefault();
        if (this.isLoading) return;

        this.emailError = '';
        this.passwordError = '';
        this.emailError = this.validateEmail(this.email);
        this.passwordError = this.validatePassword(this.password);

        if (this.emailError || this.passwordError) {
            this.toast.error('Por favor corrige los errores en el formulario');
            return;
        }

        this.isLoading = true;
        this.cdr.detectChanges();

        try {
            const { role } = await this.authService.login(this.email, this.password);
            const roleRouteMap: Record<string, string> = {
                SECRETARY: 'secretary',
                ADMIN: 'admin',
                DELIVERY: 'delivery',
                CLIENT: 'client'
            };
            const targetRoute = roleRouteMap[role] ?? 'secretary';
            this.router.navigate(['/dashboard', targetRoute]);
        } catch (error) {
            console.error('Error en login:', error);
            this.toast.error(getCognitoErrorMessage(error));
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    onSwitchToRegister(): void {
        if (this.isLoading) return;
        this.switchTab.emit('register');
    }

    onSwitchToForgot(): void {
        if (this.isLoading) return;
        this.emailForForgot.emit(this.email);
        this.switchTab.emit('forgot');
    }
}
