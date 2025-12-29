import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { GuideService, CreateGuideResponse } from "@core/services/guide.service";
import { AuthService } from "@core/services/auth.service";

interface Guide {
    id: string;
    status: string;
    destination: string;
    sender: string;
    receiver: string;
    value: string;
    created: string;
}

interface DailyStats {
    day: string;
    created: number;
    processed: number;
}

@Component({
    selector: 'app-secretary-dashboard',
    standalone: true,
    templateUrl: './secretary-dashboard.page.html',
    styleUrls: ['./secretary-dashboard.page.scss'],
    imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class SecretaryDashboardPage implements OnInit {
    activeTab: string = 'create-guide';
    trackingSearch: string = '';
    selectedGuide: string = '';
    guideForm: FormGroup;
    isSubmitting: boolean = false;
    currentUserId: string = '';

    guides: Guide[] = [
        { 
            id: 'EE123456789', 
            status: 'En oficina', 
            destination: 'Medellín',
            sender: 'Juan Pérez',
            receiver: 'María López',
            created: 'Hoy 09:30',
            value: '$25,000'
        },
        { 
            id: 'EE987654321', 
            status: 'En tránsito', 
            destination: 'Cali',
            sender: 'Ana García', 
            receiver: 'Carlos Ruiz',
            created: 'Ayer 16:45',
            value: '$45,000'
        },
        { 
            id: 'EE456789123', 
            status: 'Pendiente', 
            destination: 'Barranquilla',
            sender: 'Luis Martín',
            receiver: 'Sofia Cruz',
            created: 'Hoy 11:15',
            value: '$15,000'
        }
    ];

    cities: string[] = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'];
    serviceTypes: string[] = ['Contado', 'Contra Entrega', 'Crédito'];
    priorities: string[] = ['Normal', 'Express', 'Urgente'];
    insuranceOptions: string[] = ['No', 'Básico', 'Completo'];
    statuses: string[] = ['Pendiente', 'En oficina', 'En tránsito', 'En reparto', 'Entregado'];
    documentTypes: string[] = ['CC', 'CE', 'NIT', 'TI', 'PAS'];

    dailyStats: DailyStats[] = [
        { day: 'Lunes', created: 18, processed: 16 },
        { day: 'Martes', created: 22, processed: 20 },
        { day: 'Miércoles', created: 15, processed: 15 },
        { day: 'Jueves', created: 28, processed: 25 },
        { day: 'Viernes', created: 24, processed: 20 }
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private guideService: GuideService,
        private authService: AuthService
    ){
        this.guideForm = this.fb.group({
            // Remitente
            senderName: ['', Validators.required],
            senderDocType: ['CC', Validators.required],
            senderDoc: ['', Validators.required],
            senderPhone: ['', Validators.required],
            senderEmail: ['', Validators.email],
            senderAddress: ['', Validators.required],
            senderCity: ['', Validators.required],
            
            // Destinatario
            receiverName: ['', Validators.required],
            receiverDocType: ['CC', Validators.required],
            receiverDoc: ['', Validators.required],
            receiverPhone: ['', Validators.required],
            receiverEmail: ['', Validators.email],
            receiverAddress: ['', Validators.required],
            receiverCity: ['', Validators.required],
            
            // Paquete
            serviceType: ['Contado', Validators.required],
            weight: ['', [Validators.required, Validators.min(0.1)]],
            declaredValue: ['', [Validators.required, Validators.min(0)]],
            pieces: [1, [Validators.required, Validators.min(1)]],
            dimensions: ['20x15x10'],
            priority: ['normal'],
            insurance: ['no'],
            content: [''],
            observations: ['']
        });
    }

    ngOnInit(): void {
        this.loadCurrentUser();
    }

    /**
     * Carga el ID del usuario actual
     */
    private loadCurrentUser(): void {
        // TODO: Obtener el ID del usuario desde el token o servicio de auth
        // Por ahora usamos un valor de ejemplo
        const idToken = sessionStorage.getItem('idToken');
        if (idToken) {
            try {
                const payload = JSON.parse(atob(idToken.split('.')[1]));
                this.currentUserId = payload.sub || payload['cognito:username'];
            } catch (error) {
                console.error('Error al decodificar token:', error);
                this.currentUserId = 'd4f8f468-d051-70f3-7d8a-8095ee4b832c'; // Fallback
            }
        }
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    /**
     * Maneja la creación de una nueva guía
     */
    async handleCreateGuide(): Promise<void> {
        if (!this.guideForm.valid) {
            this.markFormGroupTouched(this.guideForm);
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;

        try {
            // Construir el request
            const guideRequest = this.guideService.buildGuideRequest(
                this.guideForm.value,
                this.currentUserId
            );

            console.log('Enviando guía:', guideRequest);

            // Llamar al servicio
            const response: CreateGuideResponse = await this.guideService.createGuide(guideRequest);

            console.log('Respuesta del servidor:', response);

            // Mostrar mensaje de éxito
            alert(`¡Guía creada exitosamente!
            
Número de guía: ${response.guide_number}
ID: ${response.guide_id}

El PDF se descargará automáticamente.`);

            // Descargar el PDF
            if (response.pdf_url) {
                await this.guideService.downloadGuidePDF(response.pdf_url);
            }

            // Limpiar el formulario
            this.guideForm.reset({
                senderDocType: 'CC',
                receiverDocType: 'CC',
                serviceType: 'Contado',
                pieces: 1,
                dimensions: '20x15x10',
                priority: 'normal',
                insurance: 'no'
            });

            // Cambiar a la pestaña de gestión de guías
            this.setActiveTab('manage-guides');

            // TODO: Recargar la lista de guías

        } catch (error: any) {
            console.error('Error al crear la guía:', error);
            
            let errorMessage = 'Error al crear la guía. Por favor intente nuevamente.';
            
            if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        } finally {
            this.isSubmitting = false;
        }
    }

    /**
     * Marca todos los controles del formulario como touched para mostrar errores
     */
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    async handleUpdateStatus(guideId: string, newStatus: string): Promise<void> {
        if (!newStatus) {
            return;
        }

        try {
            const numericId = parseInt(guideId.replace(/\D/g, ''));
            await this.guideService.updateGuideStatus(numericId, newStatus);
            
            // Actualizar la guía en la lista local
            const guide = this.guides.find(g => g.id === guideId);
            if (guide) {
                guide.status = newStatus;
            }

            alert(`Estado actualizado correctamente a: ${newStatus}`);
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Error al actualizar el estado de la guía');
        }
    }

    handleSearchTracking(): void {
        console.log('Searching tracking:', this.trackingSearch);
        // TODO: Implementar búsqueda real
    }

    getStatusBadgeClass(status: string): string {
        switch(status) {
            case 'Entregado':
                return 'badge-success';
            case 'En tránsito':
            case 'En oficina':
                return 'badge-secondary';
            case 'En reparto':
                return 'badge-default';
            case 'Pendiente':
                return 'badge-warning';
            default:
                return 'badge-default';
        }
    }

    editGuide(guideId: string): void {
        console.log('Editing guide: ', guideId);
        // TODO: Implementar edición
    }

    viewDetails(guideId: string): void {
        console.log('Viewing details: ', guideId);
        // TODO: Implementar vista de detalles
    }

    handleLogout(): void {
        sessionStorage.clear();
        this.router.navigate(['/auth']);
    }

    /**
     * Verifica si un campo específico tiene errores y ha sido touched
     */
    hasError(fieldName: string): boolean {
        const field = this.guideForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    /**
     * Obtiene el mensaje de error para un campo específico
     */
    getErrorMessage(fieldName: string): string {
        const field = this.guideForm.get(fieldName);
        
        if (field?.hasError('required')) {
            return 'Este campo es requerido';
        }
        
        if (field?.hasError('email')) {
            return 'Ingrese un email válido';
        }
        
        if (field?.hasError('min')) {
            return 'El valor debe ser mayor a 0';
        }
        
        return '';
    }
}