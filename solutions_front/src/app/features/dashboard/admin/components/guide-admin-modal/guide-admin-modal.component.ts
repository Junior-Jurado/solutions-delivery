import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ShippingGuide, GuideStatus, GuideService } from '@core/services/guide.service';
import { TranslationService } from '@shared/services/translation.service';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-guide-admin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './guide-admin-modal.component.html',
  styleUrls: ['./guide-admin-modal.component.scss']
})
export class GuideAdminModalComponent implements OnChanges {
  @Input() guideId: number | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() statusUpdated = new EventEmitter<{ guideId: number; newStatus: GuideStatus }>();

  guide: ShippingGuide | null = null;
  isLoading = false;
  isUpdatingStatus = false;
  selectedStatus: GuideStatus | null = null;
  errorMessage: string | null = null;
  private lastLoadedGuideId: number | null = null;

  // Available statuses for admin
  availableStatuses: { value: GuideStatus; label: string }[] = [
    { value: 'CREATED', label: 'Creado' },
    { value: 'IN_ROUTE', label: 'En Ruta (Recogida)' },
    { value: 'IN_WAREHOUSE', label: 'En Bodega' },
    { value: 'OUT_FOR_DELIVERY', label: 'En Reparto' },
    { value: 'DELIVERED', label: 'Entregado' }
  ];

  constructor(
    private guideService: GuideService,
    public translation: TranslationService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('GuideAdminModal ngOnChanges:', {
      isOpen: this.isOpen,
      guideId: this.guideId,
      lastLoadedGuideId: this.lastLoadedGuideId,
      changedProps: Object.keys(changes)
    });

    // Reset when modal closes
    if (changes['isOpen'] && !this.isOpen) {
      console.log('Modal closing, resetting state');
      this.guide = null;
      this.lastLoadedGuideId = null;
      this.isLoading = false;
      this.errorMessage = null;
      return;
    }

    // Load guide when modal is open and we have a guideId
    if (this.isOpen && this.guideId) {
      // Only load if we haven't loaded this guide yet
      if (this.guideId !== this.lastLoadedGuideId) {
        console.log('Loading guide because guideId changed or modal just opened');
        this.loadGuide();
      } else {
        console.log('Skipping load, guide already loaded:', this.lastLoadedGuideId);
      }
    }
  }

  async loadGuide(): Promise<void> {
    if (!this.guideId) {
      console.warn('loadGuide called without guideId');
      return;
    }

    console.log('Loading guide:', this.guideId);
    this.isLoading = true;
    this.guide = null;
    this.errorMessage = null;
    this.cdr.detectChanges();

    try {
      const response = await this.guideService.getGuideById(this.guideId);
      console.log('Guide response:', response);

      if (response && response.guide) {
        this.guide = response.guide;
        this.selectedStatus = this.guide.current_status;
        this.lastLoadedGuideId = this.guideId;
        this.errorMessage = null;
        console.log('Guide loaded successfully:', this.guide);
        console.log('Setting isLoading to false...');
      } else {
        console.error('Invalid guide response format:', response);
        const errMsg = 'La respuesta del servidor no tiene el formato esperado';
        this.errorMessage = errMsg;
        this.toast.error(errMsg);
      }
    } catch (error) {
      console.error('Error al cargar guía:', error);
      const errMsg = error instanceof Error ? error.message : 'Error al cargar los detalles de la guía';
      this.errorMessage = errMsg;
      this.toast.error(errMsg);
    } finally {
      this.isLoading = false;
      console.log('State after load:', { isLoading: this.isLoading, guide: !!this.guide, errorMessage: this.errorMessage });
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        this.cdr.detectChanges();
        console.log('detectChanges called');
      }, 0);
    }
  }

  async updateStatus(): Promise<void> {
    if (!this.guide || !this.selectedStatus || this.selectedStatus === this.guide.current_status) {
      return;
    }

    this.isUpdatingStatus = true;
    try {
      await this.guideService.updateGuideStatus(this.guide.guide_id, this.selectedStatus);

      this.toast.success(`Estado actualizado a: ${this.getStatusLabel(this.selectedStatus)}`);
      this.statusUpdated.emit({ guideId: this.guide.guide_id, newStatus: this.selectedStatus });

      // Reload guide to get updated history
      await this.loadGuide();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      this.toast.error('Error al actualizar el estado de la guía');
    } finally {
      this.isUpdatingStatus = false;
    }
  }

  async downloadPDF(): Promise<void> {
    if (!this.guide) return;

    try {
      await this.guideService.downloadGuidePDF(this.guide.guide_id);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      this.toast.error('Error al descargar el PDF');
    }
  }

  close(): void {
    console.log('close() called, isLoading:', this.isLoading);
    // Don't close while loading
    if (this.isLoading) {
      console.log('Preventing close during loading');
      return;
    }
    this.guide = null;
    this.errorMessage = null;
    this.closeModal.emit();
  }

  getStatusLabel(status: GuideStatus): string {
    const found = this.availableStatuses.find(s => s.value === status);
    return found ? found.label : status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      'CREATED': 'badge-warning',
      'IN_ROUTE': 'badge-info',
      'IN_WAREHOUSE': 'badge-secondary',
      'OUT_FOR_DELIVERY': 'badge-primary',
      'DELIVERED': 'badge-success'
    };
    return classMap[status] || 'badge-default';
  }

  canChangeToStatus(_status: GuideStatus): boolean {
    if (!this.guide) return false;

    // Admin has full control over status changes
    return true;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

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
