import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface Department {
    id: number;
    dane_code: string;
    name: string;
}

export interface City {
    id: number;
    dane_code: string;
    name: string;
    department_id: number;
    department_name?: string;
    department_code?: string;
    full_name?: string;
}

export interface DepartmentWithCities {
    department_id: number;
    department_name: string;
    department_code: string;
    cities: City[];
}

@Injectable({ providedIn: 'root' })
export class LocationService {
    private readonly BASE_URL = `${environment.apiBaseUrl}/locations`;
    
    // Cache para evitar múltiples llamadas
    private departmentsCache$ = new BehaviorSubject<Department[] | null>(null);
    private citiesCache$ = new BehaviorSubject<City[] | null>(null);
    private citiesByDepartmentCache = new Map<number, City[]>();

    constructor(private http: HttpClient) {}

    /**
     * Obtiene todos los departamentos (con cache)
     */
    getDepartments(forceRefresh = false): Observable<Department[]> {
        if (!forceRefresh && this.departmentsCache$.value) {
            return of(this.departmentsCache$.value);
        }

        const headers = this.getHeaders();

        return this.http.get<{ departments: Department[] }>(
            `${this.BASE_URL}/departments`,
            { headers }
        ).pipe(
            map(response => response.departments),
            tap(departments => {
                this.departmentsCache$.next(departments);
            }),
            catchError(error => {
                console.error('Error al cargar departamentos:', error);
                return of([]);
            })
        );
    }

    /**
     * Obtiene todas las ciudades o filtradas por departamento
     */
    getCities(departmentId?: number, forceRefresh = false): Observable<City[]> {
        // Si se solicita por departamento específico
        if (departmentId) {
            if (!forceRefresh && this.citiesByDepartmentCache.has(departmentId)) {
                return of(this.citiesByDepartmentCache.get(departmentId)!);
            }

            const headers = this.getHeaders();
            const url = `${this.BASE_URL}/cities?department_id=${departmentId}`;

            return this.http.get<{ cities: City[] }>(url, { headers }).pipe(
                map(response => response.cities),
                tap(cities => {
                    this.citiesByDepartmentCache.set(departmentId, cities);
                }),
                catchError(error => {
                    console.error('Error al cargar ciudades:', error);
                    return of([]);
                })
            );
        }

        // Todas las ciudades
        if (!forceRefresh && this.citiesCache$.value) {
            return of(this.citiesCache$.value);
        }

        const headers = this.getHeaders();

        return this.http.get<{ cities: City[] }>(
            `${this.BASE_URL}/cities`,
            { headers }
        ).pipe(
            map(response => response.cities),
            tap(cities => {
                this.citiesCache$.next(cities);
            }),
            catchError(error => {
                console.error('Error al cargar ciudades:', error);
                return of([]);
            })
        );
    }

    /**
     * Busca ciudades por nombre (para autocomplete)
     */
    searchCities(searchTerm: string): Observable<City[]> {
        if (!searchTerm || searchTerm.length < 2) {
            return of([]);
        }

        const headers = this.getHeaders();
        const url = `${this.BASE_URL}/search?q=${encodeURIComponent(searchTerm)}`;

        return this.http.get<{ cities: City[] }>(url, { headers }).pipe(
            map(response => response.cities),
            catchError(error => {
                console.error('Error en búsqueda de ciudades:', error);
                return of([]);
            })
        );
    }

    /**
     * Obtiene una ciudad específica por ID
     */
    getCityById(cityId: number): Observable<City | null> {
        const headers = this.getHeaders();

        return this.http.get<{ city: City }>(
            `${this.BASE_URL}/cities/${cityId}`,
            { headers }
        ).pipe(
            map(response => response.city),
            catchError(error => {
                console.error('Error al obtener ciudad:', error);
                return of(null);
            })
        );
    }

    /**
     * Limpia el cache de ubicaciones
     */
    clearCache(): void {
        this.departmentsCache$.next(null);
        this.citiesCache$.next(null);
        this.citiesByDepartmentCache.clear();
    }

    /**
     * Obtiene los headers con autenticación
     */
    private getHeaders(): HttpHeaders {
        const idToken = sessionStorage.getItem('idToken');
        return new HttpHeaders({
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        });
    }

    /**
     * Formatea el nombre completo de la ciudad con departamento
     */
    formatCityFullName(city: City): string {
        if (city.full_name) {
            return city.full_name;
        }
        return city.department_name 
            ? `${city.name}, ${city.department_name}`
            : city.name;
    }

    /**
     * Convierte un array de ciudades a opciones para select agrupadas por departamento
     */
    groupCitiesByDepartment(cities: City[]): DepartmentWithCities[] {
        const grouped = new Map<number, DepartmentWithCities>();

        cities.forEach(city => {
            if (!grouped.has(city.department_id)) {
                grouped.set(city.department_id, {
                    department_id: city.department_id,
                    department_name: city.department_name || '',
                    department_code: city.department_code || '',
                    cities: []
                });
            }
            grouped.get(city.department_id)!.cities.push(city);
        });

        return Array.from(grouped.values()).sort((a, b) => 
            a.department_name.localeCompare(b.department_name)
        );
    }
}