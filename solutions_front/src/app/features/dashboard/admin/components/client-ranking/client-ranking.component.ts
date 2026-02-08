import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, ClientRanking, ClientRankingFilters } from '@core/services/admin.service';
import { ToastService } from '@shared/services/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-client-ranking',
  standalone: true,
  templateUrl: './client-ranking.component.html',
  styleUrls: ['./client-ranking.component.scss'],
  imports: [CommonModule, FormsModule, IconComponent]
})
export class ClientRankingComponent implements OnInit {
  // Loading state
  isLoading = false;

  // Data
  clients: ClientRanking[] = [];
  totalClients = 0;

  // Filters
  filters: ClientRankingFilters = {
    sort_by: 'total_guides',
    order: 'desc',
    limit: 20,
    min_guides: 1
  };

  // Date range for filtering
  dateFrom = '';
  dateTo = '';

  // Sort options
  sortOptions: { value: string; label: string }[] = [
    { value: 'total_guides', label: 'Total de Guias' },
    { value: 'total_spent', label: 'Total Gastado' },
    { value: 'avg_value', label: 'Valor Promedio' },
    { value: 'last_activity', label: 'Ultima Actividad' }
  ];

  // Min guides options
  minGuidesOptions: number[] = [1, 5, 10, 20, 50];

  // Limit options
  limitOptions: number[] = [10, 20, 50, 100];

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateTo = this.formatDateForInput(today);
    this.dateFrom = this.formatDateForInput(thirtyDaysAgo);

    this.loadRanking();
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async loadRanking(): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      // Build filters with dates if set
      const requestFilters: ClientRankingFilters = {
        ...this.filters
      };

      if (this.dateFrom) {
        requestFilters.date_from = this.dateFrom;
      }
      if (this.dateTo) {
        requestFilters.date_to = this.dateTo;
      }

      const response = await this.adminService.getClientRanking(requestFilters);
      this.clients = response.clients || [];
      this.totalClients = response.total || this.clients.length;

      console.log('Client ranking loaded:', this.clients.length);
    } catch (error) {
      console.error('Error loading client ranking:', error);
      this.toast.error('Error al cargar el ranking de clientes');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  applyFilters(): void {
    this.loadRanking();
  }

  resetFilters(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.filters = {
      sort_by: 'total_guides',
      order: 'desc',
      limit: 20,
      min_guides: 1
    };
    this.dateTo = this.formatDateForInput(today);
    this.dateFrom = this.formatDateForInput(thirtyDaysAgo);

    this.loadRanking();
  }

  toggleSortOrder(): void {
    this.filters.order = this.filters.order === 'desc' ? 'asc' : 'desc';
    this.loadRanking();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  getRankBadgeClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  }

  getActivityStatus(lastActivity: string): { class: string; label: string } {
    if (!lastActivity) {
      return { class: 'status-inactive', label: 'Sin actividad' };
    }

    const lastDate = new Date(lastActivity);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return { class: 'status-active', label: 'Activo' };
    } else if (diffDays <= 30) {
      return { class: 'status-recent', label: 'Reciente' };
    } else if (diffDays <= 90) {
      return { class: 'status-moderate', label: 'Moderado' };
    } else {
      return { class: 'status-inactive', label: 'Inactivo' };
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
