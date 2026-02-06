import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Services
import {
  DeliveryService,
  DeliveryAssignment,
  MyAssignmentsResponse,
  MyAssignmentStats,
  PerformanceStats,
  IssueType
} from '@core/services/delivery.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { TranslationService } from '@shared/services/translation.service';
import { DeviceDetectionService } from '@shared/services/device-detection.service';

// Shared Components
import { IconComponent } from '@shared/components/icon/icon.component';
import { DashboardHeaderComponent } from '@shared/components/dashboard-header/dashboard-header.component';
import { MapModalComponent, MapLocation } from '@shared/components/map-modal/map-modal.component';

// Feature Components
import { DeliveryStatsComponent } from '../components/delivery-stats/delivery-stats.component';
import { AssignmentsListComponent } from '../components/assignments-list/assignments-list.component';
import { ConfirmDeliveryFormComponent, ConfirmDeliveryData } from '../components/confirm-delivery-form/confirm-delivery-form.component';
import { ReportIssueFormComponent, ReportIssueData } from '../components/report-issue-form/report-issue-form.component';
import { PerformancePanelComponent } from '../components/performance-panel/performance-panel.component';

@Component({
  selector: 'app-delivery',
  standalone: true,
  templateUrl: './delivery-dashboard.page.html',
  styleUrls: ['./delivery-dashboard.page.scss'],
  imports: [
    CommonModule,
    IconComponent,
    DashboardHeaderComponent,
    MapModalComponent,
    DeliveryStatsComponent,
    AssignmentsListComponent,
    ConfirmDeliveryFormComponent,
    ReportIssueFormComponent,
    PerformancePanelComponent
  ]
})
export class DeliveryDashboardPage implements OnInit, OnDestroy {
  @ViewChild(ConfirmDeliveryFormComponent) confirmForm!: ConfirmDeliveryFormComponent;
  @ViewChild(ReportIssueFormComponent) reportForm!: ReportIssueFormComponent;

  private destroy$ = new Subject<void>();

  // Navigation
  activeTab: 'deliveries' | 'confirm' | 'issues' | 'performance' = 'deliveries';

  // Assignments
  pickups: DeliveryAssignment[] = [];
  deliveries: DeliveryAssignment[] = [];
  isLoadingDeliveries: boolean = false;
  stats: MyAssignmentStats | null = null;

  // Confirm Delivery
  selectedAssignmentId: number | null = null;
  isConfirming: boolean = false;

  // Report Issue
  isReporting: boolean = false;

  // Performance
  performanceStats: PerformanceStats | null = null;
  isLoadingPerformance: boolean = false;

  // Device detection
  isMobile: boolean = false;

  // Refresh
  isRefreshing: boolean = false;

  // User data
  userName: string = '';
  userRole: string = 'DELIVERY';

  // Map modal
  isMapModalOpen: boolean = false;
  selectedMapLocation: MapLocation | null = null;

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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

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

  // ==========================================
  // ASSIGNMENT ACTIONS
  // ==========================================

  async handleStartRoute(assignment: DeliveryAssignment): Promise<void> {
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

  handleConfirmDelivery(assignment: DeliveryAssignment): void {
    this.selectedAssignmentId = assignment.assignment_id;
    this.setActiveTab('confirm');
  }

  handleViewOnMap(assignment: DeliveryAssignment): void {
    const isPickup = assignment.assignment_type === 'PICKUP';

    const address = isPickup
      ? assignment.guide?.sender_address
      : assignment.guide?.receiver_address;

    const city = isPickup
      ? assignment.guide?.origin_city_name
      : assignment.guide?.destination_city_name;

    const contactName = isPickup
      ? assignment.guide?.sender_name
      : assignment.guide?.receiver_name;

    const contactPhone = isPickup
      ? assignment.guide?.sender_phone
      : assignment.guide?.receiver_phone;

    if (address && city) {
      this.selectedMapLocation = {
        address: address,
        city: city,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
        type: assignment.assignment_type
      };
      this.isMapModalOpen = true;
      this.cdr.detectChanges();
    }
  }

  handleCallRecipient(assignment: DeliveryAssignment): void {
    const phone = assignment.assignment_type === 'PICKUP'
      ? assignment.guide?.sender_phone
      : assignment.guide?.receiver_phone;

    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  closeMapModal(): void {
    this.isMapModalOpen = false;
    this.selectedMapLocation = null;
    this.cdr.detectChanges();
  }

  // ==========================================
  // CONFIRM DELIVERY
  // ==========================================

  onAssignmentSelected(assignmentId: number | null): void {
    this.selectedAssignmentId = assignmentId;
  }

  async handleConfirmSubmit(data: ConfirmDeliveryData): Promise<void> {
    this.isConfirming = true;
    this.cdr.detectChanges();

    try {
      const notes = data.notes || `Completado - Condición: ${data.condition}`;
      await this.deliveryService.confirmDelivery(data.assignmentId, notes);

      this.toastService.success('¡Asignación completada exitosamente!');

      // Reset form and selection
      this.selectedAssignmentId = null;
      if (this.confirmForm) {
        this.confirmForm.resetForm();
      }

      // Reload deliveries
      await this.loadDeliveries();

      // Go back to deliveries tab
      this.setActiveTab('deliveries');

    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      this.toastService.error(error.message || 'Error al confirmar la entrega');
    } finally {
      this.isConfirming = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // REPORT ISSUE
  // ==========================================

  async handleReportSubmit(data: ReportIssueData): Promise<void> {
    this.isReporting = true;
    this.cdr.detectChanges();

    try {
      const fullDescription = data.attemptedResolution
        ? `${data.description}. Resolución intentada: ${data.attemptedResolution}`
        : data.description;

      await this.deliveryService.reportIssue(
        data.assignmentId,
        data.issueType as IssueType,
        fullDescription
      );

      this.toastService.success('Problema reportado exitosamente');

      // Reset form
      if (this.reportForm) {
        this.reportForm.resetForm();
      }

      // Reload deliveries
      await this.loadDeliveries();

    } catch (error: any) {
      console.error('Error reporting issue:', error);
      this.toastService.error(error.message || 'Error al reportar el problema');
    } finally {
      this.isReporting = false;
      this.cdr.detectChanges();
    }
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
  // REFRESH
  // ==========================================

  async handleRefresh(): Promise<void> {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    this.cdr.detectChanges();

    try {
      switch (this.activeTab) {
        case 'deliveries':
          await this.loadDeliveries();
          break;
        case 'confirm':
          await this.loadDeliveries();
          break;
        case 'issues':
          await this.loadDeliveries();
          break;
        case 'performance':
          await this.loadPerformance();
          break;
        default:
          await this.loadDeliveries();
      }
      this.toastService.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error al refrescar:', error);
      this.toastService.error('Error al actualizar los datos');
    } finally {
      this.isRefreshing = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // AUTH
  // ==========================================

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
