import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WorkerPerformance {
  name: string;
  deliveries: number;
  efficiency: number;
}

@Component({
  selector: 'app-worker-performance',
  standalone: true,
  templateUrl: './worker-performance.component.html',
  styleUrls: ['./worker-performance.component.scss'],
  imports: [CommonModule]
})
export class WorkerPerformanceComponent {
  @Input() workers: WorkerPerformance[] = [];
  @Input() isLoading: boolean = false;

  getBadgeClass(efficiency: number): string {
    return efficiency > 90 ? 'badge-success' : 'badge-secondary';
  }
}
