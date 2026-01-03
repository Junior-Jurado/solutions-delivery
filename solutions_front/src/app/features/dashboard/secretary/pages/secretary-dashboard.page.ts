import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { 
    GuideService, 
    CreateGuideResponse, 
    ShippingGuide,
    GuideStatus,
    GuideStatsResponse,
    GuidesListResponse,
    GuideFilters
} from "@core/services/guide.service";
import { AuthService } from "@core/services/auth.service";
import { LocationService, City } from "@core/services/location.service";
import { CitySelectorComponent } from "@shared/components/city-selector.component";
import { GuideDetailsModalComponent } from "@shared/components/guide-details-modal.component";
import { CommonModule } from "@angular/common";
import { ToastService } from "@shared/services/toast.service";

interface DailyStats {
    day: string;
    created: number;
    processed: number;
}

@Component({
    selector: 'app-secretary-dashboard',
    standalone: true,
    templateUrl: './secretary-dashboard.page.html',
    styleUrls: ['./secretary-dashboard.page.scss'],
    imports: [
        ReactiveFormsModule, 
        CommonModule, 
        FormsModule, 
        CitySelectorComponent,
        GuideDetailsModalComponent
    ]
})
export class SecretaryDashboardPage implements OnInit {
    // Navegación de tabs
    activeTab: string = 'create-guide';
    
    // Formulario de guía
    guideForm: FormGroup;
    isSubmitting: boolean = false;
    currentUserId: string = '';
    
    // Datos de ciudades seleccionadas
    selectedSenderCity: City | null = null;
    selectedReceiverCity: City | null = null;
    
    // Búsqueda y rastreo
    trackingSearch: string = '';
    searchResults: ShippingGuide[] = [];
    isSearching: boolean = false;
    
    // Gestión de guías
    guides: ShippingGuide[] = []; 
    isLoadingGuides: boolean = false;
    totalGuides: number = 0;
    currentPage: number = 0;
    pageSize: number = 20;
    
    // Filtros
    filterCities: City[] = [];
    selectedStatusFilter: GuideStatus | '' = '';
    selectedCityFilter: number | '' = '';
    dateFromFilter: string = '';
    dateToFilter: string = '';
    
    // Para manejo visual de fechas
    displayDateFrom: string = '';
    displayDateTo: string = '';
    
    // Estadísticas
    stats: GuideStatsResponse | null = null;
    isLoadingStats: boolean = false;
    
    // Modal de detalles
    selectedGuideForDetails: ShippingGuide | null = null;
    isDetailsModalOpen: boolean = false;
    
    // Opciones de formulario
    serviceTypes: string[] = ['Contado', 'Contra Entrega', 'Crédito'];
    priorities: string[] = ['Normal', 'Express', 'Urgente'];
    insuranceOptions: string[] = ['No', 'Básico', 'Completo'];
    documentTypes: string[] = ['CC', 'CE', 'NIT', 'TI', 'PAS'];
    
    // Estados disponibles para actualización
    availableStatuses: { value: GuideStatus; label: string }[] = [
        { value: 'CREATED', label: 'Creada' },
        { value: 'IN_ROUTE', label: 'En ruta' },
        { value: 'IN_WAREHOUSE', label: 'En bodega' },
        { value: 'OUT_FOR_DELIVERY', label: 'En reparto' },
        { value: 'DELIVERED', label: 'Entregada' }
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private guideService: GuideService,
        private authService: AuthService,
        private locationService: LocationService,
        private cdr: ChangeDetectorRef,
        private toast: ToastService
    ){
        this.guideForm = this.initializeForm();
    }

    ngOnInit(): void {
        this.loadCurrentUser();
        this.loadCities();
        this.loadGuides();
        this.loadStats();
    }

    /**
     * Inicializa el formulario de guía
     */
    private initializeForm(): FormGroup {
        return this.fb.group({
            // Remitente
            senderName: ['', Validators.required],
            senderDocType: ['CC', Validators.required],
            senderDoc: ['', Validators.required],
            senderPhone: ['', Validators.required],
            senderEmail: ['', Validators.email],
            senderAddress: ['', Validators.required],
            senderCity: ['', Validators.required],
            senderCityName: [''],
            
            // Destinatario
            receiverName: ['', Validators.required],
            receiverDocType: ['CC', Validators.required],
            receiverDoc: ['', Validators.required],
            receiverPhone: ['', Validators.required],
            receiverEmail: ['', Validators.email],
            receiverAddress: ['', Validators.required],
            receiverCity: ['', Validators.required],
            receiverCityName: [''],
            
            // Paquete
            serviceType: ['Contado', Validators.required],
            weight: ['', [Validators.required, Validators.min(0.1)]],
            declaredValue: ['', [Validators.required, Validators.min(0)]],
            pieces: [1, [Validators.required, Validators.min(1)]],
            dimensions: ['20x15x10'],
            priority: ['normal'],
            insurance: ['no'],
            content: [''],
            observations: ['']
        });
    }

    /**
     * Carga el ID del usuario actual desde el token
     */
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

    /**
     * Carga la lista de ciudades para filtros
     */
    private loadCities(): void {
        this.locationService.getCities().subscribe({
            next: (cities) => {
                this.filterCities = cities;
                console.log('Ciudades cargadas:', cities.length);
            },
            error: (error) => {
                console.error('Error al cargar ciudades:', error);
            }
        });
    }

    /**
     * Carga la lista de guías con filtros
     */
    async loadGuides(): Promise<void> {
        this.isLoadingGuides = true;
        this.guides = []; 
        this.cdr.detectChanges();

        const filters: GuideFilters = {
            limit: this.pageSize,
            offset: this.currentPage * this.pageSize
        };

        if (this.selectedStatusFilter) {
            filters.status = this.selectedStatusFilter;
            console.log('Filtro de estado aplicado:', filters.status);
        }

        if (this.selectedCityFilter) {
            filters.destination_city_id = Number(this.selectedCityFilter);
        }

        if (this.dateFromFilter) {
            filters.date_from = this.dateFromFilter;
        }

        if (this.dateToFilter) {
            filters.date_to = this.dateToFilter;
        }

        try {
            const response: GuidesListResponse = await this.guideService.listGuides(filters);
            
            this.guides = Array.isArray(response.guides) ? response.guides : [];
            this.totalGuides = response.total || 0;
            
            console.log('Guías cargadas:', this.guides.length, 'de', this.totalGuides);
            
            if (this.guides.length === 0 && this.totalGuides === 0) {
                const filterApplied = this.selectedStatusFilter || this.selectedCityFilter || this.dateFromFilter || this.dateToFilter;
                if (filterApplied) {
                    this.toast.info('No se encontraron guías con los filtros seleccionados');
                }
            }
        } catch (error: any) {
            console.error('Error al cargar guías:', error);
            this.guides = []; 
            this.totalGuides = 0;
            this.toast.error('Error al cargar las guías: ' + (error.message || 'Error desconocido'));
        } finally {
            this.isLoadingGuides = false;
            this.cdr.detectChanges();
        }
    }

    /**
     * Carga las estadísticas de guías
     */
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

    /**
     * Cambia de tab
     */
    setActiveTab(tab: string): void {
        this.activeTab = tab;
        
        // Cargar datos según el tab
        if (tab === 'manage-guides') {
            this.loadGuides();
        } else if (tab === 'reports') {
            this.loadStats();
        }
    }

    /**
     * Descarga el PDF de una guía
     */
    async downloadGuidePDF(guideId: number): Promise<void> {
        try {
            await this.guideService.downloadGuidePDF(guideId);
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            this.toast.error('Error al descargar el PDF de la guía');
        }
    }

    /**
     * Maneja la creación de una nueva guía
     */
    async handleCreateGuide(): Promise<void> {
        if (!this.guideForm.valid) {
            this.markFormGroupTouched(this.guideForm);
            this.toast.error('Por favor complete todos los campos requeridos');
            return;
        }

        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;

        try {
            const guideRequest = this.guideService.buildGuideRequest(
                this.guideForm.value,
                this.currentUserId
            );

            console.log('Enviando guía:', guideRequest);

            const response: CreateGuideResponse = await this.guideService.createGuide(guideRequest);

            console.log('Respuesta del servidor:', response);

            this.toast.success(`¡Guía creada exitosamente!\n\nNúmero de guía: ${response.guide_number}\nID: ${response.guide_id}\n\nEl PDF se descargará automáticamente.`);

            if (response.guide_id) {
                await this.guideService.downloadGuidePDF(response.guide_id);
            }

            this.guideForm.reset(this.getDefaultFormValues());
            this.selectedSenderCity = null;
            this.selectedReceiverCity = null;

            this.setActiveTab('manage-guides');

        } catch (error: any) {
            console.error('Error al crear la guía:', error);
            
            let errorMessage = 'Error al crear la guía. Por favor intente nuevamente.';
            
            if (error.message) {
                errorMessage = error.message;
            }

            this.toast.error(errorMessage);
        } finally {
            this.isSubmitting = false;
            this.cdr.detectChanges();
        }
    }

    /**
     * Actualiza el estado de una guía
     */
    async handleUpdateStatus(guideId: number, newStatus: GuideStatus): Promise<void> {
        if (!newStatus) {
            return;
        }

        try {
            const response = await this.guideService.updateGuideStatus(guideId, newStatus);
            
            const guide = this.guides.find(g => g.guide_id === guideId);
            if (guide) {
                guide.current_status = newStatus;
                this.cdr.detectChanges();
            }

            this.toast.success(`Estado actualizado correctamente a: ${this.guideService.translateStatus(newStatus)}`);
            
            await this.loadStats();
            
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            this.toast.error('Error al actualizar el estado de la guía');
        }
    }

    /**
     * Busca y rastrea envíos
     */
    async handleSearchTracking(): Promise<void> {
        if (!this.trackingSearch || this.trackingSearch.length < 3) {
            this.toast.error('Ingrese al menos 3 caracteres para buscar');
            return;
        }

        this.isSearching = true;
        this.searchResults = []; 

        try {
            const response = await this.guideService.searchGuides(this.trackingSearch);
            
            this.searchResults = Array.isArray(response.guides) ? response.guides : [];
            
            console.log('Resultados de búsqueda:', this.searchResults.length);

            if (this.searchResults.length === 0) {
                this.toast.info(`No se encontraron resultados para "${this.trackingSearch}"`);
            } else {
                this.toast.success(`Se encontraron ${this.searchResults.length} resultado(s)`);
            }
        } catch (error: any) {
            console.error('Error en búsqueda:', error);
            this.searchResults = []; 
            this.toast.error('Error al buscar guías: ' + (error.message || 'Error desconocido'));
        } finally {
            this.isSearching = false; 
            this.cdr.detectChanges();
        }
    }

    /**
     * Aplica filtros a la lista de guías
     */
    async applyFilters(): Promise<void> {
        this.currentPage = 0;
        await this.loadGuides();
    }

    /**
     * Limpia todos los filtros
     */
    async clearFilters(): Promise<void> {
        try {
            // Limpiar todos los filtros
            this.selectedStatusFilter = '';
            this.selectedCityFilter = '';
            this.dateFromFilter = '';
            this.dateToFilter = '';
            this.displayDateFrom = '';
            this.displayDateTo = '';
            this.currentPage = 0;
            
            // Forzar detección de cambios
            this.cdr.detectChanges();
            
            // Recargar las guías
            await this.loadGuides();
            
            console.log('Filtros limpiados exitosamente');
        } catch (error) {
            console.error('Error al limpiar filtros:', error);
            this.toast.error('Error al limpiar los filtros');
            this.isLoadingGuides = false;
            this.cdr.detectChanges();
        }
    }

    /**
     * Convierte fecha de dd/mm/yyyy a yyyy-mm-dd
     */
    formatDateForAPI(displayDate: string): string {
        if (!displayDate || displayDate.length !== 10) return '';
        
        const parts = displayDate.split('/');
        if (parts.length !== 3) return '';
        
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        // Validación básica
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 2000) {
            return '';
        }
        
        return `${year}-${month}-${day}`;
    }

    /**
     * Maneja el cambio en el input de fecha desde
     */
    onDateFromChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        let formatted = '';
        if (value.length >= 1) {
            formatted = value.substring(0, 2);
        }
        if (value.length >= 3) {
            formatted += '/' + value.substring(2, 4);
        }
        if (value.length >= 5) {
            formatted += '/' + value.substring(4, 8);
        }
        
        this.displayDateFrom = formatted;
        
        if (value.length === 8) {
            this.dateFromFilter = this.formatDateForAPI(formatted);
            console.log('Fecha desde (API):', this.dateFromFilter);
        } else {
            this.dateFromFilter = '';
        }
    }

    /**
     * Maneja el cambio en el input de fecha hasta
     */
    onDateToChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        let formatted = '';
        if (value.length >= 1) {
            formatted = value.substring(0, 2);
        }
        if (value.length >= 3) {
            formatted += '/' + value.substring(2, 4);
        }
        if (value.length >= 5) {
            formatted += '/' + value.substring(4, 8);
        }
        
        this.displayDateTo = formatted;
        
        if (value.length === 8) {
            this.dateToFilter = this.formatDateForAPI(formatted);
            console.log('Fecha hasta (API):', this.dateToFilter);
        } else {
            this.dateToFilter = '';
        }
    }

    /**
     * Ver detalles de una guía (abre el modal)
     */
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

    /**
     * Cierra el modal de detalles
     */
    closeDetailsModal(): void {
        this.isDetailsModalOpen = false;
        this.selectedGuideForDetails = null;
        this.cdr.detectChanges();
    }

    /**
     * Descarga el PDF desde el modal
     */
    async downloadPDFFromModal(guideId: number): Promise<void> {
        await this.downloadGuidePDF(guideId);
    }

    /**
     * Maneja la selección de ciudad del remitente
     */
    onSenderCitySelected(city: City): void {
        console.log('Ciudad remitente seleccionada:', city);
        this.selectedSenderCity = city;
        this.guideForm.patchValue({
            senderCityName: city.name
        });
    }

    /**
     * Maneja la selección de ciudad del destinatario
     */
    onReceiverCitySelected(city: City): void {
        console.log('Ciudad destinatario seleccionada:', city);
        this.selectedReceiverCity = city;
        this.guideForm.patchValue({
            receiverCityName: city.name
        });
    }

    /**
     * Verifica si un campo tiene error
     */
    hasError(fieldName: string): boolean {
        const field = this.guideForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    /**
     * Obtiene el mensaje de error para un campo
     */
    getErrorMessage(fieldName: string): string {
        const field = this.guideForm.get(fieldName);
        
        if (field?.hasError('required')) {
            return 'Este campo es requerido';
        }
        
        if (field?.hasError('email')) {
            return 'Ingrese un email válido';
        }
        
        if (field?.hasError('min')) {
            return 'El valor debe ser mayor a 0';
        }
        
        return '';
    }

    /**
     * Obtiene la clase CSS para el badge de estado
     */
    getStatusBadgeClass(status: GuideStatus): string {
        return this.guideService.getStatusBadgeClass(status);
    }

    /**
     * Traduce el estado a español
     */
    translateStatus(status: GuideStatus): string {
        return this.guideService.translateStatus(status);
    }

    /**
     * Formatea una fecha
     */
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

    /**
     * Cerrar sesión
     */
    handleLogout(): void {
        sessionStorage.clear();
        this.router.navigate(['/auth']);
    }

    /**
     * Marca todos los controles como touched
     */
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    /**
     * Obtiene los valores por defecto del formulario
     */
    private getDefaultFormValues(): any {
        return {
            senderDocType: 'CC',
            receiverDocType: 'CC',
            serviceType: 'Contado',
            pieces: 1,
            dimensions: '20x15x10',
            priority: 'normal',
            insurance: 'no',
            senderCityName: '',
            receiverCityName: ''
        };
    }

    /**
     * Navega a la página anterior
     */
    previousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadGuides();
        }
    }

    /**
     * Navega a la página siguiente
     */
    nextPage(): void {
        const totalPages = Math.ceil(this.totalGuides / this.pageSize);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.loadGuides();
        }
    }

    /**
     * Obtiene el número total de páginas
     */
    getTotalPages(): number {
        return Math.ceil(this.totalGuides / this.pageSize);
    }

    /**
     * Calcula el porcentaje para barras de progreso
     */
    calculatePercentage(count: number): number {
        if (!this.stats) return 0;
        
        const total = Object.values(this.stats.by_status).reduce((sum, val) => sum + val, 0);
        return total > 0 ? (count / total) * 100 : 0;
    }
}