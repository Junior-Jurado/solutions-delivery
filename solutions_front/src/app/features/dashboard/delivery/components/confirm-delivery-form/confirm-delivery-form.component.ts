import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryAssignment, PackageCondition } from '@core/services/delivery.service';
import { IconComponent } from '@shared/components/icon/icon.component';

export interface ConfirmDeliveryData {
  assignmentId: number;
  notes: string;
  condition: PackageCondition;
  photoBase64?: string;
}

@Component({
  selector: 'app-confirm-delivery-form',
  standalone: true,
  templateUrl: './confirm-delivery-form.component.html',
  styleUrls: ['./confirm-delivery-form.component.scss'],
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDeliveryFormComponent {
  @Input() assignmentsInProgress: DeliveryAssignment[] = [];
  @Input() selectedAssignmentId: number | null = null;
  @Input() isConfirming: boolean = false;

  @Output() assignmentSelected = new EventEmitter<number | null>();
  @Output() confirm = new EventEmitter<ConfirmDeliveryData>();

  deliveryNotes: string = '';
  packageCondition: PackageCondition = 'perfect';
  deliveryPhotoBase64: string = '';

  get selectedAssignmentData(): DeliveryAssignment | null {
    if (!this.selectedAssignmentId) return null;
    return this.assignmentsInProgress.find(a => a.assignment_id === this.selectedAssignmentId) || null;
  }

  onAssignmentChange(value: number | null): void {
    this.assignmentSelected.emit(value);
  }

  getAssignmentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'PICKUP': 'Recoger',
      'DELIVERY': 'Entregar'
    };
    return labels[type] || type;
  }

  getContactName(assignment: DeliveryAssignment): string {
    if (assignment.assignment_type === 'PICKUP') {
      return assignment.guide?.sender_name || 'Sin nombre';
    }
    return assignment.guide?.receiver_name || 'Sin nombre';
  }

  getContactAddress(assignment: DeliveryAssignment): string {
    if (assignment.assignment_type === 'PICKUP') {
      return assignment.guide?.sender_address || 'Sin dirección';
    }
    return assignment.guide?.receiver_address || 'Sin dirección';
  }

  onDeliveryPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fileToBase64(file).then(base64 => {
        this.deliveryPhotoBase64 = base64;
      });
    }
  }

  openCamera(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => this.onDeliveryPhotoChange(e);
    input.click();
  }

  onSubmit(): void {
    if (!this.selectedAssignmentId) return;

    this.confirm.emit({
      assignmentId: this.selectedAssignmentId,
      notes: this.deliveryNotes,
      condition: this.packageCondition,
      photoBase64: this.deliveryPhotoBase64 || undefined
    });
  }

  resetForm(): void {
    this.deliveryNotes = '';
    this.packageCondition = 'perfect';
    this.deliveryPhotoBase64 = '';
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}
