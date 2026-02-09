import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment.dev';

// Tipos de período
export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// Interfaces
export interface CashCloseRequest {
    period_type: PeriodType;
    year: number;
    month?: number;
    day?: number;
    week?: number;
}

export interface CashCloseDetail {
    detail_id: number;
    close_id: number;
    guide_id: number;
    date: string;
    sender: string;
    destination: string;
    units: number;
    weight: number;
    freight: number;
    other: number;
    handling: number;
    discount: number;
    total_value: number;
    payment_method: 'CASH' | 'COD' | 'CREDIT';
}

export interface CashClose {
    close_id: number;
    period_type: PeriodType;
    start_date: string;
    end_date: string;
    total_guides: number;
    total_amount: number;
    total_cash: number;
    total_cod: number;
    total_credit: number;
    total_freight: number;
    total_other: number;
    total_handling: number;
    total_discounts: number;
    total_units: number;
    total_weight: number;
    pdf_url?: string;
    pdf_s3_key?: string;
    created_by: string;
    created_at: string;
}

export interface CashCloseResponse {
    close: CashClose;
    details: CashCloseDetail[];
    pdf_url?: string;
}

export interface CashCloseListResponse {
    closes: CashClose[];
    total: number;
}

export interface CashCloseStatsResponse {
    today_total: number;
    month_total: number;
    year_total: number;
    by_payment_method: {
        CASH: number;
        COD: number;
        CREDIT: number;
    };
}

@Injectable({ providedIn: 'root' })
export class CashCloseService {
    private readonly BASE_URL = `${environment.apiBaseUrl}/cash-close`;

    constructor(private http: HttpClient) {}

    /**
     * Genera un nuevo cierre de caja
     */
    async generateCashClose(request: CashCloseRequest): Promise<CashCloseResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.post<CashCloseResponse>(
                    this.BASE_URL,
                    request,
                    { headers }
                )
            );

            console.log('Cierre de caja generado:', response);
            return response;
        } catch (error) {
            console.error('Error al generar cierre de caja:', error);
            const message = error instanceof Error ? error.message : 'Error al generar el cierre de caja';
            throw new Error(message);
        }
    }

    /**
     * Obtiene lista de cierres de caja
     */
    async listCashCloses(limit = 20, offset = 0): Promise<CashCloseListResponse> {
        const headers = this.getHeaders();
        const params = new HttpParams()
            .set('limit', limit.toString())
            .set('offset', offset.toString());

        try {
            return await firstValueFrom(
                this.http.get<CashCloseListResponse>(
                    this.BASE_URL,
                    { headers, params }
                )
            );
        } catch (error) {
            console.error('Error al obtener cierres:', error);
            throw error;
        }
    }

    /**
     * Obtiene un cierre específico con detalles
     */
    async getCashCloseById(closeId: number): Promise<CashCloseResponse> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.get<CashCloseResponse>(
                    `${this.BASE_URL}/${closeId}`,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al obtener cierre:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de cierres
     */
    async getCashCloseStats(): Promise<CashCloseStatsResponse> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.get<CashCloseStatsResponse>(
                    `${this.BASE_URL}/stats`,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }

    /**
     * Descarga el PDF de un cierre
     */
    async downloadCashClosePDF(closeId: number): Promise<void> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<{ pdf_url: string }>(
                    `${this.BASE_URL}/${closeId}/pdf`,
                    { headers }
                )
            );

            // Abrir la URL firmada en una nueva pestaña
            window.open(response.pdf_url, '_blank');
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            throw new Error('Error al descargar el PDF del cierre');
        }
    }

    /**
     * Traduce el tipo de período a español
     */
    translatePeriodType(periodType: PeriodType): string {
        const translations: Record<PeriodType, string> = {
            'DAILY': 'Diario',
            'WEEKLY': 'Semanal',
            'MONTHLY': 'Mensual',
            'YEARLY': 'Anual'
        };
        return translations[periodType] || periodType;
    }

    /**
     * Traduce el método de pago a español
     */
    translatePaymentMethod(method: 'CASH' | 'COD' | 'CREDIT'): string {
        const translations = {
            'CASH': 'Contado',
            'COD': 'Contraentrega',
            'CREDIT': 'Crédito'
        };
        return translations[method] || method;
    }

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