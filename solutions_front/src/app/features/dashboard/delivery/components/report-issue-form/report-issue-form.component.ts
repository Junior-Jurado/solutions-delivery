import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryAssignment, IssueType } from '@core/services/delivery.service';
import { IconComponent } from '@shared/components/icon/icon.component';

export interface ReportIssueData {
  assignmentId: number;
  issueType: IssueType;
  description: string;
  attemptedResolution: string;
  photos: string[];
}

@Component({
  selector: 'app-report-issue-form',
  standalone: true,
  templateUrl: './report-issue-form.component.html',
  styleUrls: ['./report-issue-form.component.scss'],
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportIssueFormComponent {
  @Input() pendingPickups: DeliveryAssignment[] = [];
  @Input() pendingDeliveries: DeliveryAssignment[] = [];
  @Input() isReporting: boolean = false;

  @Output() report = new EventEmitter<ReportIssueData>();

  selectedIssueAssignmentId: number | null = null;
  issueType: IssueType | '' = '';
  issueDescription: string = '';
  attemptedResolution: string = '';
  issuePhotos: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  }

  getContactName(assignment: DeliveryAssignment): string {
    if (assignment.assignment_type === 'PICKUP') {
      return assignment.guide?.sender_name || 'Sin nombre';
    }
    return assignment.guide?.receiver_name || 'Sin nombre';
  }

  onIssuePhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        this.fileToBase64(file).then(base64 => {
          this.issuePhotos.push(base64);
          this.cdr.markForCheck();
        });
      });
    }
  }

  onSubmit(): void {
    if (!this.selectedIssueAssignmentId || !this.issueType || !this.issueDescription) {
      return;
    }

    this.report.emit({
      assignmentId: this.selectedIssueAssignmentId,
      issueType: this.issueType as IssueType,
      description: this.issueDescription,
      attemptedResolution: this.attemptedResolution,
      photos: this.issuePhotos
    });
  }

  resetForm(): void {
    this.selectedIssueAssignmentId = null;
    this.issueType = '';
    this.issueDescription = '';
    this.attemptedResolution = '';
    this.issuePhotos = [];
  }

  get isFormValid(): boolean {
    return !!this.selectedIssueAssignmentId && !!this.issueType && !!this.issueDescription;
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
