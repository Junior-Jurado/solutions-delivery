import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Employee, UserRole } from '@core/services/admin.service';
import { ToastService } from '@shared/services/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss'],
  imports: [CommonModule, FormsModule, IconComponent]
})
export class EmployeeListComponent {
  @Input() employees: Employee[] = [];
  @Input() isLoading: boolean = false;
  @Output() employeeUpdated = new EventEmitter<Employee>();

  // Editing state
  editingUserId: string | null = null;
  editingRole: UserRole | '' = '';
  isUpdating: boolean = false;

  // Filter
  filterRole: string = '';

  // Available roles for assignment (ADMIN excluded)
  roles: { value: UserRole; label: string }[] = [
    { value: 'CLIENT', label: 'Cliente' },
    { value: 'SECRETARY', label: 'Secretaria' },
    { value: 'DELIVERY', label: 'Entregador' }
  ];

  // All roles for display purposes
  allRoles: { value: UserRole; label: string }[] = [
    { value: 'CLIENT', label: 'Cliente' },
    { value: 'SECRETARY', label: 'Secretaria' },
    { value: 'DELIVERY', label: 'Entregador' },
    { value: 'ADMIN', label: 'Administrador' }
  ];

  // Roles for filtering (excludes CLIENT - employees section)
  filterRoles: { value: UserRole; label: string }[] = [
    { value: 'SECRETARY', label: 'Secretaria' },
    { value: 'DELIVERY', label: 'Entregador' },
    { value: 'ADMIN', label: 'Administrador' }
  ];

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  get filteredEmployees(): Employee[] {
    if (!this.filterRole) {
      return this.employees;
    }
    return this.employees.filter(e => e.role === this.filterRole);
  }

  getRoleLabel(role: UserRole): string {
    const found = this.allRoles.find(r => r.value === role);
    return found ? found.label : role;
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'SECRETARY': return 'badge-secretary';
      case 'DELIVERY': return 'badge-delivery';
      case 'CLIENT': return 'badge-client';
      default: return 'badge-default';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Activo': return 'badge-success';
      case 'En ruta': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  canEdit(employee: Employee): boolean {
    return employee.role !== 'ADMIN';
  }

  startEditing(employee: Employee): void {
    if (!this.canEdit(employee)) return;
    this.editingUserId = employee.user_uuid;
    this.editingRole = employee.role;
  }

  cancelEditing(): void {
    this.editingUserId = null;
    this.editingRole = '';
  }

  async saveRole(employee: Employee): Promise<void> {
    if (!this.editingRole || this.editingRole === employee.role) {
      this.cancelEditing();
      return;
    }

    this.isUpdating = true;

    try {
      const updated = await this.adminService.updateEmployee(employee.user_uuid, {
        role: this.editingRole as UserRole
      });

      // Update local employee
      employee.role = updated.role;
      this.toast.success(`Rol actualizado a ${this.getRoleLabel(updated.role)}`);
      this.employeeUpdated.emit(updated);

    } catch (error) {
      console.error('Error updating role:', error);
      this.toast.error('Error al actualizar el rol');
    } finally {
      this.isUpdating = false;
      this.cancelEditing();
      this.cdr.detectChanges();
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
