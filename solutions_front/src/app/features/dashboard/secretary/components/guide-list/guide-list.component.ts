import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShippingGuide, GuideStatus, PaymentMethod, ServiceType } from '@core/services/guide.service';

@Component({
  selector: 'app-guide-list',
  standalone: true,
  templateUrl: './guide-list.component.html',
  styleUrls: ['./guide-list.component.scss'],
  imports: [CommonModule]
})
export class GuideListComponent {
  @Input() guides: ShippingGuide[] = [];
  @Input() isLoading: boolean = false;
  @Input() totalGuides: number = 0;
  @Input() currentPage: number = 0;
  @Input() pageSize: number = 20;

  @Output() statusUpdate = new EventEmitter<{ guideId: number; newStatus: GuideStatus }>();
  @Output() viewDetails = new EventEmitter<number>();
  @Output() downloadPDF = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<'prev' | 'next'>();

  // Estados disponibles para actualización
  availableStatuses: { value: GuideStatus; label: string }[] = [
    { value: 'CREATED', label: 'Creada' },
    { value: 'IN_ROUTE', label: 'En ruta' },
    { value: 'IN_WAREHOUSE', label: 'En bodega' },
    { value: 'OUT_FOR_DELIVERY', label: 'En reparto' },
    { value: 'DELIVERED', label: 'Entregada' }
  ];

  /**
   * Maneja el cambio de estado
   */
  onStatusChange(guideId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as GuideStatus;
    
    if (!newStatus) {
      return;
    }

    this.statusUpdate.emit({ guideId, newStatus });
    
    // Resetear el select a su estado original
    select.value = '';
  }

  /**
   * Maneja el click en ver detalles
   */
  onViewDetails(guideId: number): void {
    this.viewDetails.emit(guideId);
  }

  /**
   * Maneja el click en descargar PDF
   */
  onDownloadPDF(guideId: number): void {
    this.downloadPDF.emit(guideId);
  }

  /**
   * Maneja la navegación de páginas
   */
  onPreviousPage(): void {
    if (this.currentPage > 0) {
      this.pageChange.emit('prev');
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.getTotalPages() - 1) {
      this.pageChange.emit('next');
    }
  }

  /**
   * Obtiene el número total de páginas
   */
  getTotalPages(): number {
    return Math.ceil(this.totalGuides / this.pageSize);
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
   * Traduce el estado a español
   */
  translateStatus(status: GuideStatus): string {
    const statusTranslations: Record<GuideStatus, string> = {
      'CREATED': 'Creada',
      'IN_ROUTE': 'En ruta',
      'IN_WAREHOUSE': 'En bodega',
      'OUT_FOR_DELIVERY': 'En reparto',
      'DELIVERED': 'Entregada'
    };
    return statusTranslations[status] || status;
  }

  /**
   * Traduce el método de pago
   */
  translatePaymentMethod(method: PaymentMethod): string {
    const paymentTranslations: Record<PaymentMethod, string> = {
      'CASH': 'Contado',
      'COD': 'Contraentrega',
      'CREDIT': 'Crédito'
    };
    return paymentTranslations[method] || method;
  }

  /**
   * Traduce el tipo de servicio
   */
  translateServiceType(serviceType: ServiceType): string {
    const serviceTranslations: Record<ServiceType, string> = {
      'NORMAL': 'Normal',
      'PRIORITY': 'Prioritario',
      'EXPRESS': 'Express'
    };
    return serviceTranslations[serviceType] || serviceType;
  }

  /**
   * Formatea una fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoy ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}