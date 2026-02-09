import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { firstValueFrom } from 'rxjs';

// Interfaces
export interface DeliveryRating {
    rating_id: number;
    assignment_id: number;
    guide_id: number;
    delivery_user_id: string;
    delivery_user_name?: string;
    client_user_id: string;
    client_name?: string;
    rating: number;
    comment?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateRatingRequest {
    assignment_id: number;
    guide_id?: number;
    rating: number;
    comment?: string;
}

export interface CreateRatingResponse {
    success: boolean;
    rating: DeliveryRating;
    message: string;
}

export interface PendingRating {
    assignment_id: number;
    guide_id: number;
    delivery_user_id: string;
    delivery_user_name: string;
    completed_at: string;
    service_type: string;
}

export interface PendingRatingsResponse {
    pending_ratings: PendingRating[];
    total: number;
}

@Injectable({ providedIn: 'root' })
export class RatingService {

    private readonly CLIENT_URL = `${environment.apiBaseUrl}/client`;

    constructor(private http: HttpClient) {}

    /**
     * Obtiene las entregas pendientes de calificar por el cliente
     */
    async getPendingRatings(): Promise<PendingRatingsResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<PendingRatingsResponse>(
                    `${this.CLIENT_URL}/ratings/pending`,
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al obtener entregas pendientes de calificar:', error);
            return { pending_ratings: [], total: 0 };
        }
    }

    /**
     * Crea una calificación para una entrega
     */
    async createRating(request: CreateRatingRequest): Promise<CreateRatingResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.post<CreateRatingResponse>(
                    `${this.CLIENT_URL}/ratings`,
                    request,
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al crear calificación:', error);
            const message = error instanceof Error ? error.message : 'Error al enviar la calificación';
            throw new Error(message);
        }
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
