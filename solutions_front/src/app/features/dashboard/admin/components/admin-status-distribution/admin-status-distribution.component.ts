import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ShipmentStatus {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

@Component({
  selector: 'app-admin-status-distribution',
  standalone: true,
  templateUrl: './admin-status-distribution.component.html',
  styleUrls: ['./admin-status-distribution.component.scss'],
  imports: [CommonModule]
})
export class AdminStatusDistributionComponent {
  @Input() statusData: ShipmentStatus[] = [];
  @Input() isLoading = false;

  getColorClass(color: string): string {
    return `status-dot-${color}`;
  }
}
