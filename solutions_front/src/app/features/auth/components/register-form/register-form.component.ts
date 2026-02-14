import { Component, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { getCognitoErrorMessage } from '@core/utils/cognito-error-handler';

@Component({
    selector: 'app-register-form',
    templateUrl: './register-form.component.html',
    standalone: true,
    styleUrls: ['./register-form.component.scss'],
    imports: [FormsModule, CommonModule]
})
export class RegisterFormComponent {
    @Output() switchTab = new EventEmitter<string>();
    @Output() emailForConfirm = new EventEmitter<string>();

    regFullName = '';
    regEmail = '';
    regPhone = '';
    regTypeDocument = '';
    regNumberDocument = '';
    regPassword = '';

    regFullNameError = '';
    regEmailError = '';
    regPhoneError = '';
    regTypeDocumentError = '';
    regNumberDocumentError = '';
    regPasswordError = '';

    isLoading = false;

    constructor(
        private authService: AuthService,
        private toast: ToastService,
        private cdr: ChangeDetectorRef
    ) {}

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

    private validateFullName(name: string): string {
        if (!name || name.trim() === '') return 'El nombre completo es obligatorio';
        if (name.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
        if (name.trim().split(/\s+/).length < 2) return 'Por favor ingresa tu nombre y apellido';
        return '';
    }

    private validatePhone(phone: string): string {
        if (!phone || phone.trim() === '') return '';
        const cleanPhone = phone.replace(/[\s\-()]/g, '');
        if (!/^(\+57)?[1-9][0-9]{9}$/.test(cleanPhone)) return 'Por favor ingresa un número de teléfono válido (+57 300 123 4567)';
        return '';
    }

    private validateTypeDocument(typeDoc: string): string {
        if (!typeDoc || typeDoc.trim() === '') return '';
        if (!['CC', 'CE', 'NIT', 'PP'].includes(typeDoc)) return 'Por favor selecciona un tipo de documento válido';
        return '';
    }

    private validateNumberDocument(numberDoc: string, typeDoc: string): string {
        if (!numberDoc || numberDoc.trim() === '') return '';
        if (typeDoc && !numberDoc) return 'Por favor ingresa el número de documento';
        if (!/^[0-9-]+$/.test(numberDoc)) return 'El número de documento solo puede contener números y guiones';
        if (numberDoc.length < 5) return 'El número de documento debe tener al menos 5 caracteres';
        return '';
    }

    async handleRegister(event: Event): Promise<void> {
        event.preventDefault();
        if (this.isLoading) return;

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

            const emailToConfirm = this.regEmail.trim().toLowerCase();

            this.toast.success(
                'Registro exitoso. Revisa tu correo para obtener el código de confirmación.',
                5000
            );

            this.regFullName = '';
            this.regEmail = '';
            this.regPhone = '';
            this.regTypeDocument = '';
            this.regNumberDocument = '';
            this.regPassword = '';

            this.emailForConfirm.emit(emailToConfirm);
            this.switchTab.emit('confirm');
        } catch (error) {
            console.error('Error en registro:', error);
            this.toast.error(getCognitoErrorMessage(error));
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    onSwitchToLogin(): void {
        if (this.isLoading) return;
        this.switchTab.emit('login');
    }
}
