import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ShippingGuide, GuideStatus } from '@core/services/guide.service';
import { TranslationService } from '@shared/services/translation.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent {
  @Input() guides: ShippingGuide[] = [];
  @Input() loading = false;
  
  @Output() viewDetails = new EventEmitter<number>();
  @Output() downloadPDF = new EventEmitter<number>();

  constructor(public translationService: TranslationService) {}

  onViewDetails(guideId: number): void {
    this.viewDetails.emit(guideId);
  }

  onDownloadPDF(guideId: number): void {
    this.downloadPDF.emit(guideId);
  }

  getStatusClass(status: string): string {
    return this.translationService.getStatusBadgeClass(status as GuideStatus);
  }

  getStatusText(status: string): string {
    return this.translationService.translateGuideStatus(status as GuideStatus);
  }

  formatDate(dateString: string): string {
    return this.translationService.formatRelativeDate(dateString);
  }

  formatPrice(price: number): string {
    return this.translationService.formatCurrency(price);
  }
}