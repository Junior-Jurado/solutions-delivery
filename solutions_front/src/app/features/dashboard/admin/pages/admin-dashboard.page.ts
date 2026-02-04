import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
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

import { CashCloseFormComponent, CashCloseFormData } from "../components/cash-close-form/cash-close-form.component";
import { CashCloseListComponent } from "../components/cash-close-list/cash-close-list.component";
import { CashCloseStatsComponent } from "../components/cash-close-stats/cash-close-stats.component";

// Interfaces
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
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    status: string;
    performance: string;
}

export interface DeliveryItem {
    id: string;
    customer: string;
    address: string;
    status: 'En ruta' | 'Entregado' | 'Pendiente';
    deliveryPerson: string;
    time: string;
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
        CashCloseFormComponent,
        CashCloseListComponent,
        CashCloseStatsComponent
    ]
})
export class AdminDashboardPage implements OnInit {
    // ==========================================
    // NAVIGATION
    // ==========================================
    activeTab: string = 'stats';

    // ==========================================
    // USER
    // ==========================================
    currentUserId: string = '';
    userName: string = '';

    // ==========================================
    // LOADING STATES
    // ==========================================
    isLoadingStats: boolean = false;
    isLoadingEmployees: boolean = false;
    isLoadingDeliveries: boolean = false;
    isLoadingRoutes: boolean = false;

    // ==========================================
    // CASH CLOSE
    // ==========================================
    isGeneratingClose: boolean = false;
    cashCloses: CashClose[] = [];
    isLoadingCloses: boolean = false;
    totalCloses: number = 0;
    currentClosePage: number = 0;
    closePageSize: number = 10;
    cashCloseStats: CashCloseStatsResponse | null = null;
    isLoadingCloseStats: boolean = false;

    // ==========================================
    // STATS DATA
    // ==========================================
    stats: AdminStats = {
        shipmentsToday: 89,
        shipmentsYesterday: 79,
        delivered: 76,
        deliverySuccessRate: 85.4,
        pending: 13,
        pendingInRoute: 8,
        pendingInOffice: 5,
        revenueToday: 2100000,
        revenueYesterday: 1944444
    };

    // ==========================================
    // WORKER PERFORMANCE
    // ==========================================
    workers: WorkerPerformance[] = [
        { name: "Carlos López", deliveries: 24, efficiency: 95 },
        { name: "Ana Martínez", deliveries: 18, efficiency: 88 },
        { name: "Luis García", deliveries: 16, efficiency: 92 },
        { name: "María Rodríguez", deliveries: 14, efficiency: 86 }
    ];

    // ==========================================
    // STATUS DISTRIBUTION
    // ==========================================
    statusDistribution: ShipmentStatus[] = [
        { status: "Entregado", count: 156, color: "success", percentage: 65 },
        { status: "En ruta", count: 45, color: "primary", percentage: 19 },
        { status: "En oficina", count: 28, color: "warning", percentage: 12 },
        { status: "Pendiente", count: 11, color: "error", percentage: 4 }
    ];

    // ==========================================
    // ALERTS
    // ==========================================
    alerts: SystemAlert[] = [
        {
            id: '1',
            type: 'warning',
            title: 'Entrega retrasada',
            description: 'Guía EE123456789 - Más de 2 horas de retraso',
            timestamp: new Date()
        },
        {
            id: '2',
            type: 'error',
            title: 'Entregador inactivo',
            description: 'Pedro Jiménez sin reportes desde hace 3 horas',
            timestamp: new Date()
        }
    ];

    // ==========================================
    // EMPLOYEES
    // ==========================================
    employees: Employee[] = [
        { id: '1', name: "María González", role: "Secretaria", status: "Activo", performance: "Excelente" },
        { id: '2', name: "Carlos López", role: "Entregador", status: "En ruta", performance: "Muy bueno" },
        { id: '3', name: "Ana Martínez", role: "Entregador", status: "Activo", performance: "Bueno" },
        { id: '4', name: "Luis García", role: "Entregador", status: "Activo", performance: "Excelente" }
    ];

    // ==========================================
    // DELIVERIES
    // ==========================================
    deliveries: DeliveryItem[] = [
        {
            id: "EE123456789",
            customer: "María González",
            address: "Calle 123 #45-67",
            status: "En ruta",
            deliveryPerson: "Carlos López",
            time: "Estimado: 15 min"
        },
        {
            id: "EE987654321",
            customer: "Juan Pérez",
            address: "Carrera 89 #12-34",
            status: "Entregado",
            deliveryPerson: "Ana Martínez",
            time: "Hace 5 min"
        },
        {
            id: "EE456789123",
            customer: "Luis Rodríguez",
            address: "Av. Principal #56-78",
            status: "Pendiente",
            deliveryPerson: "No asignado",
            time: "Esperando"
        }
    ];

    // ==========================================
    // ACTIVE ROUTES
    // ==========================================
    activeRoutes: ActiveRoute[] = [
        { name: "Carlos López", packages: 8, completed: 5, zone: "Norte", status: "En ruta" },
        { name: "Ana Martínez", packages: 6, completed: 6, zone: "Sur", status: "Completado" },
        { name: "Luis García", packages: 4, completed: 2, zone: "Centro", status: "En ruta" }
    ];

    // ==========================================
    // AVAILABLE PACKAGES FOR ASSIGNMENT
    // ==========================================
    availablePackages: { id: string; address: string; selected: boolean }[] = [
        { id: "EE123456789", address: "Calle 123 #45-67", selected: false },
        { id: "EE987654321", address: "Carrera 89 #12-34", selected: false },
        { id: "EE456789123", address: "Av. Principal #56-78", selected: false }
    ];

    // ==========================================
    // DELIVERY PERSONS
    // ==========================================
    deliveryPersons: { id: string; name: string }[] = [
        { id: 'carlos', name: 'Carlos López' },
        { id: 'ana', name: 'Ana Martínez' },
        { id: 'luis', name: 'Luis García' }
    ];

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    constructor(
        private router: Router,
        private translationService: TranslationService,
        private toast: ToastService,
        private cashCloseService: CashCloseService,
        private cdr: ChangeDetectorRef
    ) {}

    // ==========================================
    // LIFECYCLE
    // ==========================================
    ngOnInit(): void {
        this.loadCurrentUser();
        this.loadInitialData();
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
                const rawName = payload['custom:full_name'] || payload.name || 'Administrador';
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

    private loadInitialData(): void {
        // TODO: Implementar carga de datos reales desde el backend
        this.isLoadingStats = false;
    }

    // ==========================================
    // TAB NAVIGATION
    // ==========================================
    setActiveTab(tab: string): void {
        this.activeTab = tab;

        if (tab === 'stats') {
            this.loadStats();
        } else if (tab === 'employees') {
            this.loadEmployees();
        } else if (tab === 'deliveries') {
            this.loadDeliveries();
        } else if (tab === 'routes') {
            this.loadRoutes();
        } else if (tab === 'cash-close') {
            this.loadCashCloses();
            this.loadCashCloseStats();
        }
    }

    // ==========================================
    // DATA LOADERS
    // ==========================================
    private async loadStats(): Promise<void> {
        this.isLoadingStats = true;
        this.cdr.detectChanges();

        try {
            // TODO: Cargar estadísticas reales
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            this.toast.error('Error al cargar las estadísticas');
        } finally {
            this.isLoadingStats = false;
            this.cdr.detectChanges();
        }
    }

    private async loadEmployees(): Promise<void> {
        this.isLoadingEmployees = true;
        this.cdr.detectChanges();

        try {
            // TODO: Cargar empleados reales
            await new Promise(resolve => setTimeout(resolve, 500));
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
            // TODO: Cargar entregas reales
            await new Promise(resolve => setTimeout(resolve, 500));
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
            // TODO: Cargar rutas reales
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error al cargar rutas:', error);
            this.toast.error('Error al cargar las rutas');
        } finally {
            this.isLoadingRoutes = false;
            this.cdr.detectChanges();
        }
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    handleEmployeeCreate(formData: any): void {
        console.log('Creating employee:', formData);
        this.toast.success('Empleado creado exitosamente');
        // TODO: Llamar al servicio para crear empleado
    }

    handleEmployeeEdit(employeeId: string): void {
        console.log('Editing employee:', employeeId);
        // TODO: Abrir modal de edición
    }

    handleAlertAction(alertId: string): void {
        console.log('Alert action:', alertId);
        // TODO: Manejar acción de alerta
    }

    handleRouteAssignment(assignment: { deliveryPersonId: string; packageIds: string[]; priority: string }): void {
        console.log('Assigning route:', assignment);
        this.toast.success('Ruta asignada exitosamente');
        // TODO: Llamar al servicio para asignar ruta
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
                `¡Cierre de caja generado exitosamente!\n\n` +
                `Total: $${response.close.total_amount.toLocaleString()}\n` +
                `Guías: ${response.close.total_guides}`
            );

            if (response.close.pdf_url) {
                await this.cashCloseService.downloadCashClosePDF(response.close.close_id);
            }

            await this.loadCashCloses();
            await this.loadCashCloseStats();

        } catch (error: any) {
            console.error('Error al generar cierre:', error);
            this.toast.error(error.message || 'Error al generar el cierre de caja');
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
            console.log('Estadísticas de cierres cargadas:', this.cashCloseStats);
        } catch (error) {
            console.error('Error al cargar estadísticas de cierres:', error);
            this.toast.error('Error al cargar las estadísticas');
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
    // AUTH
    // ==========================================
    handleLogout(): void {
        sessionStorage.clear();
        this.router.navigate(['/dashboard']);
    }
}
