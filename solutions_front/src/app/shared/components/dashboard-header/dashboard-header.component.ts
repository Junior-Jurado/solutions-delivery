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
  @Input() userRole: string = 'Usuario';
  @Input() userDescription: string = 'Panel de gestión';
  @Input() userName: string = '';
  @Input() companyName: string = 'SOLUCIONES';
  @Input() showUserName: boolean = false;
  @Input() isMobile: boolean = false;

  @Output() logout = new EventEmitter<void>();

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
}