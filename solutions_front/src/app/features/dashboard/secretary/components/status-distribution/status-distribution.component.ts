import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuideStatus } from '@core/services/guide.service';
import { IconComponent } from '@shared/components/icon/icon.component';

export type StatusCount = Record<string, number>;

export interface StatusItem {
  value: GuideStatus;
  label: string;
}

@Component({
  selector: 'app-status-distribution',
  standalone: true,
  templateUrl: './status-distribution.component.html',
  styleUrls: ['./status-distribution.component.scss'],
  imports: [CommonModule, IconComponent]
})
export class StatusDistributionComponent {
  @Input() statusCounts: StatusCount = {};
  @Input() isLoading = false;

  // Estados disponibles para mostrar
  availableStatuses: StatusItem[] = [
    { value: 'CREATED', label: 'Creada' },
    { value: 'IN_ROUTE', label: 'En ruta' },
    { value: 'IN_WAREHOUSE', label: 'En bodega' },
    { value: 'OUT_FOR_DELIVERY', label: 'En reparto' },
    { value: 'DELIVERED', label: 'Entregada' }
  ];

  /**
   * Obtiene el conteo de un estado específico
   */
  getStatusCount(status: GuideStatus): number {
    return this.statusCounts[status] || 0;
  }

  /**
   * Calcula el porcentaje de un estado
   */
  calculatePercentage(count: number): number {
    const total = this.getTotalGuides();
    return total > 0 ? (count / total) * 100 : 0;
  }

  /**
   * Obtiene el total de guías
   */
  getTotalGuides(): number {
    return Object.values(this.statusCounts).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  getStatusBadgeClass(status: GuideStatus): string {
    const statusMap: Record<GuideStatus, string> = {
      'CREATED': 'badge-created',
      'IN_ROUTE': 'badge-in-route',
      'IN_WAREHOUSE': 'badge-warning',
      'OUT_FOR_DELIVERY': 'badge-out-delivery',
      'DELIVERED': 'badge-success'
    };
    return statusMap[status] || 'badge-default';
  }

  /**
   * Verifica si hay datos para mostrar
   */
  hasData(): boolean {
    return this.getTotalGuides() > 0;
  }
}