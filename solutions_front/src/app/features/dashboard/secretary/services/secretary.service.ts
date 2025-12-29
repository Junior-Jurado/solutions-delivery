import { Injectable } from "@angular/core";


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
export class SecretaryService {}