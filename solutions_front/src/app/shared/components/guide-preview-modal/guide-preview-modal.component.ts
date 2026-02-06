import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';
import { TranslationService } from '@shared/services/translation.service';

export interface GuidePreviewData {
  // Remitente
  senderName: string;
  senderCity: string;
  senderAddress: string;
  senderPhone: string;
  senderDoc?: string;

  // Destinatario
  receiverName: string;
  receiverCity: string;
  receiverAddress: string;
  receiverPhone: string;
  receiverDoc?: string;

  // Paquete
  weight: number;
  declaredValue: number;
  serviceType: string;
  pieces?: number;
  dimensions?: string;
  content?: string;

  // Precio calculado
  calculatedPrice: number;
}

@Component({
  selector: 'app-guide-preview-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guide-preview-modal.component.html',
  styleUrls: ['./guide-preview-modal.component.scss']
})
export class GuidePreviewModalComponent {
  @Input() isOpen: boolean = false;
  @Input() guideData: GuidePreviewData | null = null;
  @Input() isCreating: boolean = false;
  @Input() title: string = 'Confirmar Creación de Guía';
  @Input() warningMessage: string = 'Verifique toda la información antes de confirmar la creación de la guía.';
  @Input() confirmButtonText: string = 'Confirmar y Crear Guía';
  @Input() cancelButtonText: string = 'Cancelar';
  @Input() allowPriceEdit: boolean = false; // Permite editar el precio (solo admin)

  @Output() confirm = new EventEmitter<number>(); // Emite el precio final
  @Output() cancel = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  // Estado de edición del precio
  isEditingPrice: boolean = false;
  customPrice: number = 0;

  constructor(
    public translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  get currentPrice(): number {
    if (this.isEditingPrice || this.customPrice > 0) {
      return this.customPrice;
    }
    return this.guideData?.calculatedPrice || 0;
  }

  startEditPrice(): void {
    if (!this.allowPriceEdit || this.isCreating) return;
    this.customPrice = this.guideData?.calculatedPrice || 0;
    this.isEditingPrice = true;
    this.cdr.markForCheck();
  }

  cancelEditPrice(): void {
    this.isEditingPrice = false;
    this.customPrice = 0;
    this.cdr.markForCheck();
  }

  savePrice(): void {
    if (this.customPrice < 0) {
      this.customPrice = 0;
    }
    this.isEditingPrice = false;
    this.cdr.markForCheck();
  }

  resetToCalculatedPrice(): void {
    this.customPrice = 0;
    this.isEditingPrice = false;
    this.cdr.markForCheck();
  }

  onConfirm(): void {
    if (!this.isCreating) {
      // Emitir el precio final (personalizado o calculado)
      this.confirm.emit(this.currentPrice);
    }
  }

  onCancel(): void {
    if (!this.isCreating) {
      this.resetToCalculatedPrice();
      this.cancel.emit();
    }
  }

  onOverlayClick(): void {
    if (!this.isCreating) {
      this.resetToCalculatedPrice();
      this.closeModal.emit();
    }
  }

  formatPrice(price: number): string {
    return this.translationService.formatCurrency(price);
  }
}