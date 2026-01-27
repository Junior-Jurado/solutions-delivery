import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environments.dev';

// ==========================================
// INTERFACES
// ==========================================

export type PartyType = 'SENDER' | 'RECEIVER';

/**
 * Parte frecuente completa (con ciudad y dirección)
 */
export interface FrequentParty {
    id: number;
    party_type: PartyType;
    full_name: string;
    document_type: string;
    document_number: string;
    phone: string;
    email?: string;
    city_id: number;
    city_name?: string;
    address: string;
    first_used_at: string;
    last_used_at: string;
    usage_count: number;
    user_uuid?: string;
}

/**
 * Cliente único (sin ciudad ni dirección específica)
 * Para el autocompletado inicial por nombre
 */
export interface FrequentPartyUnique {
    full_name: string;
    document_type: string;
    document_number: string;
    phone: string;
    email?: string;
    total_cities: number;
    total_usage: number;
}

/**
 * Respuesta de búsqueda
 */
export interface FrequentPartySearchResponse {
    parties: FrequentParty[];
    total: number;
}

export interface FrequentPartyUniqueResponse {
    parties: FrequentPartyUnique[];
    total: number;
}

/**
 * Request para crear/actualizar
 */
export interface CreateFrequentPartyRequest {
    party_type: PartyType;
    full_name: string;
    document_type: string;
    document_number: string;
    phone: string;
    email: string;
    city_id: number;
    address: string;
    user_uuid?: string;
}

// ==========================================
// SERVICE
// ==========================================

@Injectable({ providedIn: 'root' })
export class FrequentPartyService {
    private readonly BASE_URL = `${environment.apiBaseUrl}/frequent-parties`;

    constructor(private http: HttpClient) {}

    /**
     * Busca clientes únicos por nombre (autocompletado inicial)
     */
    searchByName(searchTerm: string, partyType?: PartyType): Observable<FrequentPartyUnique[]> {
        if (!searchTerm || searchTerm.length < 2) {
            return of([]);
        }

        const headers = this.getHeaders();
        let params = new HttpParams().set('q', searchTerm);
        if (partyType) params = params.set('party_type', partyType);

        return this.http.get<FrequentPartyUniqueResponse>(
            `${this.BASE_URL}/search-by-name`,
            { headers, params }
        ).pipe(
            map(response => response.parties || []),
            catchError(error => {
                console.error('Error al buscar clientes:', error);
                return of([]);
            })
        );
    }

    /**
     * Busca direcciones de un cliente en una ciudad
     */
    searchByNameAndCity(searchTerm: string, cityId: number, partyType?: PartyType): Observable<FrequentParty[]> {
        if (!searchTerm || searchTerm.length < 2 || !cityId) {
            return of([]);
        }

        const headers = this.getHeaders();
        let params = new HttpParams()
            .set('q', searchTerm)
            .set('city_id', cityId.toString());
        if (partyType) params = params.set('party_type', partyType);

        return this.http.get<FrequentPartySearchResponse>(
            `${this.BASE_URL}/search-by-name-and-city`,
            { headers, params }
        ).pipe(
            map(response => response.parties || []),
            catchError(error => {
                console.error('Error al buscar direcciones:', error);
                return of([]);
            })
        );
    }

    /**
     * Obtiene direcciones por documento y ciudad
     */
    getByDocumentAndCity(documentNumber: string, cityId: number, partyType?: PartyType): Observable<FrequentParty[]> {
        if (!documentNumber || !cityId) {
            return of([]);
        }

        const headers = this.getHeaders();
        let params = new HttpParams()
            .set('document_number', documentNumber)
            .set('city_id', cityId.toString());
        if (partyType) params = params.set('party_type', partyType);

        return this.http.get<FrequentPartySearchResponse>(
            `${this.BASE_URL}/by-document`,
            { headers, params }
        ).pipe(
            map(response => response.parties || []),
            catchError(error => {
                console.error('Error al buscar direcciones:', error);
                return of([]);
            })
        );
    }

    /**
     * Registra o actualiza una parte frecuente
     */
    upsertFrequentParty(request: CreateFrequentPartyRequest): Observable<any> {
        const headers = this.getHeaders();
        return this.http.post(this.BASE_URL, request, { headers }).pipe(
            catchError(error => {
                console.error('Error al registrar parte frecuente:', error);
                throw error;
            })
        );
    }

    private getHeaders(): HttpHeaders {
        const idToken = sessionStorage.getItem('idToken');
        return new HttpHeaders({
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        });
    }

    formatClientDisplay(party: FrequentPartyUnique): string {
        const parts = [party.full_name, `${party.document_type}: ${party.document_number}`];
        if (party.total_cities > 1) parts.push(`${party.total_cities} ciudades`);
        return parts.join(' • ');
    }

    formatAddressDisplay(party: FrequentParty): string {
        return party.usage_count > 1
            ? `${party.address} • Usado ${party.usage_count} veces`
            : party.address;
    }
}