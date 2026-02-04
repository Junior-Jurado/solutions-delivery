import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DeliveryItem {
  id: string;
  customer: string;
  address: string;
  status: 'En ruta' | 'Entregado' | 'Pendiente';
  deliveryPerson: string;
  time: string;
}

@Component({
  selector: 'app-realtime-deliveries',
  standalone: true,
  templateUrl: './realtime-deliveries.component.html',
  styleUrls: ['./realtime-deliveries.component.scss'],
  imports: [CommonModule]
})
export class RealtimeDeliveriesComponent {
  @Input() deliveries: DeliveryItem[] = [];
  @Input() isLoading: boolean = false;

  getStatusClass(status: string): string {
    switch (status) {
      case 'Entregado':
        return 'badge-success';
      case 'En ruta':
        return 'badge-secondary';
      case 'Pendiente':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  }
}
