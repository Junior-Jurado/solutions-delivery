import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

export interface AdminStatCard {
  icon: string;
  iconCategory: string;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  type: 'primary' | 'success' | 'warning' | 'info';
}

@Component({
  selector: 'app-admin-stats-cards',
  standalone: true,
  templateUrl: './admin-stats-cards.component.html',
  styleUrls: ['./admin-stats-cards.component.scss'],
  imports: [CommonModule, IconComponent]
})
export class AdminStatsCardsComponent {
  @Input() isLoading = false;
  @Input() shipmentsToday = 0;
  @Input() shipmentsChange = 0;
  @Input() delivered = 0;
  @Input() deliverySuccessRate = 0;
  @Input() pending = 0;
  @Input() pendingInRoute = 0;
  @Input() pendingInOffice = 0;
  @Input() revenueToday = 0;
  @Input() revenueChange = 0;

  getStatCards(): AdminStatCard[] {
    return [
      {
        icon: 'package',
        iconCategory: 'delivery',
        title: 'Envios Hoy',
        value: this.shipmentsToday,
        subtitle: `${this.shipmentsChange >= 0 ? '+' : ''}${this.shipmentsChange}% vs ayer`,
        trend: {
          value: this.shipmentsChange,
          isPositive: this.shipmentsChange >= 0
        },
        type: 'primary'
      },
      {
        icon: 'check-circle',
        iconCategory: 'status',
        title: 'Entregados',
        value: this.delivered,
        subtitle: `${this.deliverySuccessRate.toFixed(1)}% tasa exito`,
        trend: {
          value: this.deliverySuccessRate,
          isPositive: true
        },
        type: 'success'
      },
      {
        icon: 'clock',
        iconCategory: 'delivery',
        title: 'Pendientes',
        value: this.pending,
        subtitle: `${this.pendingInRoute} en ruta, ${this.pendingInOffice} en oficina`,
        type: 'warning'
      },
      {
        icon: 'dollar-sign',
        iconCategory: 'finance',
        title: 'Ingresos Hoy',
        value: this.formatCurrency(this.revenueToday),
        subtitle: `${this.revenueChange >= 0 ? '+' : ''}${this.revenueChange}% vs ayer`,
        trend: {
          value: this.revenueChange,
          isPositive: this.revenueChange >= 0
        },
        type: 'info'
      }
    ];
  }

  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  }
}
