import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  zone: string;
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class EmployeeFormComponent {
  @Output() formSubmit = new EventEmitter<EmployeeFormData>();

  employeeForm: FormGroup;
  isSubmitting: boolean = false;

  roles = [
    { value: 'secretary', label: 'Secretaria' },
    { value: 'delivery', label: 'Entregador' }
  ];

  zones = [
    { value: 'north', label: 'Norte' },
    { value: 'south', label: 'Sur' },
    { value: 'east', label: 'Oriente' },
    { value: 'west', label: 'Occidente' },
    { value: 'center', label: 'Centro' }
  ];

  constructor(private fb: FormBuilder) {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['', Validators.required],
      zone: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      this.isSubmitting = true;
      this.formSubmit.emit(this.employeeForm.value);
      this.employeeForm.reset();
      this.isSubmitting = false;
    } else {
      this.employeeForm.markAllAsTouched();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
