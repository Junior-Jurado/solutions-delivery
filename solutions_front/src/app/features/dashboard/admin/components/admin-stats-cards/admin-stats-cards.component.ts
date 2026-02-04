import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AdminStatCard {
  icon: string;
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
  imports: [CommonModule]
})
export class AdminStatsCardsComponent {
  @Input() isLoading: boolean = false;
  @Input() shipmentsToday: number = 0;
  @Input() shipmentsChange: number = 0;
  @Input() delivered: number = 0;
  @Input() deliverySuccessRate: number = 0;
  @Input() pending: number = 0;
  @Input() pendingInRoute: number = 0;
  @Input() pendingInOffice: number = 0;
  @Input() revenueToday: number = 0;
  @Input() revenueChange: number = 0;

  getStatCards(): AdminStatCard[] {
    return [
      {
        icon: 'package',
        title: 'Envíos Hoy',
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
        title: 'Entregados',
        value: this.delivered,
        subtitle: `${this.deliverySuccessRate.toFixed(1)}% tasa éxito`,
        trend: {
          value: this.deliverySuccessRate,
          isPositive: true
        },
        type: 'success'
      },
      {
        icon: 'clock',
        title: 'Pendientes',
        value: this.pending,
        subtitle: `${this.pendingInRoute} en ruta, ${this.pendingInOffice} en oficina`,
        type: 'warning'
      },
      {
        icon: 'dollar-sign',
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

  getIconSVG(iconType: string): string {
    const icons: Record<string, string> = {
      'package': `<path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                   <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                   <line x1="12" y1="22.08" x2="12" y2="12"></line>`,
      'check-circle': `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                       <polyline points="22 4 12 14.01 9 11.01"></polyline>`,
      'clock': `<circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>`,
      'dollar-sign': `<line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>`,
      'trending-up': `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>`,
      'trending-down': `<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                        <polyline points="17 18 23 18 23 12"></polyline>`
    };
    return icons[iconType] || '';
  }

  getTrendIcon(isPositive: boolean): string {
    return isPositive ? this.getIconSVG('trending-up') : this.getIconSVG('trending-down');
  }
}
