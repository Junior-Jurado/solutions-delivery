import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environments.dev";
import { firstValueFrom } from 'rxjs';
// Tipos
export type DeliveryStatus = 'PENDING' | 'IN_ROUTE' | 'DELIVERED' | 'FAILED';
export type DeliveryPriority = 'Normal' | 'Express' | 'Urgente';
export type PackageCondition = 'perfect' | 'minor-damage' | 'damaged';
export type IssueType = 
  | 'address-incorrect' 
  | 'recipient-unavailable' 
  | 'access-denied' 
  | 'package-damaged' 
  | 'payment-issue' 
  | 'other';

// Interfaces
export interface Delivery {
  id: string;
  guide_id: number;
  guide_number: string;
  address: string;
  recipient: string;
  phone: string;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  value: number;
  instructions: string;
  estimated_time: string;
  delivered_at?: string;
  delivery_photo_url?: string;
  signature_url?: string;
  otp_code?: string;
}

export interface DeliveryStats {
    total_today: number;
    completed: number;
    pending: number;
    avg_time_minutes: number;
    rating: number;
}

export interface ConfirmDeliveryRequest {
    guide_id: number;
    otp_code: string;
    delivery_notes: string;
    package_condition: PackageCondition;
    delivery_photo: string; // Base64
    signature?: string; // Base64
}

export interface ConfirmDeliveryResponse {
    success: boolean;
    delivery_id: string;
    message: string;
}

export interface ReportIssueRequest {
    guide_id: number;
    issue_type: IssueType;
    description: string;
    attempted_resolution: string;
    evidence_photos?: string[]; // Base64
}

export interface ReportIssueResponse {
    success: boolean;
    issue_id: string;
    message: string;
}

export interface PerformanceStats {
    deliveries_this_week: number;
    deliveries_last_week: number;
    deliveries_change_percent: number;
    success_rate: number;
    avg_time_minutes: number;
    avg_time_last_week: number;
    avg_time_change: number;
    avg_rating: number;
    avg_rating_last_month: number;
    avg_rating_change: number;
    total_ratings: number;
    daily_performance: DailyPerfomance[];
    recent_reviews: CustomerReview[];
}

export interface DailyPerfomance {
    day: string;
    deliveries: number;
    target: number;
    efficiency: number;
}

export interface CustomerReview {
    rating: number;
    comment: string;
    client: string;
    date: string;
}

// Interfaces alineadas con el backend
export interface DeliveryAssignment {
    assignment_id: number;
    guide_id: number;
    delivery_user_id: string;
    delivery_user_name?: string;
    assignment_type: 'PICKUP' | 'DELIVERY';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    assigned_by: string;
    assigned_by_name?: string;
    assigned_at: string;
    updated_at: string;
    completed_at?: string;
    guide?: GuideInfo;
}

export interface GuideInfo {
    guide_id: number;
    service_type: string;
    current_status: string;
    origin_city_name: string;
    destination_city_name: string;
    sender_name?: string;
    sender_address?: string;
    sender_phone?: string;
    receiver_name?: string;
    receiver_address?: string;
    receiver_phone?: string;
    created_at: string;
}

export interface MyAssignmentStats {
    pending_pickups: number;
    pending_deliveries: number;
    in_progress_pickups: number;
    in_progress_deliveries: number;
    completed_today: number;
    completed_this_week: number;
}

export interface MyAssignmentsResponse {
    pickups: DeliveryAssignment[];
    deliveries: DeliveryAssignment[];
    stats: MyAssignmentStats;
}

export interface StartRouteRequest {
    assignment_id: number;
    notes?: string;
}

export interface ConfirmDeliveryBackendRequest {
    assignment_id: number;
    notes?: string;
    delivery_photo_url?: string;
    signature_url?: string;
}

export interface ReportIssueBackendRequest {
    assignment_id: number;
    issue_type: IssueType;
    description: string;
    notes?: string;
}

@Injectable({ providedIn: 'root'})
export class DeliveryService {

    private readonly BASE_URL = `${environment.apiBaseUrl}/assignments`;

    constructor(private http: HttpClient) {}

    // ==========================================
    // DELIVERIES
    // ==========================================

    /**
     * Obtiene las asignaciones del repartidor (pickups y deliveries)
     */
    async getMyAssignments(): Promise<MyAssignmentsResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<MyAssignmentsResponse>(
                    `${this.BASE_URL}/my`,
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al obtener mis asignaciones:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas del repartidor (usa las stats de getMyAssignments)
     * @deprecated Usar getMyAssignments().stats en su lugar
     */
    async getDeliveryStats(): Promise<MyAssignmentStats> {
        const response = await this.getMyAssignments();
        return response.stats;
    }

    /**
     * Inicia la ruta de entrega (cambia el estado a IN_PROGRESS)
     */
    async startRoute(assignmentId: number, notes?: string): Promise<DeliveryAssignment> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.put<{ success: boolean; assignment: DeliveryAssignment; message: string }>(
                    `${this.BASE_URL}/${assignmentId}/status`,
                    { status: 'IN_PROGRESS', notes: notes || 'Ruta iniciada' },
                    { headers }
                )
            );
            return response.assignment;
        } catch (error) {
            console.error('Error al iniciar la ruta:', error);
            throw error;
        }
    }

    /**
     * Confirmar la entrega exitosa (cambia estado a COMPLETED)
     */
    async confirmDelivery(assignmentId: number, notes?: string): Promise<ConfirmDeliveryResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.put<{ success: boolean; assignment: DeliveryAssignment; message: string }>(
                    `${this.BASE_URL}/${assignmentId}/status`,
                    { status: 'COMPLETED', notes: notes || 'Entrega completada' },
                    { headers }
                )
            );

            return {
                success: response.success,
                delivery_id: String(response.assignment.assignment_id),
                message: response.message
            };
        } catch (error) {
            console.error('Error al confirmar la entrega:', error);
            throw error;
        }
    }

    /**
     * Reportar un problema con la entrega (marca como CANCELLED con notas del issue)
     */
    async reportIssue(assignmentId: number, issueType: IssueType, description: string): Promise<ReportIssueResponse> {
        const headers = this.getHeaders();
        const notes = `[${issueType}] ${description}`;

        try {
            const response = await firstValueFrom(
                this.http.put<{ success: boolean; assignment: DeliveryAssignment; message: string }>(
                    `${this.BASE_URL}/${assignmentId}/status`,
                    { status: 'CANCELLED', notes },
                    { headers }
                )
            );

            return {
                success: response.success,
                issue_id: String(response.assignment.assignment_id),
                message: response.message
            };
        } catch (error) {
            console.error('Error al reportar un problema:', error);
            throw error;
        }
    }

    // ==========================================
    // PERFORMANCE
    // ==========================================

    /**
     * Obtiene las estadísticas de rendimiento del repartidor
     */
    async getPerformanceStats(): Promise<PerformanceStats> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<PerformanceStats>(
                    `${this.BASE_URL}/my/performance`,
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al obtener estadísticas de rendimiento:', error);
            // Fallback a datos calculados si el endpoint falla
            const myAssignments = await this.getMyAssignments();
            const stats = myAssignments.stats;
            const totalCompleted = stats.completed_this_week;
            const totalPending = stats.pending_pickups + stats.pending_deliveries;
            const totalInProgress = stats.in_progress_pickups + stats.in_progress_deliveries;
            const total = totalCompleted + totalPending + totalInProgress;

            return {
                deliveries_this_week: stats.completed_this_week,
                deliveries_last_week: 0,
                deliveries_change_percent: 0,
                success_rate: total > 0 ? Math.round((totalCompleted / total) * 100) : 100,
                avg_time_minutes: 0,
                avg_time_last_week: 0,
                avg_time_change: 0,
                avg_rating: 0,
                avg_rating_last_month: 0,
                avg_rating_change: 0,
                total_ratings: 0,
                daily_performance: [],
                recent_reviews: []
            };
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================

    /**
     * Convierte archivo a Base64
     */
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        })
    }

    /**
     * Obtiene los headers con autenticación
     */
    private getHeaders(): HttpHeaders {
        const idToken = sessionStorage.getItem('idToken');
        
        if (!idToken) {
        throw new Error('No se encontró el token de identificación');
        }

        return new HttpHeaders({
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
        });
    }
}