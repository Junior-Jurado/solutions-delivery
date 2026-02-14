/**
 * Script de validación de variables de entorno.
 * Se ejecuta antes del build (prebuild) y puede ejecutarse manualmente con: npm run validate:env
 *
 * Valida AMBOS archivos de entorno (dev y prod) para asegurar que no
 * se haga build ni push con configuraciones inválidas.
 */

const fs = require('fs');
const path = require('path');

const ENV_DIR = path.join(__dirname, '..', 'src', 'app', 'environments');

const PLACEHOLDERS = {
    userPoolId: ['us-east-1_PRODPOOL', 'YOUR_POOL_ID', 'CHANGE_ME'],
    clientId: ['PROD_CLIENT_ID', 'YOUR_CLIENT_ID', 'CHANGE_ME'],
    apiBaseUrl: ['https://api.tudominio.com', 'https://your-api.com', 'CHANGE_ME']
};

const POOL_ID_REGEX = /^[\w-]+_[a-zA-Z0-9]+$/;

function extractValues(fileContent, fileName) {
    const errors = [];

    // Extraer userPoolId
    const poolIdMatch = fileContent.match(/userPoolId:\s*['"`]([^'"`]*)['"`]/);
    const poolId = poolIdMatch ? poolIdMatch[1].trim() : '';

    // Extraer clientId
    const clientIdMatch = fileContent.match(/clientId:\s*['"`]([^'"`]*)['"`]/);
    const clientId = clientIdMatch ? clientIdMatch[1].trim() : '';

    // Extraer apiBaseUrl
    const apiUrlMatch = fileContent.match(/apiBaseUrl:\s*['"`]([^'"`]*)['"`]/);
    const apiUrl = apiUrlMatch ? apiUrlMatch[1].trim() : '';

    // Validar userPoolId
    if (!poolId) {
        errors.push(`[${fileName}] cognito.userPoolId está vacío`);
    } else if (PLACEHOLDERS.userPoolId.includes(poolId)) {
        errors.push(`[${fileName}] cognito.userPoolId tiene un valor placeholder: "${poolId}"`);
    } else if (!POOL_ID_REGEX.test(poolId)) {
        errors.push(`[${fileName}] cognito.userPoolId tiene formato inválido: "${poolId}" (esperado: region_poolId)`);
    }

    // Validar clientId
    if (!clientId) {
        errors.push(`[${fileName}] cognito.clientId está vacío`);
    } else if (PLACEHOLDERS.clientId.includes(clientId)) {
        errors.push(`[${fileName}] cognito.clientId tiene un valor placeholder: "${clientId}"`);
    }

    // Validar apiBaseUrl
    if (!apiUrl) {
        errors.push(`[${fileName}] apiBaseUrl está vacío`);
    } else if (PLACEHOLDERS.apiBaseUrl.includes(apiUrl)) {
        errors.push(`[${fileName}] apiBaseUrl tiene un valor placeholder: "${apiUrl}"`);
    }

    return errors;
}

function main() {
    console.log('\n🔍 Validando archivos de entorno...\n');

    const filesToValidate = [
        { file: 'environment.dev.ts', label: 'Desarrollo' },
        { file: 'environment.prod.ts', label: 'Producción' }
    ];

    let allErrors = [];

    for (const { file, label } of filesToValidate) {
        const filePath = path.join(ENV_DIR, file);

        if (!fs.existsSync(filePath)) {
            allErrors.push(`[${file}] Archivo no encontrado: ${filePath}`);
            continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const errors = extractValues(content, file);

        if (errors.length === 0) {
            console.log(`  ✅ ${label} (${file}) - OK`);
        } else {
            console.log(`  ❌ ${label} (${file}) - ${errors.length} error(es)`);
            allErrors = allErrors.concat(errors);
        }
    }

    // También validar el environment.ts base (no debería tener valores vacíos en uso directo)
    const baseFile = path.join(ENV_DIR, 'environment.ts');
    if (fs.existsSync(baseFile)) {
        const baseContent = fs.readFileSync(baseFile, 'utf8');
        const basePoolId = baseContent.match(/userPoolId:\s*['"`]([^'"`]*)['"`]/);
        const baseClientId = baseContent.match(/clientId:\s*['"`]([^'"`]*)['"`]/);
        const baseApiUrl = baseContent.match(/apiBaseUrl:\s*['"`]([^'"`]*)['"`]/);

        const hasEmptyBase = (!basePoolId?.[1] || !baseClientId?.[1] || !baseApiUrl?.[1]);
        if (hasEmptyBase) {
            console.log(`\n  ⚠️  environment.ts base tiene valores vacíos (OK si se usa fileReplacements en angular.json)`);
        }
    }

    console.log('');

    if (allErrors.length > 0) {
        console.error('❌ Validación FALLIDA. Errores encontrados:\n');
        allErrors.forEach(e => console.error(`   • ${e}`));
        console.error('\n📝 Configura los valores correctos en src/app/environments/ antes de hacer build o push.\n');
        process.exit(1);
    }

    console.log('✅ Todas las variables de entorno son válidas.\n');
}

main();
