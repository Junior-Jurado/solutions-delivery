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
    GuideFormValue
} from "@core/services/guide.service";
import { LocationService, City } from "@core/services/location.service";
import { ToastService } from "@shared/services/toast.service";
import { TranslationService } from "@shared/services/translation.service";

// Components
import { GuidePreviewModalComponent } from "@shared/components/guide-preview-modal/guide-preview-modal.component";
import { GuideFormComponent } from '@shared/components/guide-form/guide-form.component';
import { GuideListComponent } from "../components/guide-list/guide-list.component";
import { GuideFiltersComponent, GuideFilterValues } from "../components/guide-filters/guide-filters.component";
import { StatsCardsComponent } from "../components/stats-cards/stats-cards.component";
import { GuideDetailsModalComponent } from "@shared/components/guide-details-modal.component";
import { GuideSearchComponent } from "../components/guide-search/guide-search.component";
import { StatusDistributionComponent } from "../components/status-distribution/status-distribution.component";
import { AssignmentPanelComponent } from "@shared/components/assignment-panel/assignment-panel.component";
import { IconComponent } from "@shared/components/icon/icon.component";
import { DashboardHeaderComponent } from "@shared/components/dashboard-header/dashboard-header.component";

interface GuidePreview {
  senderName: string;
  senderCity: string;
  senderAddress: string;
  senderPhone: string;
  senderDoc: string;
  receiverName: string;
  receiverCity: string;
  receiverAddress: string;
  receiverPhone: string;
  receiverDoc: string;
  weight: number;
  declaredValue: number;
  serviceType: string;
  pieces: number;
  dimensions: string;
  calculatedPrice: number;
}

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
        AssignmentPanelComponent,
        IconComponent,
        GuidePreviewModalComponent,
        DashboardHeaderComponent
    ]
})
export class SecretaryDashboardPage implements OnInit {
    @ViewChild(GuideFormComponent) guideFormComponent!: GuideFormComponent;

    // ==========================================
    // NAVIGATION
    // ==========================================
    activeTab = 'create-guide';

    // ==========================================
    // USER
    // ==========================================
    currentUserId = '';
    userName = '';

    // ==========================================
    // GUIDES MANAGEMENT
    // ==========================================
    guides: ShippingGuide[] = [];
    isLoadingGuides = false;
    totalGuides = 0;
    currentPage = 0;
    pageSize = 20;

    // Filters
    filterCities: City[] = [];
    selectedStatusFilter: GuideStatus | '' = '';
    selectedCityFilter: number | '' = '';
    dateFromFilter = '';
    dateToFilter = '';

    // ==========================================
    // SEARCH & TRACKING
    // ==========================================
    trackingSearch = '';
    searchResults: ShippingGuide[] = [];
    isSearching = false;

    // ==========================================
    // STATISTICS
    // ==========================================
    stats: GuideStatsResponse | null = null;
    isLoadingStats = false;

    // Estados disponibles para Status Distribution
    availableStatuses: { value: GuideStatus; label: string }[] = [
        { value: 'CREATED', label: 'Creada' },
        { value: 'IN_ROUTE', label: 'En ruta' },
        { value: 'IN_WAREHOUSE', label: 'En bodega' },
        { value: 'OUT_FOR_DELIVERY', label: 'En reparto' },
        { value: 'DELIVERED', label: 'Entregada' }
    ];

    // ==========================================
    // GUIDE PREVIEW MODAL
    // ==========================================
    showGuidePreview = false;
    guidePreviewData: GuidePreview | null = null;
    pendingGuideData: GuideFormValue | null = null;
    isCreatingGuide = false;

    // ==========================================
    // MODAL
    // ==========================================
    selectedGuideForDetails: ShippingGuide | null = null;
    isDetailsModalOpen = false;

    // ==========================================
    // REFRESH
    // ==========================================
    isRefreshing = false;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    constructor(
        private router: Router,
        private guideService: GuideService,
        private locationService: LocationService,
        private translationService: TranslationService,
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
                const rawName = payload['custom:full_name'] || payload.name || 'Secretari@';
                this.userName = this.fixUtf8Encoding(rawName);
                console.log('Usuario actual:', this.currentUserId);
            } catch (error) {
                console.error('Error al decodificar token:', error);
                this.router.navigate(['/auth']);
            }
        } else {
            this.router.navigate(['/auth']);
        }
    }

    /**
     * Corrige problemas de doble codificación UTF-8
     * Ejemplo: "GermÃ¡n" -> "Germán"
     */
    private fixUtf8Encoding(text: string): string {
        if (!text) return text;
        try {
            // Detectar si tiene caracteres de doble encoding (ej: Ã¡, Ã©, Ã­, Ã³, Ãº, Ã±)
            if (/Ã[\x80-\xBF]/.test(text)) {
                // Convertir string a bytes Latin-1 y luego interpretar como UTF-8
                const bytes = new Uint8Array([...text].map(c => c.charCodeAt(0)));
                return new TextDecoder('utf-8').decode(bytes);
            }
            return text;
        } catch {
            return text;
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
        }
    }

    // ==========================================
    // GUIDE FORM HANDLERS 
    // ==========================================
    handleGuideFormSubmit(formData: GuideFormValue): void {
        // Calculamos el precio
        const calculatedPrice = this.guideService.calculatePrice(formData);
        
        // Guardamos los datos pendientes
        this.pendingGuideData = formData;
        
        // Preparamos los datos para el preview
        this.guidePreviewData = {
            // Remitente
            senderName: formData.senderName,
            senderCity: formData.senderCityName || '',
            senderAddress: formData.senderAddress,
            senderPhone: formData.senderPhone,
            senderDoc: `${formData.senderDocType || 'CC'} ${formData.senderDoc}`,

            // Destinatario
            receiverName: formData.receiverName,
            receiverCity: formData.receiverCityName || '',
            receiverAddress: formData.receiverAddress,
            receiverPhone: formData.receiverPhone,
            receiverDoc: `${formData.receiverDocType || 'CC'} ${formData.receiverDoc}`,

            // Paquete
            weight: Number(formData.weight) || 0,
            declaredValue: Number(formData.declaredValue) || 0,
            serviceType: formData.serviceType,
            pieces: Number(formData.pieces) || 1,
            dimensions: formData.dimensions || '20x15x10',

            // Precio
            calculatedPrice: calculatedPrice
        };
        
        // Mostramos el modal de confirmación
        this.showGuidePreview = true;
        this.cdr.detectChanges();
    }

    /**
     * Confirma y crea la guía
     */
    async confirmGuideCreation(_finalPrice?: number): Promise<void> {
        if (!this.pendingGuideData) return;

        this.isCreatingGuide = true;
        this.guideFormComponent.setSubmitting(true);
        this.cdr.detectChanges();

        try {
            // Secretaria no puede modificar precio, así que no pasamos precio personalizado
            const guideRequest = this.guideService.buildGuideRequest(
                this.pendingGuideData,
                this.currentUserId
            );

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
            this.guideFormComponent.resetForm();
            
            // Cambiar a la pestaña de gestión y recargar
            this.setActiveTab('manage-guides');
            await this.loadGuides();

        } catch (error) {
            console.error('Error creating guide:', error);
            const message = error instanceof Error ? error.message : 'Error al crear la guía';
            this.toast.error(message);
        } finally {
            this.isCreatingGuide = false;
            this.guideFormComponent.setSubmitting(false);
            this.cdr.detectChanges();
        }
    }

    /**
     * Cancela la creación de la guía
     */
    cancelGuideCreation(): void {
        this.showGuidePreview = false;
        this.pendingGuideData = null;
        this.guidePreviewData = null;
        this.guideFormComponent.setSubmitting(false);
        this.cdr.detectChanges();
    }

    // ==========================================
    // GUIDE LIST HANDLERS
    // ==========================================
    async loadGuides(): Promise<void> {
        this.isLoadingGuides = true;
        this.guides = [];
        this.cdr.detectChanges();

        const filters: Record<string, string | number> = {
            limit: this.pageSize,
            offset: this.currentPage * this.pageSize
        };

        if (this.selectedStatusFilter) filters['status'] = this.selectedStatusFilter;
        if (this.selectedCityFilter) filters['destination_city_id'] = Number(this.selectedCityFilter);
        if (this.dateFromFilter) filters['date_from'] = this.dateFromFilter;
        if (this.dateToFilter) filters['date_to'] = this.dateToFilter;

        try {
            const response = await this.guideService.listGuides(filters);
            this.guides = Array.isArray(response.guides) ? response.guides : [];
            this.totalGuides = response.total || 0;

            console.log('Guías cargadas:', this.guides.length, 'de', this.totalGuides);
        } catch (error) {
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
        } catch (error) {
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

    // ==========================================
    // HELPERS
    // ==========================================
    formatPrice(price: number): string {
        return this.translationService.formatCurrency(price);
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
                case 'create-guide':
                    // No hay nada que refrescar en este tab
                    break;
                case 'manage-guides':
                    await this.loadGuides();
                    break;
                case 'search':
                    // El usuario debe buscar de nuevo
                    break;
                case 'reports':
                    await this.loadStats();
                    break;
                case 'assignments':
                    // El panel de asignaciones maneja su propia carga
                    break;
                default:
                    await this.loadGuides();
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
    // AUTH
    // ==========================================
    handleLogout(): void {
        sessionStorage.clear();
        this.router.navigate(['/dashboard']);
    }
}

