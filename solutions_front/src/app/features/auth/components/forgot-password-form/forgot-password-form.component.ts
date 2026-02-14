import { Component, EventEmitter, Input, Output, ChangeDetectorRef, OnDestroy, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { getCognitoErrorMessage } from '@core/utils/cognito-error-handler';

@Component({
    selector: 'app-forgot-password-form',
    templateUrl: './forgot-password-form.component.html',
    standalone: true,
    styleUrls: ['./forgot-password-form.component.scss'],
    imports: [FormsModule, CommonModule, IconComponent]
})
export class ForgotPasswordFormComponent implements OnDestroy, AfterViewInit {
    @Input() initialEmail = '';
    @Output() switchTab = new EventEmitter<string>();
    @Output() emailForLogin = new EventEmitter<string>();

    @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

    forgotEmail = '';
    codeDigits: string[] = ['', '', '', '', '', ''];
    forgotNewPassword = '';
    forgotConfirmPassword = '';
    forgotStep: 'email' | 'code' | 'password' = 'email';

    forgotEmailError = '';
    forgotCodeError = '';
    forgotNewPasswordError = '';
    forgotConfirmPasswordError = '';

    isLoading = false;
    showNewPassword = false;
    showConfirmPassword = false;

    resendCountdown = 0;
    private resendTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private authService: AuthService,
        private toast: ToastService,
        private cdr: ChangeDetectorRef
    ) {}

    ngAfterViewInit(): void {
        this.focusFirstInput();
    }

    ngOnChanges(): void {
        if (this.initialEmail) {
            this.forgotEmail = this.initialEmail;
        }
    }

    ngOnDestroy(): void {
        this.clearResendTimer();
    }

    get currentStepIndex(): number {
        switch (this.forgotStep) {
            case 'email': return 0;
            case 'code': return 1;
            case 'password': return 2;
            default: return 0;
        }
    }

    get codeString(): string {
        return this.codeDigits.join('');
    }

    get passwordStrength(): { level: number; label: string; color: string } {
        const password = this.forgotNewPassword;
        if (!password) return { level: 0, label: '', color: '' };

        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { level: score, label: 'Débil', color: 'weak' };
        if (score <= 3) return { level: score, label: 'Media', color: 'medium' };
        if (score <= 4) return { level: score, label: 'Fuerte', color: 'strong' };
        return { level: score, label: 'Muy fuerte', color: 'very-strong' };
    }

    steps = [
        { label: 'Correo', icon: 'mail' },
        { label: 'Código', icon: 'shield' },
        { label: 'Nueva Contraseña', icon: 'lock' }
    ];

    // Code input handling
    onCodeInput(event: Event, index: number): void {
        const input = event.target as HTMLInputElement;
        const value = input.value;

        // Only allow digits
        if (value && !/^\d$/.test(value)) {
            input.value = '';
            this.codeDigits[index] = '';
            return;
        }

        this.codeDigits[index] = value;

        // Auto-focus next input
        if (value && index < 5) {
            const inputs = this.codeInputs.toArray();
            inputs[index + 1]?.nativeElement.focus();
        }

        this.forgotCodeError = '';
    }

    onCodeKeydown(event: KeyboardEvent, index: number): void {
        if (event.key === 'Backspace' && !this.codeDigits[index] && index > 0) {
            const inputs = this.codeInputs.toArray();
            inputs[index - 1]?.nativeElement.focus();
        }
    }

    onCodePaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text') || '';
        const digits = pastedData.replace(/\D/g, '').slice(0, 6);

        for (let i = 0; i < 6; i++) {
            this.codeDigits[i] = digits[i] || '';
        }

        // Focus last filled or next empty
        const inputs = this.codeInputs.toArray();
        const focusIndex = Math.min(digits.length, 5);
        inputs[focusIndex]?.nativeElement.focus();

        this.forgotCodeError = '';
        this.cdr.detectChanges();
    }

    private focusFirstInput(): void {
        setTimeout(() => {
            if (this.forgotStep === 'code') {
                const inputs = this.codeInputs?.toArray();
                inputs?.[0]?.nativeElement.focus();
            }
        }, 100);
    }

    private validateEmail(email: string): string {
        if (!email || email.trim() === '') return 'El correo electrónico es obligatorio';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Por favor ingresa un correo electrónico válido';
        return '';
    }

    private validatePassword(password: string): string {
        if (!password || password.trim() === '') return 'La contraseña es obligatoria';
        if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
        if (!/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula';
        if (!/[a-z]/.test(password)) return 'La contraseña debe contener al menos una letra minúscula';
        if (!/[0-9]/.test(password)) return 'La contraseña debe contener al menos un número';
        if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe contener al menos un carácter especial';
        return '';
    }

    private clearErrors(): void {
        this.forgotEmailError = '';
        this.forgotCodeError = '';
        this.forgotNewPasswordError = '';
        this.forgotConfirmPasswordError = '';
    }

    private startResendTimer(): void {
        this.resendCountdown = 60;
        this.resendTimer = setInterval(() => {
            this.resendCountdown--;
            if (this.resendCountdown <= 0) {
                this.clearResendTimer();
            }
            this.cdr.detectChanges();
        }, 1000);
    }

    private clearResendTimer(): void {
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
            this.resendTimer = null;
        }
        this.resendCountdown = 0;
    }

    // Step 1: Send code
    async handleSendCode(event: Event): Promise<void> {
        event.preventDefault();
        if (this.isLoading) return;

        this.clearErrors();
        this.forgotEmailError = this.validateEmail(this.forgotEmail);
        if (this.forgotEmailError) return;

        this.isLoading = true;
        this.cdr.detectChanges();

        try {
            await this.authService.requestPasswordReset(this.forgotEmail.trim().toLowerCase());
            this.forgotStep = 'code';
            this.startResendTimer();
            this.toast.success('Código de verificación enviado a tu correo electrónico.', 5000);
            this.cdr.detectChanges();
            this.focusFirstInput();
        } catch (error) {
            console.error('Error al enviar código:', error);
            this.toast.error(getCognitoErrorMessage(error));
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    // Step 2: Verify code
    async handleVerifyCode(event: Event): Promise<void> {
        event.preventDefault();
        if (this.isLoading) return;

        this.clearErrors();
        const code = this.codeString;
        if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
            this.forgotCodeError = 'El código debe ser de 6 dígitos';
            return;
        }

        // Move to password step (code will be verified on final submit)
        this.forgotStep = 'password';
        this.cdr.detectChanges();
    }

    // Step 3: Set new password
    async handleSetPassword(event: Event): Promise<void> {
        event.preventDefault();
        if (this.isLoading) return;

        this.clearErrors();
        this.forgotNewPasswordError = this.validatePassword(this.forgotNewPassword);

        if (!this.forgotConfirmPassword) {
            this.forgotConfirmPasswordError = 'Debes confirmar la contraseña';
        } else if (this.forgotNewPassword !== this.forgotConfirmPassword) {
            this.forgotConfirmPasswordError = 'Las contraseñas no coinciden';
        }

        if (this.forgotNewPasswordError || this.forgotConfirmPasswordError) return;

        this.isLoading = true;
        this.cdr.detectChanges();

        try {
            await this.authService.confirmPasswordReset(
                this.forgotEmail.trim().toLowerCase(),
                this.codeString,
                this.forgotNewPassword
            );

            this.toast.success('¡Contraseña cambiada exitosamente! Ya puedes iniciar sesión.', 3000);

            const emailToRemember = this.forgotEmail.trim().toLowerCase();

            // Clear fields
            this.forgotEmail = '';
            this.codeDigits = ['', '', '', '', '', ''];
            this.forgotNewPassword = '';
            this.forgotConfirmPassword = '';
            this.forgotStep = 'email';
            this.clearResendTimer();

            setTimeout(() => {
                this.emailForLogin.emit(emailToRemember);
                this.switchTab.emit('login');
            }, 1000);
        } catch (error) {
            console.error('Error al confirmar contraseña:', error);
            this.toast.error(getCognitoErrorMessage(error));
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    async handleResendCode(): Promise<void> {
        if (this.resendCountdown > 0 || this.isLoading) return;

        this.isLoading = true;
        this.cdr.detectChanges();

        try {
            await this.authService.requestPasswordReset(this.forgotEmail.trim().toLowerCase());
            this.startResendTimer();
            this.codeDigits = ['', '', '', '', '', ''];
            this.toast.success('Código reenviado exitosamente. Revisa tu correo electrónico.');
            this.focusFirstInput();
        } catch (error) {
            console.error('Error al reenviar código:', error);
            this.toast.error(getCognitoErrorMessage(error));
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    toggleNewPasswordVisibility(): void {
        this.showNewPassword = !this.showNewPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    goBackStep(): void {
        if (this.isLoading) return;
        if (this.forgotStep === 'password') {
            this.forgotStep = 'code';
            this.cdr.detectChanges();
            this.focusFirstInput();
        } else if (this.forgotStep === 'code') {
            this.forgotStep = 'email';
            this.cdr.detectChanges();
        }
    }

    onSwitchToLogin(): void {
        if (this.isLoading) return;
        this.clearResendTimer();
        this.switchTab.emit('login');
    }
}
