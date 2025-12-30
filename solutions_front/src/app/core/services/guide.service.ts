import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

// Interface para la respuesta
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

@Injectable({ providedIn: 'root' })
export class GuideService {
    private readonly BASE_URL = `${environment.apiBaseUrl}/guides`;

    constructor(private http: HttpClient) {}

    /**
     * Crea una nueva guía de envío
     * @param guideData Datos completos de la guía
     * @returns Promise con la respuesta de creación de guía
     */
    async createGuide(guideData: CreateGuideRequest): Promise<CreateGuideResponse> {
        const idToken = sessionStorage.getItem('idToken');

        if (!idToken) {
            throw new Error('No se encontró el token de identificación. Por favor inicie sesión.');
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        });

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
     * Construye el objeto de request desde los datos del formulario
     * @param formValue Valores del formulario
     * @param userId ID del usuario que crea la guía
     * @returns Objeto CreateGuideRequest completo
     */
    buildGuideRequest(formValue: any, userId: string): CreateGuideRequest {
        // Parsear dimensiones si vienen en formato "20x15x10"
        const dimensions = this.parseDimensions(formValue.dimensions || '20x15x10');

        return {
            created_by: userId,
            
            service: {
                service_type: formValue.serviceType?.toUpperCase() || 'NORMAL',
                payment_method: this.mapPaymentMethod(formValue.serviceType),
                shipping_type: 'TERRESTRE'
            },

            pricing: {
                declared_value: parseFloat(formValue.declaredValue) || 0,
                price: this.calculatePrice(formValue) // Implementar lógica de cálculo
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
                city_name: formValue.senderCity
            },

            receiver: {
                full_name: formValue.receiverName,
                document_type: formValue.receiverDocType || 'CC',
                document_number: formValue.receiverDoc,
                phone: this.formatPhone(formValue.receiverPhone),
                email: formValue.receiverEmail || '',
                address: formValue.receiverAddress,
                city_id: this.getCityId(formValue.receiverCity),
                city_name: formValue.receiverCity
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
     * Mapea el tipo de servicio al método de pago
     */
    private mapPaymentMethod(serviceType: string): string {
        const mapping: Record<string, string> = {
            'Contado': 'CONTADO',
            'Contra Entrega': 'CONTRA_ENTREGA',
            'Crédito': 'CREDITO'
        };
        return mapping[serviceType] || 'CONTADO';
    }

    /**
     * Parsea las dimensiones del formato "20x15x10"
     */
    private parseDimensions(dimensionsStr: string): { length: number; width: number; height: number } {
        const parts = dimensionsStr.split('x').map(d => parseFloat(d.trim()));
        
        return {
            length: parts[0] || 20,
            width: parts[1] || 15,
            height: parts[2] || 10
        };
    }

    /**
     * Formatea el número de teléfono
     */
    private formatPhone(phone: string): string {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    }

    /**
     * Obtiene el ID de la ciudad desde el valor del formulario
     * El formulario ahora debe guardar el ID directamente
     */
    private getCityId(cityIdOrName: string | number): number {
        // Si ya es un número, retornarlo
        if (typeof cityIdOrName === 'number') {
            return cityIdOrName;
        }
        
        // Si es string, intentar parsearlo
        const parsed = parseInt(cityIdOrName);
        if (!isNaN(parsed)) {
            return parsed;
        }
        
        // Fallback - esto no debería ocurrir con el nuevo selector
        console.warn('No se pudo obtener el ID de la ciudad:', cityIdOrName);
        return 0;
    }

    /**
     * Calcula el precio del envío según los parámetros
     * TODO: Implementar lógica real de cálculo de precios
     */
    private calculatePrice(formValue: any): number {
        const weight = parseFloat(formValue.weight) || 0;
        const basePrice = 15000;
        const pricePerKg = 3000;
        
        // Lógica básica de ejemplo
        let price = basePrice + (weight * pricePerKg);

        // Ajustar por prioridad
        if (formValue.priority === 'express') {
            price *= 1.5;
        } else if (formValue.priority === 'urgente') {
            price *= 2;
        }

        return Math.round(price);
    }

    /**
     * Descarga el PDF de una guía
     */
    async downloadGuidePDF(pdfUrl: string): Promise<void> {
        window.open(pdfUrl, '_blank');
    }

    /**
     * Obtiene una guía por su ID
     */
    getGuideById(guideId: number): Observable<any> {
        const idToken = sessionStorage.getItem('idToken');
        
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${idToken}`
        });

        return this.http.get(`${this.BASE_URL}/${guideId}`, { headers });
    }

    /**
     * Lista todas las guías
     */
    listGuides(filters?: any): Observable<any> {
        const idToken = sessionStorage.getItem('idToken');
        
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${idToken}`
        });

        return this.http.get(this.BASE_URL, { headers, params: filters });
    }

    /**
     * Actualiza el estado de una guía
     */
    async updateGuideStatus(guideId: number, newStatus: string): Promise<any> {
        const idToken = sessionStorage.getItem('idToken');
        
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        });

        return firstValueFrom(
            this.http.patch(
                `${this.BASE_URL}/${guideId}/status`,
                { status: newStatus },
                { headers }
            )
        );
    }
}