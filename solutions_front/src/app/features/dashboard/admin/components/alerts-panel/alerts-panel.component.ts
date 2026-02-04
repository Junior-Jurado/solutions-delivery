import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: Date;
}

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  templateUrl: './alerts-panel.component.html',
  styleUrls: ['./alerts-panel.component.scss'],
  imports: [CommonModule]
})
export class AlertsPanelComponent {
  @Input() alerts: SystemAlert[] = [];
  @Output() alertAction = new EventEmitter<string>();

  getAlertClass(type: string): string {
    return `alert-${type}`;
  }

  getActionLabel(type: string): string {
    switch (type) {
      case 'warning':
        return 'Ver Detalles';
      case 'error':
        return 'Contactar';
      default:
        return 'Ver';
    }
  }

  onAction(alertId: string): void {
    this.alertAction.emit(alertId);
  }
}
