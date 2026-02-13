import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { ShippingService, ShippingPriceRequest } from '@shared/services/shipping.service';

// Interfaces para el request
export interface ServiceInfo {
    service_type: string;
    payment_method: string;
    shipping_type: string;
}

export interface PricingInfo {
    declared_value: number;
    price: number;
    override_reason?: string;
}

export interface RouteInfo {
    origin_city_id: number;
    destination_city_id: number;
}

export interface PartyInfo {
    full_name: string;
    document_type: string;
    document_number: string;
    phone: string;
    email: string;
    address: string;
    city_id: number;
    city_name: string;
}

export interface PackageInfo {
    weight_kg: number;
    pieces: number;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    insured: boolean;
    description: string;
    special_notes: string;
}

export interface CreateGuideRequest {
    created_by: string;
    service: ServiceInfo;
    pricing: PricingInfo;
    route: RouteInfo;
    sender: PartyInfo;
    receiver: PartyInfo;
    package: PackageInfo;
}

// Interfaces para respuestas
export interface CreateGuideResponse {
    guide_id: number;
    guide_number: string;
    pdf_url: string;
    s3_key: string;
    pdf_size: number;
    message: string;
}

export interface GuideErrorResponse {
    error: string;
    details?: string;
    guide_id?: number;
}

// Tipos de estado de guía
export type GuideStatus = 
    | 'CREATED'
    | 'IN_ROUTE' 
    | 'IN_WAREHOUSE'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED';

export type ServiceType = 'NORMAL' | 'PRIORITY' | 'EXPRESS';
export type PaymentMethod = 'CASH' | 'COD' | 'CREDIT';

// Interface para el formulario de guía (flexible para compatibilidad)
export interface GuideFormValue {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    serviceType: string;
    declaredValue: string | number;
    senderCity: number | { city_id: number };
    receiverCity: number | { city_id: number };
    senderName: string;
    senderDocType?: string;
    senderDoc: string;
    senderPhone: string;
    senderEmail?: string;
    senderAddress: string;
    senderCityName?: string;
    receiverName: string;
    receiverDocType?: string;
    receiverDoc: string;
    receiverPhone: string;
    receiverEmail?: string;
    receiverAddress: string;
    receiverCityName?: string;
    weight: string | number;
    pieces?: string | number;
    dimensions?: string;
    insurance?: string;
    content?: string;
    observations?: string;
    priority?: string;
}
// Interfaces para los modelos de guía
export interface ShippingGuide {
    guide_id: number;
    service_type: ServiceType;
    payment_method: PaymentMethod;
    declared_value: number;
    price: number;
    current_status: GuideStatus;
    origin_city_id: number;
    origin_city_name?: string;
    destination_city_id: number;
    destination_city_name?: string;
    pdf_url?: string;
    pdf_s3_key?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    sender?: GuideParty;
    receiver?: GuideParty;
    package?: Package;
    history?: StatusHistory[];
}

export interface GuideParty {
    party_id: number;
    guide_id: number;
    party_role: 'SENDER' | 'RECEIVER';
    full_name: string;
    document_type: string;
    document_number: string;
    phone: string;
    email: string;
    address: string;
    city_id: number;
    city_name?: string;
}

export interface Package {
    package_id: number;
    guide_id: number;
    weight_kg: number;
    pieces: number;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    insured: boolean;
    description: string;
    special_notes: string;
}

export interface StatusHistory {
    history_id: number;
    guide_id: number;
    status: GuideStatus;
    updated_by: string;
    updated_at: string;
}

// Interfaces para listados y filtros
export interface GuideFilters {
    status?: GuideStatus;
    origin_city_id?: number;
    destination_city_id?: number;
    created_by?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}

export interface GuidesListResponse {
    guides: ShippingGuide[];
    total: number;
    limit: number;
    offset: number;
}

export interface GuideDetailResponse {
    guide: ShippingGuide;
}

export interface UpdateStatusRequest {
    status: GuideStatus;
}

export interface UpdateStatusResponse {
    success: boolean;
    guide_id: number;
    new_status: GuideStatus;
    message: string;
}

export interface GuideStatsResponse {
    total_today: number;
    total_processed: number;
    total_pending: number;
    by_status: Record<string, number>;
}


@Injectable({ providedIn: 'root' })
export class GuideService {
    private readonly BASE_URL = `${environment.apiBaseUrl}/guides`;

    constructor(
        private http: HttpClient,
        private shippingService: ShippingService
    ) {}

    // ==========================================
    // API METHODS
    // ==========================================

    async createGuide(guideData: CreateGuideRequest): Promise<CreateGuideResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.post<CreateGuideResponse>(
                    this.BASE_URL,
                    guideData,
                    { headers }
                )
            );

            console.log('Guía creada exitosamente:', response);
            return response;
        } catch (error) {
            console.error('Error al crear la guía:', error);

            if (error && typeof error === 'object' && 'error' in error) {
                const errorResponse = (error as { error: GuideErrorResponse }).error;
                throw new Error(errorResponse.details || errorResponse.error || 'Error desconocido al crear la guía');
            }

            throw new Error('Error de conexión al crear la guía');
        }
    }

    async listGuides(filters?: GuideFilters): Promise<GuidesListResponse> {
        const headers = this.getHeaders();
        
        let params = new HttpParams();
        
        if (filters) {
            if (filters.status) params = params.set('status', filters.status);
            if (filters.origin_city_id) params = params.set('origin_city_id', filters.origin_city_id.toString());
            if (filters.destination_city_id) params = params.set('destination_city_id', filters.destination_city_id.toString());
            if (filters.created_by) params = params.set('created_by', filters.created_by);
            if (filters.search) params = params.set('search', filters.search);
            if (filters.date_from) params = params.set('date_from', filters.date_from);
            if (filters.date_to) params = params.set('date_to', filters.date_to);
            if (filters.limit) params = params.set('limit', filters.limit.toString());
            if (filters.offset) params = params.set('offset', filters.offset.toString());
        }

        try {
            return await firstValueFrom(
                this.http.get<GuidesListResponse>(this.BASE_URL, { headers, params })
            );
        } catch (error) {
            console.error('Error al obtener guías:', error);
            throw error;
        }
    }

    async getGuideById(guideId: number): Promise<GuideDetailResponse> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.get<GuideDetailResponse>(
                    `${this.BASE_URL}/${guideId}`,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al obtener guía:', error);
            throw error;
        }
    }

    async updateGuideStatus(guideId: number, newStatus: GuideStatus): Promise<UpdateStatusResponse> {
        const headers = this.getHeaders();
        
        const body: UpdateStatusRequest = {
            status: newStatus
        };

        try {
            return await firstValueFrom(
                this.http.put<UpdateStatusResponse>(
                    `${this.BASE_URL}/${guideId}/status`,
                    body,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            throw error;
        }
    }

    async getGuideStats(): Promise<GuideStatsResponse> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.get<GuideStatsResponse>(
                    `${this.BASE_URL}/stats`,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }

    async searchGuides(searchTerm: string): Promise<GuidesListResponse> {
        if (searchTerm.length < 3) {
            return {
                guides: [],
                total: 0,
                limit: 50,
                offset: 0
            };
        }

        const headers = this.getHeaders();
        const params = new HttpParams().set('q', searchTerm);

        try {
            return await firstValueFrom(
                this.http.get<GuidesListResponse>(
                    `${this.BASE_URL}/search`,
                    { headers, params }
                )
            );
        } catch (error) {
            console.error('Error en búsqueda:', error);
            throw error;
        }
    }

    async downloadGuidePDF(guideId: number): Promise<void> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<{ url: string; expires_in: number; message: string }>(
                    `${this.BASE_URL}/${guideId}/pdf`,
                    { headers }
                )
            );

            window.open(response.url, '_blank');
        } catch (error) {
            console.error('Error al obtener URL de descarga:', error);
            throw new Error('Error al descargar el PDF');
        }
    }

    // ==========================================
    // BUILDER METHODS
    // ==========================================

    buildGuideRequest(formValue: GuideFormValue, userId: string, customPrice?: number): CreateGuideRequest {
        const dimensions = this.parseDimensions(formValue.dimensions || '20x15x10');

        // Usar precio personalizado si se proporciona, sino calcular
        const finalPrice = customPrice !== undefined && customPrice > 0
            ? customPrice
            : this.calculatePrice(formValue);

        return {
            created_by: userId,

            service: {
                service_type: this.mapServiceType(formValue.serviceType),
                payment_method: this.mapPaymentMethod(formValue.serviceType),
                shipping_type: 'TERRESTRE'
            },

            pricing: {
                declared_value: parseFloat(String(formValue.declaredValue)) || 0,
                price: finalPrice
            },

            route: {
                origin_city_id: this.getCityId(formValue.senderCity),
                destination_city_id: this.getCityId(formValue.receiverCity)
            },

            sender: {
                full_name: formValue.senderName,
                document_type: formValue.senderDocType || 'CC',
                document_number: formValue.senderDoc,
                phone: this.cleanPhone(formValue.senderPhone),
                email: formValue.senderEmail || '',
                address: formValue.senderAddress,
                city_id: this.getCityId(formValue.senderCity),
                city_name: formValue.senderCityName || ''
            },

            receiver: {
                full_name: formValue.receiverName,
                document_type: formValue.receiverDocType || 'CC',
                document_number: formValue.receiverDoc,
                phone: this.cleanPhone(formValue.receiverPhone),
                email: formValue.receiverEmail || '',
                address: formValue.receiverAddress,
                city_id: this.getCityId(formValue.receiverCity),
                city_name: formValue.receiverCityName || ''
            },

            package: {
                weight_kg: parseFloat(String(formValue.weight)) || 0,
                pieces: parseInt(String(formValue.pieces ?? '1')) || 1,
                length_cm: dimensions.length,
                width_cm: dimensions.width,
                height_cm: dimensions.height,
                insured: formValue.insurance !== 'no',
                description: formValue.content || 'GENERAL',
                special_notes: formValue.observations || ''
            }
        };
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    private parseDimensions(dimensionsStr: string): { length: number; width: number; height: number } {
        const parts = dimensionsStr.split('x').map(d => parseFloat(d.trim()));
        
        return {
            length: parts[0] || 20,
            width: parts[1] || 15,
            height: parts[2] || 10
        };
    }

    private cleanPhone(phone: string): string {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    }

    private getCityId(cityValue: number | string | { city_id: number }): number {
        if (typeof cityValue === 'number') {
            return cityValue;
        }

        if (typeof cityValue === 'object' && cityValue !== null && 'city_id' in cityValue) {
            return cityValue.city_id;
        }

        const parsed = parseInt(String(cityValue));
        if (!isNaN(parsed)) {
            return parsed;
        }

        console.warn('No se pudo obtener el ID de la ciudad:', cityValue);
        return 0;
    }

    private mapServiceType(serviceType: string): ServiceType {
        const mapping: Record<string, ServiceType> = {
            'Contado': 'NORMAL',
            'Contra Entrega': 'NORMAL',
            'Crédito': 'NORMAL',
            'Express': 'PRIORITY',
            'Urgente': 'EXPRESS'
        };
        return mapping[serviceType] || 'NORMAL';
    }

    private mapPaymentMethod(serviceType: string): PaymentMethod {
        const mapping: Record<string, PaymentMethod> = {
            'Contado': 'CASH',
            'Contra Entrega': 'COD',
            'Crédito': 'CREDIT'
        };
        return mapping[serviceType] || 'CASH';
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

    // ==========================================
    // PUBLIC HELPER METHODS
    // ==========================================

    /**
     * Calcula el precio de una guía usando el backend (tarifas reales de BD)
     */
    async calculatePriceAsync(formValue: Partial<GuideFormValue>): Promise<number> {
        const dimensions = this.parseDimensions(String(formValue.dimensions || '20x15x10'));
        const originCityId = this.getCityId(formValue.senderCity as number | { city_id: number });
        const destCityId = this.getCityId(formValue.receiverCity as number | { city_id: number });

        if (!originCityId || !destCityId) {
            return this.calculatePrice(formValue);
        }

        try {
            const request: ShippingPriceRequest = {
                origin_city_id: originCityId,
                destination_city_id: destCityId,
                weight_kg: parseFloat(String(formValue.weight ?? '0')) || 0,
                length_cm: dimensions.length,
                width_cm: dimensions.width,
                height_cm: dimensions.height
            };

            const response = await this.shippingService.calculatePrice(request);
            return Math.round(response.price);
        } catch (error) {
            console.warn('Error al calcular precio via backend, usando cálculo local:', error);
            return this.calculatePrice(formValue);
        }
    }

    /**
     * Calcula el precio de una guía basado en peso y prioridad (fallback local)
     */
    calculatePrice(formValue: Partial<GuideFormValue>): number {
        const weight = parseFloat(String(formValue.weight ?? '0')) || 0;
        const basePrice = 15000;
        const pricePerKg = 3000;

        let price = basePrice + (weight * pricePerKg);

        // Aplicar multiplicadores según prioridad
        if (formValue.priority === 'express') {
            price *= 1.5;
        } else if (formValue.priority === 'urgente') {
            price *= 2;
        }

        return Math.round(price);
    }
}