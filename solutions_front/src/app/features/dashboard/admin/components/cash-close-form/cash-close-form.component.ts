import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodType } from '@core/services/cash-close.service';

export interface CashCloseFormData {
  periodType: PeriodType;
  year: number;
  month?: number;
  day?: number;
  week?: number;
}

@Component({
  selector: 'app-cash-close-form',
  standalone: true,
  templateUrl: './cash-close-form.component.html',
  styleUrls: ['./cash-close-form.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class CashCloseFormComponent implements OnInit {
  @Input() isGenerating = false;
  @Output() generateClose = new EventEmitter<CashCloseFormData>();

  // Valores del formulario
  selectedPeriodType: PeriodType = 'DAILY';
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  selectedDay: number = new Date().getDate();

  // Datos para los selectores
  years: number[] = [];
  months: { value: number; label: string }[] = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];
  days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

  ngOnInit(): void {
    this.initializeYears();
  }

  /**
   * Inicializa el array de años (últimos 5 años + próximo año)
   */
  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    this.years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      this.years.push(i);
    }
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    const formData: CashCloseFormData = {
      periodType: this.selectedPeriodType,
      year: Number(this.selectedYear)
    };

    if (this.selectedPeriodType === 'DAILY') {
      formData.month = Number(this.selectedMonth);
      formData.day = Number(this.selectedDay);
    } else if (this.selectedPeriodType === 'WEEKLY') {
      const weekNumber = this.getWeekNumber(
        Number(this.selectedYear),
        Number(this.selectedMonth),
        Number(this.selectedDay)
      );
      formData.week = weekNumber;
      formData.month = Number(this.selectedMonth);
      formData.day = Number(this.selectedDay);
    } else if (this.selectedPeriodType === 'MONTHLY') {
      formData.month = Number(this.selectedMonth);
    }

    this.generateClose.emit(formData);
  }

  /**
   * Valida que el formulario esté completo según el tipo de período
   */
  isFormValid(): boolean {
    if (!this.selectedYear) return false;

    if (this.selectedPeriodType === 'DAILY' || this.selectedPeriodType === 'WEEKLY') {
      return !!(this.selectedMonth && this.selectedDay);
    }

    if (this.selectedPeriodType === 'MONTHLY') {
      return !!this.selectedMonth;
    }

    return true; // YEARLY solo necesita año
  }

  /**
   * Obtiene el texto descriptivo del período seleccionado
   */
  getPeriodDescription(): string {
    if (!this.isFormValid()) {
      return 'Complete los campos requeridos para ver la descripción del período';
    }

    switch (this.selectedPeriodType) {
      case 'DAILY':
        return `Se generará un cierre para el día ${this.selectedDay}/${this.selectedMonth}/${this.selectedYear}`;
      
      case 'WEEKLY':
        return `Se generará un cierre semanal comenzando el ${this.selectedDay}/${this.selectedMonth}/${this.selectedYear} (7 días consecutivos)`;
      
      case 'MONTHLY': {
        const monthName = this.months.find(m => m.value === Number(this.selectedMonth))?.label || '';
        return `Se generará un cierre para todo el mes de ${monthName} ${this.selectedYear}`;
      }
      
      case 'YEARLY':
        return `Se generará un cierre para todo el año ${this.selectedYear}`;
      
      default:
        return '';
    }
  }

  /**
   * Verifica si debe mostrar el selector de mes
   */
  shouldShowMonth(): boolean {
    return this.selectedPeriodType === 'MONTHLY' || 
           this.selectedPeriodType === 'WEEKLY' || 
           this.selectedPeriodType === 'DAILY';
  }

  /**
   * Verifica si debe mostrar el selector de día
   */
  shouldShowDay(): boolean {
    return this.selectedPeriodType === 'DAILY' || 
           this.selectedPeriodType === 'WEEKLY';
  }

  /**
   * Obtiene el label del campo día según el tipo de período
   */
  getDayLabel(): string {
    return this.selectedPeriodType === 'WEEKLY' ? 'Día de inicio *' : 'Día *';
  }

  /**
   * Calcula el número de semana del año (ISO 8601)
   */
  private getWeekNumber(year: number, month: number, day: number): number {
    const date = new Date(year, month - 1, day);
    const tempDate = new Date(date.getTime());
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
  }
}