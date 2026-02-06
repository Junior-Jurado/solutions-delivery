import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';
import { GuideService, ShippingGuide, GuideStatus, GuidesListResponse } from '@core/services/guide.service';
import { TranslationService } from '@shared/services/translation.service';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-admin-guides',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './admin-guides.component.html',
  styleUrls: ['./admin-guides.component.scss']
})
export class AdminGuidesComponent implements OnInit {
  @Output() viewGuide = new EventEmitter<number>();

  // Search & Filters
  searchTerm: string = '';
  selectedStatus: string = '';
  isSearching: boolean = false;

  // Guides list
  guides: ShippingGuide[] = [];
  isLoading: boolean = false;
  totalGuides: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;

  // Status options for filter
  statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'CREATED', label: 'Creado' },
    { value: 'IN_ROUTE', label: 'En Ruta' },
    { value: 'IN_WAREHOUSE', label: 'En Bodega' },
    { value: 'OUT_FOR_DELIVERY', label: 'En Reparto' },
    { value: 'DELIVERED', label: 'Entregado' }
  ];

  // Inline editing
  editingGuideId: number | null = null;
  editingStatus: GuideStatus | null = null;
  isUpdatingStatus: boolean = false;

  constructor(
    private guideService: GuideService,
    public translation: TranslationService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadGuides();
  }

  async loadGuides(): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const filters: any = {
        limit: this.pageSize,
        offset: this.currentPage * this.pageSize
      };

      if (this.selectedStatus) {
        filters.status = this.selectedStatus;
      }

      if (this.searchTerm && this.searchTerm.length >= 3) {
        filters.search = this.searchTerm;
      }

      const response = await this.guideService.listGuides(filters);
      this.guides = response.guides || [];
      this.totalGuides = response.total || 0;
    } catch (error) {
      console.error('Error loading guides:', error);
      this.toast.error('Error al cargar las guías');
      this.guides = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async searchGuides(): Promise<void> {
    if (this.searchTerm && this.searchTerm.length > 0 && this.searchTerm.length < 3) {
      return; // Wait for at least 3 characters
    }

    this.currentPage = 0;
    this.isSearching = true;
    await this.loadGuides();
    this.isSearching = false;
  }

  onSearchKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchGuides();
    }
  }

  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadGuides();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadGuides();
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.totalGuides / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadGuides();
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // View guide details
  onViewGuide(guideId: number): void {
    this.viewGuide.emit(guideId);
  }

  // Inline status editing
  startEditStatus(guide: ShippingGuide): void {
    this.editingGuideId = guide.guide_id;
    this.editingStatus = guide.current_status;
  }

  cancelEditStatus(): void {
    this.editingGuideId = null;
    this.editingStatus = null;
  }

  async saveStatus(guide: ShippingGuide): Promise<void> {
    if (!this.editingStatus || this.editingStatus === guide.current_status) {
      this.cancelEditStatus();
      return;
    }

    this.isUpdatingStatus = true;
    try {
      await this.guideService.updateGuideStatus(guide.guide_id, this.editingStatus);
      guide.current_status = this.editingStatus;
      this.toast.success(`Estado actualizado a: ${this.getStatusLabel(this.editingStatus)}`);
      this.cancelEditStatus();
    } catch (error) {
      console.error('Error updating status:', error);
      this.toast.error('Error al actualizar el estado');
    } finally {
      this.isUpdatingStatus = false;
      this.cdr.detectChanges();
    }
  }

  // Helpers
  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(o => o.value === status);
    return option ? option.label : status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'CREATED': 'badge-warning',
      'IN_ROUTE': 'badge-info',
      'IN_WAREHOUSE': 'badge-secondary',
      'OUT_FOR_DELIVERY': 'badge-primary',
      'DELIVERED': 'badge-success'
    };
    return classMap[status] || 'badge-default';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: number): string {
    return value ? `$${value.toLocaleString('es-CO')}` : '$0';
  }
}
