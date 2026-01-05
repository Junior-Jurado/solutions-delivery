import { Component, OnInit, ChangeDetectorRef, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

// Services
import { 
    GuideService, 
    ShippingGuide,
    GuideStatus,
    GuideStatsResponse,
    PaymentMethod,
    ServiceType
} from "@core/services/guide.service";
import { LocationService, City } from "@core/services/location.service";
import { 
    CashClose, 
    CashCloseRequest, 
    CashCloseService, 
    CashCloseStatsResponse, 
    PeriodType 
} from "@core/services/cash-close.service";
import { ToastService } from "@shared/services/toast.service";

// Components
import { GuideFormComponent } from '../components/guide-form/guide-form.component';
import { GuideListComponent } from "../components/guide-list/guide-list.component";
import { GuideFiltersComponent, GuideFilterValues } from "../components/guide-filters/guide-filters.component";
import { StatsCardsComponent } from "../components/stats-cards/stats-cards.component";
import { GuideDetailsModalComponent } from "@shared/components/guide-details-modal.component";
import { CashCloseFormComponent, CashCloseFormData } from "../components/cash-close-form/cash-close-form.component";
import { CashCloseListComponent } from "../components/cash-close-list/cash-close-list.component";
import { GuideSearchComponent } from "../components/guide-search/guide-search.component";
import { StatusDistributionComponent } from "../components/status-distribution/status-distribution.component";
import { CashCloseStatsComponent } from "../components/cash-close-stats/cash-close-stats.component";

@Component({
    selector: 'app-secretary-dashboard',
    standalone: true,
    templateUrl: './secretary-dashboard.page.html',
    styleUrls: ['./secretary-dashboard.page.scss'],
    imports: [
        CommonModule,
        FormsModule,
        GuideFormComponent,
        GuideListComponent,
        GuideFiltersComponent,
        GuideSearchComponent,
        StatsCardsComponent,
        StatusDistributionComponent,
        GuideDetailsModalComponent,
        CashCloseFormComponent,
        CashCloseListComponent,
        CashCloseStatsComponent
    ]
})
export class SecretaryDashboardPage implements OnInit {
    @ViewChild(GuideFormComponent) guideFormComponent!: GuideFormComponent;

    // ==========================================
    // NAVIGATION
    // ==========================================
    activeTab: string = 'create-guide';

    // ==========================================
    // USER
    // ==========================================
    currentUserId: string = '';

    // ==========================================
    // GUIDES MANAGEMENT
    // ==========================================
    guides: ShippingGuide[] = [];
    isLoadingGuides: boolean = false;
    totalGuides: number = 0;
    currentPage: number = 0;
    pageSize: number = 20;

    // Filters
    filterCities: City[] = [];
    selectedStatusFilter: GuideStatus | '' = '';
    selectedCityFilter: number | '' = '';
    dateFromFilter: string = '';
    dateToFilter: string = '';

    // ==========================================
    // SEARCH & TRACKING
    // ==========================================
    trackingSearch: string = '';
    searchResults: ShippingGuide[] = [];
    isSearching: boolean = false;

    // ==========================================
    // STATISTICS
    // ==========================================
    stats: GuideStatsResponse | null = null;
    isLoadingStats: boolean = false;

    // Estados disponibles para Status Distribution
    availableStatuses: { value: GuideStatus; label: string }[] = [
        { value: 'CREATED', label: 'Creada' },
        { value: 'IN_ROUTE', label: 'En ruta' },
        { value: 'IN_WAREHOUSE', label: 'En bodega' },
        { value: 'OUT_FOR_DELIVERY', label: 'En reparto' },
        { value: 'DELIVERED', label: 'Entregada' }
    ];

    // ==========================================
    // MODAL
    // ==========================================
    selectedGuideForDetails: ShippingGuide | null = null;
    isDetailsModalOpen: boolean = false;

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
    // CONSTRUCTOR
    // ==========================================
    constructor(
        private router: Router,
        private guideService: GuideService,
        private locationService: LocationService,
        private cashCloseService: CashCloseService,
        private toast: ToastService,
        private cdr: ChangeDetectorRef
    ) {}

    // ==========================================
    // LIFECYCLE
    // ==========================================
    ngOnInit(): void {
        this.loadCurrentUser();
        this.loadCities();
        this.loadGuides();
        this.loadStats();
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
                console.log('Usuario actual:', this.currentUserId);
            } catch (error) {
                console.error('Error al decodificar token:', error);
                this.router.navigate(['/auth']);
            }
        } else {
            this.router.navigate(['/auth']);
        }
    }

    private loadCities(): void {
        this.locationService.getCities().subscribe({
            next: (cities) => {
                this.filterCities = cities;
                console.log('Ciudades cargadas:', cities.length);
            },
            error: (error) => {
                console.error('Error al cargar ciudades:', error);
                this.toast.error('Error al cargar las ciudades');
            }
        });
    }

    // ==========================================
    // TAB NAVIGATION
    // ==========================================
    setActiveTab(tab: string): void {
        this.activeTab = tab;

        if (tab === 'manage-guides') {
            this.loadGuides();
        } else if (tab === 'reports') {
            this.loadStats();
        } else if (tab === 'cash-close') {
            this.loadCashCloses();
            this.loadCashCloseStats();
        }
    }

    // ==========================================
    // GUIDE FORM HANDLERS
    // ==========================================
    async handleGuideFormSubmit(formData: any): Promise<void> {
        this.guideFormComponent.setSubmitting(true);

        try {
            const guideRequest = this.guideService.buildGuideRequest(formData, this.currentUserId);
            const response = await this.guideService.createGuide(guideRequest);

            this.toast.success(`¡Guía creada exitosamente!\nNúmero: ${response.guide_number}`);

            if (response.guide_id) {
                await this.guideService.downloadGuidePDF(response.guide_id);
            }

            this.guideFormComponent.resetForm();
            this.setActiveTab('manage-guides');

        } catch (error: any) {
            this.toast.error(error.message || 'Error al crear la guía');
        } finally {
            this.guideFormComponent.setSubmitting(false);
        }
    }

    // ==========================================
    // GUIDE LIST HANDLERS
    // ==========================================
    async loadGuides(): Promise<void> {
        this.isLoadingGuides = true;
        this.guides = [];
        this.cdr.detectChanges();

        const filters: any = {
            limit: this.pageSize,
            offset: this.currentPage * this.pageSize
        };

        if (this.selectedStatusFilter) filters.status = this.selectedStatusFilter;
        if (this.selectedCityFilter) filters.destination_city_id = Number(this.selectedCityFilter);
        if (this.dateFromFilter) filters.date_from = this.dateFromFilter;
        if (this.dateToFilter) filters.date_to = this.dateToFilter;

        try {
            const response = await this.guideService.listGuides(filters);
            this.guides = Array.isArray(response.guides) ? response.guides : [];
            this.totalGuides = response.total || 0;

            console.log('Guías cargadas:', this.guides.length, 'de', this.totalGuides);
        } catch (error: any) {
            console.error('Error al cargar guías:', error);
            this.guides = [];
            this.totalGuides = 0;
            this.toast.error('Error al cargar las guías');
        } finally {
            this.isLoadingGuides = false;
            this.cdr.detectChanges();
        }
    }

    async handleStatusUpdate(event: { guideId: number; newStatus: GuideStatus }): Promise<void> {
        try {
            await this.guideService.updateGuideStatus(event.guideId, event.newStatus);

            const guide = this.guides.find(g => g.guide_id === event.guideId);
            if (guide) {
                guide.current_status = event.newStatus;
            }

            this.toast.success('Estado actualizado correctamente');
            await this.loadStats();

        } catch (error) {
            console.error('Error al actualizar estado:', error);
            this.toast.error('Error al actualizar el estado');
        }
    }

    handlePageChange(direction: 'prev' | 'next'): void {
        if (direction === 'prev' && this.currentPage > 0) {
            this.currentPage--;
            this.loadGuides();
        } else if (direction === 'next' && this.currentPage < this.getTotalPages() - 1) {
            this.currentPage++;
            this.loadGuides();
        }
    }

    getTotalPages(): number {
        return Math.ceil(this.totalGuides / this.pageSize);
    }

    // ==========================================
    // FILTERS HANDLERS
    // ==========================================
    async handleFiltersApplied(filters: GuideFilterValues): Promise<void> {
        this.selectedStatusFilter = filters.status;
        this.selectedCityFilter = filters.cityId;
        this.dateFromFilter = filters.dateFrom;
        this.dateToFilter = filters.dateTo;

        this.currentPage = 0;
        await this.loadGuides();
    }

    async handleFiltersClear(): Promise<void> {
        this.selectedStatusFilter = '';
        this.selectedCityFilter = '';
        this.dateFromFilter = '';
        this.dateToFilter = '';

        this.currentPage = 0;
        await this.loadGuides();
    }

    // ==========================================
    // SEARCH & TRACKING
    // ==========================================
    async handleSearch(query: string): Promise<void> {
        if (!query || query.length < 3) {
            this.toast.error('Ingrese al menos 3 caracteres para buscar');
            return;
        }

        this.trackingSearch = query;
        this.isSearching = true;
        this.searchResults = [];

        try {
            const response = await this.guideService.searchGuides(query);
            this.searchResults = Array.isArray(response.guides) ? response.guides : [];

            if (this.searchResults.length === 0) {
                this.toast.info(`No se encontraron resultados para "${query}"`);
            } else {
                this.toast.success(`Se encontraron ${this.searchResults.length} resultado(s)`);
            }
        } catch (error: any) {
            console.error('Error en búsqueda:', error);
            this.searchResults = [];
            this.toast.error('Error al buscar guías');
        } finally {
            this.isSearching = false;
            this.cdr.detectChanges();
        }
    }

    // ==========================================
    // STATISTICS
    // ==========================================
    async loadStats(): Promise<void> {
        this.isLoadingStats = true;
        this.cdr.detectChanges();

        try {
            this.stats = await this.guideService.getGuideStats();
            console.log('Estadísticas cargadas:', this.stats);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            this.toast.error('Error al cargar las estadísticas');
        } finally {
            this.isLoadingStats = false;
            this.cdr.detectChanges();
        }
    }

    calculatePercentage(count: number): number {
        if (!this.stats) return 0;
        const total = Object.values(this.stats.by_status).reduce((sum, val) => sum + val, 0);
        return total > 0 ? (count / total) * 100 : 0;
    }

    // ==========================================
    // MODAL HANDLERS
    // ==========================================
    async viewDetails(guideId: number): Promise<void> {
        try {
            const response = await this.guideService.getGuideById(guideId);
            this.selectedGuideForDetails = response.guide;
            this.isDetailsModalOpen = true;
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error al obtener detalles:', error);
            this.toast.error('Error al cargar los detalles de la guía');
        }
    }

    closeDetailsModal(): void {
        this.isDetailsModalOpen = false;
        this.selectedGuideForDetails = null;
        this.cdr.detectChanges();
    }

    async downloadPDFFromModal(guideId: number): Promise<void> {
        await this.downloadGuidePDF(guideId);
    }

    // ==========================================
    // PDF DOWNLOADS
    // ==========================================
    async downloadGuidePDF(guideId: number): Promise<void> {
        try {
            await this.guideService.downloadGuidePDF(guideId);
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            this.toast.error('Error al descargar el PDF de la guía');
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
    // CASH CLOSE
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

            this.cashCloses = response.closes;
            this.totalCloses = response.total;

            console.log('Cierres de caja cargados:', this.cashCloses.length);
        } catch (error) {
            console.error('Error al cargar cierres:', error);
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

    // ==========================================
    // UTILITY METHODS (Translations & Formats)
    // ==========================================
    getStatusBadgeClass(status: GuideStatus): string {
        return this.guideService.getStatusBadgeClass(status);
    }

    translateStatus(status: GuideStatus): string {
        return this.guideService.translateStatus(status);
    }

    translatePaymentMethod(method: PaymentMethod): string {
        return this.guideService.translatePaymentMethod(method);
    }

    translateServiceType(serviceType: ServiceType): string {
        return this.guideService.translateServiceType(serviceType);
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
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // ==========================================
    // AUTH
    // ==========================================
    handleLogout(): void {
        sessionStorage.clear();
        this.router.navigate(['/auth']);
    }
}