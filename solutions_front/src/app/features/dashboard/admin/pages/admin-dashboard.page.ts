import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Services
import { ToastService } from "@shared/services/toast.service";
import { TranslationService } from "@shared/services/translation.service";
import {
    CashClose,
    CashCloseRequest,
    CashCloseService,
    CashCloseStatsResponse
} from "@core/services/cash-close.service";
import {
    AdminService,
    Employee as BackendEmployee,
    SystemAlert as BackendAlert,
    WorkerStats,
    RealtimeDelivery,
    ActiveRoute as BackendActiveRoute,
    StatusCount
} from "@core/services/admin.service";
import { AssignmentService, DeliveryUser, PendingGuide } from "@core/services/assignment.service";
import { GuideService, GuideFormValue } from "@core/services/guide.service";

// Shared Components
import { IconComponent } from "@shared/components/icon/icon.component";
import { DashboardHeaderComponent } from "@shared/components/dashboard-header/dashboard-header.component";

// Admin Components
import { AdminStatsCardsComponent } from "../components/admin-stats-cards/admin-stats-cards.component";
import { WorkerPerformanceComponent } from "../components/worker-performance/worker-performance.component";
import { AdminStatusDistributionComponent } from "../components/admin-status-distribution/admin-status-distribution.component";
import { AlertsPanelComponent } from "../components/alerts-panel/alerts-panel.component";
import { EmployeeFormComponent } from "../components/employee-form/employee-form.component";
import { EmployeeListComponent } from "../components/employee-list/employee-list.component";
import { DeliveryOverviewComponent } from "../components/delivery-overview/delivery-overview.component";
import { RealtimeDeliveriesComponent } from "../components/realtime-deliveries/realtime-deliveries.component";
import { RouteAssignmentFormComponent } from "../components/route-assignment-form/route-assignment-form.component";
import { ActiveRoutesComponent } from "../components/active-routes/active-routes.component";
import { AssignmentPanelComponent } from "@shared/components/assignment-panel/assignment-panel.component";

import { CashCloseFormComponent, CashCloseFormData } from "../components/cash-close-form/cash-close-form.component";
import { CashCloseListComponent } from "../components/cash-close-list/cash-close-list.component";
import { CashCloseStatsComponent } from "../components/cash-close-stats/cash-close-stats.component";
import { GuideAdminModalComponent } from "../components/guide-admin-modal/guide-admin-modal.component";
import { AdminGuidesComponent } from "../components/admin-guides/admin-guides.component";
import { ClientRankingComponent } from "../components/client-ranking/client-ranking.component";

import { GuideFormComponent } from "@shared/components/guide-form/guide-form.component";
import { GuidePreviewModalComponent, GuidePreviewData } from "@shared/components/guide-preview-modal/guide-preview-modal.component";
import { UserProfileComponent } from "@shared/components/user-profile/user-profile.component";

// Guide Service
import { GuideStatus } from "@core/services/guide.service";

// Interfaces for components
export interface AdminStats {
    shipmentsToday: number;
    shipmentsYesterday: number;
    delivered: number;
    deliverySuccessRate: number;
    pending: number;
    pendingInRoute: number;
    pendingInOffice: number;
    revenueToday: number;
    revenueYesterday: number;
    averageDeliveryTime: number;
    satisfactionRate: number;
}

export interface WorkerPerformance {
    name: string;
    deliveries: number;
    efficiency: number;
}

export interface ShipmentStatus {
    status: string;
    count: number;
    color: string;
    percentage: number;
}

export interface SystemAlert {
    id: string;
    type: 'warning' | 'error' | 'info';
    title: string;
    description: string;
    timestamp: Date;
    guideId?: number;
    userId?: string;
}

// Employee interface removed - using BackendEmployee from admin.service

export interface DeliveryItem {
    id: string;
    customer: string;
    address: string;
    status: 'En ruta' | 'Entregado' | 'Pendiente';
    deliveryPerson: string;
    time: string;
    serviceType?: string;
}

export interface ActiveRoute {
    name: string;
    packages: number;
    completed: number;
    zone: string;
    status: 'En ruta' | 'Completado';
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    templateUrl: './admin-dashboard.page.html',
    styleUrls: ['./admin-dashboard.page.scss'],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IconComponent,
        DashboardHeaderComponent,
        AdminStatsCardsComponent,
        WorkerPerformanceComponent,
        AdminStatusDistributionComponent,
        AlertsPanelComponent,
        EmployeeFormComponent,
        EmployeeListComponent,
        DeliveryOverviewComponent,
        RealtimeDeliveriesComponent,
        RouteAssignmentFormComponent,
        ActiveRoutesComponent,
        AssignmentPanelComponent,
        CashCloseFormComponent,
        CashCloseListComponent,
        CashCloseStatsComponent,
        GuideAdminModalComponent,
        AdminGuidesComponent,
        GuideFormComponent,
        GuidePreviewModalComponent,
        ClientRankingComponent,
        UserProfileComponent
    ]
})
export class AdminDashboardPage implements OnInit, OnDestroy {
    // ==========================================
    // NAVIGATION
    // ==========================================
    activeTab = 'stats';

    // Sub-tabs para Operaciones (Empleados + Guías + Clientes)
    operationsSubTab: 'employees' | 'guides' | 'clients' = 'employees';

    // Sub-tabs para Entregas (Vista General + Asignaciones)
    deliveriesSubTab: 'overview' | 'assignments' = 'overview';

    // ==========================================
    // USER
    // ==========================================
    currentUserId = '';
    userName = '';

    // ==========================================
    // LOADING STATES
    // ==========================================
    isLoadingStats = false;
    isLoadingEmployees = false;
    isLoadingDeliveries = false;
    isLoadingRoutes = false;
    isRefreshing = false;

    // ==========================================
    // CASH CLOSE
    // ==========================================
    isGeneratingClose = false;
    cashCloses: CashClose[] = [];
    isLoadingCloses = false;
    totalCloses = 0;
    currentClosePage = 0;
    closePageSize = 10;
    cashCloseStats: CashCloseStatsResponse | null = null;
    isLoadingCloseStats = false;

    // ==========================================
    // STATS DATA
    // ==========================================
    stats: AdminStats = {
        shipmentsToday: 0,
        shipmentsYesterday: 0,
        delivered: 0,
        deliverySuccessRate: 0,
        pending: 0,
        pendingInRoute: 0,
        pendingInOffice: 0,
        revenueToday: 0,
        revenueYesterday: 0,
        averageDeliveryTime: 0,
        satisfactionRate: 0
    };

    // ==========================================
    // WORKER PERFORMANCE
    // ==========================================
    workers: WorkerPerformance[] = [];

    // ==========================================
    // STATUS DISTRIBUTION
    // ==========================================
    statusDistribution: ShipmentStatus[] = [];

    // ==========================================
    // ALERTS
    // ==========================================
    alerts: SystemAlert[] = [];

    // ==========================================
    // EMPLOYEES
    // ==========================================
    employees: BackendEmployee[] = [];

    // ==========================================
    // DELIVERIES
    // ==========================================
    deliveries: DeliveryItem[] = [];

    // ==========================================
    // ACTIVE ROUTES
    // ==========================================
    activeRoutes: ActiveRoute[] = [];

    // ==========================================
    // AVAILABLE PACKAGES FOR ASSIGNMENT
    // ==========================================
    availablePackages: { id: string; address: string; selected: boolean }[] = [];

    // ==========================================
    // DELIVERY PERSONS
    // ==========================================
    deliveryPersons: { id: string; name: string }[] = [];

    // ==========================================
    // GUIDE MODAL
    // ==========================================
    isGuideModalOpen = false;
    selectedGuideId: number | null = null;

    // ==========================================
    // GUIDE CREATION (Admin)
    // ==========================================
    guidesSubTab: 'create' | 'manage' = 'manage';
    showGuidePreview = false;
    guidePreviewData: GuidePreviewData | null = null;
    pendingGuideData: GuideFormValue | null = null;
    isCreatingGuide = false;

    // ==========================================
    // VIEW CHILDREN
    // ==========================================
    @ViewChild(AdminGuidesComponent) adminGuidesComponent?: AdminGuidesComponent;
    @ViewChild(GuideFormComponent) guideFormComponent?: GuideFormComponent;
    @ViewChild(ClientRankingComponent) clientRankingComponent?: ClientRankingComponent;

    // ==========================================
    // USER PROFILE
    // ==========================================
    showUserProfile = false;

    // ==========================================
    // REFRESH INTERVAL
    // ==========================================
    private refreshInterval: ReturnType<typeof setInterval> | null = null;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    constructor(
        private router: Router,
        private translationService: TranslationService,
        private toast: ToastService,
        private cashCloseService: CashCloseService,
        private adminService: AdminService,
        private assignmentService: AssignmentService,
        private guideService: GuideService,
        private cdr: ChangeDetectorRef
    ) {}

    // ==========================================
    // LIFECYCLE
    // ==========================================
    ngOnInit(): void {
        this.loadCurrentUser();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    ngOnDestroy(): void {
        this.stopAutoRefresh();
    }

    // ==========================================
    // AUTO REFRESH
    // ==========================================
    private startAutoRefresh(): void {
        // Refrescar estadísticas cada 30 segundos
        this.refreshInterval = setInterval(() => {
            if (this.activeTab === 'stats' || this.activeTab === 'deliveries') {
                this.loadStats(true);
            }
        }, 30000);
    }

    private stopAutoRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    private loadCurrentUser(): void {
        const idToken = sessionStorage.getItem('idToken');
        if (idToken) {
            try {
                const payload = JSON.parse(atob(idToken.split('.')[1]));
                this.currentUserId = payload.sub || payload['cognito:username'];
                const savedName = sessionStorage.getItem('userDisplayName');
                const rawName = savedName || payload['custom:full_name'] || payload.name || 'Administrador';
                this.userName = this.fixUtf8Encoding(rawName);
            } catch (error) {
                console.error('Error al decodificar token:', error);
                this.router.navigate(['/auth']);
            }
        } else {
            this.router.navigate(['/auth']);
        }
    }

    private fixUtf8Encoding(text: string): string {
        if (!text) return text;
        try {
            if (/Ã[\x80-\xBF]/.test(text)) {
                const bytes = new Uint8Array([...text].map(c => c.charCodeAt(0)));
                return new TextDecoder('utf-8').decode(bytes);
            }
            return text;
        } catch {
            return text;
        }
    }

    private async loadInitialData(): Promise<void> {
        await this.loadStats();
        await this.loadDeliveryPersons();
    }

    // ==========================================
    // TAB NAVIGATION
    // ==========================================
    setActiveTab(tab: string): void {
        this.activeTab = tab;

        if (tab === 'stats') {
            this.loadStats();
        } else if (tab === 'operations') {
            // Cargar datos según el sub-tab activo
            if (this.operationsSubTab === 'employees') {
                this.loadEmployees();
            }
        } else if (tab === 'deliveries') {
            // Cargar datos según el sub-tab activo
            if (this.deliveriesSubTab === 'overview') {
                this.loadDeliveries();
                this.loadRoutes();
            }
        } else if (tab === 'finance') {
            this.loadCashCloses();
            this.loadCashCloseStats();
        }
    }

    // Sub-tabs para Operaciones
    setOperationsSubTab(subTab: 'employees' | 'guides' | 'clients'): void {
        this.operationsSubTab = subTab;
        if (subTab === 'employees') {
            this.loadEmployees();
        } else if (subTab === 'guides' && this.adminGuidesComponent) {
            this.adminGuidesComponent.loadGuides();
        }
        // ClientRankingComponent loads its own data on init
    }

    // Sub-tabs para Entregas
    setDeliveriesSubTab(subTab: 'overview' | 'assignments'): void {
        this.deliveriesSubTab = subTab;
        if (subTab === 'overview') {
            this.loadDeliveries();
            this.loadRoutes();
        }
        // El AssignmentPanelComponent carga sus propios datos
    }

    // ==========================================
    // DATA LOADERS
    // ==========================================
    async loadStats(silent = false): Promise<void> {
        if (!silent) {
            this.isLoadingStats = true;
            this.cdr.detectChanges();
        }

        try {
            const response = await this.adminService.getDashboardStats();

            // Map to local stats format
            this.stats = {
                shipmentsToday: response.shipments_today,
                shipmentsYesterday: response.shipments_yesterday,
                delivered: response.delivered,
                deliverySuccessRate: response.delivery_rate,
                pending: response.pending,
                pendingInRoute: response.pending_in_route,
                pendingInOffice: response.pending_in_office,
                revenueToday: response.revenue_today,
                revenueYesterday: response.revenue_yesterday,
                averageDeliveryTime: response.average_delivery_time || 0,
                satisfactionRate: response.satisfaction_rate || 0
            };

            // Map worker performance
            this.workers = (response.worker_performance || []).map((w: WorkerStats) => ({
                name: w.name || 'Sin nombre',
                deliveries: w.deliveries_today,
                efficiency: Math.round(w.efficiency)
            }));

            // Map status distribution
            this.statusDistribution = (response.status_distribution || []).map((s: StatusCount) => ({
                status: this.translateStatus(s.status),
                count: s.count,
                color: this.getStatusColor(s.status),
                percentage: Math.round(s.percentage)
            }));

            // Map alerts
            this.alerts = (response.alerts || []).map((a: BackendAlert) => ({
                id: a.id,
                type: a.type as 'warning' | 'error' | 'info',
                title: a.title,
                description: a.description,
                timestamp: new Date(a.timestamp),
                guideId: a.guide_id,
                userId: a.user_id
            }));

            // Map realtime deliveries
            this.deliveries = (response.realtime_deliveries || []).map((d: RealtimeDelivery) => ({
                id: d.guide_id.toString(),
                customer: d.customer,
                address: d.address,
                status: this.mapDeliveryStatus(d.status),
                deliveryPerson: d.delivery_person,
                time: this.formatRelativeTime(d.assigned_at),
                serviceType: d.service_type
            }));

            // Map active routes
            this.activeRoutes = (response.active_routes || []).map((r: BackendActiveRoute) => ({
                name: r.name || 'Sin nombre',
                packages: r.packages,
                completed: r.completed,
                zone: r.zone,
                status: r.status as 'En ruta' | 'Completado'
            }));

            if (!silent) {
                console.log('Estadísticas cargadas correctamente');
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            if (!silent) {
                this.toast.error('Error al cargar las estadísticas');
            }
        } finally {
            if (!silent) {
                this.isLoadingStats = false;
                this.cdr.detectChanges();
            }
        }
    }

    private async loadEmployees(): Promise<void> {
        this.isLoadingEmployees = true;
        this.cdr.detectChanges();

        try {
            const response = await this.adminService.getEmployees();
            // Pasar los empleados directamente sin transformar
            this.employees = response.employees || [];
            console.log('Empleados cargados:', this.employees.length);
        } catch (error) {
            console.error('Error al cargar empleados:', error);
            this.toast.error('Error al cargar los empleados');
        } finally {
            this.isLoadingEmployees = false;
            this.cdr.detectChanges();
        }
    }

    private async loadDeliveries(): Promise<void> {
        this.isLoadingDeliveries = true;
        this.cdr.detectChanges();

        try {
            // Reload stats to get fresh realtime deliveries
            await this.loadStats(true);
        } catch (error) {
            console.error('Error al cargar entregas:', error);
            this.toast.error('Error al cargar las entregas');
        } finally {
            this.isLoadingDeliveries = false;
            this.cdr.detectChanges();
        }
    }

    private async loadRoutes(): Promise<void> {
        this.isLoadingRoutes = true;
        this.cdr.detectChanges();

        try {
            // Load pending guides for assignment
            const pendingGuides = await this.assignmentService.getPendingGuides();

            this.availablePackages = [
                ...(pendingGuides.pickups || []).map((g: PendingGuide) => ({
                    id: g.guide_id.toString(),
                    address: `${g.contact_address} - ${g.origin_city_name}`,
                    selected: false
                })),
                ...(pendingGuides.deliveries || []).map((g: PendingGuide) => ({
                    id: g.guide_id.toString(),
                    address: `${g.contact_address} - ${g.destination_city_name}`,
                    selected: false
                }))
            ];

            // Reload stats to get fresh active routes
            await this.loadStats(true);
        } catch (error) {
            console.error('Error al cargar rutas:', error);
            this.toast.error('Error al cargar las rutas');
        } finally {
            this.isLoadingRoutes = false;
            this.cdr.detectChanges();
        }
    }

    private async loadDeliveryPersons(): Promise<void> {
        try {
            const users = await this.assignmentService.getDeliveryUsers();
            this.deliveryPersons = (users || []).map((u: DeliveryUser) => ({
                id: u.user_id,
                name: u.full_name || u.email
            }));
        } catch (error) {
            console.error('Error al cargar repartidores:', error);
        }
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    handleUserUpdated(employee: BackendEmployee): void {
        console.log('User updated:', employee);
        // Reload employees list
        this.loadEmployees();
    }

    handleUserFound(employee: BackendEmployee): void {
        console.log('User found via document search:', employee);
        // Reload stats and employees to show updated statistics
        this.loadStats(true);
        this.loadEmployees();
    }

    handleAlertAction(alertId: string): void {
        console.log('Alert expanded/collapsed:', alertId);
        // La alerta ya se expande/colapsa en el componente
    }

    handleViewGuide(guideId: number): void {
        console.log('Viewing guide:', guideId);
        this.selectedGuideId = guideId;
        this.isGuideModalOpen = true;
        this.cdr.detectChanges();
    }

    closeGuideModal(): void {
        this.isGuideModalOpen = false;
        this.selectedGuideId = null;
        this.cdr.detectChanges();
    }

    handleGuideStatusUpdated(event: { guideId: number; newStatus: GuideStatus }): void {
        console.log('Guide status updated:', event);
        // Reload stats to reflect changes
        this.loadStats(true);
    }

    handleDismissAlert(alertId: string): void {
        console.log('Dismissing alert:', alertId);
        this.alerts = this.alerts.filter(a => a.id !== alertId);
        this.cdr.detectChanges();
        this.toast.success('Alerta descartada');
    }

    // ==========================================
    // GUIDE CREATION HANDLERS
    // ==========================================
    setGuidesSubTab(subTab: 'create' | 'manage'): void {
        this.guidesSubTab = subTab;
        if (subTab === 'manage' && this.adminGuidesComponent) {
            this.adminGuidesComponent.loadGuides();
        }
    }

    async handleGuideFormSubmit(formData: GuideFormValue): Promise<void> {
        // Calcular el precio via backend
        const calculatedPrice = await this.guideService.calculatePriceAsync(formData);

        // Guardar datos pendientes
        this.pendingGuideData = formData;

        // Preparar datos para el preview
        this.guidePreviewData = {
            senderName: formData.senderName,
            senderCity: formData.senderCityName || '',
            senderAddress: formData.senderAddress,
            senderPhone: formData.senderPhone,
            senderDoc: `${formData.senderDocType || ''} ${formData.senderDoc}`,
            receiverName: formData.receiverName,
            receiverCity: formData.receiverCityName || '',
            receiverAddress: formData.receiverAddress,
            receiverPhone: formData.receiverPhone,
            receiverDoc: `${formData.receiverDocType || ''} ${formData.receiverDoc}`,
            weight: Number(formData.weight) || 0,
            declaredValue: Number(formData.declaredValue) || 0,
            serviceType: formData.serviceType,
            pieces: Number(formData.pieces) || 1,
            dimensions: formData.dimensions || '',
            calculatedPrice: calculatedPrice
        };

        // Mostrar modal de confirmación
        this.showGuidePreview = true;
        this.cdr.detectChanges();
    }

    async confirmGuideCreation(event: { price: number; reason: string }): Promise<void> {
        if (!this.pendingGuideData) return;

        this.isCreatingGuide = true;
        if (this.guideFormComponent) {
            this.guideFormComponent.setSubmitting(true);
        }
        this.cdr.detectChanges();

        try {
            // Usar el precio final (puede ser modificado por el admin)
            const guideRequest = this.guideService.buildGuideRequest(
                this.pendingGuideData,
                this.currentUserId,
                event.price // Precio personalizado
            );

            // Agregar razón del override si existe
            if (event.reason) {
                guideRequest.pricing.override_reason = event.reason;
            }

            const response = await this.guideService.createGuide(guideRequest);

            this.toast.success(
                `¡Guía creada exitosamente!\nNúmero: ${response.guide_number}`,
                3000
            );

            // Descargar PDF automáticamente
            if (response.guide_id) {
                await this.guideService.downloadGuidePDF(response.guide_id);
            }

            // Cerrar modal y limpiar
            this.showGuidePreview = false;
            this.pendingGuideData = null;
            this.guidePreviewData = null;

            // Resetear formulario
            if (this.guideFormComponent) {
                this.guideFormComponent.resetForm();
            }

            // Cambiar a la sub-tab de gestión y recargar
            this.setGuidesSubTab('manage');

        } catch (error) {
            console.error('Error creating guide:', error);
            const message = error instanceof Error ? error.message : 'Error al crear la guía';
            this.toast.error(message);
        } finally {
            this.isCreatingGuide = false;
            if (this.guideFormComponent) {
                this.guideFormComponent.setSubmitting(false);
            }
            this.cdr.detectChanges();
        }
    }

    cancelGuideCreation(): void {
        this.showGuidePreview = false;
        this.pendingGuideData = null;
        this.guidePreviewData = null;
        if (this.guideFormComponent) {
            this.guideFormComponent.setSubmitting(false);
        }
        this.cdr.detectChanges();
    }

    async handleRouteAssignment(assignment: { deliveryPersonId: string; packageIds: string[]; priority: string }): Promise<void> {
        console.log('Assigning route:', assignment);

        try {
            // Create assignments for each package
            for (const packageId of assignment.packageIds) {
                await this.assignmentService.createAssignment({
                    guide_id: parseInt(packageId),
                    delivery_user_id: assignment.deliveryPersonId,
                    assignment_type: 'DELIVERY',
                    notes: `Prioridad: ${assignment.priority}`
                });
            }

            this.toast.success('Rutas asignadas exitosamente');
            await this.loadRoutes();
        } catch (error) {
            console.error('Error al asignar ruta:', error);
            this.toast.error('Error al asignar las rutas');
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================
    formatPrice(price: number): string {
        return this.translationService.formatCurrency(price);
    }

    calculatePercentageChange(current: number, previous: number): number {
        if (previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    private translateStatus(status: string): string {
        const statusMap: Record<string, string> = {
            'CREATED': 'Creado',
            'IN_ROUTE': 'En ruta',
            'IN_WAREHOUSE': 'En bodega',
            'OUT_FOR_DELIVERY': 'En reparto',
            'DELIVERED': 'Entregado'
        };
        return statusMap[status] || status;
    }

    private getStatusColor(status: string): string {
        const colorMap: Record<string, string> = {
            'CREATED': 'warning',
            'IN_ROUTE': 'primary',
            'IN_WAREHOUSE': 'secondary',
            'OUT_FOR_DELIVERY': 'info',
            'DELIVERED': 'success'
        };
        return colorMap[status] || 'default';
    }

    private translateRole(role: string): string {
        const roleMap: Record<string, string> = {
            'CLIENT': 'Cliente',
            'ADMIN': 'Administrador',
            'SECRETARY': 'Secretaria',
            'DELIVERY': 'Entregador'
        };
        return roleMap[role] || role;
    }

    private mapDeliveryStatus(status: string): 'En ruta' | 'Entregado' | 'Pendiente' {
        const statusMap: Record<string, 'En ruta' | 'Entregado' | 'Pendiente'> = {
            'IN_ROUTE': 'En ruta',
            'OUT_FOR_DELIVERY': 'En ruta',
            'DELIVERED': 'Entregado',
            'CREATED': 'Pendiente',
            'IN_WAREHOUSE': 'Pendiente',
            'PENDING': 'Pendiente',
            'IN_PROGRESS': 'En ruta'
        };
        return statusMap[status] || 'Pendiente';
    }

    private formatRelativeTime(dateStr: string): string {
        if (!dateStr) return 'N/A';

        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Ahora';
            if (diffMins < 60) return `Hace ${diffMins} min`;

            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `Hace ${diffHours}h`;

            const diffDays = Math.floor(diffHours / 24);
            return `Hace ${diffDays}d`;
        } catch {
            return 'N/A';
        }
    }

    // ==========================================
    // CASH CLOSE METHODS
    // ==========================================
    async handleCashCloseGenerate(formData: CashCloseFormData): Promise<void> {
        const request: CashCloseRequest = {
            period_type: formData.periodType,
            year: formData.year
        };

        if (formData.month) request.month = formData.month;
        if (formData.day) request.day = formData.day;
        if (formData.week) request.week = formData.week;

        this.isGeneratingClose = true;

        try {
            const response = await this.cashCloseService.generateCashClose(request);

            this.toast.success(
                `Cierre de caja generado exitosamente! Total: $${response.close.total_amount.toLocaleString()} - Guias: ${response.close.total_guides}`
            );

            if (response.close.pdf_url) {
                await this.cashCloseService.downloadCashClosePDF(response.close.close_id);
            }

            await this.loadCashCloses();
            await this.loadCashCloseStats();

        } catch (error) {
            console.error('Error al generar cierre:', error);
            const message = error instanceof Error ? error.message : 'Error al generar el cierre de caja';
            this.toast.error(message);
        } finally {
            this.isGeneratingClose = false;
            this.cdr.detectChanges();
        }
    }

    async loadCashCloses(): Promise<void> {
        this.isLoadingCloses = true;
        this.cdr.detectChanges();

        try {
            const response = await this.cashCloseService.listCashCloses(
                this.closePageSize,
                this.currentClosePage * this.closePageSize
            );

            this.cashCloses = response.closes || [];
            this.totalCloses = response.total || 0;

            if (this.cashCloses.length === 0) {
                console.log('No hay cierres de caja registrados');
            } else {
                console.log('Cierres de caja cargados:', this.cashCloses.length);
            }
        } catch (error) {
            console.error('Error al cargar cierres:', error);
            this.cashCloses = [];
            this.totalCloses = 0;
            this.toast.error('Error al cargar los cierres de caja');
        } finally {
            this.isLoadingCloses = false;
            this.cdr.detectChanges();
        }
    }

    async loadCashCloseStats(): Promise<void> {
        this.isLoadingCloseStats = true;
        this.cdr.detectChanges();

        try {
            this.cashCloseStats = await this.cashCloseService.getCashCloseStats();
            console.log('Estadisticas de cierres cargadas:', this.cashCloseStats);
        } catch (error) {
            console.error('Error al cargar estadisticas de cierres:', error);
            this.toast.error('Error al cargar las estadisticas');
        } finally {
            this.isLoadingCloseStats = false;
            this.cdr.detectChanges();
        }
    }

    handleClosePageChange(direction: 'prev' | 'next'): void {
        if (direction === 'prev' && this.currentClosePage > 0) {
            this.currentClosePage--;
            this.loadCashCloses();
        } else if (direction === 'next') {
            const totalPages = Math.ceil(this.totalCloses / this.closePageSize);
            if (this.currentClosePage < totalPages - 1) {
                this.currentClosePage++;
                this.loadCashCloses();
            }
        }
    }

    async downloadClosePDF(closeId: number): Promise<void> {
        try {
            await this.cashCloseService.downloadCashClosePDF(closeId);
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            this.toast.error('Error al descargar el PDF del cierre');
        }
    }

    // ==========================================
    // REFRESH
    // ==========================================
    async handleRefresh(): Promise<void> {
        if (this.isRefreshing) return;

        this.isRefreshing = true;
        this.cdr.detectChanges();

        try {
            switch (this.activeTab) {
                case 'stats':
                    await this.loadStats();
                    break;
                case 'operations':
                    if (this.operationsSubTab === 'employees') {
                        await this.loadEmployees();
                    } else if (this.operationsSubTab === 'guides' && this.adminGuidesComponent) {
                        await this.adminGuidesComponent.loadGuides();
                    } else if (this.operationsSubTab === 'clients' && this.clientRankingComponent) {
                        await this.clientRankingComponent.loadRanking();
                    }
                    break;
                case 'deliveries':
                    if (this.deliveriesSubTab === 'overview') {
                        await this.loadDeliveries();
                        await this.loadRoutes();
                    }
                    // AssignmentPanel tiene su propio refresh interno
                    break;
                case 'finance':
                    await this.loadCashCloses();
                    await this.loadCashCloseStats();
                    break;
                default:
                    await this.loadStats();
            }
            this.toast.success('Datos actualizados correctamente');
        } catch (error) {
            console.error('Error al refrescar:', error);
            this.toast.error('Error al actualizar los datos');
        } finally {
            this.isRefreshing = false;
            this.cdr.detectChanges();
        }
    }

    // ==========================================
    // PROFILE
    // ==========================================
    openProfile(): void {
        this.showUserProfile = true;
        this.cdr.detectChanges();
    }

    closeProfile(): void {
        this.showUserProfile = false;
        this.cdr.detectChanges();
    }

    // ==========================================
    // AUTH
    // ==========================================
    handleLogout(): void {
        sessionStorage.clear();
        this.router.navigate(['/dashboard']);
    }
}
