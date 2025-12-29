import {
    CognitoUserPool,
    CognitoUserAttribute,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession
} from 'amazon-cognito-identity-js';

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments.dev';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const poolData = {
    UserPoolId: environment.cognito.userPoolId,
    ClientId: environment.cognito.clientId
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    constructor(private http: HttpClient) {}
    
    private cachedRole: string | null = null;
    private userPool = new CognitoUserPool(poolData);

    /**
     * Inicia sesión en la aplicación con credenciales de usuario y contraseña.
     * @param email Dirección de correo electrónico del usuario.
     * @param password Contraseña del usuario.
     * @returns Una promesa que se resuelve con un objeto que contiene el idToken y el accessToken.
     */
    login(email: string, password: string): Promise<{
        idToken: string,
        accessToken: string;
        role: string;
    }> {
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
                        sessionStorage.setItem('idToken', idToken);
                        sessionStorage.setItem('accessToken', accessToken);
                        sessionStorage.setItem('refreshToken', refreshToken);

                        const role = await this.fetchAndCacheUserRole();

                        resolve({
                            idToken,
                            accessToken,
                            role
                        });
                    } catch (error) {
                        reject(error);
                    }
                    
                },
                onFailure: (err) => {
                    console.error('Error en login de Cognito:', err);
                    reject(err);
                }
            });
        });
    }

    private async fetchAndCacheUserRole(): Promise<string> {
        const idToken = sessionStorage.getItem('idToken');

        if (!idToken) {
            throw new Error('No se encontró el token de identificación');
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${idToken}`
        });

        const response = await this.http
        .get<{ role: string }>(
            `${environment.apiBaseUrl}/auth/role`,
            { headers }
        ).toPromise();
        
        const role = response!.role.toUpperCase();

        // Guardar en cache
        sessionStorage.setItem('role', role);
        this.cachedRole = role;

        return role;
    }

    getUserRole(): Promise<string> {
        // 1. cache en memoria
        if (this.cachedRole) {
            return Promise.resolve(this.cachedRole);
        }

        // 2. cache en sessionStorage
        const storedRole = sessionStorage.getItem('role');
        if (storedRole) {
            this.cachedRole = storedRole;
            return Promise.resolve(storedRole);
        }
        
        // 3. llamada a la API
        const idToken = sessionStorage.getItem('idToken');

        const headers = new HttpHeaders({
            Authorization: `Bearer ${idToken}`
        });

        return this.http
        .get<{ role: string }>(
            `${environment.apiBaseUrl}/auth/role`,
            { headers }
        ).toPromise().then(res => res!.role)
    }

    registerUser(data: {
        fullName: string,
        email: string,
        phone: string,
        password: string,
        typeDocument: string,
        numberDocument: string
    }): Promise<any> {
        
        const phoneFormatted = this.formatPhoneNumber(data.phone);

        const attributes: CognitoUserAttribute[] = [
            new CognitoUserAttribute({ Name: 'email', Value: data.email }),
            new CognitoUserAttribute({ Name: 'phone_number', Value: phoneFormatted}),

            // Custom attributes
            new CognitoUserAttribute({ Name: 'custom:full_name', Value: data.fullName}),
            new CognitoUserAttribute({ Name: 'custom:type_document', Value: data.typeDocument}),
            new CognitoUserAttribute({ Name: 'custom:number_document', Value: data.numberDocument})
        ];

        return new Promise((resolve, reject) => {
            this.userPool.signUp(
                data.email,
                data.password,
                attributes,
                [],
                (err, result) => {
                    if (err) {
                        console.error('Error en signUp de Cognito:', err);
                        reject(err);
                        return;
                    }

                    console.log('Usuario registrado exitosamente:', result);
                    resolve(result);
                } 
            )
        })
    }
    
    formatPhoneNumber(phone: string): string {
        // Limpiar el número de cualquier caracter no numérico
        let clean = phone.replace(/\D/g, '');

        // Si ya tiene el código de país, devolverlo con +
        if (clean.startsWith('57')) {
            return `+${clean}`;
        }
        
        // Si no tiene código de país, agregarlo
        return `+57${clean}`;
    }

    confirmUser(email: string, code: string): Promise<void> {
        const user = new CognitoUser({
            Username: email,
            Pool: this.userPool
        });

        return new Promise((resolve, reject) => {
            user.confirmRegistration(code, true, (err: any, result: any) => {
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

    resendConfirmationCode(email: string): Promise<void> {
        const user = new CognitoUser({
            Username: email,
            Pool: this.userPool
        });

        return new Promise((resolve, reject) => {
            user.resendConfirmationCode((err: any, result: any) => {
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
}