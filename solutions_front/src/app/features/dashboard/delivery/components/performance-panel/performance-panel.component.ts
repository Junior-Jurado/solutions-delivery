import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceStats } from '@core/services/delivery.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { StarRatingComponent } from '@shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-performance-panel',
  standalone: true,
  templateUrl: './performance-panel.component.html',
  styleUrls: ['./performance-panel.component.scss'],
  imports: [CommonModule, IconComponent, StarRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformancePanelComponent {
  @Input() performanceStats: PerformanceStats | null = null;
  @Input() isLoading: boolean = false;
}
