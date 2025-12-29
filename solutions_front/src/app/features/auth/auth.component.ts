import { Component, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "@core/services/auth.service";
import { ChangeDetectorRef } from "@angular/core";

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

    // Estado de carga
    isLoading: boolean = false;
    isResendingCode: boolean = false;
    
    // Sistema de toast
    toastMessage: string = '';
    toastType: 'success' | 'error' | 'info' = 'info';
    showToast: boolean = false;
    private toastTimeoutId: any = null;

    // Errores de validación
    emailError: string = '';
    passwordError: string = '';
    regFullNameError: string = '';
    regEmailError: string = '';
    regPhoneError: string = '';
    regTypeDocumentError: string = '';
    regNumberDocumentError: string = '';
    regPasswordError: string = '';
    confirmCodeError: string = '';

    constructor(
        private router: Router,
        private authService: AuthService,
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef
    ) {}

    // Método para mostrar Toast
    displayToast(
        text: string,
        type: 'success' | 'error' | 'info' = 'info',
        duration: number = 4000
    ): void {

        // Cancelar cualquier toast anterior
        if (this.toastTimeoutId) {
            clearTimeout(this.toastTimeoutId);
            this.toastTimeoutId = null;
        }

        this.toastMessage = text;
        this.toastType = type;
        this.showToast = true;
        this.cdr.detectChanges();

        this.toastTimeoutId = setTimeout(() => {
            this.showToast = false;
            this.cdr.detectChanges();
            this.toastTimeoutId = null;
        }, duration);
    }


    // Validaciones individuales
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
        
        // Validar requisitos de Cognito
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
        
        // Validar que contenga al menos nombre y apellido
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length < 2) {
            return 'Por favor ingresa tu nombre y apellido';
        }
        
        return '';
    }

    validatePhone(phone: string): string {
        if (!phone || phone.trim() === '') {
            return ''; // El teléfono es opcional
        }
        
        // Remover espacios y caracteres especiales para validar
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Validar formato colombiano (+57 seguido de 10 dígitos)
        const phoneRegex = /^(\+57)?[1-9][0-9]{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            return 'Por favor ingresa un número de teléfono válido (+57 300 123 4567)';
        }
        
        return '';
    }

    validateTypeDocument(typeDoc: string): string {
        if (!typeDoc || typeDoc.trim() === '') {
            return ''; // El tipo de documento es opcional
        }
        
        const validTypes = ['CC', 'CE', 'NIT', 'PP'];
        if (!validTypes.includes(typeDoc)) {
            return 'Por favor selecciona un tipo de documento válido';
        }
        
        return '';
    }

    validateNumberDocument(numberDoc: string, typeDoc: string): string {
        if (!numberDoc || numberDoc.trim() === '') {
            return ''; // El número de documento es opcional si no hay tipo
        }
        
        if (typeDoc && !numberDoc) {
            return 'Por favor ingresa el número de documento';
        }
        
        // Validar que solo contenga números y guiones
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
        
        // Cognito típicamente envía códigos de 6 dígitos
        if (!/^\d{6}$/.test(code)) {
            return 'El código debe ser de 6 dígitos';
        }
        
        return '';
    }

    // Limpiar errores
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

    // Método para obtener un mensaje de error amigable
    getErrorMessage(error: any): string {
        // ERROR HTTP (backend)
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

        // ERRORES DE COGNITO (fallback)
        const errorMessage = error?.message || error?.toString() || '';
        
        // Manejar errores específicos de Cognito
        if (errorMessage.includes('Incorrect username or password')) {
            return 'Correo o contraseña incorrectos. Por favor verifica tus credenciales.';
        }
        
        if (errorMessage.includes('User does not exist')) {
            return 'No existe una cuenta con este correo electrónico.';
        }

        if (errorMessage.includes('User already exists')) {
            return 'Usuario ya registrado. Por favor inicia sesión.';
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

        if (errorMessage.includes('Username should be an email') || errorMessage.includes('Invalid email')) {
            return 'Por favor ingresa un correo electrónico válido.';
        }

        if (errorMessage.includes('Password did not conform')) {
            return 'La contraseña no cumple con los requisitos mínimos de seguridad.';
        }

        if (errorMessage.includes('An account with the given email already exists')) {
            return 'Ya existe una cuenta con este correo electrónico.';
        }

        if (errorMessage.includes('Invalid verification code')) {
            return 'Código de verificación inválido. Por favor verifica el código.';
        }

        if (errorMessage.includes('Code mismatch')) {
            return 'El código ingresado no es correcto. Intenta nuevamente.';
        }

        if (errorMessage.includes('Attempt limit exceeded')) {
            return 'Has excedido el límite de intentos. Solicita un nuevo código.';
        }
        
        // Si no coincide con ningún error conocido, devolver el mensaje original o uno genérico
        return errorMessage || 'Ha ocurrido un error. Por favor intenta nuevamente.';
    }

    async handleLogin(event: Event): Promise<void> {
        event.preventDefault();

        if (this.isLoading) return;

        // Limpiar errores previos
        this.clearLoginErrors();

        // Validar campos
        this.emailError = this.validateEmail(this.email);
        this.passwordError = this.validatePassword(this.password);

        // Si hay errores, no continuar
        if (this.emailError || this.passwordError) {
            this.displayToast('Por favor corrige los errores en el formulario', 'error');
            return;
        }

        this.isLoading = true;

        try {
            // Login Cognito
            const { role } = await this.authService.login(this.email, this.password);

            this.displayToast('Inicio de sesión exitoso', 'success', 2000);

            

            const roleRouteMap: Record<string, string> = {
                SECRETARY: 'secretary',
                ADMIN: 'admin',
                DELIVERY: 'delivery',
                CLIENT: 'client'
            }

            const targetRoute = roleRouteMap[role] ?? '';
            // Pequeño delay para que el usuario vea el mensaje
            setTimeout(() => {
                this.ngZone.run(() => {
                    this.router.navigate(['/dashboard', targetRoute]);
                });
            }, 500);

        } catch (error: any) {
            console.error('Error en login:', error);
            const friendlyMessage = this.getErrorMessage(error);
            this.displayToast(friendlyMessage, 'error');
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    async handleRegister(event: Event): Promise<void> {
        event.preventDefault();

        if (this.isLoading) return;

        // Limpiar errores previos
        this.clearRegisterErrors();

        // Validar campos
        this.regFullNameError = this.validateFullName(this.regFullName);
        this.regEmailError = this.validateEmail(this.regEmail);
        this.regPhoneError = this.validatePhone(this.regPhone);
        this.regTypeDocumentError = this.validateTypeDocument(this.regTypeDocument);
        this.regNumberDocumentError = this.validateNumberDocument(this.regNumberDocument, this.regTypeDocument);
        this.regPasswordError = this.validatePassword(this.regPassword);

        // Validación especial: si hay tipo de documento, debe haber número
        if (this.regTypeDocument && !this.regNumberDocument) {
            this.regNumberDocumentError = 'Por favor ingresa el número de documento';
        }

        // Si hay errores, no continuar
        if (this.regFullNameError || this.regEmailError || this.regPhoneError || 
            this.regTypeDocumentError || this.regNumberDocumentError || this.regPasswordError) {
            this.displayToast('Por favor corrige los errores en el formulario', 'error');
            return;
        }

        this.isLoading = true;

        try {
            await this.authService.registerUser({
                fullName: this.regFullName.trim(),
                email: this.regEmail.trim().toLowerCase(),
                phone: this.regPhone.trim(),
                password: this.regPassword,
                typeDocument: this.regTypeDocument,
                numberDocument: this.regNumberDocument.trim()
            });

            this.ngZone.run(() => {
                this.confirmEmail = this.regEmail.trim().toLowerCase();
                this.authTab = 'confirm';
                
                this.displayToast(
                    'Registro exitoso. Revisa tu correo para obtener el código de confirmación.',
                    'success',
                    5000
                );

                // Limpiar campos de registro
                this.regFullName = '';
                this.regEmail = '';
                this.regPhone = '';
                this.regTypeDocument = '';
                this.regNumberDocument = '';
                this.regPassword = '';
            });

        } catch (error: any) {
            console.error('Error en registro:', error);
            const friendlyMessage = this.getErrorMessage(error);
            this.displayToast(friendlyMessage, 'error');
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    async handleConfirmEmail(event: Event): Promise<void> {
        event.preventDefault();

        // Limpiar errores previos
        this.clearConfirmErrors();

        // Validar código
        this.confirmCodeError = this.validateConfirmationCode(this.confirmCode);

        if (this.confirmCodeError) {
            this.displayToast(this.confirmCodeError, 'error');
            return;
        }

        if (this.isLoading) return;

        this.isLoading = true;

        try {
            await this.authService.confirmUser(this.confirmEmail, this.confirmCode.trim());

            this.displayToast(
                '¡Correo confirmado exitosamente! Ya puedes iniciar sesión.',
                'success',
                3000
            );

            // Limpiar campos
            this.confirmCode = '';
            const emailToRemember = this.confirmEmail;
            this.confirmEmail = '';

            // Cambiar a login después del mensaje y prellenar el email
            setTimeout(() => {
                this.authTab = 'login';
                this.email = emailToRemember;
                this.cdr.detectChanges();
            }, 1000);

        } catch (error: any) {
            console.error('Error en confirmación:', error);
            const friendlyMessage = this.getErrorMessage(error);
            this.displayToast(friendlyMessage, 'error');
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    async handleResendCode(): Promise<void> {
        if (this.isResendingCode || this.isLoading) return;

        this.isResendingCode = true;

        try {
            await this.authService.resendConfirmationCode(this.confirmEmail);
            this.displayToast(
                'Código reenviado exitosamente. Revisa tu correo electrónico.',
                'success'
            );
        } catch (error: any) {
            console.error('Error al reenviar código:', error);
            const friendlyMessage = this.getErrorMessage(error);
            this.displayToast(friendlyMessage, 'error');
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    switchToRegister(): void {
        if (this.isLoading) return;
        this.clearLoginErrors();
        this.authTab = 'register';
    }

    switchToLogin(): void {
        if (this.isLoading) return;
        this.clearRegisterErrors();
        this.clearConfirmErrors();
        this.authTab = 'login';
    }

    goHome(): void {
        if (this.isLoading) return;
        this.router.navigate(['/']);
    }
}