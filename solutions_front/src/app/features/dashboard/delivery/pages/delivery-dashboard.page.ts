import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Services
import {
  DeliveryService,
  DeliveryAssignment,
  MyAssignmentsResponse,
  MyAssignmentStats,
  PerformanceStats,
  PackageCondition,
  IssueType
} from '@core/services/delivery.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { TranslationService } from '@shared/services/translation.service';
import { DeviceDetectionService } from '@shared/services/device-detection.service';

// Components
import { IconComponent } from '@shared/components/icon/icon.component';
import { DashboardHeaderComponent } from '@shared/components/dashboard-header/dashboard-header.component';

@Component({
  selector: 'app-delivery',
  standalone: true,
  templateUrl: './delivery-dashboard.page.html',
  styleUrls: ['./delivery-dashboard.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    DashboardHeaderComponent
  ]
})
export class DeliveryDashboardPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Navigation
  activeTab: 'deliveries' | 'confirm' | 'issues' | 'performance' = 'deliveries';

  // Assignments (Pickups y Deliveries)
  pickups: DeliveryAssignment[] = [];
  deliveries: DeliveryAssignment[] = [];
  isLoadingDeliveries: boolean = false;
  stats: MyAssignmentStats | null = null;

  // Confirm Delivery
  selectedAssignmentId: number | null = null;
  deliveryNotes: string = '';
  packageCondition: PackageCondition = 'perfect';
  deliveryPhotoBase64: string = '';
  signatureBase64: string = '';
  isConfirming: boolean = false;

  // Report Issue
  selectedIssueAssignmentId: number | null = null;
  issueType: IssueType | '' = '';
  issueDescription: string = '';
  attemptedResolution: string = '';
  issuePhotos: string[] = [];
  isReporting: boolean = false;

  // Performance
  performanceStats: PerformanceStats | null = null;
  isLoadingPerformance: boolean = false;

  // Device detection
  isMobile: boolean = false;

  // User data
  userName: string = '';
  userRole: string = 'DELIVERY';

  constructor(
    private deliveryService: DeliveryService,
    private authService: AuthService,
    private toastService: ToastService,
    public translationService: TranslationService,
    private deviceService: DeviceDetectionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadUserData();
    this.detectDevice();
    await this.loadDeliveries();
    await this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  /**
   * Carga los datos del usuario desde el token JWT
   */
  private loadUserData(): void {
    const idToken = sessionStorage.getItem('idToken');
    if (idToken) {
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        const rawName = payload['custom:full_name'] || payload.name || 'Repartidor';
        this.userName = this.fixUtf8Encoding(rawName);
        this.userRole = sessionStorage.getItem('role') || 'DELIVERY';
      } catch (error) {
        console.error('Error al decodificar token:', error);
        this.userName = 'Repartidor';
      }
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

  private detectDevice(): void {
    this.deviceService.getDeviceInfo$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.isMobile = info.isMobile;
      });
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================

  setActiveTab(tab: 'deliveries' | 'confirm' | 'issues' | 'performance'): void {
    this.activeTab = tab;

    if (tab === 'performance' && !this.performanceStats) {
      this.loadPerformance();
    }
  }

  // ==========================================
  // DELIVERIES
  // ==========================================

  async loadDeliveries(): Promise<void> {
    this.isLoadingDeliveries = true;
    this.cdr.detectChanges();

    try {
      const response: MyAssignmentsResponse = await this.deliveryService.getMyAssignments();
      this.pickups = response.pickups || [];
      this.deliveries = response.deliveries || [];
      this.stats = response.stats;
      console.log('Asignaciones cargadas - Pickups:', this.pickups.length, 'Entregas:', this.deliveries.length);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      this.toastService.error('Error al cargar las asignaciones');
    } finally {
      this.isLoadingDeliveries = false;
      this.cdr.detectChanges();
    }
  }

  async loadStats(): Promise<void> {
    // Las stats ahora vienen incluidas en loadDeliveries
    // Este método se mantiene por compatibilidad
    if (!this.stats) {
      await this.loadDeliveries();
    }
  }

  async startRoute(assignment: DeliveryAssignment): Promise<void> {
    try {
      await this.deliveryService.startRoute(assignment.assignment_id, 'Ruta iniciada');
      assignment.status = 'IN_PROGRESS';
      this.toastService.success('Ruta iniciada exitosamente');
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error starting route:', error);
      this.toastService.error('Error al iniciar la ruta');
    }
  }

  viewOnMap(assignment: DeliveryAssignment): void {
    // Abrir Google Maps con la dirección
    const address = assignment.assignment_type === 'PICKUP'
      ? assignment.guide?.sender_address
      : assignment.guide?.receiver_address;

    if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  }

  callRecipient(assignment: DeliveryAssignment): void {
    const phone = assignment.assignment_type === 'PICKUP'
      ? assignment.guide?.sender_phone
      : assignment.guide?.receiver_phone;

    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  goToConfirmTab(assignment: DeliveryAssignment): void {
    this.selectedAssignmentId = assignment.assignment_id;
    this.setActiveTab('confirm');
  }

  // ==========================================
  // CONFIRM DELIVERY
  // ==========================================

  get selectedAssignmentData(): DeliveryAssignment | null {
    if (!this.selectedAssignmentId) return null;
    const allAssignments = [...this.pickups, ...this.deliveries];
    return allAssignments.find(a => a.assignment_id === this.selectedAssignmentId) || null;
  }

  get assignmentsInProgress(): DeliveryAssignment[] {
    const allAssignments = [...this.pickups, ...this.deliveries];
    return allAssignments.filter(a => a.status === 'IN_PROGRESS');
  }

  get pendingPickups(): DeliveryAssignment[] {
    return this.pickups.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS');
  }

  get pendingDeliveries(): DeliveryAssignment[] {
    return this.deliveries.filter(d => d.status === 'PENDING' || d.status === 'IN_PROGRESS');
  }

  onDeliveryPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.deliveryService.fileToBase64(file).then(base64 => {
        this.deliveryPhotoBase64 = base64;
      });
    }
  }

  openCamera(): void {
    // En producción, esto abriría la cámara del dispositivo
    // Por ahora, trigger el input file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => this.onDeliveryPhotoChange(e);
    input.click();
  }

  async confirmDelivery(): Promise<void> {
    if (!this.selectedAssignmentId) {
      this.toastService.error('Por favor seleccione una asignación');
      return;
    }

    const assignment = this.selectedAssignmentData;
    if (!assignment) return;

    this.isConfirming = true;
    this.cdr.detectChanges();

    try {
      const notes = this.deliveryNotes || `Completado - Condición: ${this.packageCondition}`;
      await this.deliveryService.confirmDelivery(assignment.assignment_id, notes);

      this.toastService.success('¡Asignación completada exitosamente!');

      // Resetear formulario
      this.resetConfirmForm();

      // Recargar entregas
      await this.loadDeliveries();

      // Volver a la pestaña de entregas
      this.setActiveTab('deliveries');

    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      this.toastService.error(error.message || 'Error al confirmar la entrega');
    } finally {
      this.isConfirming = false;
      this.cdr.detectChanges();
    }
  }

  resetConfirmForm(): void {
    this.selectedAssignmentId = null;
    this.deliveryNotes = '';
    this.packageCondition = 'perfect';
    this.deliveryPhotoBase64 = '';
    this.signatureBase64 = '';
  }

  // ==========================================
  // REPORT ISSUE
  // ==========================================

  onIssuePhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        this.deliveryService.fileToBase64(file).then(base64 => {
          this.issuePhotos.push(base64);
          this.cdr.detectChanges();
        });
      });
    }
  }

  async reportIssue(): Promise<void> {
    if (!this.selectedIssueAssignmentId || !this.issueType || !this.issueDescription) {
      this.toastService.error('Por favor complete todos los campos requeridos');
      return;
    }

    this.isReporting = true;
    this.cdr.detectChanges();

    try {
      const fullDescription = this.attemptedResolution
        ? `${this.issueDescription}. Resolución intentada: ${this.attemptedResolution}`
        : this.issueDescription;

      await this.deliveryService.reportIssue(
        this.selectedIssueAssignmentId,
        this.issueType as IssueType,
        fullDescription
      );

      this.toastService.success('Problema reportado exitosamente');

      // Resetear formulario
      this.resetIssueForm();

      // Recargar entregas
      await this.loadDeliveries();

    } catch (error: any) {
      console.error('Error reporting issue:', error);
      this.toastService.error(error.message || 'Error al reportar el problema');
    } finally {
      this.isReporting = false;
      this.cdr.detectChanges();
    }
  }

  resetIssueForm(): void {
    this.selectedIssueAssignmentId = null;
    this.issueType = '';
    this.issueDescription = '';
    this.attemptedResolution = '';
    this.issuePhotos = [];
  }

  // ==========================================
  // PERFORMANCE
  // ==========================================

  async loadPerformance(): Promise<void> {
    this.isLoadingPerformance = true;
    this.cdr.detectChanges();

    try {
      this.performanceStats = await this.deliveryService.getPerformanceStats();
      console.log('Performance stats:', this.performanceStats);
    } catch (error) {
      console.error('Error loading performance:', error);
      this.toastService.error('Error al cargar estadísticas de rendimiento');
    } finally {
      this.isLoadingPerformance = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'badge-warning',
      'IN_PROGRESS': 'badge-info',
      'COMPLETED': 'badge-success',
      'CANCELLED': 'badge-error'
    };
    return classes[status] || 'badge-default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  }

  getAssignmentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'PICKUP': 'Recoger',
      'DELIVERY': 'Entregar'
    };
    return labels[type] || type;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: Record<string, string> = {
      'Urgente': 'badge-error',
      'Express': 'badge-info',
      'Normal': 'badge-secondary'
    };
    return classes[priority] || 'badge-default';
  }

  getContactName(assignment: DeliveryAssignment): string {
    if (assignment.assignment_type === 'PICKUP') {
      return assignment.guide?.sender_name || 'Sin nombre';
    }
    return assignment.guide?.receiver_name || 'Sin nombre';
  }

  getContactAddress(assignment: DeliveryAssignment): string {
    if (assignment.assignment_type === 'PICKUP') {
      return assignment.guide?.sender_address || 'Sin dirección';
    }
    return assignment.guide?.receiver_address || 'Sin dirección';
  }

  getContactPhone(assignment: DeliveryAssignment): string {
    if (assignment.assignment_type === 'PICKUP') {
      return assignment.guide?.sender_phone || '';
    }
    return assignment.guide?.receiver_phone || '';
  }

  formatPrice(value: number): string {
    return this.translationService.formatCurrency(value);
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  // ==========================================
  // AUTH
  // ==========================================

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}