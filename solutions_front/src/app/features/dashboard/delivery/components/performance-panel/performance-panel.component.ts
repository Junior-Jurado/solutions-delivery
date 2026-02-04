import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceStats } from '@core/services/delivery.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-performance-panel',
  standalone: true,
  templateUrl: './performance-panel.component.html',
  styleUrls: ['./performance-panel.component.scss'],
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformancePanelComponent {
  @Input() performanceStats: PerformanceStats | null = null;
  @Input() isLoading: boolean = false;

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }
}
