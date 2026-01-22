import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Services
import { AuthService } from '@core/services/auth.service';
import { ClientService, ClientProfile } from '@core/services/client.service';
import { GuideService, ShippingGuide, CreateGuideRequest } from '@core/services/guide.service';
import { ToastService } from '@shared/services/toast.service';
import { TranslationService } from '@shared/services/translation.service';
import { DeviceDetectionService } from '@shared/services/device-detection.service';

// Components
import { IconComponent } from '@shared/components/icon/icon.component';
import { GuidePreviewData, GuidePreviewModalComponent } from '@shared/components/guide-preview-modal/guide-preview-modal.component';
import { GuideFormComponent } from '@features/dashboard/secretary/components/guide-form/guide-form.component';
import { GuideDetailsModalComponent } from '@shared/components/guide-details-modal.component';
import { TrackingComponent } from '../components/tracking/tracking.component';
import { MyGuidesComponent } from '../components/my-guides/my-guides.component';
import { HistoryComponent } from '../components/history/history.component';
import { QuoteComponent, QuoteData } from '../components/quote/quote.component';
import { DashboardHeaderComponent } from '../components/dashboard-header/dashboard-header.component';
import { DashboardFooterComponent } from '../components/dashboard-footer/dashboard-footer.component';

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
  pieces: number;
  declaredValue: number;
  serviceType: string;
  calculatedPrice: number;
  dimensions: string;
  content: string;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  templateUrl: './client-dashboard.page.html',
  styleUrls: ['./client-dashboard.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    GuideFormComponent,
    IconComponent,
    GuideDetailsModalComponent,
    TrackingComponent,
    MyGuidesComponent,
    HistoryComponent,
    QuoteComponent,
    DashboardHeaderComponent,
    DashboardFooterComponent,
    GuidePreviewModalComponent
  ]
})
export class ClientDashboardPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // User data
  currentUser: ClientProfile | null = null;
  userId: string = '';

  // Active tab
  activeTab: 'tracking' | 'my-guides' | 'history' | 'quote' | 'create' = 'tracking';
  
  // Tracking
  trackingResult: ShippingGuide | null = null;
  isTracking: boolean = false;
  trackingError: string = '';

  // My Guides
  myGuides: ShippingGuide[] = [];
  loadingMyGuides: boolean = false;

  // History
  guidesHistory: ShippingGuide[] = [];
  loadingHistory: boolean = false;

  // Quote
  quoteData: QuoteData = {
    serviceType: '',
    weight: 0,
    declaredValue: 0,
    pieces: 1,
    dimensions: '20x15x10',
    insurance: 'no',
    content: '',
    observations: ''
  };
  quoteResult: number | null = null;

  // Create Guide
  showGuidePreview: boolean = false;
  guidePreviewData: GuidePreview | null = null;
  pendingGuideData: any = null;
  isCreatingGuide: boolean = false;

  // Guide Details Modal
  selectedGuide: ShippingGuide | null = null;
  showDetailsModal: boolean = false;

  // Device detection
  isMobile: boolean = false;

  constructor(
    private authService: AuthService,
    private clientService: ClientService,
    private guideService: GuideService,
    private toastService: ToastService,
    public translationService: TranslationService,
    private deviceService: DeviceDetectionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.detectDevice();
    await this.loadUserProfile();
    await this.loadMyGuides();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Detecta el tipo de dispositivo
   */
  private detectDevice(): void {
    this.deviceService.getDeviceInfo$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.isMobile = info.isMobile;
      });
  }

  /**
   * Carga el perfil del usuario
   */
  private async loadUserProfile(): Promise<void> {
    try {
      this.currentUser = await this.clientService.getProfile();
      this.userId = this.currentUser.user_id;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading profile:', error);
      this.toastService.error('Error al cargar el perfil de usuario');
    }
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: 'tracking' | 'my-guides' | 'history' | 'quote' | 'create'): void {
    this.activeTab = tab;

    if (tab === 'my-guides' && this.myGuides.length === 0) {
      this.loadMyGuides();
    } else if (tab === 'history' && this.guidesHistory.length === 0) {
      this.loadGuidesHistory();
    }
  }

  // ==========================================
  // TRACKING
  // ==========================================

  /**
   * Realiza el rastreo de una guía
   */
  async trackGuide(trackingNumber: string): Promise<void> {
    this.isTracking = true;
    this.trackingError = '';
    this.trackingResult = null;
    this.cdr.detectChanges();

    try {
      const guide = await this.clientService.trackGuide(trackingNumber);
      
      const canViewGuide = this.validateGuideAccess(guide);
      
      if (!canViewGuide) {
        this.trackingError = 'No tienes permiso para ver esta guía. Solo puedes rastrear guías donde apareces como remitente, destinatario o creador.';
        this.toastService.error('Acceso denegado');
        this.trackingResult = null;
      } else {
        this.trackingResult = guide;
        this.toastService.success('Guía encontrada exitosamente');
      }
      
      this.cdr.detectChanges();
    } catch (error: any) {
      this.trackingError = 'No se encontró la guía. Verifique el número e intente nuevamente.';
      this.toastService.error('Guía no encontrada');
      this.cdr.detectChanges();
    } finally {
      this.isTracking = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Valida si el usuario tiene acceso a ver una guía
   */
  private validateGuideAccess(guide: ShippingGuide): boolean {
    if (!this.currentUser) return false;

    if (guide.created_by === this.userId) {
      return true;
    }

    if (guide.sender?.document_number === this.currentUser.document_number) {
      return true;
    }

    if (guide.receiver?.document_number === this.currentUser.document_number) {
      return true;
    }

    return false;
  }

  /**
   * Limpia el resultado del rastreo
   */
  clearTracking(): void {
    this.trackingResult = null;
    this.trackingError = '';
  }

  // ==========================================
  // MY GUIDES
  // ==========================================

  /**
   * Carga las guías activas del usuario
   */
  private async loadMyGuides(): Promise<void> {
    this.loadingMyGuides = true;
    this.cdr.detectChanges();

    try {
      this.myGuides = await this.clientService.getActiveGuides();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading guides:', error);
      this.toastService.error('Error al cargar las guías');
    } finally {
      this.loadingMyGuides = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Recarga las guías activas
   */
  async refreshMyGuides(): Promise<void> {
    await this.loadMyGuides();
    this.toastService.success('Guías actualizadas');
  }

  // ==========================================
  // HISTORY
  // ==========================================

  /**
   * Carga el histórico de guías
   */
  private async loadGuidesHistory(): Promise<void> {
    this.loadingHistory = true;
    this.cdr.detectChanges();

    try {
      this.guidesHistory = await this.clientService.getGuideHistory();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading history:', error);
      this.toastService.error('Error al cargar el histórico');
    } finally {
      this.loadingHistory = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // QUOTE (COTIZACIÓN)
  // ==========================================

  /**
   * Calcula la cotización del envío usando el método del GuideService
   */
  calculateQuote(quoteData: QuoteData): void {
    if (!quoteData.weight || quoteData.weight <= 0) {
      this.toastService.error('Por favor ingrese un peso válido');
      return;
    }

    if (!quoteData.serviceType) {
      this.toastService.error('Por favor seleccione un tipo de servicio');
      return;
    }

    const formValue = {
      weight: quoteData.weight,
      declaredValue: quoteData.declaredValue,
      serviceType: quoteData.serviceType,
      pieces: quoteData.pieces,
      dimensions: quoteData.dimensions,
      insurance: quoteData.insurance,
      content: quoteData.content,
      observations: quoteData.observations
    };

    this.quoteResult = this.guideService.calculatePrice(formValue);
    
    this.toastService.success('Cotización calculada exitosamente');
    this.cdr.detectChanges();
  }

  /**
   * Reinicia el formulario de cotización
   */
  resetQuote(): void {
    this.quoteData = {
      serviceType: '',
      weight: 0,
      declaredValue: 0,
      pieces: 1,
      dimensions: '20x15x10',
      insurance: 'no',
      content: '',
      observations: ''
    };
    this.quoteResult = null;
    this.cdr.detectChanges();
  }

  /**
   * Navega al tab de crear guía con los datos de la cotización
   */
  proceedToCreateGuide(): void {
    this.toastService.info('Redirigiendo al formulario de creación...');
    this.setActiveTab('create');
  }

  // ==========================================
  // CREATE GUIDE
  // ==========================================

  /**
   * Cuando el formulario se envía
   */
  onGuideFormSubmit(formData: any): void {
    const calculatedPrice = this.guideService.calculatePrice(formData);
    
    this.pendingGuideData = formData;
    
    this.guidePreviewData = {
      // Remitente
      senderName: formData.senderName,
      senderCity: formData.senderCityName,
      senderAddress: formData.senderAddress,
      senderPhone: formData.senderPhone,
      senderDoc: `${formData.senderDocType} ${formData.senderDoc}`,
      
      // Destinatario
      receiverName: formData.receiverName,
      receiverCity: formData.receiverCityName,
      receiverAddress: formData.receiverAddress,
      receiverPhone: formData.receiverPhone,
      receiverDoc: `${formData.receiverDocType} ${formData.receiverDoc}`,
      
      // Paquete
      weight: formData.weight,
      declaredValue: formData.declaredValue,
      serviceType: formData.serviceType,
      pieces: formData.pieces,
      dimensions: formData.dimensions,
      content: formData.content,
      
      // Precio
      calculatedPrice: calculatedPrice
    };
    
    this.showGuidePreview = true;
  }

  /**
   * Cuando se confirma la creación
   */
  async confirmGuideCreation(): Promise<void> {
    if (!this.pendingGuideData || !this.userId) return;

    this.isCreatingGuide = true;
    this.cdr.detectChanges();

    try {
      const guideRequest = this.guideService.buildGuideRequest(
        this.pendingGuideData,
        this.userId
      );

      const response = await this.guideService.createGuide(guideRequest);

      this.toastService.success(
        `Guía creada exitosamente. Número: ${response.guide_number}`,
        3000
      );

      this.showGuidePreview = false;
      this.pendingGuideData = null;
      this.guidePreviewData = null;

      this.setActiveTab('my-guides');
      await this.loadMyGuides();

    } catch (error: any) {
      console.error('Error creating guide:', error);
      this.toastService.error(error.message || 'Error al crear la guía');
    } finally {
      this.isCreatingGuide = false;
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
  }

  // ==========================================
  // GUIDE DETAILS
  // ==========================================

  /**
   * Muestra los detalles de una guía
   */
  async viewGuideDetail(guideId: number): Promise<void> {
    try {
      const response = await this.guideService.getGuideById(guideId);
      this.selectedGuide = response.guide;
      this.showDetailsModal = true;
    } catch (error) {
      console.error('Error loading guide details:', error);
      this.toastService.error('Error al cargar los detalles de la guía');
    }
  }

  /**
   * Cierra el modal de detalles
   */
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedGuide = null;
  }

  /**
   * Descarga el PDF de una guía
   */
  async downloadGuidePDF(guideId: number): Promise<void> {
    try {
      await this.guideService.downloadGuidePDF(guideId);
      this.toastService.success('Descargando PDF...');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.toastService.error('Error al descargar el PDF');
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  formatPrice(price: number): string {
    return this.translationService.formatCurrency(price);
  }

  // ==========================================
  // AUTH
  // ==========================================

  /**
   * Cierra sesión
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}