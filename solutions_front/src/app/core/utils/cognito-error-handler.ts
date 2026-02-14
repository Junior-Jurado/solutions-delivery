/**
 * Mapeo completo de errores de AWS Cognito a mensajes amigables en español.
 * Cubre todos los códigos de error documentados del SDK amazon-cognito-identity-js.
 */

interface CognitoError {
    code?: string;
    name?: string;
    message?: string;
    status?: number;
    statusCode?: number;
}

export function getCognitoErrorMessage(error: unknown): string {
    if (!error) return 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.';

    const cognitoError = error as CognitoError;
    const code = cognitoError.code || cognitoError.name || '';
    const message = cognitoError.message || String(error) || '';
    const status = cognitoError.status || cognitoError.statusCode;

    // 1. Errores HTTP del backend (no Cognito)
    if (status) {
        switch (status) {
            case 400: return 'Solicitud inválida. Verifica los datos ingresados.';
            case 401: return 'Correo o contraseña incorrectos.';
            case 403: return 'No tienes permisos para acceder al sistema.';
            case 404: return 'Tu cuenta no está registrada en el sistema. Contacta al administrador.';
            case 429: return 'Demasiadas solicitudes. Espera un momento antes de intentar nuevamente.';
            case 500: return 'Error interno del servidor. Intenta más tarde.';
            case 502: return 'El servidor no está disponible. Intenta más tarde.';
            case 503: return 'El servicio está temporalmente no disponible. Intenta más tarde.';
            default: return 'Error inesperado del servidor. Intenta nuevamente.';
        }
    }

    // 2. Errores por código de Cognito
    switch (code) {
        // Autenticación
        case 'NotAuthorizedException':
            if (message.includes('Incorrect username or password'))
                return 'Correo o contraseña incorrectos. Por favor verifica tus credenciales.';
            if (message.includes('Password attempts exceeded'))
                return 'Demasiados intentos fallidos. Tu cuenta está bloqueada temporalmente. Intenta de nuevo más tarde.';
            if (message.includes('User is disabled'))
                return 'Tu cuenta ha sido deshabilitada. Contacta al administrador.';
            return 'No tienes autorización para realizar esta acción.';

        // Usuario no encontrado
        case 'UserNotFoundException':
            return 'No existe una cuenta con este correo electrónico.';

        // Usuario no confirmado
        case 'UserNotConfirmedException':
            return 'Tu cuenta no ha sido confirmada. Por favor revisa tu correo electrónico para confirmar tu cuenta.';

        // Usuario ya existe
        case 'UsernameExistsException':
            return 'Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.';

        // Código inválido
        case 'CodeMismatchException':
            return 'Código de verificación incorrecto. Por favor verifica el código e intenta nuevamente.';

        // Código expirado
        case 'ExpiredCodeException':
            return 'El código de verificación ha expirado. Solicita uno nuevo.';

        // Límite de intentos
        case 'LimitExceededException':
            return 'Has excedido el límite de intentos. Espera unos minutos antes de intentar nuevamente.';

        // Demasiadas solicitudes
        case 'TooManyRequestsException':
            return 'Demasiadas solicitudes. Espera un momento antes de intentar nuevamente.';

        // Contraseña inválida
        case 'InvalidPasswordException':
            return 'La contraseña no cumple con los requisitos mínimos de seguridad. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.';

        // Parámetro inválido
        case 'InvalidParameterException':
            if (message.includes('email'))
                return 'Por favor ingresa un correo electrónico válido.';
            if (message.includes('password'))
                return 'La contraseña no cumple con el formato requerido.';
            if (message.includes('phone'))
                return 'El número de teléfono no tiene un formato válido.';
            return 'Uno de los datos ingresados no es válido. Por favor revisa el formulario.';

        // Recurso no encontrado (pool, client)
        case 'ResourceNotFoundException':
            return 'Error de configuración del servicio de autenticación. Contacta al administrador.';

        // Fallo en entrega de código
        case 'CodeDeliveryFailureException':
            return 'No se pudo enviar el código de verificación. Verifica que tu correo electrónico sea válido e intenta nuevamente.';

        // Usuario ya confirmado (intenta confirmar de nuevo)
        case 'AliasExistsException':
            return 'Esta cuenta ya ha sido verificada. Intenta iniciar sesión directamente.';

        // Configuración inválida del pool
        case 'InvalidUserPoolConfigurationException':
            return 'Error de configuración del servicio. Contacta al administrador.';

        // Lambda triggers
        case 'InvalidLambdaResponseException':
        case 'UnexpectedLambdaException':
        case 'UserLambdaValidationException':
            return 'Error en la validación del servidor. Intenta nuevamente o contacta al administrador.';

        // MFA
        case 'MFAMethodNotFoundException':
            return 'No se encontró el método de autenticación. Contacta al administrador.';

        case 'SoftwareTokenMFANotFoundException':
            return 'No se ha configurado la verificación en dos pasos. Contacta al administrador.';

        // Dispositivo no recordado
        case 'DeviceNotRememberedException':
            return 'Este dispositivo no está registrado. Intenta iniciar sesión nuevamente.';

        // Token inválido o expirado
        case 'NotAuthorizedException':
            return 'Tu sesión ha expirado. Inicia sesión nuevamente.';

        // Error interno de Cognito
        case 'InternalErrorException':
            return 'Error interno del servicio de autenticación. Intenta más tarde.';

        // Contraseña debe ser reseteada por admin
        case 'PasswordResetRequiredException':
            return 'Tu contraseña debe ser restablecida. Usa la opción "Olvidé mi contraseña".';

        // Demasiados intentos de contraseña fallidos
        case 'TooManyFailedAttemptsException':
            return 'Demasiados intentos fallidos. Tu cuenta está bloqueada temporalmente. Intenta en 15 minutos.';
    }

    // 3. Fallback: buscar en el mensaje de error (para errores sin código)
    if (message.includes('Incorrect username or password'))
        return 'Correo o contraseña incorrectos. Por favor verifica tus credenciales.';
    if (message.includes('User does not exist'))
        return 'No existe una cuenta con este correo electrónico.';
    if (message.includes('User already exists') || message.includes('An account with the given email already exists'))
        return 'Ya existe una cuenta con este correo electrónico.';
    if (message.includes('User is not confirmed'))
        return 'Tu cuenta no ha sido confirmada. Por favor revisa tu correo.';
    if (message.includes('Password attempts exceeded'))
        return 'Demasiados intentos fallidos. Intenta de nuevo más tarde.';
    if (message.includes('Username should be an email') || message.includes('Invalid email'))
        return 'Por favor ingresa un correo electrónico válido.';
    if (message.includes('Password did not conform'))
        return 'La contraseña no cumple con los requisitos mínimos de seguridad.';
    if (message.includes('Invalid verification code') || message.includes('Code mismatch'))
        return 'Código de verificación inválido. Por favor verifica el código.';
    if (message.includes('Invalid code provided'))
        return 'El código proporcionado no es válido o ha expirado. Solicita uno nuevo.';
    if (message.includes('Attempt limit exceeded'))
        return 'Has excedido el límite de intentos. Solicita un nuevo código.';
    if (message.includes('User pool') && message.includes('does not exist'))
        return 'Error de configuración del servicio de autenticación. Contacta al administrador.';
    if (message.includes('User pool client') && message.includes('does not exist'))
        return 'Error de configuración del servicio de autenticación. Contacta al administrador.';
    if (message.includes('Network error') || message.includes('Failed to fetch') || message.includes('NetworkError'))
        return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
    if (message.includes('ETIMEDOUT') || message.includes('timeout'))
        return 'La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente.';
    if (message.includes('User is disabled'))
        return 'Tu cuenta ha sido deshabilitada. Contacta al administrador.';

    return message || 'Ha ocurrido un error. Por favor intenta nuevamente.';
}
