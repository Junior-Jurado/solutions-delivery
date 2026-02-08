import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { IconComponent } from '../icon/icon.component';

export interface RatingSubmitData {
  assignmentId: number;
  guideId: number;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-rating-modal',
  standalone: true,
  templateUrl: './rating-modal.component.html',
  styleUrls: ['./rating-modal.component.scss'],
  imports: [CommonModule, FormsModule, StarRatingComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingModalComponent {
  @Input() isOpen = false;
  @Input() deliveryUserName = '';
  @Input() guideId = 0;
  @Input() assignmentId = 0;
  @Input() serviceType = '';
  @Input() isSubmitting = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() submitRating = new EventEmitter<RatingSubmitData>();

  rating = 0;
  comment = '';

  constructor(private cdr: ChangeDetectorRef) {}

  onRatingChange(value: number): void {
    this.rating = value;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.rating === 0) return;

    this.submitRating.emit({
      assignmentId: this.assignmentId,
      guideId: this.guideId,
      rating: this.rating,
      comment: this.comment
    });
  }

  onClose(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  resetForm(): void {
    this.rating = 0;
    this.comment = '';
  }

  get canSubmit(): boolean {
    return this.rating > 0 && !this.isSubmitting;
  }
}
