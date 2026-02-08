import { Component, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Employee, UserRole } from '@core/services/admin.service';
import { ToastService } from '@shared/services/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss'],
  imports: [CommonModule, FormsModule, IconComponent]
})
export class EmployeeFormComponent {
  @Output() userUpdated = new EventEmitter<Employee>();
  @Output() userFound = new EventEmitter<Employee>();

  // Search
  documentNumber = '';
  isSearching = false;

  // User found
  foundUser: Employee | null = null;
  searchError = '';

  // Role editing
  selectedRole: UserRole | '' = '';
  isUpdating = false;

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

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  async searchUser(): Promise<void> {
    if (!this.documentNumber || this.documentNumber.trim().length < 5) {
      this.toast.error('Ingrese un número de documento válido (mínimo 5 dígitos)');
      return;
    }

    this.isSearching = true;
    this.foundUser = null;
    this.searchError = '';
    this.selectedRole = '';
    this.cdr.detectChanges();

    try {
      const user = await this.adminService.getUserByDocument(this.documentNumber.trim());
      this.foundUser = user;
      this.selectedRole = user.role;
      // Emit event so parent can load statistics for this user
      this.userFound.emit(user);
    } catch (error) {
      const httpError = error as { status?: number };
      if (httpError.status === 404) {
        this.searchError = 'No se encontró ningún usuario con ese número de documento';
      } else {
        this.searchError = 'Error al buscar el usuario';
      }
      this.toast.error(this.searchError);
    } finally {
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  clearSearch(): void {
    this.documentNumber = '';
    this.foundUser = null;
    this.searchError = '';
    this.selectedRole = '';
  }

  get canEditRole(): boolean {
    // Cannot edit if user is ADMIN
    return this.foundUser !== null && this.foundUser.role !== 'ADMIN';
  }

  get roleChanged(): boolean {
    return this.foundUser !== null && this.selectedRole !== this.foundUser.role;
  }

  async updateUserRole(): Promise<void> {
    if (!this.foundUser || !this.selectedRole || !this.roleChanged) {
      return;
    }

    this.isUpdating = true;
    this.cdr.detectChanges();

    try {
      const updatedUser = await this.adminService.updateEmployee(this.foundUser.user_uuid, {
        role: this.selectedRole as UserRole
      });

      this.foundUser = updatedUser;
      this.selectedRole = updatedUser.role;
      this.toast.success(`Rol actualizado a ${this.getRoleLabel(this.selectedRole as UserRole)}`);
      this.userUpdated.emit(updatedUser);

    } catch (error) {
      console.error('Error updating role:', error);
      this.toast.error('Error al actualizar el rol del usuario');
    } finally {
      this.isUpdating = false;
      this.cdr.detectChanges();
    }
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

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }
}
