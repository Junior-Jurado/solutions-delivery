import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatCard {
  icon: string;
  title: string;
  value: number;
  label: string;
  type: 'primary' | 'success' | 'warning' | 'info';
}

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  templateUrl: './stats-cards.component.html',
  styleUrls: ['./stats-cards.component.scss'],
  imports: [CommonModule]
})
export class StatsCardsComponent {
  @Input() isLoading: boolean = false;
  @Input() totalToday: number = 0;
  @Input() totalProcessed: number = 0;
  @Input() totalPending: number = 0;

  /**
   * Obtiene las tarjetas de estadísticas
   */
  getStatCards(): StatCard[] {
    return [
      {
        icon: 'file',
        title: 'Guías Hoy',
        value: this.totalToday,
        label: 'Creadas el día de hoy',
        type: 'primary'
      },
      {
        icon: 'check-circle',
        title: 'Procesadas',
        value: this.totalProcessed,
        label: 'Entregadas exitosamente',
        type: 'success'
      },
      {
        icon: 'clock',
        title: 'Pendientes',
        value: this.totalPending,
        label: 'Requieren atención',
        type: 'warning'
      }
    ];
  }

  /**
   * Obtiene el SVG del icono según el tipo
   */
  getIconSVG(iconType: string): string {
    const icons: Record<string, string> = {
      'file': `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
               <polyline points="14 2 14 8 20 8"></polyline>
               <line x1="16" y1="13" x2="8" y2="13"></line>
               <line x1="16" y1="17" x2="8" y2="17"></line>
               <polyline points="10 9 9 9 8 9"></polyline>`,
      
      'check-circle': `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                       <polyline points="22 4 12 14.01 9 11.01"></polyline>`,
      
      'clock': `<circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>`
    };
    
    return icons[iconType] || '';
  }

  /**
   * Obtiene la clase CSS del valor según el tipo
   */
  getValueClass(type: string): string {
    return `stat-value ${type}`;
  }
}