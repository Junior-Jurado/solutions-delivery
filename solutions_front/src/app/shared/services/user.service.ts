import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface UserProfile {
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    document_type: string;
    document_number: string;
    created_at: string;
}

export interface UserProfileUpdateRequest {
    full_name?: string;
    phone?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly BASE_URL = `${environment.apiBaseUrl}/user`;

    constructor(private http: HttpClient) {}

    async getProfile(): Promise<UserProfile> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.get<UserProfile>(
                    `${this.BASE_URL}/profile`,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            throw new Error('Error al obtener el perfil de usuario');
        }
    }

    async updateProfile(data: UserProfileUpdateRequest): Promise<UserProfile> {
        const headers = this.getHeaders();

        try {
            return await firstValueFrom(
                this.http.put<UserProfile>(
                    `${this.BASE_URL}/profile`,
                    data,
                    { headers }
                )
            );
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            throw new Error('Error al actualizar el perfil');
        }
    }

    private getHeaders(): HttpHeaders {
        const idToken = sessionStorage.getItem('idToken');

        if (!idToken) {
            throw new Error('No se encontró el token de identificación.');
        }

        return new HttpHeaders({
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        });
    }
}
