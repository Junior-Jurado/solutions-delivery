import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environments.dev';

// Interfaces para el request
export interface ServiceInfo {
    service_type: string;
    payment_method: string;
    shipping_type: string;
}

export interface PricingInfo {
    declared_value: number;
    price: number;
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
export type PaymentMethod = 'CONTADO' | 'CONTRAENTREGA';

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
    created_at: string;
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

    constructor(private http: HttpClient) {}

    /**
     * Crea una nueva guía de envío
     */
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
        } catch (error: any) {
            console.error('Error al crear la guía:', error);
            
            if (error.error) {
                const errorResponse = error.error as GuideErrorResponse;
                throw new Error(errorResponse.details || errorResponse.error || 'Error desconocido al crear la guía');
            }
            
            throw new Error('Error de conexión al crear la guía');
        }
    }

    /**
     * Obtiene lista de guías con filtros
     */
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

    /**
     * Obtiene una guía por su ID con toda su información
     */
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

    /**
     * Actualiza el estado de una guía
     */
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

    /**
     * Obtiene estadísticas de guías
     */
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

    /**
     * Busca guías por término de búsqueda
     */
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

    /**
     * Construye el objeto de request desde los datos del formulario
     */
    buildGuideRequest(formValue: any, userId: string): CreateGuideRequest {
        const dimensions = this.parseDimensions(formValue.dimensions || '20x15x10');

        return {
            created_by: userId,
            
            service: {
                service_type: this.mapServiceType(formValue.serviceType),
                payment_method: this.mapPaymentMethod(formValue.serviceType),
                shipping_type: 'TERRESTRE'
            },

            pricing: {
                declared_value: parseFloat(formValue.declaredValue) || 0,
                price: this.calculatePrice(formValue)
            },

            route: {
                origin_city_id: this.getCityId(formValue.senderCity),
                destination_city_id: this.getCityId(formValue.receiverCity)
            },

            sender: {
                full_name: formValue.senderName,
                document_type: formValue.senderDocType || 'CC',
                document_number: formValue.senderDoc,
                phone: this.formatPhone(formValue.senderPhone),
                email: formValue.senderEmail || '',
                address: formValue.senderAddress,
                city_id: this.getCityId(formValue.senderCity),
                city_name: formValue.senderCityName || ''
            },

            receiver: {
                full_name: formValue.receiverName,
                document_type: formValue.receiverDocType || 'CC',
                document_number: formValue.receiverDoc,
                phone: this.formatPhone(formValue.receiverPhone),
                email: formValue.receiverEmail || '',
                address: formValue.receiverAddress,
                city_id: this.getCityId(formValue.receiverCity),
                city_name: formValue.receiverCityName || ''
            },

            package: {
                weight_kg: parseFloat(formValue.weight) || 0,
                pieces: parseInt(formValue.pieces) || 1,
                length_cm: dimensions.length,
                width_cm: dimensions.width,
                height_cm: dimensions.height,
                insured: formValue.insurance !== 'no',
                description: formValue.content || 'GENERAL',
                special_notes: formValue.observations || ''
            }
        };
    }

    /**
     * Descarga el PDF de una guía obteniendo una URL pre-firmada del backend
     */
    async downloadGuidePDF(guideId: number): Promise<void> {
        const headers = this.getHeaders();

        try {
            // Obtener la URL pre-firmada del backend
            const response = await firstValueFrom(
                this.http.get<{ url: string; expires_in: number; message: string }>(
                    `${this.BASE_URL}/${guideId}/pdf`,
                    { headers }
                )
            );

            // Abrir la URL pre-firmada en una nueva pestaña
            window.open(response.url, '_blank');
        } catch (error) {
            console.error('Error al obtener URL de descarga:', error);
            throw new Error('Error al descargar el PDF');
        }
    }

    /**
     * Traduce el estado a texto legible en español
     */
    translateStatus(status: GuideStatus): string {
        const translations: Record<GuideStatus, string> = {
            'CREATED': 'Creada',
            'IN_ROUTE': 'En ruta',
            'IN_WAREHOUSE': 'En bodega',
            'OUT_FOR_DELIVERY': 'En reparto',
            'DELIVERED': 'Entregada'
        };
        return translations[status] || status;
    }

    /**
     * Obtiene la clase CSS para el badge de estado
     */
    getStatusBadgeClass(status: GuideStatus): string {
        const classes: Record<GuideStatus, string> = {
            'CREATED': 'badge-default',
            'IN_ROUTE': 'badge-secondary',
            'IN_WAREHOUSE': 'badge-warning',
            'OUT_FOR_DELIVERY': 'badge-secondary',
            'DELIVERED': 'badge-success'
        };
        return classes[status] || 'badge-default';
    }

    // Métodos privados de utilidad
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
            'Contado': 'CONTADO',
            'Contra Entrega': 'CONTRAENTREGA',
            'Crédito': 'CONTADO'
        };
        return mapping[serviceType] || 'CONTADO';
    }

    private parseDimensions(dimensionsStr: string): { length: number; width: number; height: number } {
        const parts = dimensionsStr.split('x').map(d => parseFloat(d.trim()));
        
        return {
            length: parts[0] || 20,
            width: parts[1] || 15,
            height: parts[2] || 10
        };
    }

    private formatPhone(phone: string): string {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    }

    private getCityId(cityIdOrName: string | number): number {
        if (typeof cityIdOrName === 'number') {
            return cityIdOrName;
        }
        
        const parsed = parseInt(cityIdOrName);
        if (!isNaN(parsed)) {
            return parsed;
        }
        
        console.warn('No se pudo obtener el ID de la ciudad:', cityIdOrName);
        return 0;
    }

    private calculatePrice(formValue: any): number {
        const weight = parseFloat(formValue.weight) || 0;
        const basePrice = 15000;
        const pricePerKg = 3000;
        
        let price = basePrice + (weight * pricePerKg);

        if (formValue.priority === 'express') {
            price *= 1.5;
        } else if (formValue.priority === 'urgente') {
            price *= 2;
        }

        return Math.round(price);
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