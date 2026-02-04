import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delivery-overview',
  standalone: true,
  templateUrl: './delivery-overview.component.html',
  styleUrls: ['./delivery-overview.component.scss'],
  imports: [CommonModule]
})
export class DeliveryOverviewComponent {
  @Input() deliveriesToday: number = 0;
  @Input() completed: number = 0;
  @Input() pending: number = 0;
  @Input() averageTime: number = 0;
  @Input() satisfaction: number = 0;
}
