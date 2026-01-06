import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CitySelectorComponent } from '@shared/components/city-selector.component';
import { City } from '@core/services/location.service';
import { CreateGuideResponse } from '@core/services/guide.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-guide-form',
  standalone: true,
  templateUrl: './guide-form.component.html',
  styleUrls: ['./guide-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CitySelectorComponent,
    IconComponent
  ]
})
export class GuideFormComponent {
  @Input() currentUserId: string = '';
  @Output() guideCreated = new EventEmitter<CreateGuideResponse>();
  @Output() formSubmit = new EventEmitter<any>();

  guideForm: FormGroup;
  isSubmitting: boolean = false;

  selectedSenderCity: City | null = null;
  selectedReceiverCity: City | null = null;

  // Opciones de formulario
  serviceTypes: string[] = ['Contado', 'Contra Entrega', 'Crédito'];
  priorities: string[] = ['Normal', 'Express', 'Urgente'];
  insuranceOptions: string[] = ['No', 'Básico', 'Completo'];
  documentTypes: string[] = ['CC', 'CE', 'NIT', 'TI', 'PAS'];

  constructor(private fb: FormBuilder) {
    this.guideForm = this.initializeForm();
  }

  /**
   * Inicializa el formulario de guía
   */
  private initializeForm(): FormGroup {
    return this.fb.group({
      // Remitente
      senderName: ['', Validators.required],
      senderDocType: ['CC', Validators.required],
      senderDoc: ['', Validators.required],
      senderPhone: ['', Validators.required],
      senderEmail: ['', Validators.email],
      senderAddress: ['', Validators.required],
      senderCity: ['', Validators.required],
      senderCityName: [''],

      // Destinatario
      receiverName: ['', Validators.required],
      receiverDocType: ['CC', Validators.required],
      receiverDoc: ['', Validators.required],
      receiverPhone: ['', Validators.required],
      receiverEmail: ['', Validators.email],
      receiverAddress: ['', Validators.required],
      receiverCity: ['', Validators.required],
      receiverCityName: [''],

      // Paquete
      serviceType: ['Contado', Validators.required],
      weight: ['', [Validators.required, Validators.min(0.1)]],
      declaredValue: ['', [Validators.required, Validators.min(0)]],
      pieces: [1, [Validators.required, Validators.min(1)]],
      dimensions: ['20x15x10'],
      priority: ['normal'],
      insurance: ['no'],
      content: [''],
      observations: ['']
    });
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (!this.guideForm.valid) {
      this.markFormGroupTouched(this.guideForm);
      return;
    }

    this.formSubmit.emit(this.guideForm.value);
  }

  /**
   * Maneja la selección de ciudad del remitente
   */
  onSenderCitySelected(city: City): void {
    this.selectedSenderCity = city;
    this.guideForm.patchValue({
      senderCity: city.id,
      senderCityName: city.name
    });
  }

  /**
   * Maneja la selección de ciudad del destinatario
   */
  onReceiverCitySelected(city: City): void {
    this.selectedReceiverCity = city;
    this.guideForm.patchValue({
      receiverCity: city.id,
      receiverCityName: city.name
    });
  }

  /**
   * Resetea el formulario
   */
  resetForm(): void {
    this.guideForm.reset(this.getDefaultFormValues());
    this.selectedSenderCity = null;
    this.selectedReceiverCity = null;
  }

  /**
   * Verifica si un campo tiene error
   */
  hasError(fieldName: string): boolean {
    const field = this.guideForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.guideForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (field?.hasError('email')) {
      return 'Ingrese un email válido';
    }

    if (field?.hasError('min')) {
      return 'El valor debe ser mayor a 0';
    }

    return '';
  }

  /**
   * Marca todos los controles como touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Obtiene los valores por defecto del formulario
   */
  private getDefaultFormValues(): any {
    return {
      senderDocType: 'CC',
      receiverDocType: 'CC',
      serviceType: 'Contado',
      pieces: 1,
      dimensions: '20x15x10',
      priority: 'normal',
      insurance: 'no',
      senderCityName: '',
      receiverCityName: ''
    };
  }

  /**
   * Setter para isSubmitting (para uso externo)
   */
  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }
}