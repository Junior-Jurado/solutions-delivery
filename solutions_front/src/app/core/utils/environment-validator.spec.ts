import { validateEnvironment } from './environment-validator';
import { environment } from '@environments/environment';

describe('Environment Validator', () => {
    const originalEnv = { ...environment };

    afterEach(() => {
        // Restaurar valores originales
        Object.assign(environment, originalEnv);
    });

    describe('Cognito UserPoolId', () => {
        it('should fail when userPoolId is empty', () => {
            environment.cognito.userPoolId = '';
            const result = validateEnvironment();
            expect(result.valid).toBeFalse();
            expect(result.errors.some(e => e.includes('COGNITO_USER_POOL_ID no está configurado'))).toBeTrue();
        });

        it('should fail when userPoolId is a placeholder', () => {
            environment.cognito.userPoolId = 'us-east-1_PRODPOOL';
            const result = validateEnvironment();
            expect(result.valid).toBeFalse();
            expect(result.errors.some(e => e.includes('placeholder'))).toBeTrue();
        });

        it('should fail when userPoolId has invalid format', () => {
            environment.cognito.userPoolId = 'invalid-format';
            const result = validateEnvironment();
            expect(result.valid).toBeFalse();
            expect(result.errors.some(e => e.includes('formato inválido'))).toBeTrue();
        });

        it('should pass when userPoolId has valid format', () => {
            environment.cognito.userPoolId = 'us-east-1_hzN05QBUg';
            environment.cognito.clientId = '448m8f9ljbv33l5d94s3j42shm';
            environment.apiBaseUrl = 'https://example.com/api';
            const result = validateEnvironment();
            expect(result.valid).toBeTrue();
        });
    });

    describe('Cognito ClientId', () => {
        it('should fail when clientId is empty', () => {
            environment.cognito.clientId = '';
            const result = validateEnvironment();
            expect(result.valid).toBeFalse();
            expect(result.errors.some(e => e.includes('COGNITO_CLIENT_ID no está configurado'))).toBeTrue();
        });

        it('should fail when clientId is a placeholder', () => {
            environment.cognito.clientId = 'PROD_CLIENT_ID';
            const result = validateEnvironment();
            expect(result.valid).toBeFalse();
            expect(result.errors.some(e => e.includes('COGNITO_CLIENT_ID') && e.includes('placeholder'))).toBeTrue();
        });
    });

    describe('API Base URL', () => {
        it('should fail when apiBaseUrl is empty', () => {
            environment.apiBaseUrl = '';
            const result = validateEnvironment();
            expect(result.valid).toBeFalse();
            expect(result.errors.some(e => e.includes('API_BASE_URL no está configurado'))).toBeTrue();
        });

        it('should fail when apiBaseUrl is a placeholder', () => {
            environment.apiBaseUrl = 'https://api.tudominio.com';
            const result = validateEnvironment();
            expect(result.valid).toBeFalse();
            expect(result.errors.some(e => e.includes('API_BASE_URL') && e.includes('placeholder'))).toBeTrue();
        });
    });

    describe('Full validation', () => {
        it('should pass with valid dev environment values', () => {
            environment.cognito.userPoolId = 'us-east-1_hzN05QBUg';
            environment.cognito.clientId = '448m8f9ljbv33l5d94s3j42shm';
            environment.apiBaseUrl = 'https://9cdy0ywdh6.execute-api.us-east-1.amazonaws.com/api/v1';
            const result = validateEnvironment();
            expect(result.valid).toBeTrue();
            expect(result.errors.length).toBe(0);
        });

        it('should report all errors when all values are invalid', () => {
            environment.cognito.userPoolId = '';
            environment.cognito.clientId = '';
            environment.apiBaseUrl = '';
            const result = validateEnvironment();
            expect(result.valid).toBeFalse();
            expect(result.errors.length).toBe(3);
        });
    });
});
