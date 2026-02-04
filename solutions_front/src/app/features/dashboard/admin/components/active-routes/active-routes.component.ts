import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActiveRoute {
  name: string;
  packages: number;
  completed: number;
  zone: string;
  status: 'En ruta' | 'Completado';
}

@Component({
  selector: 'app-active-routes',
  standalone: true,
  templateUrl: './active-routes.component.html',
  styleUrls: ['./active-routes.component.scss'],
  imports: [CommonModule]
})
export class ActiveRoutesComponent {
  @Input() routes: ActiveRoute[] = [];
  @Input() isLoading: boolean = false;

  getStatusClass(status: string): string {
    return status === 'Completado' ? 'badge-success' : 'badge-secondary';
  }

  getProgressPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return (completed / total) * 100;
  }
}
