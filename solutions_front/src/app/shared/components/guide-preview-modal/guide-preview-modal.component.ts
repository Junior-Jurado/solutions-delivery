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
  @Input() isOpen = false;
  @Input() guideData: GuidePreviewData | null = null;
  @Input() isCreating = false;
  @Input() title = 'Confirmar Creación de Guía';
  @Input() warningMessage = 'Verifique toda la información antes de confirmar la creación de la guía.';
  @Input() confirmButtonText = 'Confirmar y Crear Guía';
  @Input() cancelButtonText = 'Cancelar';
  @Input() allowPriceEdit = false; // Permite editar el precio (solo admin)

  @Output() confirmAction = new EventEmitter<{ price: number; reason: string }>(); // Emite el precio final y razón
  @Output() cancelAction = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  // Estado de edición del precio
  isEditingPrice = false;
  customPrice = 0;
  priceChangeReason = '';
  priceValidationError = '';

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
    this.priceChangeReason = '';
    this.priceValidationError = '';
    this.cdr.markForCheck();
  }

  savePrice(): void {
    const calculatedPrice = this.guideData?.calculatedPrice || 0;
    const minAllowedPrice = calculatedPrice * 0.5;

    if (this.customPrice <= 0) {
      this.priceValidationError = 'El precio debe ser mayor a $0.';
      this.cdr.markForCheck();
      return;
    }

    if (this.customPrice < minAllowedPrice) {
      this.priceValidationError = `El descuento no puede superar el 50%. Precio mínimo: ${this.formatPrice(minAllowedPrice)}`;
      this.cdr.markForCheck();
      return;
    }

    this.priceValidationError = '';
    this.isEditingPrice = false;
    this.cdr.markForCheck();
  }

  resetToCalculatedPrice(): void {
    this.customPrice = 0;
    this.priceChangeReason = '';
    this.priceValidationError = '';
    this.isEditingPrice = false;
    this.cdr.markForCheck();
  }

  get isPriceModified(): boolean {
    return this.customPrice > 0 && this.customPrice !== this.guideData?.calculatedPrice;
  }

  onConfirm(): void {
    if (!this.isCreating) {
      // Si el precio fue modificado, la razón es obligatoria
      if (this.isPriceModified && !this.priceChangeReason.trim()) {
        return;
      }
      this.confirmAction.emit({
        price: this.currentPrice,
        reason: this.isPriceModified ? this.priceChangeReason.trim() : ''
      });
    }
  }

  onCancel(): void {
    if (!this.isCreating) {
      this.resetToCalculatedPrice();
      this.cancelAction.emit();
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