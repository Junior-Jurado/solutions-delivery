import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ShippingGuide } from '@core/services/guide.service';
import { TranslationService } from '@shared/services/translation.service';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss']
})
export class TrackingComponent {
  @Input() isTracking: boolean = false;
  @Input() trackingError: string = '';
  @Input() trackingResult: ShippingGuide | null = null;
  
  @Output() track = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<number>();

  trackingNumber: string = '';

  constructor(public translationService: TranslationService) {}

  onTrack(): void {
    if (this.trackingNumber.trim()) {
      this.track.emit(this.trackingNumber.trim());
    }
  }

  onClear(): void {
    this.trackingNumber = '';
    this.clear.emit();
  }

  onViewDetails(guideId: number): void {
    this.viewDetails.emit(guideId);
  }

  getStatusClass(status: string): string {
    return this.translationService.getStatusBadgeClass(status as any);
  }

  getStatusText(status: string): string {
    return this.translationService.translateGuideStatus(status as any);
  }

  formatDate(dateString: string): string {
    return this.translationService.formatRelativeDate(dateString);
  }
}