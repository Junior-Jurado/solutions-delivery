import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingGuide, GuideStatus } from '@core/services/guide.service';

@Component({
  selector: 'app-guide-search',
  standalone: true,
  templateUrl: './guide-search.component.html',
  styleUrls: ['./guide-search.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class GuideSearchComponent {
  @Input() searchResults: ShippingGuide[] = [];
  @Input() isSearching: boolean = false;

  @Output() search = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<number>();
  @Output() downloadPDF = new EventEmitter<number>();

  searchQuery: string = '';

  /**
   * Maneja el envío del formulario de búsqueda
   */
  onSearch(): void {
    if (this.searchQuery && this.searchQuery.length >= 3) {
      this.search.emit(this.searchQuery);
    }
  }

  /**
   * Verifica si el formulario es válido
   */
  isSearchValid(): boolean {
    return this.searchQuery.length >= 3;
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

  /**
   * Verifica si la guía tiene PDF
   */
  hasPDF(guide: ShippingGuide): boolean {
    return !!guide.pdf_url;
  }
}