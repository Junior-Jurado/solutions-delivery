import { environment } from '@environments/environment';

export interface EnvironmentValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateEnvironment(): EnvironmentValidationResult {
    const errors: string[] = [];

    // Cognito
    if (!environment.cognito.userPoolId || environment.cognito.userPoolId.trim() === '') {
        errors.push('COGNITO_USER_POOL_ID no está configurado');
    } else if (environment.cognito.userPoolId === 'us-east-1_PRODPOOL') {
        errors.push('COGNITO_USER_POOL_ID tiene un valor placeholder (us-east-1_PRODPOOL). Configura el valor real.');
    } else if (!/^[\w-]+_[a-zA-Z0-9]+$/.test(environment.cognito.userPoolId)) {
        errors.push(`COGNITO_USER_POOL_ID tiene un formato inválido: "${environment.cognito.userPoolId}". Formato esperado: region_poolId`);
    }

    if (!environment.cognito.clientId || environment.cognito.clientId.trim() === '') {
        errors.push('COGNITO_CLIENT_ID no está configurado');
    } else if (environment.cognito.clientId === 'PROD_CLIENT_ID') {
        errors.push('COGNITO_CLIENT_ID tiene un valor placeholder (PROD_CLIENT_ID). Configura el valor real.');
    }

    // API Base URL
    if (!environment.apiBaseUrl || environment.apiBaseUrl.trim() === '') {
        errors.push('API_BASE_URL no está configurado');
    } else if (environment.apiBaseUrl === 'https://api.tudominio.com') {
        errors.push('API_BASE_URL tiene un valor placeholder (https://api.tudominio.com). Configura el valor real.');
    }

    return { valid: errors.length === 0, errors };
}

export function logEnvironmentValidation(): void {
    const result = validateEnvironment();

    if (!result.valid) {
        const mode = environment.production ? 'PRODUCCIÓN' : 'DESARROLLO';
        console.error(
            `\n⚠️ [ENV ${mode}] Configuración de entorno inválida:\n` +
            result.errors.map(e => `  ❌ ${e}`).join('\n') +
            '\n\nRevisa los archivos en src/app/environments/\n'
        );
    }
}
