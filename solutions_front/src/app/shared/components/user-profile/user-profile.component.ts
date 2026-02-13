import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';
import { UserService, UserProfile } from '@shared/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
    @Output() closeProfile = new EventEmitter<void>();
    @Output() profileUpdated = new EventEmitter<string>(); // Emite el nuevo nombre

    // Profile data
    profile: UserProfile | null = null;
    isLoading = false;

    // Edit mode
    isEditing = false;
    editFullName = '';
    editPhone = '';
    isSaving = false;

    // Password change
    passwordStep: 'idle' | 'requesting' | 'confirm' | 'confirming' = 'idle';
    verificationCode = '';
    newPassword = '';
    confirmPassword = '';

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef
    ) {}

    async ngOnInit(): Promise<void> {
        await this.loadProfile();
    }

    async loadProfile(): Promise<void> {
        this.isLoading = true;
        this.cdr.markForCheck();

        try {
            this.profile = await this.userService.getProfile();
            // Fix UTF-8 encoding
            if (this.profile.full_name) {
                this.profile.full_name = this.fixUtf8Encoding(this.profile.full_name);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.toastService.error('Error al cargar el perfil');
        } finally {
            this.isLoading = false;
            this.cdr.markForCheck();
        }
    }

    startEdit(): void {
        if (!this.profile) return;
        this.editFullName = this.profile.full_name;
        this.editPhone = this.profile.phone;
        this.isEditing = true;
        this.cdr.markForCheck();
    }

    cancelEdit(): void {
        this.isEditing = false;
        this.cdr.markForCheck();
    }

    async saveProfile(): Promise<void> {
        if (!this.editFullName.trim()) {
            this.toastService.error('El nombre es obligatorio');
            return;
        }

        this.isSaving = true;
        this.cdr.markForCheck();

        try {
            this.profile = await this.userService.updateProfile({
                full_name: this.editFullName.trim(),
                phone: this.editPhone.trim()
            });
            this.isEditing = false;
            sessionStorage.setItem('userDisplayName', this.profile.full_name);
            this.profileUpdated.emit(this.profile.full_name);
            this.toastService.success('Perfil actualizado exitosamente');
        } catch (error) {
            console.error('Error saving profile:', error);
            this.toastService.error('Error al guardar el perfil');
        } finally {
            this.isSaving = false;
            this.cdr.markForCheck();
        }
    }

    async requestPasswordChange(): Promise<void> {
        const email = this.authService.getCurrentUserEmail();
        if (!email) {
            this.toastService.error('No se pudo obtener el email del usuario');
            return;
        }

        this.passwordStep = 'requesting';
        this.cdr.markForCheck();

        try {
            await this.authService.requestPasswordReset(email);
            this.passwordStep = 'confirm';
            this.toastService.success('Código de verificación enviado a tu email');
        } catch (error) {
            console.error('Error requesting password reset:', error);
            this.passwordStep = 'idle';
            this.toastService.error('Error al enviar el código de verificación');
        }
        this.cdr.markForCheck();
    }

    async confirmPasswordChange(): Promise<void> {
        if (!this.verificationCode.trim()) {
            this.toastService.error('Ingrese el código de verificación');
            return;
        }
        if (this.newPassword.length < 8) {
            this.toastService.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            this.toastService.error('Las contraseñas no coinciden');
            return;
        }

        const email = this.authService.getCurrentUserEmail();
        if (!email) return;

        this.passwordStep = 'confirming';
        this.cdr.markForCheck();

        try {
            await this.authService.confirmPasswordReset(
                email,
                this.verificationCode.trim(),
                this.newPassword
            );
            this.passwordStep = 'idle';
            this.verificationCode = '';
            this.newPassword = '';
            this.confirmPassword = '';
            this.toastService.success('Contraseña cambiada exitosamente');
        } catch (error) {
            console.error('Error confirming password:', error);
            this.passwordStep = 'confirm';
            this.toastService.error('Error al cambiar la contraseña. Verifique el código.');
        }
        this.cdr.markForCheck();
    }

    cancelPasswordChange(): void {
        this.passwordStep = 'idle';
        this.verificationCode = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.cdr.markForCheck();
    }

    onOverlayClick(): void {
        // No cerrar si está en proceso de cambio de contraseña o editando
        if (this.passwordStep !== 'idle' || this.isEditing || this.isSaving) {
            return;
        }
        this.closeProfile.emit();
    }

    onClose(): void {
        this.closeProfile.emit();
    }

    private fixUtf8Encoding(text: string): string {
        if (!text) return text;
        try {
            if (/Ã[\x80-\xBF]/.test(text)) {
                const bytes = new Uint8Array([...text].map(c => c.charCodeAt(0)));
                return new TextDecoder('utf-8').decode(bytes);
            }
            return text;
        } catch {
            return text;
        }
    }
}
