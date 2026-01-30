import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environments.dev";
import { Observable, firstValueFrom } from 'rxjs';
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
    success_rate: number;
    avg_time_minutes: number;
    avg_rating: number;
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

@Injectable({ providedIn: 'root'})
export class DeliveryService {

    private readonly BASE_URL = `${environment.apiBaseUrl}/delivery`;

    constructor(private http: HttpClient) {}

    // ==========================================
    // DELIVERIES
    // ==========================================

    /**
     * Obtiene las entregas asignadas al repartidor
     */
    async getMyDeliveries(): Promise<Delivery[]> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<{ deliveries: Delivery[] }>(
                    `${this.BASE_URL}/my-deliveries`, 
                    { headers }
                )
            );
            return response.deliveries;
        } catch (error) {
            console.error('Error al obtener mis entregas:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas del repartidor
     */
    async getDeliveryStats(): Promise<DeliveryStats> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<DeliveryStats>(
                    `${this.BASE_URL}/stats`, 
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }

    /**
     * Inicia la ruta de entrega
     */
    async startRoute(guideId: number): Promise<void> {
        const headers = this.getHeaders();

        try {
            await firstValueFrom(
                this.http.post(
                    `${this.BASE_URL}/${guideId}/start-route`,
                    {}, 
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al iniciar la ruta:', error);
        }
    }

    /**
     * Confirmar la entrega exitosa
     */
    async confirmDelivery(data: ConfirmDeliveryRequest): Promise<ConfirmDeliveryResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.post<ConfirmDeliveryResponse>(
                    `${this.BASE_URL}/confirm`,
                    data, 
                    { headers }
                )
            );

            return response;
        } catch (error) {
            console.error('Error al confirmar la entrega:', error);
            throw error;
        }
    }

    /**
     * Reportar un problema con la entrega
     */
    async reportIssue(data: ReportIssueRequest): Promise<ReportIssueResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.post<ReportIssueResponse>(
                    `${this.BASE_URL}/report-issue`,
                    data, 
                    { headers }
                )
            );

            return response;
        } catch (error) {
            console.error('Error al reportar un problema:', error);
            throw error;
        }
    }

    // ==========================================
    // PERFORMANCE
    // ==========================================

    /**
     * Obtiene las estadísticas de rendimiento
     */
    async getPerformanceStats(): Promise<PerformanceStats> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<PerformanceStats>(
                    `${this.BASE_URL}/performance`, 
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al obtener estadísticas de rendimiento:', error);
            throw error;
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