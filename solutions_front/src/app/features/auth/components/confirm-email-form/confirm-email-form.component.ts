import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { getCognitoErrorMessage } from '@core/utils/cognito-error-handler';

@Component({
    selector: 'app-confirm-email-form',
    templateUrl: './confirm-email-form.component.html',
    standalone: true,
    styleUrls: ['./confirm-email-form.component.scss'],
    imports: [FormsModule, CommonModule, IconComponent]
})
export class ConfirmEmailFormComponent {
    @Input() confirmEmail = '';
    @Output() switchTab = new EventEmitter<string>();
    @Output() emailForLogin = new EventEmitter<string>();

    confirmCode = '';
    confirmCodeError = '';
    isLoading = false;
    isResendingCode = false;

    constructor(
        private authService: AuthService,
        private toast: ToastService,
        private cdr: ChangeDetectorRef
    ) {}

    private validateConfirmationCode(code: string): string {
        if (!code || code.trim() === '') return 'El código de confirmación es obligatorio';
        if (!/^\d{6}$/.test(code)) return 'El código debe ser de 6 dígitos';
        return '';
    }

    async handleConfirmEmail(event: Event): Promise<void> {
        event.preventDefault();

        this.confirmCodeError = this.validateConfirmationCode(this.confirmCode);
        if (this.confirmCodeError) {
            this.toast.error(this.confirmCodeError);
            return;
        }

        if (this.isLoading) return;

        this.isLoading = true;
        this.cdr.detectChanges();

        try {
            await this.authService.confirmUser(this.confirmEmail, this.confirmCode.trim());

            this.toast.success('¡Correo confirmado exitosamente! Ya puedes iniciar sesión.', 3000);

            const emailToRemember = this.confirmEmail;
            this.confirmCode = '';

            setTimeout(() => {
                this.emailForLogin.emit(emailToRemember);
                this.switchTab.emit('login');
            }, 1000);
        } catch (error) {
            console.error('Error en confirmación:', error);
            this.toast.error(getCognitoErrorMessage(error));
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    async handleResendCode(): Promise<void> {
        if (this.isResendingCode || this.isLoading) return;

        this.isResendingCode = true;
        this.cdr.detectChanges();

        try {
            await this.authService.resendConfirmationCode(this.confirmEmail);
            this.toast.success('Código reenviado exitosamente. Revisa tu correo electrónico.');
        } catch (error) {
            console.error('Error al reenviar código:', error);
            this.toast.error(getCognitoErrorMessage(error));
        } finally {
            this.isResendingCode = false;
            this.cdr.detectChanges();
        }
    }

    onSwitchToLogin(): void {
        if (this.isLoading) return;
        this.switchTab.emit('login');
    }
}
