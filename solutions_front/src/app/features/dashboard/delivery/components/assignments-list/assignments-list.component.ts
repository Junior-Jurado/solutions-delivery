import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryAssignment } from '@core/services/delivery.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { AssignmentCardComponent } from '../assignment-card/assignment-card.component';

@Component({
  selector: 'app-assignments-list',
  standalone: true,
  templateUrl: './assignments-list.component.html',
  styleUrls: ['./assignments-list.component.scss'],
  imports: [CommonModule, IconComponent, AssignmentCardComponent]
})
export class AssignmentsListComponent {
  @Input() pickups: DeliveryAssignment[] = [];
  @Input() deliveries: DeliveryAssignment[] = [];
  @Input() isLoading = false;

  @Output() startRoute = new EventEmitter<DeliveryAssignment>();
  @Output() confirmDelivery = new EventEmitter<DeliveryAssignment>();
  @Output() viewOnMap = new EventEmitter<DeliveryAssignment>();
  @Output() callRecipient = new EventEmitter<DeliveryAssignment>();

  get pendingPickups(): DeliveryAssignment[] {
    return this.pickups.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS');
  }

  get pendingDeliveries(): DeliveryAssignment[] {
    return this.deliveries.filter(d => d.status === 'PENDING' || d.status === 'IN_PROGRESS');
  }

  trackByAssignment(_index: number, assignment: DeliveryAssignment): string | number {
    return assignment.assignment_id;
  }

  onStartRoute(assignment: DeliveryAssignment): void {
    this.startRoute.emit(assignment);
  }

  onConfirmDelivery(assignment: DeliveryAssignment): void {
    this.confirmDelivery.emit(assignment);
  }

  onViewOnMap(assignment: DeliveryAssignment): void {
    this.viewOnMap.emit(assignment);
  }

  onCallRecipient(assignment: DeliveryAssignment): void {
    this.callRecipient.emit(assignment);
  }
}
