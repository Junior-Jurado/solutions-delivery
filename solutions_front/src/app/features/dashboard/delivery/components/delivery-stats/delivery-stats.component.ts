import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyAssignmentStats } from '@core/services/delivery.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-delivery-stats',
  standalone: true,
  templateUrl: './delivery-stats.component.html',
  styleUrls: ['./delivery-stats.component.scss'],
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryStatsComponent {
  @Input() stats: MyAssignmentStats | null = null;
  @Input() isLoading: boolean = false;
}
