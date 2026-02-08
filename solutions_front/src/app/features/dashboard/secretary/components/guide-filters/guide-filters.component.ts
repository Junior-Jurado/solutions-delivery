import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { City } from '@core/services/location.service';
import { GuideStatus } from '@core/services/guide.service';

export interface GuideFilterValues {
  status: GuideStatus | '';
  cityId: number | '';
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-guide-filters',
  standalone: true,
  templateUrl: './guide-filters.component.html',
  styleUrls: ['./guide-filters.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class GuideFiltersComponent {
  @Input() cities: City[] = [];
  @Input() isLoading = false;

  @Output() filterApplied = new EventEmitter<GuideFilterValues>();
  @Output() filterCleared = new EventEmitter<void>();

  // Valores del formulario
  selectedStatus: GuideStatus | '' = '';
  selectedCity: number | '' = '';
  dateFrom = '';
  dateTo = '';

  // Para display de fechas en formato dd/mm/yyyy
  displayDateFrom = '';
  displayDateTo = '';

  // Estados disponibles
  availableStatuses: { value: GuideStatus; label: string }[] = [
    { value: 'CREATED', label: 'Creada' },
    { value: 'IN_ROUTE', label: 'En ruta' },
    { value: 'IN_WAREHOUSE', label: 'En bodega' },
    { value: 'OUT_FOR_DELIVERY', label: 'En reparto' },
    { value: 'DELIVERED', label: 'Entregada' }
  ];

  /**
   * Aplica los filtros
   */
  applyFilters(): void {
    const filters: GuideFilterValues = {
      status: this.selectedStatus,
      cityId: this.selectedCity,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo
    };

    this.filterApplied.emit(filters);
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.selectedStatus = '';
    this.selectedCity = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.displayDateFrom = '';
    this.displayDateTo = '';

    this.filterCleared.emit();
  }

  /**
   * Maneja el cambio en el input de fecha desde
   */
  onDateFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    let formatted = '';
    if (value.length >= 1) {
      formatted = value.substring(0, 2);
    }
    if (value.length >= 3) {
      formatted += '/' + value.substring(2, 4);
    }
    if (value.length >= 5) {
      formatted += '/' + value.substring(4, 8);
    }

    this.displayDateFrom = formatted;

    if (value.length === 8) {
      this.dateFrom = this.formatDateForAPI(formatted);
    } else {
      this.dateFrom = '';
    }
  }

  /**
   * Maneja el cambio en el input de fecha hasta
   */
  onDateToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    let formatted = '';
    if (value.length >= 1) {
      formatted = value.substring(0, 2);
    }
    if (value.length >= 3) {
      formatted += '/' + value.substring(2, 4);
    }
    if (value.length >= 5) {
      formatted += '/' + value.substring(4, 8);
    }

    this.displayDateTo = formatted;

    if (value.length === 8) {
      this.dateTo = this.formatDateForAPI(formatted);
    } else {
      this.dateTo = '';
    }
  }

  /**
   * Convierte fecha de dd/mm/yyyy a yyyy-mm-dd
   */
  private formatDateForAPI(displayDate: string): string {
    if (!displayDate || displayDate.length !== 10) return '';

    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];

    // Validación básica
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 2000) {
      return '';
    }

    return `${year}-${month}-${day}`;
  }

  /**
   * Verifica si hay algún filtro activo
   */
  hasActiveFilters(): boolean {
    return !!(this.selectedStatus || this.selectedCity || this.dateFrom || this.dateTo);
  }

  /**
   * Verifica si los filtros son válidos para aplicar
   */
  canApplyFilters(): boolean {
    // Si hay fechas, ambas deben estar completas
    if (this.displayDateFrom && !this.dateFrom) return false;
    if (this.displayDateTo && !this.dateTo) return false;

    // Debe haber al menos un filtro seleccionado
    return this.hasActiveFilters();
  }
}