import { Injectable } from '@angular/core';
import { GuideStatus, ServiceType, PaymentMethod } from '@core/services/guide.service';

@Injectable({ providedIn: 'root' })
export class TranslationService {
    /**
     * Traduce el estado de guía
     */
    translateGuideStatus(status: GuideStatus): string {
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
     * Traduce el método de pago
     */
    translatePaymentMethod(method: PaymentMethod): string {
        const translations: Record<PaymentMethod, string> = {
            'CASH': 'Contado',
            'COD': 'Contraentrega',
            'CREDIT': 'Crédito'
        };
        return translations[method] || method;
    }

    /**
     * Traduce el tipo de servicio
     */
    translateServiceType(serviceType: ServiceType): string {
        const translations: Record<ServiceType, string> = {
            'NORMAL': 'Normal',
            'PRIORITY': 'Prioritario',
            'EXPRESS': 'Express'
        };
        return translations[serviceType] || serviceType;
    }

    /**
     * Traduce el tipo de documento
     */
    translateDocumentType(docType: string): string {
        const translations: Record<string, string> = {
            'CC': 'Cédula de Ciudadanía',
            'CE': 'Cédula de Extranjería',
            'NIT': 'NIT',
            'TI': 'Tarjeta de Identidad',
            'PAS': 'Pasaporte'
        };
        return translations[docType] || docType;
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

    /**
     * Obtiene la clase CSS para el badge de método de pago
     */
    getPaymentMethodBadgeClass(method: PaymentMethod): string {
        const classes: Record<PaymentMethod, string> = {
            'CASH': 'badge-success',
            'COD': 'badge-warning',
            'CREDIT': 'badge-info'
        };
        return classes[method] || 'badge-default';
    }
}