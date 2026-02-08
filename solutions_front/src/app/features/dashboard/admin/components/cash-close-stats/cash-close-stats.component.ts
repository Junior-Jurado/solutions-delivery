import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CashCloseStats {
  today_total: number;
  month_total: number;
  year_total: number;
}

@Component({
  selector: 'app-cash-close-stats',
  standalone: true,
  templateUrl: './cash-close-stats.component.html',
  styleUrls: ['./cash-close-stats.component.scss'],
  imports: [CommonModule]
})
export class CashCloseStatsComponent {
  @Input() stats: CashCloseStats | null = null;
  @Input() isLoading = false;

  /**
   * Obtiene el año actual
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('es-CO');
  }

  /**
   * Verifica si hay datos disponibles
   */
  hasData(): boolean {
    return this.stats !== null;
  }

  /**
   * Obtiene el total del día
   */
  getTodayTotal(): number {
    return this.stats?.today_total || 0;
  }

  /**
   * Obtiene el total del mes
   */
  getMonthTotal(): number {
    return this.stats?.month_total || 0;
  }

  /**
   * Obtiene el total del año
   */
  getYearTotal(): number {
    return this.stats?.year_total || 0;
  }

  /**
   * Calcula el porcentaje del día respecto al mes
   */
  getDayPercentage(): number {
    const monthTotal = this.getMonthTotal();
    const todayTotal = this.getTodayTotal();
    
    if (monthTotal === 0) return 0;
    return (todayTotal / monthTotal) * 100;
  }

  /**
   * Calcula el porcentaje del mes respecto al año
   */
  getMonthPercentage(): number {
    const yearTotal = this.getYearTotal();
    const monthTotal = this.getMonthTotal();
    
    if (yearTotal === 0) return 0;
    return (monthTotal / yearTotal) * 100;
  }
}