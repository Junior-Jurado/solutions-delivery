import {
    CognitoUserPool,
    CognitoUserAttribute,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession
} from 'amazon-cognito-identity-js';

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environments.dev';

const poolData = {
    UserPoolId: environment.cognito.userPoolId,
    ClientId: environment.cognito.clientId
};

export interface LoginResponse {
    idToken: string;
    accessToken: string;
    role: string;
}

export interface RegisterData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    typeDocument: string;
    numberDocument: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private userPool = new CognitoUserPool(poolData);
    private cachedRole: string | null = null;

    constructor(private http: HttpClient) {}

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    /**
     * Inicia sesión con credenciales
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        const authDetails = new AuthenticationDetails({
            Username: email,
            Password: password
        });

        const user = new CognitoUser({
            Username: email,
            Pool: this.userPool
        });

        return new Promise((resolve, reject) => {
            user.authenticateUser(authDetails, {
                onSuccess: async (session: CognitoUserSession) => {
                    try {
                        const idToken = session.getIdToken().getJwtToken();
                        const accessToken = session.getAccessToken().getJwtToken();
                        const refreshToken = session.getRefreshToken().getToken();

                        // Guardar tokens
                        this.saveTokens(idToken, accessToken, refreshToken);

                        // Obtener rol del usuario
                        const role = await this.fetchAndCacheUserRole(idToken);

                        resolve({ idToken, accessToken, role });
                    } catch (error) {
                        reject(error);
                    }
                },
                onFailure: (err) => {
                    console.error('Error en login:', err);
                    reject(err);
                }
            });
        });
    }

    /**
     * Cierra sesión del usuario
     */
    logout(): void {
        const user = this.userPool.getCurrentUser();
        if (user) {
            user.signOut();
        }
        this.clearSession();
    }

    /**
     * Verifica si hay sesión activa
     */
    isAuthenticated(): boolean {
        return !!sessionStorage.getItem('idToken');
    }

    // ==========================================
    // REGISTRATION
    // ==========================================

    /**
     * Registra un nuevo usuario
     */
    async registerUser(data: RegisterData): Promise<any> {
        const phoneFormatted = this.formatPhoneNumber(data.phone);

        const attributes: CognitoUserAttribute[] = [
            new CognitoUserAttribute({ Name: 'email', Value: data.email }),
            new CognitoUserAttribute({ Name: 'phone_number', Value: phoneFormatted }),
            new CognitoUserAttribute({ Name: 'custom:full_name', Value: data.fullName }),
            new CognitoUserAttribute({ Name: 'custom:type_document', Value: data.typeDocument }),
            new CognitoUserAttribute({ Name: 'custom:number_document', Value: data.numberDocument })
        ];

        return new Promise((resolve, reject) => {
            this.userPool.signUp(
                data.email,
                data.password,
                attributes,
                [],
                (err, result) => {
                    if (err) {
                        console.error('Error en registro:', err);
                        reject(err);
                        return;
                    }

                    console.log('Usuario registrado exitosamente:', result);
                    resolve(result);
                }
            );
        });
    }

    /**
     * Confirma el registro de usuario con código
     */
    async confirmUser(email: string, code: string): Promise<void> {
        const user = new CognitoUser({
            Username: email,
            Pool: this.userPool
        });

        return new Promise((resolve, reject) => {
            user.confirmRegistration(code, true, (err, result) => {
                if (err) {
                    console.error('Error en confirmación:', err);
                    reject(err);
                    return;
                }

                console.log('Usuario confirmado exitosamente:', result);
                resolve();
            });
        });
    }

    /**
     * Reenvía el código de confirmación
     */
    async resendConfirmationCode(email: string): Promise<void> {
        const user = new CognitoUser({
            Username: email,
            Pool: this.userPool
        });

        return new Promise((resolve, reject) => {
            user.resendConfirmationCode((err, result) => {
                if (err) {
                    console.error('Error al reenviar código:', err);
                    reject(err);
                    return;
                }

                console.log('Código reenviado exitosamente:', result);
                resolve();
            });
        });
    }

    // ==========================================
    // USER ROLE
    // ==========================================

    /**
     * Obtiene el rol del usuario (con cache)
     */
    async getUserRole(): Promise<string> {
        // 1. Cache en memoria
        if (this.cachedRole) {
            return this.cachedRole;
        }

        // 2. Cache en sessionStorage
        const storedRole = sessionStorage.getItem('role');
        if (storedRole) {
            this.cachedRole = storedRole;
            return storedRole;
        }

        // 3. Llamada a la API
        const idToken = sessionStorage.getItem('idToken');
        if (!idToken) {
            throw new Error('No se encontró el token de identificación');
        }

        return this.fetchAndCacheUserRole(idToken);
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Obtiene el rol desde la API y lo cachea
     */
    private async fetchAndCacheUserRole(idToken: string): Promise<string> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${idToken}`
        });

        try {
            const response = await firstValueFrom(
                this.http.get<{ role: string }>(
                    `${environment.apiBaseUrl}/auth/role`,
                    { headers }
                )
            );

            const role = response.role.toUpperCase();

            // Guardar en cache
            sessionStorage.setItem('role', role);
            this.cachedRole = role;

            return role;
        } catch (error) {
            console.error('Error al obtener rol:', error);
            throw new Error('No se pudo obtener el rol del usuario');
        }
    }

    /**
     * Guarda los tokens en sessionStorage
     */
    private saveTokens(idToken: string, accessToken: string, refreshToken: string): void {
        sessionStorage.setItem('idToken', idToken);
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
    }

    /**
     * Limpia la sesión
     */
    private clearSession(): void {
        sessionStorage.clear();
        this.cachedRole = null;
    }

    /**
     * Formatea el número de teléfono para Cognito
     */
    private formatPhoneNumber(phone: string): string {
        // Limpiar el número
        const clean = phone.replace(/\D/g, '');

        // Si ya tiene el código de país, devolverlo con +
        if (clean.startsWith('57')) {
            return `+${clean}`;
        }

        // Agregar código de país de Colombia
        return `+57${clean}`;
    }
}