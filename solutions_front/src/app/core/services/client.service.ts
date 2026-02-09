import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { ShippingGuide, GuideStatus } from './guide.service';

export interface ClientProfile {
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    document_type: string;
    document_number: string;
    created_at: string;
}

export interface ClientStats {
    total_guides: number;
    active_guides: number;
    delivered_guides: number;
    total_spent: number;
}

export interface ClientGuideFilters {
    status?: GuideStatus;
    date_from?: string;
    date_to?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
    private readonly BASE_URL = `${environment.apiBaseUrl}/client`;

    constructor(private http: HttpClient) {}

    // ==========================================
    // PROFILE
    // ==========================================

    /**
     * Obtiene el perfil del cliente actual
     */
    async getProfile(): Promise<ClientProfile> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.get<ClientProfile>(
                    `${this.BASE_URL}/profile`,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            throw error;
        }
    }

    /**
     * Actualiza el perfil del cliente
     */
    async updateProfile(data: Partial<ClientProfile>): Promise<ClientProfile> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.put<ClientProfile>(
                    `${this.BASE_URL}/profile`,
                    data,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            throw error;
        }
    }

    // ==========================================
    // GUIDES
    // ==========================================

    /**
     * Obtiene las guías activas del cliente
     */
    async getActiveGuides(): Promise<ShippingGuide[]> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<{ guides: ShippingGuide[] }>(
                    `${this.BASE_URL}/guides/active`,
                    { headers }
                )
            );
            return response.guides;
        } catch (error) {
            console.error('Error al obtener guías activas:', error);
            throw error;
        }
    }

    /**
     * Obtiene el histórico de guías del cliente
     */
    async getGuideHistory(filters?: ClientGuideFilters): Promise<ShippingGuide[]> {
        const headers = this.getHeaders();
        
        let params = new HttpParams();
        
        if (filters) {
            if (filters.status) params = params.set('status', filters.status);
            if (filters.date_from) params = params.set('date_from', filters.date_from);
            if (filters.date_to) params = params.set('date_to', filters.date_to);
            if (filters.search) params = params.set('search', filters.search);
            if (filters.limit) params = params.set('limit', filters.limit.toString());
            if (filters.offset) params = params.set('offset', filters.offset.toString());
        }

        try {
            const response = await firstValueFrom(
                this.http.get<{ guides: ShippingGuide[] }>(
                    `${this.BASE_URL}/guides/history`,
                    { headers, params }
                )
            );
            return response.guides;
        } catch (error) {
            console.error('Error al obtener histórico:', error);
            throw error;
        }
    }

    /**
     * Busca una guía por número
     */
    async trackGuide(guideNumber: string): Promise<ShippingGuide> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<{ guide: ShippingGuide }>(
                    `${this.BASE_URL}/guides/track/${guideNumber}`,
                    { headers }
                )
            );
            return response.guide;
        } catch (error) {
            console.error('Error al rastrear guía:', error);
            throw error;
        }
    }

    // ==========================================
    // STATS
    // ==========================================

    /**
     * Obtiene estadísticas del cliente
     */
    async getStats(): Promise<ClientStats> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.get<ClientStats>(
                    `${this.BASE_URL}/stats`,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    /**
     * Obtiene los headers con autenticación
     */
    private getHeaders(): HttpHeaders {
        const idToken = sessionStorage.getItem('idToken');
        
        if (!idToken) {
            throw new Error('No se encontró el token de identificación. Por favor inicie sesión.');
        }

        return new HttpHeaders({
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        });
    }
}