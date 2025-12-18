import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

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
    templateUrl: './secretary-dashboard.component.html',
    styleUrls: ['./secretary-dashboard.component.scss'],
    imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class SecretaryDashboardComponent {
    activeTab: string = 'create-guide';

    trackingSearch: string = '';
    selectedGuide: string = '';

    guideForm: FormGroup;

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

    dailyStats: DailyStats[] = [
        { day: 'Lunes', created: 18, processed: 16 },
        { day: 'Martes', created: 22, processed: 20 },
        { day: 'Miércoles', created: 15, processed: 15 },
        { day: 'Jueves', created: 28, processed: 25 },
        { day: 'Viernes', created: 24, processed: 20 }
    ];

    constructor(private fb: FormBuilder){
        this.guideForm = this.fb.group({
            senderName: ['', Validators.required],
            senderDoc: [''],
            senderPhone:['', Validators.required],
            senderEmail: ['', Validators.email],
            senderAddress: ['', Validators.required],
            senderCity: ['', Validators.required],
            receiverName: ['', Validators.required],
            receiverDoc: [''],
            receiverPhone: ['', Validators.required],
            receiverEmail: ['', Validators.email],
            receiverAddress: ['', Validators.required],
            receiverCity: ['', Validators.required],
            serviceType: ['', Validators.required],
            weight: ['', Validators.required],
            declaredValue: ['', Validators.required],
            pieces: [1],
            dimensiones: ['', Validators.required],
            priority: ['normal'],
            insurance: ['no'],
            content: [''],
            observations: ['']
        });
    }

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    handleCreateGuide(): void {
        if (this.guideForm.valid) {
            console.log('Creating guide:', this.guideForm.value);
            // Aqui logica para crear guia
            alert('Guía creada exitosamente.');
            this.guideForm.reset();
        }
    }

    handleUpdateStatus(guideId: string, newStatus: string) {
        console.log(`Updating guide ${guideId} to status: ${newStatus}`);
        const guide = this.guides.find(g => g.id === guideId);
        if (guide) {
            guide.status = newStatus;
        }
    }

    handleSearchTracking():  void {
        console.log('Searching tracking:', this.trackingSearch);
        // Aqui logica de busqueda
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
        // Logica para editar guia
    }

    viewDetails(guideId: string): void {
        console.log('Viewing details: ', guideId);
    }
}