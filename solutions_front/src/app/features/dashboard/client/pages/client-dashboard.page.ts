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
import { GuideFormComponent } from '@features/dashboard/secretary/components/guide-form/guide-form.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { GuideDetailsModalComponent } from '@shared/components/guide-details-modal.component';

interface GuidePreview {
  senderName: string;
  senderCity: string;
  receiverName: string;
  receiverCity: string;
  weight: number;
  declaredValue: number;
  serviceType: string;
  priority: string;
  calculatedPrice: number; // ← NUEVO: Precio calculado
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
    GuideDetailsModalComponent
  ]
})
export class ClientDashboardPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // User data
  currentUser: ClientProfile | null = null;
  userId: string = '';

  // Active tab
  activeTab: 'tracking' | 'my-guides' | 'history' | 'create' = 'tracking';
  
  // Tracking
  trackingNumber: string = '';
  trackingResult: ShippingGuide | null = null;
  isTracking: boolean = false;
  trackingError: string = '';

  // My Guides
  myGuides: ShippingGuide[] = [];
  loadingMyGuides: boolean = false;

  // History
  guidesHistory: ShippingGuide[] = [];
  loadingHistory: boolean = false;

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
      this.cdr.detectChanges(); // Forzar detección de cambios
    } catch (error) {
      console.error('Error loading profile:', error);
      this.toastService.error('Error al cargar el perfil de usuario');
    }
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: 'tracking' | 'my-guides' | 'history' | 'create'): void {
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
  async trackGuide(): Promise<void> {
    if (!this.trackingNumber.trim()) {
      this.trackingError = 'Por favor ingrese un número de guía';
      return;
    }

    this.isTracking = true;
    this.trackingError = '';
    this.trackingResult = null;
    this.cdr.detectChanges(); // Actualizar UI antes de la llamada

    try {
      const guide = await this.clientService.trackGuide(this.trackingNumber.trim());
      
      // ⭐ VALIDACIÓN DE SEGURIDAD: Verificar que el usuario tiene permiso para ver esta guía
      const canViewGuide = this.validateGuideAccess(guide);
      
      if (!canViewGuide) {
        this.trackingError = 'No tienes permiso para ver esta guía. Solo puedes rastrear guías donde apareces como remitente, destinatario o creador.';
        this.toastService.error('Acceso denegado');
        this.trackingResult = null;
      } else {
        this.trackingResult = guide;
        this.toastService.success('Guía encontrada exitosamente');
      }
      
      this.cdr.detectChanges(); // Actualizar UI después de recibir datos
    } catch (error: any) {
      this.trackingError = 'No se encontró la guía. Verifique el número e intente nuevamente.';
      this.toastService.error('Guía no encontrada');
      this.cdr.detectChanges();
    } finally {
      this.isTracking = false;
      this.cdr.detectChanges(); // Actualizar UI final
    }
  }

  /**
   * Valida si el usuario tiene acceso a ver una guía
   */
  private validateGuideAccess(guide: ShippingGuide): boolean {
    if (!this.currentUser) return false;

    // El usuario puede ver la guía si:
    // 1. Es el creador
    if (guide.created_by === this.userId) {
      return true;
    }

    // 2. Su documento coincide con el del remitente
    if (guide.sender?.document_number === this.currentUser.document_number) {
      return true;
    }

    // 3. Su documento coincide con el del destinatario
    if (guide.receiver?.document_number === this.currentUser.document_number) {
      return true;
    }

    return false;
  }

  /**
   * Limpia el resultado del rastreo
   */
  clearTracking(): void {
    this.trackingNumber = '';
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
    this.cdr.detectChanges(); // Mostrar loader

    try {
      this.myGuides = await this.clientService.getActiveGuides();
      this.cdr.detectChanges(); // Actualizar con datos
    } catch (error) {
      console.error('Error loading guides:', error);
      this.toastService.error('Error al cargar las guías');
    } finally {
      this.loadingMyGuides = false;
      this.cdr.detectChanges(); // Ocultar loader
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
    this.cdr.detectChanges(); // Mostrar loader

    try {
      this.guidesHistory = await this.clientService.getGuideHistory();
      this.cdr.detectChanges(); // Actualizar con datos
    } catch (error) {
      console.error('Error loading history:', error);
      this.toastService.error('Error al cargar el histórico');
    } finally {
      this.loadingHistory = false;
      this.cdr.detectChanges(); // Ocultar loader
    }
  }

  // ==========================================
  // CREATE GUIDE
  // ==========================================

  /**
   * Maneja el envío del formulario de creación de guía
   */
  onGuideFormSubmit(formData: any): void {
    // Calcular el precio usando el método del GuideService
    const calculatedPrice = this.guideService.calculatePrice(formData);
    
    this.pendingGuideData = formData;
    this.guidePreviewData = {
      senderName: formData.senderName,
      senderCity: formData.senderCityName,
      receiverName: formData.receiverName,
      receiverCity: formData.receiverCityName,
      weight: formData.weight,
      declaredValue: formData.declaredValue,
      serviceType: formData.serviceType,
      priority: formData.priority,
      calculatedPrice: calculatedPrice
    };
    this.showGuidePreview = true;
  }

  /**
   * Confirma la creación de la guía
   */
  async confirmGuideCreation(): Promise<void> {
    if (!this.pendingGuideData || !this.userId) return;

    this.isCreatingGuide = true;
    this.cdr.detectChanges(); // Mostrar estado de creación

    try {
      // Construir el request usando el builder del GuideService
      const guideRequest: CreateGuideRequest = this.guideService.buildGuideRequest(
        this.pendingGuideData,
        this.userId
      );

      // Crear la guía
      const response = await this.guideService.createGuide(guideRequest);

      // Mostrar mensaje de éxito (3 segundos)
      this.toastService.success(
        `Guía creada exitosamente. Número: ${response.guide_number}`,
        3000
      );

      // Limpiar el modal
      this.showGuidePreview = false;
      this.pendingGuideData = null;
      this.guidePreviewData = null;
      this.cdr.detectChanges();

      // Cambiar a "Mis Guías" y recargar
      this.setActiveTab('my-guides');
      await this.loadMyGuides();

    } catch (error: any) {
      console.error('Error creating guide:', error);
      const errorMessage = error.message || 'Error al crear la guía. Por favor intente nuevamente.';
      this.toastService.error(errorMessage);
    } finally {
      this.isCreatingGuide = false;
      this.cdr.detectChanges(); // Ocultar estado de creación
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
  // STATUS HELPERS
  // ==========================================

  /**
   * Obtiene la clase CSS según el estado de la guía
   */
  getStatusClass(status: string): string {
    return this.translationService.getStatusBadgeClass(status as any);
  }

  /**
   * Traduce el estado de la guía
   */
  getStatusText(status: string): string {
    return this.translationService.translateGuideStatus(status as any);
  }

  /**
   * Formatea una fecha de manera relativa
   */
  formatDate(dateString: string): string {
    return this.translationService.formatRelativeDate(dateString);
  }

  /**
   * Formatea un precio
   */
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