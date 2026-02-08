import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ShippingGuide, GuideStatus } from '@core/services/guide.service';
import { TranslationService } from '@shared/services/translation.service';

@Component({
  selector: 'app-my-guides',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-guides.component.html',
  styleUrls: ['./my-guides.component.scss']
})
export class MyGuidesComponent {
  @Input() guides: ShippingGuide[] = [];
  @Input() loading = false;
  
  @Output() refresh = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<number>();
  @Output() downloadPDF = new EventEmitter<number>();
  @Output() createGuide = new EventEmitter<void>();

  constructor(public translationService: TranslationService) {}

  onRefresh(): void {
    this.refresh.emit();
  }

  onViewDetails(guideId: number): void {
    this.viewDetails.emit(guideId);
  }

  onDownloadPDF(guideId: number): void {
    this.downloadPDF.emit(guideId);
  }

  onCreateGuide(): void {
    this.createGuide.emit();
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