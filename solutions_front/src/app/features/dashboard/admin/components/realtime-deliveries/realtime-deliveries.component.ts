import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

export interface DeliveryItem {
  id: string;
  customer: string;
  address: string;
  status: 'En ruta' | 'Entregado' | 'Pendiente';
  deliveryPerson: string;
  time: string;
  serviceType?: string;
}

@Component({
  selector: 'app-realtime-deliveries',
  standalone: true,
  templateUrl: './realtime-deliveries.component.html',
  styleUrls: ['./realtime-deliveries.component.scss'],
  imports: [CommonModule, IconComponent]
})
export class RealtimeDeliveriesComponent {
  @Input() deliveries: DeliveryItem[] = [];
  @Input() isLoading: boolean = false;
  @Output() viewGuide = new EventEmitter<number>();

  getStatusClass(status: string): string {
    switch (status) {
      case 'Entregado':
        return 'badge-success';
      case 'En ruta':
        return 'badge-info';
      case 'Pendiente':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Entregado':
        return 'check-circle';
      case 'En ruta':
        return 'truck';
      case 'Pendiente':
        return 'clock';
      default:
        return 'package';
    }
  }

  getStatusIconCategory(status: string): string {
    switch (status) {
      case 'Entregado':
        return 'status';
      case 'En ruta':
      case 'Pendiente':
      default:
        return 'delivery';
    }
  }

  getServiceTypeLabel(serviceType: string | undefined): string {
    if (!serviceType) return 'Estándar';
    const types: { [key: string]: string } = {
      'STANDARD': 'Estándar',
      'EXPRESS': 'Express',
      'SAME_DAY': 'Mismo día',
      'NEXT_DAY': 'Siguiente día'
    };
    return types[serviceType] || serviceType;
  }

  onViewGuide(deliveryId: string): void {
    const guideId = parseInt(deliveryId);
    if (!isNaN(guideId)) {
      this.viewGuide.emit(guideId);
    }
  }
}
