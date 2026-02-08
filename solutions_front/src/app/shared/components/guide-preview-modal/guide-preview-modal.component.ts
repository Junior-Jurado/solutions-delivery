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

  @Output() confirmAction = new EventEmitter<number>(); // Emite el precio final
  @Output() cancelAction = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  // Estado de edición del precio
  isEditingPrice = false;
  customPrice = 0;

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
      this.confirmAction.emit(this.currentPrice);
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