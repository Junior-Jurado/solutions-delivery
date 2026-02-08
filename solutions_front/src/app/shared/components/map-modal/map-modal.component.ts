import {
  Component,
  Input,
  Output,
  EventEmitter,
  PLATFORM_ID,
  Inject,
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface MapLocation {
  address: string;
  city: string;
  contactName?: string;
  contactPhone?: string;
  type?: 'PICKUP' | 'DELIVERY';
}

@Component({
  selector: 'app-map-modal',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="dlv-map-modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="dlv-map-modal-content" [class.mobile]="isMobile" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="dlv-map-modal-header">
          <div class="dlv-header-info">
            <div class="dlv-header-type" *ngIf="location?.type">
              <span class="dlv-type-badge" [class.pickup]="location?.type === 'PICKUP'" [class.delivery]="location?.type === 'DELIVERY'">
                {{ location?.type === 'PICKUP' ? 'RECOGER' : 'ENTREGAR' }}
              </span>
            </div>
            <h2 class="dlv-map-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{{ location?.contactName || 'Ubicación' }}</span>
            </h2>
          </div>
          <button class="dlv-btn-close" (click)="close()" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Address Card -->
        <div class="dlv-address-card">
          <div class="dlv-address-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" [attr.stroke]="location?.type === 'PICKUP' ? '#3b82f6' : '#f59e0b'" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div class="dlv-address-details">
            <div class="dlv-address-main">{{ location?.address }}</div>
            <div class="dlv-address-city">{{ location?.city }}, Colombia</div>
            <div class="dlv-address-contact" *ngIf="location?.contactPhone">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>{{ location?.contactPhone }}</span>
            </div>
          </div>
        </div>

        <!-- Navigation Instructions -->
        <div class="dlv-nav-instructions">
          <div class="dlv-nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </div>
          <div class="dlv-nav-text">
            <span class="dlv-nav-title">Navegar a esta dirección</span>
            <span class="dlv-nav-subtitle">Selecciona tu aplicación de navegación preferida</span>
          </div>
        </div>

        <!-- Action Buttons - Main focus -->
        <div class="dlv-map-modal-actions">
          <button class="dlv-nav-btn dlv-btn-google" (click)="openInGoogleMaps()" type="button">
            <div class="dlv-nav-btn-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="dlv-nav-btn-text">
              <span class="dlv-nav-btn-title">Google Maps</span>
              <span class="dlv-nav-btn-subtitle">Abrir navegación</span>
            </div>
            <svg class="dlv-nav-btn-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <button class="dlv-nav-btn dlv-btn-waze" (click)="openInWaze()" type="button">
            <div class="dlv-nav-btn-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <div class="dlv-nav-btn-text">
              <span class="dlv-nav-btn-title">Waze</span>
              <span class="dlv-nav-btn-subtitle">Abrir navegación</span>
            </div>
            <svg class="dlv-nav-btn-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <button class="dlv-nav-btn dlv-btn-call" (click)="callContact()" type="button" *ngIf="location?.contactPhone">
            <div class="dlv-nav-btn-icon dlv-icon-call">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div class="dlv-nav-btn-text">
              <span class="dlv-nav-btn-title">Llamar</span>
              <span class="dlv-nav-btn-subtitle">{{ location?.contactPhone }}</span>
            </div>
            <svg class="dlv-nav-btn-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <!-- Footer -->
        <div class="dlv-map-modal-footer">
          <button class="dlv-btn-cancel" (click)="close()" type="button">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dlv-map-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 16px;
      animation: dlvFadeIn 0.2s ease-out;
      box-sizing: border-box;
    }

    @keyframes dlvFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dlv-map-modal-content {
      background: var(--bg-secondary, #f8fafc);
      border-radius: 20px;
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: dlvSlideUp 0.3s ease-out;
      overflow: hidden;
      max-height: calc(100vh - 32px);
      box-sizing: border-box;
    }

    .dlv-map-modal-content.mobile {
      max-width: 100%;
      border-radius: 16px;
    }

    @keyframes dlvSlideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .dlv-map-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, var(--color-azul, #0066CC) 0%, #764ba2 100%);
      color: white;
      flex-shrink: 0;
    }

    .dlv-header-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dlv-header-type {
      display: flex;
    }

    .dlv-type-badge {
      display: inline-flex;
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dlv-type-badge.pickup {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .dlv-type-badge.delivery {
      background: rgba(245, 158, 11, 0.3);
      color: #fef3c7;
    }

    .dlv-map-title {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
    }

    .dlv-map-title svg {
      flex-shrink: 0;
    }

    .dlv-btn-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .dlv-btn-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Address Card */
    .dlv-address-card {
      display: flex;
      gap: 14px;
      padding: 18px 20px;
      background: var(--card-bg, #ffffff);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .dlv-address-icon {
      flex-shrink: 0;
      width: 50px;
      height: 50px;
      background: var(--bg-tertiary, #f1f5f9);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dlv-address-details {
      flex: 1;
      min-width: 0;
    }

    .dlv-address-main {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .dlv-address-city {
      font-size: 13px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 8px;
    }

    .dlv-address-contact {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--color-azul, #3b82f6);
      font-weight: 500;
    }

    .dlv-address-contact svg {
      flex-shrink: 0;
    }

    /* Navigation Instructions */
    .dlv-nav-instructions {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: var(--card-bg, #ffffff);
    }

    .dlv-nav-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background: var(--bg-tertiary, #f1f5f9);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dlv-nav-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dlv-nav-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #374151);
    }

    .dlv-nav-subtitle {
      font-size: 12px;
      color: var(--text-muted, #9ca3af);
    }

    /* Action Buttons */
    .dlv-map-modal-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px 20px;
      background: var(--card-bg, #ffffff);
    }

    .dlv-nav-btn {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      width: 100%;
    }

    .dlv-nav-btn-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dlv-nav-btn-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dlv-nav-btn-title {
      font-size: 15px;
      font-weight: 600;
    }

    .dlv-nav-btn-subtitle {
      font-size: 12px;
      opacity: 0.8;
    }

    .dlv-nav-btn-arrow {
      flex-shrink: 0;
      opacity: 0.6;
    }

    /* Google Maps Button */
    .dlv-btn-google {
      background: linear-gradient(135deg, var(--color-azul, #4285f4) 0%, #1a73e8 100%);
      color: white;
    }

    .dlv-btn-google .dlv-nav-btn-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .dlv-btn-google:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
    }

    /* Waze Button */
    .dlv-btn-waze {
      background: linear-gradient(135deg, #33ccff 0%, #00b8e6 100%);
      color: #1a1a2e;
    }

    .dlv-btn-waze .dlv-nav-btn-icon {
      background: rgba(255, 255, 255, 0.3);
    }

    .dlv-btn-waze:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(51, 204, 255, 0.4);
    }

    /* Call Button */
    .dlv-btn-call {
      background: linear-gradient(135deg, var(--color-verde, #22c55e) 0%, #16a34a 100%);
      color: white;
    }

    .dlv-btn-call .dlv-nav-btn-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .dlv-btn-call:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    }

    /* Footer */
    .dlv-map-modal-footer {
      padding: 16px 20px;
      background: var(--bg-secondary, #f8fafc);
      border-top: 1px solid var(--border-color, #e5e7eb);
    }

    .dlv-btn-cancel {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 10px;
      background: var(--card-bg, #ffffff);
      color: var(--text-secondary, #6b7280);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dlv-btn-cancel:hover {
      background: var(--bg-tertiary, #f3f4f6);
      border-color: var(--text-muted, #9ca3af);
    }

    /* Mobile */
    @media (max-width: 480px) {
      .dlv-map-modal-overlay {
        padding: 12px;
      }

      .dlv-map-modal-content {
        max-height: calc(100vh - 24px);
      }

      .dlv-map-modal-header {
        padding: 14px 16px;
      }

      .dlv-map-title {
        font-size: 15px;
      }

      .dlv-address-card {
        padding: 14px 16px;
      }

      .dlv-address-icon {
        width: 44px;
        height: 44px;
      }

      .dlv-address-icon svg {
        width: 26px;
        height: 26px;
      }

      .dlv-address-main {
        font-size: 14px;
      }

      .dlv-nav-instructions {
        padding: 12px 16px;
      }

      .dlv-map-modal-actions {
        padding: 14px 16px;
        gap: 8px;
      }

      .dlv-nav-btn {
        padding: 12px 14px;
      }

      .dlv-nav-btn-icon {
        width: 42px;
        height: 42px;
      }

      .dlv-nav-btn-icon svg {
        width: 24px;
        height: 24px;
      }

      .dlv-nav-btn-title {
        font-size: 14px;
      }

      .dlv-map-modal-footer {
        padding: 14px 16px;
      }
    }

    /* ===== DARK MODE ADJUSTMENTS ===== */
    @media (prefers-color-scheme: dark) {
      .dlv-map-modal-overlay {
        background: rgba(0, 0, 0, 0.75);
      }

      .dlv-map-modal-content {
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }

      .dlv-map-modal-header {
        background: linear-gradient(135deg, #4D9AFF 0%, #8B5CF6 100%);
      }

      .dlv-address-contact {
        color: #4D9AFF;
      }

      .dlv-btn-google {
        background: linear-gradient(135deg, #4D9AFF 0%, #3B82F6 100%);
      }

      .dlv-btn-google:hover {
        box-shadow: 0 4px 12px rgba(77, 154, 255, 0.4);
      }

      .dlv-btn-waze {
        background: linear-gradient(135deg, #4DD4FF 0%, #00C4E6 100%);
        color: #0D0D0D;
      }

      .dlv-btn-waze:hover {
        box-shadow: 0 4px 12px rgba(77, 212, 255, 0.4);
      }

      .dlv-btn-call {
        background: linear-gradient(135deg, #33D47F 0%, #22C55E 100%);
      }

      .dlv-btn-call:hover {
        box-shadow: 0 4px 12px rgba(51, 212, 127, 0.4);
      }

      .dlv-nav-icon svg {
        stroke: var(--text-muted, #9ca3af);
      }
    }
  `]
})
export class MapModalComponent {
  @Input() isOpen = false;
  @Input() location: MapLocation | null = null;
  @Input() isMobile = false;

  @Output() closeModal = new EventEmitter<void>();

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  close(): void {
    this.closeModal.emit();
  }

  openInGoogleMaps(): void {
    if (!this.location) return;

    const fullAddress = `${this.location.address}, ${this.location.city}, Colombia`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    window.open(url, '_blank');
  }

  openInWaze(): void {
    if (!this.location) return;

    const fullAddress = `${this.location.address}, ${this.location.city}, Colombia`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://www.waze.com/ul?q=${encodedAddress}&navigate=yes`;

    window.open(url, '_blank');
  }

  callContact(): void {
    if (this.location?.contactPhone) {
      window.location.href = `tel:${this.location.contactPhone}`;
    }
  }
}
