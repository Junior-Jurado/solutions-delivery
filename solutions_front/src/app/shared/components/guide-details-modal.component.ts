// guide-details-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShippingGuide } from '@core/services/guide.service';
import { TranslationService } from '@shared/services/translation.service';

@Component({
  selector: 'app-guide-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Detalles de Guía #{{ guide?.guide_id }}
          </h2>
          <button class="btn-close" (click)="close()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body" *ngIf="guide">
          <!-- Estado -->
          <div class="detail-section">
            <div class="section-title">Estado Actual</div>
            <span class="badge-large" [ngClass]="translation.getStatusBadgeClass(guide.current_status)">
              {{ translation.translateGuideStatus(guide.current_status) }}
            </span>
            <div class="detail-date">Creada: {{ formatDate(guide.created_at) }}</div>
          </div>

          <!-- Remitente -->
          <div class="detail-section">
            <div class="section-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <h3>Remitente</h3>
            </div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Nombre:</span>
                <span class="value">{{ guide.sender?.full_name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Documento:</span>
                <span class="value">{{ translation.translateDocumentType(guide.sender?.document_type || '') }} {{ guide.sender?.document_number || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Teléfono:</span>
                <span class="value">{{ guide.sender?.phone || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Email:</span>
                <span class="value">{{ guide.sender?.email || 'N/A' }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="label">Dirección:</span>
                <span class="value">{{ guide.sender?.address || 'N/A' }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="label">Ciudad:</span>
                <span class="value">{{ guide.origin_city_name }}</span>
              </div>
            </div>
          </div>

          <!-- Destinatario -->
          <div class="detail-section">
            <div class="section-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <h3>Destinatario</h3>
            </div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Nombre:</span>
                <span class="value">{{ guide.receiver?.full_name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Documento:</span>
                <span class="value">{{ translation.translateDocumentType(guide.receiver?.document_type || '') }} {{ guide.receiver?.document_number || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Teléfono:</span>
                <span class="value">{{ guide.receiver?.phone || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Email:</span>
                <span class="value">{{ guide.receiver?.email || 'N/A' }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="label">Dirección:</span>
                <span class="value">{{ guide.receiver?.address || 'N/A' }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="label">Ciudad:</span>
                <span class="value">{{ guide.destination_city_name }}</span>
              </div>
            </div>
          </div>

          <!-- Paquete -->
          <div class="detail-section">
            <div class="section-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              <h3>Información del Paquete</h3>
            </div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Peso:</span>
                <span class="value">{{ guide.package?.weight_kg || 0 }} kg</span>
              </div>
              <div class="detail-item">
                <span class="label">Piezas:</span>
                <span class="value">{{ guide.package?.pieces || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Dimensiones:</span>
                <span class="value">{{ guide.package?.length_cm }}x{{ guide.package?.width_cm }}x{{ guide.package?.height_cm }} cm</span>
              </div>
              <div class="detail-item">
                <span class="label">Asegurado:</span>
                <span class="value">{{ guide.package?.insured ? 'Sí' : 'No' }}</span>
              </div>
              <div class="detail-item full-width" *ngIf="guide.package?.description">
                <span class="label">Descripción:</span>
                <span class="value">{{ guide.package?.description }}</span>
              </div>
              <div class="detail-item full-width" *ngIf="guide.package?.special_notes">
                <span class="label">Notas especiales:</span>
                <span class="value">{{ guide.package?.special_notes }}</span>
              </div>
            </div>
          </div>

          <!-- Valores -->
          <div class="detail-section">
            <div class="section-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <h3>Información Financiera</h3>
            </div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Tipo de servicio:</span>
                <span class="value">{{ translation.translateServiceType(guide.service_type) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Método de pago:</span>
                <span class="badge" [ngClass]="translation.getPaymentMethodBadgeClass(guide.payment_method)">
                  {{ translation.translatePaymentMethod(guide.payment_method) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="label">Valor declarado:</span>
                <span class="value price">\${{ guide.declared_value.toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Precio del envío:</span>
                <span class="value price">\${{ guide.price.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Historial -->
          <div class="detail-section" *ngIf="guide.history && guide.history.length > 0">
            <div class="section-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <h3>Historial de Estados</h3>
            </div>
            <div class="history-timeline">
              <div *ngFor="let item of guide.history" class="history-item">
                <div class="history-dot"></div>
                <div class="history-content">
                  <div class="history-status">{{ translation.translateGuideStatus(item.status) }}</div>
                  <div class="history-date">{{ formatDate(item.updated_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" (click)="close()">Cerrar</button>
          <button class="btn btn-primary" (click)="downloadPDF()" *ngIf="guide?.pdf_url">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-header h2 svg {
      color: #3b82f6;
    }

    .btn-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .detail-section {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .badge-large {
      display: inline-flex;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .badge-large.badge-default {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-large.badge-secondary {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-large.badge-warning {
      background: #e0e7ff;
      color: #3730a3;
    }

    .badge-large.badge-success {
      background: #dcfce7;
      color: #166534;
    }

    .badge {
      display: inline-flex;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }

    .badge.badge-success {
      background: #dcfce7;
      color: #166534;
    }

    .badge.badge-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .badge.badge-info {
      background: #dbeafe;
      color: #1e40af;
    }

    .detail-date {
      font-size: 13px;
      color: #6b7280;
      margin-top: 8px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }

    .section-header svg {
      color: #3b82f6;
    }

    .section-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-item .label {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
    }

    .detail-item .value {
      font-size: 14px;
      color: #111827;
      word-break: break-word;
    }

    .detail-item .value.price {
      font-size: 16px;
      font-weight: 600;
      color: #059669;
    }

    .history-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-left: 10px;
    }

    .history-item {
      display: flex;
      gap: 16px;
      position: relative;
    }

    .history-item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 24px;
      bottom: -16px;
      width: 2px;
      background: #e5e7eb;
    }

    .history-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid white;
      flex-shrink: 0;
      margin-top: 2px;
      box-shadow: 0 0 0 2px #3b82f6;
    }

    .history-content {
      flex: 1;
    }

    .history-status {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .history-date {
      font-size: 13px;
      color: #6b7280;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      border: none;
    }

    .btn-outline {
      background: white;
      border: 1px solid #d1d5db;
      color: #374151;
    }

    .btn-outline:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    @media (max-width: 768px) {
      .modal-content {
        max-height: 95vh;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .modal-header h2 {
        font-size: 18px;
      }
    }
  `]
})
export class GuideDetailsModalComponent {
  @Input() guide: ShippingGuide | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() downloadPDFEvent = new EventEmitter<number>();

  constructor(public translation: TranslationService) {}

  close(): void {
    this.closeModal.emit();
  }

  downloadPDF(): void {
    if (this.guide) {
      this.downloadPDFEvent.emit(this.guide.guide_id);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoy ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}