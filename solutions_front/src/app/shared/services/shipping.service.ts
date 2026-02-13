import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface ShippingPriceRequest {
    origin_city_id: number;
    destination_city_id: number;
    weight_kg: number;
    length_cm: number;
    width_cm: number;
    height_cm: number;
}

export interface PriceBreakdown {
    base_price: number;
    weight_price: number;
    total: number;
}

export interface ShippingPriceResponse {
    price: number;
    breakdown: PriceBreakdown;
}

@Injectable({ providedIn: 'root' })
export class ShippingService {
    private readonly BASE_URL = `${environment.apiBaseUrl}/shipping`;

    constructor(private http: HttpClient) {}

    async calculatePrice(request: ShippingPriceRequest): Promise<ShippingPriceResponse> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.post<ShippingPriceResponse>(
                    `${this.BASE_URL}/calculate`,
                    request,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al calcular precio de envío:', error);
            throw new Error('Error al calcular el precio del envío');
        }
    }

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
