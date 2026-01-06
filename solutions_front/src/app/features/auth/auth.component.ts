import { Component, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "@core/services/auth.service";
import { ToastService } from "@shared/services/toast.service";
import { IconComponent } from "@shared/components/icon/icon.component";


@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    standalone: true,
    styleUrls: ['./auth.component.scss'],
    imports: [
        FormsModule, 
        CommonModule,
        IconComponent
    ]
})
export class AuthComponent {
    // ==========================================
    // LOGIN FIELDS
    // ==========================================
    email: string = '';
    password: string = '';

    // ==========================================
    // REGISTER FIELDS
    // ==========================================
    regFullName: string = '';
    regEmail: string = '';
    regPhone: string = '';
    regTypeDocument: string = '';
    regNumberDocument: string = '';
    regPassword: string = '';

    // ==========================================
    // CONFIRMATION FIELDS
    // ==========================================
    confirmEmail: string = '';
    confirmCode: string = '';

    // ==========================================
    // UI STATE
    // ==========================================
    authTab: 'login' | 'register' | 'confirm' = 'login';
    isLoading: boolean = false;
    isResendingCode: boolean = false;

    // ==========================================
    // VALIDATION ERRORS
    // ==========================================
    emailError: string = '';
    passwordError: string = '';
    regFullNameError: string = '';
    regEmailError: string = '';
    regPhoneError: string = '';
    regTypeDocumentError: string = '';
    regNumberDocumentError: string = '';
    regPasswordError: string = '';
    confirmCodeError: string = '';

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    constructor(
        private router: Router,
        private authService: AuthService,
        private toast: ToastService,
        private cdr: ChangeDetectorRef 
    ) {}

    // ==========================================
    // VALIDATION METHODS
    // ==========================================

    validateEmail(email: string): string {
        if (!email || email.trim() === '') {
            return 'El correo electrónico es obligatorio';
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Por favor ingresa un correo electrónico válido';
        }
        
        return '';
    }

    validatePassword(password: string): string {
        if (!password || password.trim() === '') {
            return 'La contraseña es obligatoria';
        }
        
        if (password.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres';
        }
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
        
        if (!hasUpperCase) {
            return 'La contraseña debe contener al menos una letra mayúscula';
        }
        
        if (!hasLowerCase) {
            return 'La contraseña debe contener al menos una letra minúscula';
        }
        
        if (!hasNumber) {
            return 'La contraseña debe contener al menos un número';
        }
        
        if (!hasSpecialChar) {
            return 'La contraseña debe contener al menos un carácter especial';
        }
        
        return '';
    }

    validateFullName(name: string): string {
        if (!name || name.trim() === '') {
            return 'El nombre completo es obligatorio';
        }
        
        if (name.trim().length < 3) {
            return 'El nombre debe tener al menos 3 caracteres';
        }
        
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length < 2) {
            return 'Por favor ingresa tu nombre y apellido';
        }
        
        return '';
    }

    validatePhone(phone: string): string {
        if (!phone || phone.trim() === '') {
            return ''; // Opcional
        }
        
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^(\+57)?[1-9][0-9]{9}$/;
        
        if (!phoneRegex.test(cleanPhone)) {
            return 'Por favor ingresa un número de teléfono válido (+57 300 123 4567)';
        }
        
        return '';
    }

    validateTypeDocument(typeDoc: string): string {
        if (!typeDoc || typeDoc.trim() === '') {
            return ''; // Opcional
        }
        
        const validTypes = ['CC', 'CE', 'NIT', 'PP'];
        if (!validTypes.includes(typeDoc)) {
            return 'Por favor selecciona un tipo de documento válido';
        }
        
        return '';
    }

    validateNumberDocument(numberDoc: string, typeDoc: string): string {
        if (!numberDoc || numberDoc.trim() === '') {
            return ''; // Opcional si no hay tipo
        }
        
        if (typeDoc && !numberDoc) {
            return 'Por favor ingresa el número de documento';
        }
        
        const docRegex = /^[0-9\-]+$/;
        if (!docRegex.test(numberDoc)) {
            return 'El número de documento solo puede contener números y guiones';
        }
        
        if (numberDoc.length < 5) {
            return 'El número de documento debe tener al menos 5 caracteres';
        }
        
        return '';
    }

    validateConfirmationCode(code: string): string {
        if (!code || code.trim() === '') {
            return 'El código de confirmación es obligatorio';
        }
        
        if (!/^\d{6}$/.test(code)) {
            return 'El código debe ser de 6 dígitos';
        }
        
        return '';
    }

    // ==========================================
    // CLEAR ERRORS
    // ==========================================

    clearLoginErrors(): void {
        this.emailError = '';
        this.passwordError = '';
    }

    clearRegisterErrors(): void {
        this.regFullNameError = '';
        this.regEmailError = '';
        this.regPhoneError = '';
        this.regTypeDocumentError = '';
        this.regNumberDocumentError = '';
        this.regPasswordError = '';
    }

    clearConfirmErrors(): void {
        this.confirmCodeError = '';
    }

    // ==========================================
    // ERROR HANDLER
    // ==========================================

    private getErrorMessage(error: any): string {
        // Errores HTTP del backend
        if (error?.status) {
            switch (error.status) {
                case 404:
                    return 'Tu cuenta no está registrada en el sistema. Contacta al administrador.';
                case 401:
                    return 'Correo o contraseña incorrectos.';
                case 403:
                    return 'No tienes permisos para acceder al sistema.';
                case 500:
                    return 'Error interno del servidor. Intenta más tarde.';
                default:
                    return 'Error inesperado. Intenta nuevamente.';
            }
        }

        const errorMessage = error?.message || error?.toString() || '';
        
        // Errores específicos de Cognito
        if (errorMessage.includes('Incorrect username or password')) {
            return 'Correo o contraseña incorrectos. Por favor verifica tus credenciales.';
        }
        
        if (errorMessage.includes('User does not exist')) {
            return 'No existe una cuenta con este correo electrónico.';
        }

        if (errorMessage.includes('User already exists') || 
            errorMessage.includes('An account with the given email already exists')) {
            return 'Ya existe una cuenta con este correo electrónico.';
        }
        
        if (errorMessage.includes('User is not confirmed')) {
            return 'Tu cuenta no ha sido confirmada. Por favor revisa tu correo.';
        }
        
        if (errorMessage.includes('Password attempts exceeded')) {
            return 'Demasiados intentos fallidos. Intenta de nuevo más tarde.';
        }
        
        if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch')) {
            return 'Error de conexión. Verifica tu conexión a internet.';
        }

        if (errorMessage.includes('Username should be an email') || 
            errorMessage.includes('Invalid email')) {
            return 'Por favor ingresa un correo electrónico válido.';
        }

        if (errorMessage.includes('Password did not conform')) {
            return 'La contraseña no cumple con los requisitos mínimos de seguridad.';
        }

        if (errorMessage.includes('Invalid verification code') || 
            errorMessage.includes('Code mismatch')) {
            return 'Código de verificación inválido. Por favor verifica el código.';
        }

        if (errorMessage.includes('Attempt limit exceeded')) {
            return 'Has excedido el límite de intentos. Solicita un nuevo código.';
        }
        
        return errorMessage || 'Ha ocurrido un error. Por favor intenta nuevamente.';
    }

    // ==========================================
    // LOGIN HANDLER
    // ==========================================

    async handleLogin(event: Event): Promise<void> {
        event.preventDefault();

        if (this.isLoading) return;

        // Validar campos
        this.clearLoginErrors();
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

        } catch (error: any) {
            console.error('Error en login:', error);
            const friendlyMessage = this.getErrorMessage(error);
            this.toast.error(friendlyMessage);
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    // ==========================================
    // REGISTER HANDLER
    // ==========================================

    async handleRegister(event: Event): Promise<void> {
        event.preventDefault();

        if (this.isLoading) return;

        // Validar campos
        this.clearRegisterErrors();
        this.regFullNameError = this.validateFullName(this.regFullName);
        this.regEmailError = this.validateEmail(this.regEmail);
        this.regPhoneError = this.validatePhone(this.regPhone);
        this.regTypeDocumentError = this.validateTypeDocument(this.regTypeDocument);
        this.regNumberDocumentError = this.validateNumberDocument(this.regNumberDocument, this.regTypeDocument);
        this.regPasswordError = this.validatePassword(this.regPassword);

        if (this.regTypeDocument && !this.regNumberDocument) {
            this.regNumberDocumentError = 'Por favor ingresa el número de documento';
        }

        if (this.regFullNameError || this.regEmailError || this.regPhoneError || 
            this.regTypeDocumentError || this.regNumberDocumentError || this.regPasswordError) {
            this.toast.error('Por favor corrige los errores en el formulario');
            return;
        }

        this.isLoading = true;
        this.cdr.detectChanges();

        try {
            await this.authService.registerUser({
                fullName: this.regFullName.trim(),
                email: this.regEmail.trim().toLowerCase(),
                phone: this.regPhone.trim(),
                password: this.regPassword,
                typeDocument: this.regTypeDocument,
                numberDocument: this.regNumberDocument.trim()
            });

            this.confirmEmail = this.regEmail.trim().toLowerCase();
            this.authTab = 'confirm';
            this.cdr.detectChanges(); 
            
            this.toast.success(
                'Registro exitoso. Revisa tu correo para obtener el código de confirmación.',
                5000
            );

            // Limpiar campos
            this.regFullName = '';
            this.regEmail = '';
            this.regPhone = '';
            this.regTypeDocument = '';
            this.regNumberDocument = '';
            this.regPassword = '';

        } catch (error: any) {
            console.error('Error en registro:', error);
            const friendlyMessage = this.getErrorMessage(error);
            this.toast.error(friendlyMessage);
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges(); 
        }
    }

    // ==========================================
    // CONFIRMATION HANDLER
    // ==========================================

    async handleConfirmEmail(event: Event): Promise<void> {
        event.preventDefault();

        this.clearConfirmErrors();
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

            this.toast.success(
                '¡Correo confirmado exitosamente! Ya puedes iniciar sesión.',
                3000
            );

            const emailToRemember = this.confirmEmail;
            this.confirmCode = '';
            this.confirmEmail = '';

            setTimeout(() => {
                this.authTab = 'login';
                this.email = emailToRemember;
                this.cdr.detectChanges(); 
            }, 1000);

        } catch (error: any) {
            console.error('Error en confirmación:', error);
            const friendlyMessage = this.getErrorMessage(error);
            this.toast.error(friendlyMessage);
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges(); 
        }
    }

    // ==========================================
    // RESEND CODE HANDLER
    // ==========================================

    async handleResendCode(): Promise<void> {
        if (this.isResendingCode || this.isLoading) return;

        this.isResendingCode = true;
        this.cdr.detectChanges(); 

        try {
            await this.authService.resendConfirmationCode(this.confirmEmail);
            this.toast.success('Código reenviado exitosamente. Revisa tu correo electrónico.');
        } catch (error: any) {
            console.error('Error al reenviar código:', error);
            const friendlyMessage = this.getErrorMessage(error);
            this.toast.error(friendlyMessage);
        } finally {
            this.isResendingCode = false;
            this.cdr.detectChanges(); 
        }
    }

    // ==========================================
    // TAB NAVIGATION
    // ==========================================

    switchToRegister(): void {
        if (this.isLoading) return;
        this.clearLoginErrors();
        this.authTab = 'register';
        this.cdr.detectChanges(); 
    }

    switchToLogin(): void {
        if (this.isLoading) return;
        this.clearRegisterErrors();
        this.clearConfirmErrors();
        this.authTab = 'login';
        this.cdr.detectChanges();
    }

    goHome(): void {
        if (this.isLoading) return;
        this.router.navigate(['/']);
    }
}