import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-delivery-overview',
  standalone: true,
  templateUrl: './delivery-overview.component.html',
  styleUrls: ['./delivery-overview.component.scss'],
  imports: [CommonModule, IconComponent]
})
export class DeliveryOverviewComponent {
  @Input() deliveriesToday: number = 0;
  @Input() completed: number = 0;
  @Input() pending: number = 0;
  @Input() averageTime: number = 0;
  @Input() satisfaction: number = 0;

  get formattedAverageTime(): string {
    if (this.averageTime === 0) return 'N/A';
    if (this.averageTime < 1) {
      // Menos de 1 hora, mostrar en minutos
      const minutes = Math.round(this.averageTime * 60);
      return `${minutes} min`;
    }
    // Mostrar con 1 decimal
    return `${this.averageTime.toFixed(1)}h`;
  }

  get formattedSatisfaction(): string {
    if (this.satisfaction === 0) return 'N/A';
    return `${this.satisfaction.toFixed(1)}%`;
  }

  get completionRate(): number {
    if (this.deliveriesToday === 0) return 0;
    return Math.round((this.completed / this.deliveriesToday) * 100);
  }
}
