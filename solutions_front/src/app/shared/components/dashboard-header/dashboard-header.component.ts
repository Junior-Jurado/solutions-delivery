import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent {
  @Input() userRole = 'Usuario';
  @Input() userDescription = 'Panel de gestión';
  @Input() userName = '';
  @Input() companyName = 'SOLUCIONES';
  @Input() showUserName = false;
  @Input() isMobile = false;
  @Input() showRefresh = false;
  @Input() isRefreshing = false;

  @Output() logout = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  /**
   * Devuelve el texto a mostrar en el header.
   * Si showUserName es true y hay userName, muestra el nombre.
   * Si no, muestra el rol.
   */
  get displayName(): string {
    if (this.showUserName && this.userName) {
      return this.userName;
    }
    return this.userRole;
  }

  onLogout(): void {
    this.logout.emit();
  }

  onRefresh(): void {
    if (!this.isRefreshing) {
      this.refresh.emit();
    }
  }
}