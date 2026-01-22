import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, IconComponent],
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
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  constructor(public translationService: TranslationService) {}

  onConfirm(): void {
    if (!this.isCreating) {
      this.confirm.emit();
    }
  }

  onCancel(): void {
    if (!this.isCreating) {
      this.cancel.emit();
    }
  }

  onOverlayClick(): void {
    if (!this.isCreating) {
      this.closeModal.emit();
    }
  }

  formatPrice(price: number): string {
    return this.translationService.formatCurrency(price);
  }
}