import { getCognitoErrorMessage } from './cognito-error-handler';

describe('Cognito Error Handler', () => {

    describe('HTTP status errors', () => {
        it('should handle 401', () => {
            const msg = getCognitoErrorMessage({ status: 401 });
            expect(msg).toContain('incorrectos');
        });

        it('should handle 403', () => {
            const msg = getCognitoErrorMessage({ status: 403 });
            expect(msg).toContain('permisos');
        });

        it('should handle 404', () => {
            const msg = getCognitoErrorMessage({ status: 404 });
            expect(msg).toContain('registrada');
        });

        it('should handle 429', () => {
            const msg = getCognitoErrorMessage({ status: 429 });
            expect(msg).toContain('solicitudes');
        });

        it('should handle 500', () => {
            const msg = getCognitoErrorMessage({ status: 500 });
            expect(msg).toContain('servidor');
        });

        it('should handle 502', () => {
            const msg = getCognitoErrorMessage({ status: 502 });
            expect(msg).toContain('disponible');
        });
    });

    describe('Cognito error codes', () => {
        it('should handle NotAuthorizedException - wrong password', () => {
            const msg = getCognitoErrorMessage({ code: 'NotAuthorizedException', message: 'Incorrect username or password' });
            expect(msg).toContain('incorrectos');
        });

        it('should handle NotAuthorizedException - attempts exceeded', () => {
            const msg = getCognitoErrorMessage({ code: 'NotAuthorizedException', message: 'Password attempts exceeded' });
            expect(msg).toContain('bloqueada');
        });

        it('should handle NotAuthorizedException - disabled user', () => {
            const msg = getCognitoErrorMessage({ code: 'NotAuthorizedException', message: 'User is disabled' });
            expect(msg).toContain('deshabilitada');
        });

        it('should handle UserNotFoundException', () => {
            const msg = getCognitoErrorMessage({ code: 'UserNotFoundException' });
            expect(msg).toContain('No existe');
        });

        it('should handle UserNotConfirmedException', () => {
            const msg = getCognitoErrorMessage({ code: 'UserNotConfirmedException' });
            expect(msg).toContain('confirmada');
        });

        it('should handle UsernameExistsException', () => {
            const msg = getCognitoErrorMessage({ code: 'UsernameExistsException' });
            expect(msg).toContain('Ya existe');
        });

        it('should handle CodeMismatchException', () => {
            const msg = getCognitoErrorMessage({ code: 'CodeMismatchException' });
            expect(msg).toContain('incorrecto');
        });

        it('should handle ExpiredCodeException', () => {
            const msg = getCognitoErrorMessage({ code: 'ExpiredCodeException' });
            expect(msg).toContain('expirado');
        });

        it('should handle LimitExceededException', () => {
            const msg = getCognitoErrorMessage({ code: 'LimitExceededException' });
            expect(msg).toContain('límite');
        });

        it('should handle TooManyRequestsException', () => {
            const msg = getCognitoErrorMessage({ code: 'TooManyRequestsException' });
            expect(msg).toContain('solicitudes');
        });

        it('should handle InvalidPasswordException', () => {
            const msg = getCognitoErrorMessage({ code: 'InvalidPasswordException' });
            expect(msg).toContain('requisitos');
        });

        it('should handle InvalidParameterException - email', () => {
            const msg = getCognitoErrorMessage({ code: 'InvalidParameterException', message: 'Invalid email' });
            expect(msg).toContain('correo electrónico');
        });

        it('should handle InvalidParameterException - password', () => {
            const msg = getCognitoErrorMessage({ code: 'InvalidParameterException', message: 'Invalid password format' });
            expect(msg).toContain('contraseña');
        });

        it('should handle InvalidParameterException - phone', () => {
            const msg = getCognitoErrorMessage({ code: 'InvalidParameterException', message: 'Invalid phone number' });
            expect(msg).toContain('teléfono');
        });

        it('should handle ResourceNotFoundException', () => {
            const msg = getCognitoErrorMessage({ code: 'ResourceNotFoundException' });
            expect(msg).toContain('configuración');
        });

        it('should handle CodeDeliveryFailureException', () => {
            const msg = getCognitoErrorMessage({ code: 'CodeDeliveryFailureException' });
            expect(msg).toContain('código de verificación');
        });

        it('should handle AliasExistsException', () => {
            const msg = getCognitoErrorMessage({ code: 'AliasExistsException' });
            expect(msg).toContain('verificada');
        });

        it('should handle PasswordResetRequiredException', () => {
            const msg = getCognitoErrorMessage({ code: 'PasswordResetRequiredException' });
            expect(msg).toContain('restablecida');
        });

        it('should handle TooManyFailedAttemptsException', () => {
            const msg = getCognitoErrorMessage({ code: 'TooManyFailedAttemptsException' });
            expect(msg).toContain('bloqueada');
        });

        it('should handle InternalErrorException', () => {
            const msg = getCognitoErrorMessage({ code: 'InternalErrorException' });
            expect(msg).toContain('interno');
        });
    });

    describe('Message-based fallback errors', () => {
        it('should handle "User pool does not exist" message', () => {
            const msg = getCognitoErrorMessage({ message: 'User pool client blah does not exist' });
            expect(msg).toContain('configuración');
        });

        it('should handle "User pool ... does not exist" message', () => {
            const msg = getCognitoErrorMessage({ message: 'User pool us-east-1_INVALID does not exist.' });
            expect(msg).toContain('configuración');
        });

        it('should handle network errors', () => {
            const msg = getCognitoErrorMessage({ message: 'Network error' });
            expect(msg).toContain('conexión');
        });

        it('should handle Failed to fetch', () => {
            const msg = getCognitoErrorMessage({ message: 'Failed to fetch' });
            expect(msg).toContain('conexión');
        });

        it('should handle timeout errors', () => {
            const msg = getCognitoErrorMessage({ message: 'ETIMEDOUT' });
            expect(msg).toContain('tardó demasiado');
        });

        it('should handle User is disabled message', () => {
            const msg = getCognitoErrorMessage({ message: 'User is disabled' });
            expect(msg).toContain('deshabilitada');
        });

        it('should handle Invalid code provided message', () => {
            const msg = getCognitoErrorMessage({ message: 'Invalid code provided' });
            expect(msg).toContain('expirado');
        });
    });

    describe('Edge cases', () => {
        it('should handle null error', () => {
            const msg = getCognitoErrorMessage(null);
            expect(msg).toContain('inesperado');
        });

        it('should handle undefined error', () => {
            const msg = getCognitoErrorMessage(undefined);
            expect(msg).toContain('inesperado');
        });

        it('should handle string error', () => {
            const msg = getCognitoErrorMessage('Something went wrong');
            expect(msg).toBe('Something went wrong');
        });

        it('should handle error with only message', () => {
            const msg = getCognitoErrorMessage({ message: 'Custom error message' });
            expect(msg).toBe('Custom error message');
        });
    });
});
