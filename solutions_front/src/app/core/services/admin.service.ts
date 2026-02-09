import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { firstValueFrom } from 'rxjs';

// Types
export type UserRole = 'CLIENT' | 'ADMIN' | 'SECRETARY' | 'DELIVERY';

// Interfaces
export interface AdminDashboardStats {
    // KPIs principales
    shipments_today: number;
    shipments_yesterday: number;
    delivered: number;
    delivered_yesterday: number;
    delivery_rate: number;
    pending: number;
    pending_in_route: number;
    pending_in_office: number;
    revenue_today: number;
    revenue_yesterday: number;

    // Métricas de entregas
    average_delivery_time: number;  // Tiempo promedio en horas
    satisfaction_rate: number;      // Porcentaje de satisfacción

    // Distribución por estado
    status_distribution: StatusCount[];

    // Rendimiento de entregadores
    worker_performance: WorkerStats[];

    // Entregas en tiempo real
    realtime_deliveries: RealtimeDelivery[];

    // Rutas activas
    active_routes: ActiveRoute[];

    // Alertas del sistema
    alerts: SystemAlert[];
}

export interface StatusCount {
    status: string;
    count: number;
    percentage: number;
}

export interface WorkerStats {
    user_id: string;
    name: string;
    deliveries_today: number;
    completed_today: number;
    efficiency: number;
    avg_rating: number;
}

export interface RealtimeDelivery {
    guide_id: number;
    customer: string;
    address: string;
    status: string;
    delivery_person: string;
    assigned_at: string;
    service_type: string;
}

export interface ActiveRoute {
    user_id: string;
    name: string;
    packages: number;
    completed: number;
    zone: string;
    status: string;
}

export interface SystemAlert {
    id: string;
    type: 'warning' | 'error' | 'info';
    title: string;
    description: string;
    timestamp: string;
    guide_id?: number;
    user_id?: string;
}

export interface Employee {
    user_uuid: string;
    full_name: string;
    email: string;
    phone: string;
    role: UserRole;
    status: string;
    performance?: string;
    created_at: string;
    last_login?: string;
    total_completed?: number;
    type_document?: string;
    number_document?: string;
}

export interface EmployeesListResponse {
    employees: Employee[];
    total: number;
}

export interface UpdateEmployeeRequest {
    full_name?: string;
    phone?: string;
    role?: UserRole;
}

// Client Ranking interfaces
export interface ClientRanking {
    user_uuid: string;
    full_name: string;
    email: string;
    phone?: string;
    total_guides: number;
    total_spent: number;
    avg_value: number;
    last_activity: string;
}

export interface ClientRankingFilters {
    sort_by?: 'total_guides' | 'total_spent' | 'avg_value' | 'last_activity';
    order?: 'asc' | 'desc';
    limit?: number;
    min_guides?: number;
    date_from?: string;
    date_to?: string;
}

export interface ClientRankingResponse {
    clients: ClientRanking[];
    total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

    private readonly BASE_URL = `${environment.apiBaseUrl}/admin`;

    constructor(private http: HttpClient) {}

    // ==========================================
    // DASHBOARD STATS
    // ==========================================

    /**
     * Obtiene todas las estadísticas del dashboard admin
     */
    async getDashboardStats(): Promise<AdminDashboardStats> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<AdminDashboardStats>(
                    `${this.BASE_URL}/stats`,
                    { headers }
                )
            );

            // Asegurar que los arrays no sean undefined
            return {
                ...response,
                status_distribution: response.status_distribution || [],
                worker_performance: response.worker_performance || [],
                realtime_deliveries: response.realtime_deliveries || [],
                active_routes: response.active_routes || [],
                alerts: response.alerts || []
            };
        } catch (error) {
            console.error('Error al obtener estadísticas del admin:', error);
            throw error;
        }
    }

    // ==========================================
    // EMPLOYEES
    // ==========================================

    /**
     * Obtiene la lista de empleados
     */
    async getEmployees(role?: UserRole): Promise<EmployeesListResponse> {
        const headers = this.getHeaders();
        const params: Record<string, string> = {};

        if (role) {
            params['role'] = role;
        }

        try {
            const response = await firstValueFrom(
                this.http.get<EmployeesListResponse>(
                    `${this.BASE_URL}/employees`,
                    { headers, params }
                )
            );
            return {
                employees: response.employees || [],
                total: response.total || 0
            };
        } catch (error) {
            console.error('Error al obtener empleados:', error);
            throw error;
        }
    }

    /**
     * Obtiene un empleado por ID
     */
    async getEmployeeById(employeeId: string): Promise<Employee> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<Employee>(
                    `${this.BASE_URL}/employees/${employeeId}`,
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al obtener empleado:', error);
            throw error;
        }
    }

    /**
     * Actualiza un empleado
     */
    async updateEmployee(employeeId: string, data: UpdateEmployeeRequest): Promise<Employee> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.put<{ success: boolean; employee: Employee; message: string }>(
                    `${this.BASE_URL}/employees/${employeeId}`,
                    data,
                    { headers }
                )
            );
            return response.employee;
        } catch (error) {
            console.error('Error al actualizar empleado:', error);
            throw error;
        }
    }

    /**
     * Busca un usuario por número de documento
     */
    async getUserByDocument(documentNumber: string): Promise<Employee> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<Employee>(
                    `${this.BASE_URL}/users/search`,
                    {
                        headers,
                        params: { document: documentNumber }
                    }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al buscar usuario por documento:', error);
            throw error;
        }
    }

    // ==========================================
    // CLIENT RANKING
    // ==========================================

    /**
     * Obtiene el ranking de mejores clientes
     */
    async getClientRanking(filters?: ClientRankingFilters): Promise<ClientRankingResponse> {
        const headers = this.getHeaders();
        const params: Record<string, string> = {};

        if (filters) {
            if (filters.sort_by) params['sort_by'] = filters.sort_by;
            if (filters.order) params['order'] = filters.order;
            if (filters.limit) params['limit'] = filters.limit.toString();
            if (filters.min_guides) params['min_guides'] = filters.min_guides.toString();
            if (filters.date_from) params['date_from'] = filters.date_from;
            if (filters.date_to) params['date_to'] = filters.date_to;
        }

        try {
            const response = await firstValueFrom(
                this.http.get<ClientRankingResponse>(
                    `${this.BASE_URL}/clients/ranking`,
                    { headers, params }
                )
            );
            return {
                clients: response.clients || [],
                total: response.total || 0
            };
        } catch (error) {
            console.error('Error al obtener ranking de clientes:', error);
            throw error;
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================

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

    // ==========================================
    // DATA TRANSFORMERS
    // ==========================================

    /**
     * Transforma el status de la guía a español
     */
    translateStatus(status: string): string {
        const statusMap: Record<string, string> = {
            'CREATED': 'Creado',
            'IN_ROUTE': 'En ruta',
            'IN_WAREHOUSE': 'En bodega',
            'OUT_FOR_DELIVERY': 'En reparto',
            'DELIVERED': 'Entregado'
        };
        return statusMap[status] || status;
    }

    /**
     * Obtiene el color para el status
     */
    getStatusColor(status: string): string {
        const colorMap: Record<string, string> = {
            'CREATED': 'warning',
            'IN_ROUTE': 'primary',
            'IN_WAREHOUSE': 'secondary',
            'OUT_FOR_DELIVERY': 'info',
            'DELIVERED': 'success'
        };
        return colorMap[status] || 'default';
    }

    /**
     * Transforma el role a español
     */
    translateRole(role: UserRole): string {
        const roleMap: Record<string, string> = {
            'CLIENT': 'Cliente',
            'ADMIN': 'Administrador',
            'SECRETARY': 'Secretaria',
            'DELIVERY': 'Entregador'
        };
        return roleMap[role] || role;
    }
}
