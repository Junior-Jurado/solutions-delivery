import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashClose, PeriodType } from '@core/services/cash-close.service';

@Component({
  selector: 'app-cash-close-list',
  standalone: true,
  templateUrl: './cash-close-list.component.html',
  styleUrls: ['./cash-close-list.component.scss'],
  imports: [CommonModule]
})
export class CashCloseListComponent {
  @Input() closes: CashClose[] = [];
  @Input() isLoading = false;
  @Input() totalCloses = 0;
  @Input() currentPage = 0;
  @Input() pageSize = 10;

  @Output() downloadPDF = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<'prev' | 'next'>();

  /**
   * Maneja el click en descargar PDF
   */
  onDownloadPDF(closeId: number): void {
    this.downloadPDF.emit(closeId);
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
    return Math.ceil(this.totalCloses / this.pageSize);
  }

  /**
   * Traduce el tipo de período
   */
  translatePeriodType(periodType: PeriodType): string {
    const translations: Record<PeriodType, string> = {
      'DAILY': 'Diario',
      'WEEKLY': 'Semanal',
      'MONTHLY': 'Mensual',
      'YEARLY': 'Anual'
    };
    return translations[periodType] || periodType;
  }

  /**
   * Formatea una fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Formatea una fecha con hora
   */
  formatDateTime(dateString: string): string {
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
   * Verifica si tiene PDF disponible
   */
  hasPDF(close: CashClose): boolean {
    return !!(close.pdf_url || close.pdf_s3_key);
  }
}