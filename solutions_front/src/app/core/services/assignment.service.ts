import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environments.dev";
import { firstValueFrom } from 'rxjs';

// Tipos
export type AssignmentType = 'PICKUP' | 'DELIVERY';
export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Interfaces
export interface DeliveryUser {
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    active_pickups: number;
    active_deliveries: number;
    total_completed: number;
}

export interface PendingGuide {
    guide_id: number;
    service_type: string;
    current_status: string;
    origin_city_name: string;
    destination_city_name: string;
    contact_name: string;
    contact_address: string;
    contact_phone: string;
    created_at: string;
    assignment_type: AssignmentType;
}

export interface PendingGuidesResponse {
    pickups: PendingGuide[];
    deliveries: PendingGuide[];
}

export interface DeliveryAssignment {
    assignment_id: number;
    guide_id: number;
    delivery_user_id: string;
    delivery_user_name?: string;
    assignment_type: AssignmentType;
    status: AssignmentStatus;
    notes?: string;
    assigned_by: string;
    assigned_by_name?: string;
    assigned_at: string;
    updated_at: string;
    completed_at?: string;
    guide?: GuideInfo;
}

export interface GuideInfo {
    guide_id: number;
    service_type: string;
    current_status: string;
    origin_city_name: string;
    destination_city_name: string;
    sender_name?: string;
    sender_address?: string;
    sender_phone?: string;
    receiver_name?: string;
    receiver_address?: string;
    receiver_phone?: string;
    created_at: string;
}

export interface CreateAssignmentRequest {
    guide_id: number;
    delivery_user_id: string;
    assignment_type: AssignmentType;
    notes?: string;
}

export interface CreateAssignmentResponse {
    success: boolean;
    assignment_id: number;
    assignment: DeliveryAssignment;
    message: string;
}

export interface AssignmentStatsResponse {
    total_assignments: number;
    pending_pickups: number;
    pending_deliveries: number;
    in_progress_pickups: number;
    in_progress_deliveries: number;
    completed_today: number;
    by_delivery_user: Record<string, number>;
}

export interface AssignmentsListResponse {
    assignments: DeliveryAssignment[];
    total: number;
    limit: number;
    offset: number;
}

export interface AssignmentFilters {
    status?: AssignmentStatus;
    assignment_type?: AssignmentType;
    delivery_user_id?: string;
    guide_id?: number;
    limit?: number;
    offset?: number;
}

@Injectable({ providedIn: 'root' })
export class AssignmentService {

    private readonly BASE_URL = `${environment.apiBaseUrl}/assignments`;

    constructor(private http: HttpClient) {}

    // ==========================================
    // DELIVERY USERS
    // ==========================================

    /**
     * Obtiene la lista de repartidores disponibles
     */
    async getDeliveryUsers(): Promise<DeliveryUser[]> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<DeliveryUser[]>(
                    `${this.BASE_URL}/delivery-users`,
                    { headers }
                )
            );
            return response || [];
        } catch (error) {
            console.error('Error al obtener repartidores:', error);
            throw error;
        }
    }

    // ==========================================
    // PENDING GUIDES
    // ==========================================

    /**
     * Obtiene las guías pendientes de asignar
     */
    async getPendingGuides(): Promise<PendingGuidesResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<PendingGuidesResponse>(
                    `${this.BASE_URL}/pending-guides`,
                    { headers }
                )
            );
            return {
                pickups: response.pickups || [],
                deliveries: response.deliveries || []
            };
        } catch (error) {
            console.error('Error al obtener guías pendientes:', error);
            throw error;
        }
    }

    // ==========================================
    // ASSIGNMENTS
    // ==========================================

    /**
     * Crea una nueva asignación
     */
    async createAssignment(request: CreateAssignmentRequest): Promise<CreateAssignmentResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.post<CreateAssignmentResponse>(
                    this.BASE_URL,
                    request,
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al crear asignación:', error);
            throw error;
        }
    }

    /**
     * Obtiene las asignaciones con filtros
     */
    async getAssignments(filters?: AssignmentFilters): Promise<AssignmentsListResponse> {
        const headers = this.getHeaders();

        const params: Record<string, string> = {};
        if (filters) {
            if (filters.status) params['status'] = filters.status;
            if (filters.assignment_type) params['assignment_type'] = filters.assignment_type;
            if (filters.delivery_user_id) params['delivery_user_id'] = filters.delivery_user_id;
            if (filters.guide_id) params['guide_id'] = String(filters.guide_id);
            if (filters.limit) params['limit'] = String(filters.limit);
            if (filters.offset) params['offset'] = String(filters.offset);
        }

        try {
            const response = await firstValueFrom(
                this.http.get<AssignmentsListResponse>(
                    this.BASE_URL,
                    { headers, params }
                )
            );
            return {
                assignments: response.assignments || [],
                total: response.total || 0,
                limit: response.limit || 50,
                offset: response.offset || 0
            };
        } catch (error) {
            console.error('Error al obtener asignaciones:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de asignaciones
     */
    async getAssignmentStats(): Promise<AssignmentStatsResponse> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.get<AssignmentStatsResponse>(
                    `${this.BASE_URL}/stats`,
                    { headers }
                )
            );
            return response;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }

    /**
     * Actualiza el estado de una asignación
     */
    async updateAssignmentStatus(assignmentId: number, status: AssignmentStatus, notes?: string): Promise<DeliveryAssignment> {
        const headers = this.getHeaders();

        try {
            const response = await firstValueFrom(
                this.http.put<{ success: boolean; assignment: DeliveryAssignment; message: string }>(
                    `${this.BASE_URL}/${assignmentId}/status`,
                    { status, notes },
                    { headers }
                )
            );
            return response.assignment;
        } catch (error) {
            console.error('Error al actualizar estado:', error);
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
}
