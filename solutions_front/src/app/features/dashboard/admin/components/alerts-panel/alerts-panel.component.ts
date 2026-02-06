import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  guideId?: number;
  userId?: string;
}

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  templateUrl: './alerts-panel.component.html',
  styleUrls: ['./alerts-panel.component.scss'],
  imports: [CommonModule, IconComponent]
})
export class AlertsPanelComponent {
  @Input() alerts: SystemAlert[] = [];
  @Output() alertAction = new EventEmitter<string>();
  @Output() viewGuide = new EventEmitter<number>();
  @Output() dismissAlert = new EventEmitter<string>();

  expandedAlertId: string | null = null;

  getAlertClass(type: string): string {
    return `alert-${type}`;
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'warning':
        return 'alert-triangle';
      case 'error':
        return 'x-circle';
      case 'info':
        return 'info-circle';
      default:
        return 'info-circle';
    }
  }

  toggleExpand(alertId: string): void {
    if (this.expandedAlertId === alertId) {
      this.expandedAlertId = null;
    } else {
      this.expandedAlertId = alertId;
    }
  }

  isExpanded(alertId: string): boolean {
    return this.expandedAlertId === alertId;
  }

  onAction(alertId: string): void {
    this.toggleExpand(alertId);
    this.alertAction.emit(alertId);
  }

  onViewGuide(guideId: number | undefined): void {
    if (guideId) {
      this.viewGuide.emit(guideId);
    }
  }

  onDismiss(alertId: string, event: Event): void {
    event.stopPropagation();
    this.dismissAlert.emit(alertId);
  }

  formatTimestamp(timestamp: Date): string {
    if (!timestamp) return '';

    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    return alertTime.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
