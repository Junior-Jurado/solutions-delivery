import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
    AssignmentService,
    DeliveryUser,
    PendingGuide,
    PendingGuidesResponse,
    AssignmentStatsResponse,
    DeliveryAssignment
} from '@core/services/assignment.service';
import { ToastService } from '@shared/services/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
    selector: 'app-assignment-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent],
    templateUrl: './assignment-panel.component.html',
    styleUrls: ['./assignment-panel.component.scss']
})
export class AssignmentPanelComponent implements OnInit {

    @Output() assignmentCreated = new EventEmitter<void>();

    // Data
    deliveryUsers: DeliveryUser[] = [];
    pendingPickups: PendingGuide[] = [];
    pendingDeliveries: PendingGuide[] = [];
    recentAssignments: DeliveryAssignment[] = [];
    stats: AssignmentStatsResponse | null = null;

    // Loading states
    isLoadingUsers = false;
    isLoadingGuides = false;
    isLoadingStats = false;
    isLoadingAssignments = false;
    isAssigning = false;

    // Assignment modal
    showAssignModal = false;
    selectedGuide: PendingGuide | null = null;
    selectedDeliveryUserId = '';
    assignmentNotes = '';

    // View toggle
    activeView: 'pickups' | 'deliveries' | 'history' = 'pickups';

    constructor(
        private assignmentService: AssignmentService,
        private toast: ToastService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadAll();
    }

    async loadAll(): Promise<void> {
        await Promise.all([
            this.loadDeliveryUsers(),
            this.loadPendingGuides(),
            this.loadStats(),
            this.loadRecentAssignments()
        ]);
    }

    // ==========================================
    // DATA LOADING
    // ==========================================

    async loadDeliveryUsers(): Promise<void> {
        this.isLoadingUsers = true;
        try {
            this.deliveryUsers = await this.assignmentService.getDeliveryUsers();
            console.log('Repartidores cargados:', this.deliveryUsers.length);
        } catch (error) {
            console.error('Error al cargar repartidores:', error);
            this.toast.error('Error al cargar los repartidores');
        } finally {
            this.isLoadingUsers = false;
            this.cdr.detectChanges();
        }
    }

    async loadPendingGuides(): Promise<void> {
        this.isLoadingGuides = true;
        try {
            const response: PendingGuidesResponse = await this.assignmentService.getPendingGuides();
            this.pendingPickups = response.pickups || [];
            this.pendingDeliveries = response.deliveries || [];
            console.log('Guías pendientes - Pickups:', this.pendingPickups.length, 'Deliveries:', this.pendingDeliveries.length);
        } catch (error) {
            console.error('Error al cargar guías pendientes:', error);
            this.toast.error('Error al cargar las guías pendientes');
        } finally {
            this.isLoadingGuides = false;
            this.cdr.detectChanges();
        }
    }

    async loadStats(): Promise<void> {
        this.isLoadingStats = true;
        try {
            this.stats = await this.assignmentService.getAssignmentStats();
            console.log('Estadísticas cargadas:', this.stats);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        } finally {
            this.isLoadingStats = false;
            this.cdr.detectChanges();
        }
    }

    async loadRecentAssignments(): Promise<void> {
        this.isLoadingAssignments = true;
        try {
            const response = await this.assignmentService.getAssignments({ limit: 10 });
            this.recentAssignments = response.assignments || [];
            console.log('Asignaciones recientes:', this.recentAssignments.length);
        } catch (error) {
            console.error('Error al cargar asignaciones:', error);
        } finally {
            this.isLoadingAssignments = false;
            this.cdr.detectChanges();
        }
    }

    // ==========================================
    // ASSIGNMENT MODAL
    // ==========================================

    openAssignModal(guide: PendingGuide): void {
        this.selectedGuide = guide;
        this.selectedDeliveryUserId = '';
        this.assignmentNotes = '';
        this.showAssignModal = true;
        this.cdr.detectChanges();
    }

    closeAssignModal(): void {
        this.showAssignModal = false;
        this.selectedGuide = null;
        this.selectedDeliveryUserId = '';
        this.assignmentNotes = '';
        this.cdr.detectChanges();
    }

    async confirmAssignment(): Promise<void> {
        if (!this.selectedGuide || !this.selectedDeliveryUserId) {
            this.toast.error('Seleccione un repartidor');
            return;
        }

        this.isAssigning = true;
        this.cdr.detectChanges();

        try {
            await this.assignmentService.createAssignment({
                guide_id: this.selectedGuide.guide_id,
                delivery_user_id: this.selectedDeliveryUserId,
                assignment_type: this.selectedGuide.assignment_type,
                notes: this.assignmentNotes || undefined
            });

            const selectedUser = this.deliveryUsers.find(u => u.user_id === this.selectedDeliveryUserId);
            const userName = selectedUser?.full_name || 'Repartidor';
            const actionType = this.selectedGuide.assignment_type === 'PICKUP' ? 'recoger' : 'entregar';

            this.toast.success(
                `Guía #${this.selectedGuide.guide_id} asignada a ${userName} para ${actionType}`
            );

            this.closeAssignModal();
            this.assignmentCreated.emit();

            // Recargar datos
            await this.loadAll();

        } catch (error) {
            console.error('Error al asignar:', error);
            const message = error instanceof Error ? error.message : 'Error al crear la asignación';
            this.toast.error(message);
        } finally {
            this.isAssigning = false;
            this.cdr.detectChanges();
        }
    }

    // ==========================================
    // VIEW TOGGLE
    // ==========================================

    setActiveView(view: 'pickups' | 'deliveries' | 'history'): void {
        this.activeView = view;
        this.cdr.detectChanges();
    }

    // ==========================================
    // HELPERS
    // ==========================================

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'PENDING': 'Pendiente',
            'IN_PROGRESS': 'En Progreso',
            'COMPLETED': 'Completado',
            'CANCELLED': 'Cancelado'
        };
        return labels[status] || status;
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'PENDING': 'badge-warning',
            'IN_PROGRESS': 'badge-info',
            'COMPLETED': 'badge-success',
            'CANCELLED': 'badge-error'
        };
        return classes[status] || 'badge-default';
    }

    getAssignmentTypeLabel(type: string): string {
        return type === 'PICKUP' ? 'Recoger' : 'Entregar';
    }

    getAssignmentTypeClass(type: string): string {
        return type === 'PICKUP' ? 'badge-info' : 'badge-warning';
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getDeliveryUserWorkload(user: DeliveryUser): number {
        return user.active_pickups + user.active_deliveries;
    }

    getWorkloadClass(user: DeliveryUser): string {
        const workload = this.getDeliveryUserWorkload(user);
        if (workload === 0) return 'workload-free';
        if (workload <= 3) return 'workload-low';
        if (workload <= 6) return 'workload-medium';
        return 'workload-high';
    }
}
