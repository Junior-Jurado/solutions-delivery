import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Employee {
  id: string;
  name: string;
  role: string;
  status: string;
  performance: string;
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss'],
  imports: [CommonModule]
})
export class EmployeeListComponent {
  @Input() employees: Employee[] = [];
  @Input() isLoading: boolean = false;
  @Output() editEmployee = new EventEmitter<string>();

  getStatusClass(status: string): string {
    return status === 'Activo' ? 'badge-success' : 'badge-secondary';
  }

  onEdit(employeeId: string): void {
    this.editEmployee.emit(employeeId);
  }
}
