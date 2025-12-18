import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Delivery {
  id: string;
  address: string;
  recipient: string;
  phone: string;
  status: string;
  priority: string;
  value: string;
  instructions: string;
  estimatedTime: string;
}

interface DailyPerformance {
  day: string;
  deliveries: number;
  target: number;
  efficiency: number;
}

interface CustomerReview {
  rating: number;
  comment: string;
  client: string;
  date: string;
}

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  templateUrl: './delivery-dashboard.component.html',
  styleUrls: ['./delivery-dashboard.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class DeliveryDashboardComponent {
  activeTab: string = 'deliveries';
  otpCode: string = '';
  deliveryNotes: string = '';
  selectedDelivery: string = '';
  selectedGuide: string = '';
  issueType: string = '';
  issueDescription: string = '';
  attemptedResolution: string = '';
  packageStatus: string = 'perfect';

  deliveries: Delivery[] = [
    { 
      id: 'EE123456789', 
      address: 'Calle 123 #45-67, Chapinero, Bogotá', 
      recipient: 'María González',
      phone: '300 123 4567',
      status: 'Pendiente',
      priority: 'Normal',
      value: '$25,000',
      instructions: 'Entregar solo a la persona registrada',
      estimatedTime: '30 min'
    },
    { 
      id: 'EE987654321', 
      address: 'Carrera 89 #12-34, Zona Rosa, Bogotá', 
      recipient: 'Carlos López',
      phone: '300 987 6543',
      status: 'En ruta',
      priority: 'Express',
      value: '$45,000',
      instructions: 'Llamar antes de llegar al edificio',
      estimatedTime: '15 min'
    },
    { 
      id: 'EE456789123', 
      address: 'Av. Principal #56-78, Suba, Bogotá', 
      recipient: 'Ana Martínez',
      phone: '300 555 7890',
      status: 'Pendiente',
      priority: 'Urgente',
      value: '$15,000',
      instructions: 'Fragil - manejar con cuidado',
      estimatedTime: '45 min'
    }
  ];

  dailyPerformance: DailyPerformance[] = [
    { day: 'Lunes', deliveries: 12, target: 10, efficiency: 120 },
    { day: 'Martes', deliveries: 9, target: 10, efficiency: 90 },
    { day: 'Miércoles', deliveries: 11, target: 10, efficiency: 110 },
    { day: 'Jueves', deliveries: 15, target: 10, efficiency: 150 },
    { day: 'Viernes', deliveries: 8, target: 10, efficiency: 80 }
  ];

  customerReviews: CustomerReview[] = [
    { 
      rating: 5, 
      comment: 'Excelente servicio, muy puntual', 
      client: 'María G.',
      date: 'Hoy'
    },
    { 
      rating: 4, 
      comment: 'Buena atención, llegó en tiempo', 
      client: 'Carlos L.',
      date: 'Ayer'
    },
    { 
      rating: 5, 
      comment: 'Muy profesional y cordial', 
      client: 'Ana M.',
      date: 'Ayer'
    }
  ];

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getEnRutaDeliveries(): Delivery[] {
    return this.deliveries.filter(d => d.status === 'En ruta');
  }

  getSelectedDeliveryInfo(): Delivery | undefined {
    return this.deliveries.find(d => d.id === this.selectedDelivery);
  }

  getPriorityClass(priority: string): string {
    switch(priority) {
      case 'Urgente': return 'badge-danger';
      case 'Express': return 'badge-primary';
      default: return 'badge-secondary';
    }
  }

  getStatusClass(status: string): string {
    return status === 'En ruta' ? 'badge-primary' : 'badge-secondary';
  }

  handleConfirmDelivery(event: Event): void {
    event.preventDefault();
    console.log('Confirming delivery with OTP:', this.otpCode);
    // Aquí iría la lógica de confirmación
  }

  handleReportIssue(event: Event): void {
    event.preventDefault();
    console.log('Reporting delivery issue');
    // Aquí iría la lógica de reporte
  }

  openCamera(): void {
    console.log('Opening camera');
    // Implementar apertura de cámara
  }

  uploadFromGallery(): void {
    console.log('Uploading from gallery');
    // Implementar subida desde galería
  }

  activateSignature(): void {
    console.log('Activating signature');
    // Implementar firma digital
  }

  addPhotos(): void {
    console.log('Adding photos');
    // Implementar agregar fotos
  }

  viewMap(delivery: Delivery): void {
    console.log('Viewing map for:', delivery.id);
    // Implementar navegación al mapa
  }

  callRecipient(delivery: Delivery): void {
    console.log('Calling:', delivery.phone);
    // Implementar llamada
  }

  confirmOrStartRoute(delivery: Delivery): void {
    if (delivery.status === 'En ruta') {
      console.log('Confirming delivery:', delivery.id);
      this.setActiveTab('confirm');
      this.selectedDelivery = delivery.id;
    } else {
      console.log('Starting route:', delivery.id);
      // Implementar inicio de ruta
    }
  }

  getStarArray(count: number): number[] {
    return Array(count).fill(0);
  }
}