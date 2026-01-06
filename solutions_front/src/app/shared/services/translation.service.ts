import { Injectable } from '@angular/core';
import { GuideStatus, ServiceType, PaymentMethod } from '@core/services/guide.service';
import { PeriodType } from '@core/services/cash-close.service';

@Injectable({ providedIn: 'root' })
export class TranslationService {
    // ==========================================
    // GUIDE STATUS
    // ==========================================
    
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
     * Obtiene la clase CSS para el badge de estado
     */
    getStatusBadgeClass(status: GuideStatus): string {
        const classes: Record<GuideStatus, string> = {
            'CREATED': 'badge-created',
            'IN_ROUTE': 'badge-in-route',
            'IN_WAREHOUSE': 'badge-warning',
            'OUT_FOR_DELIVERY': 'badge-out-delivery',
            'DELIVERED': 'badge-success'
        };
        return classes[status] || 'badge-default';
    }

    // ==========================================
    // PAYMENT METHOD
    // ==========================================
    
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

    // ==========================================
    // SERVICE TYPE
    // ==========================================
    
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

    // ==========================================
    // DOCUMENT TYPE
    // ==========================================
    
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

    // ==========================================
    // PERIOD TYPE (para Cash Close)
    // ==========================================
    
    /**
     * Traduce el tipo de período
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

    // ==========================================
    // DATE FORMATTING
    // ==========================================
    
    /**
     * Formatea una fecha con formato relativo (Hoy, Ayer, etc.)
     */
    formatRelativeDate(dateString: string): string {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Hoy ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Ayer ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    /**
     * Formatea una fecha en formato largo
     */
    formatLongDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    /**
     * Formatea un número como moneda colombiana
     */
    formatCurrency(value: number): string {
        return value.toLocaleString('es-CO');
    }

    /**
     * Formatea un número de teléfono
     */
    formatPhone(phone: string): string {
        if (!phone) return '';
        
        // Limpiar el número
        const clean = phone.replace(/\D/g, '');
        
        // Formatear como (XXX) XXX-XXXX
        if (clean.length === 10) {
            return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
        }
        
        return phone;
    }
}