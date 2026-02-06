import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryAssignment } from '@core/services/delivery.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-assignment-card',
  standalone: true,
  templateUrl: './assignment-card.component.html',
  styleUrls: ['./assignment-card.component.scss'],
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentCardComponent {
  @Input() assignment!: DeliveryAssignment;

  @Output() startRoute = new EventEmitter<DeliveryAssignment>();
  @Output() confirmDelivery = new EventEmitter<DeliveryAssignment>();
  @Output() viewOnMap = new EventEmitter<DeliveryAssignment>();
  @Output() callRecipient = new EventEmitter<DeliveryAssignment>();

  get isPickup(): boolean {
    return this.assignment.assignment_type === 'PICKUP';
  }

  get isInProgress(): boolean {
    return this.assignment.status === 'IN_PROGRESS';
  }

  get isPending(): boolean {
    return this.assignment.status === 'PENDING';
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'badge-warning',
      'IN_PROGRESS': 'badge-info',
      'COMPLETED': 'badge-success',
      'CANCELLED': 'badge-error'
    };
    return classes[status] || 'badge-default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  }

  getContactName(): string {
    if (this.isPickup) {
      return this.assignment.guide?.sender_name || 'Sin nombre';
    }
    return this.assignment.guide?.receiver_name || 'Sin nombre';
  }

  getContactAddress(): string {
    if (this.isPickup) {
      return this.assignment.guide?.sender_address || 'Sin dirección';
    }
    return this.assignment.guide?.receiver_address || 'Sin dirección';
  }

  getContactPhone(): string {
    if (this.isPickup) {
      return this.assignment.guide?.sender_phone || '';
    }
    return this.assignment.guide?.receiver_phone || '';
  }

  onStartRoute(): void {
    this.startRoute.emit(this.assignment);
  }

  onConfirmDelivery(): void {
    this.confirmDelivery.emit(this.assignment);
  }

  onViewOnMap(): void {
    this.viewOnMap.emit(this.assignment);
  }

  onCallRecipient(): void {
    this.callRecipient.emit(this.assignment);
  }

  onMainAction(): void {
    if (this.isInProgress) {
      this.onConfirmDelivery();
    } else {
      this.onStartRoute();
    }
  }

  getMainActionIcon(): string {
    return this.isInProgress ? 'check-circle' : 'play';
  }

  getMainActionIconCategory(): string {
    return this.isInProgress ? 'status' : 'delivery';
  }
}
