/**
 * Script de validación de variables de entorno.
 *
 * Uso:
 *   node scripts/validate-env.js              → valida solo dev (por defecto)
 *   node scripts/validate-env.js --env=dev    → valida solo dev
 *   node scripts/validate-env.js --env=prod   → valida solo prod
 *   node scripts/validate-env.js --env=all    → valida ambos
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

    const poolIdMatch = fileContent.match(/userPoolId:\s*['"`]([^'"`]*)['"`]/);
    const poolId = poolIdMatch ? poolIdMatch[1].trim() : '';

    const clientIdMatch = fileContent.match(/clientId:\s*['"`]([^'"`]*)['"`]/);
    const clientId = clientIdMatch ? clientIdMatch[1].trim() : '';

    const apiUrlMatch = fileContent.match(/apiBaseUrl:\s*['"`]([^'"`]*)['"`]/);
    const apiUrl = apiUrlMatch ? apiUrlMatch[1].trim() : '';

    if (!poolId) {
        errors.push(`[${fileName}] cognito.userPoolId está vacío`);
    } else if (PLACEHOLDERS.userPoolId.includes(poolId)) {
        errors.push(`[${fileName}] cognito.userPoolId tiene un valor placeholder: "${poolId}"`);
    } else if (!POOL_ID_REGEX.test(poolId)) {
        errors.push(`[${fileName}] cognito.userPoolId tiene formato inválido: "${poolId}" (esperado: region_poolId)`);
    }

    if (!clientId) {
        errors.push(`[${fileName}] cognito.clientId está vacío`);
    } else if (PLACEHOLDERS.clientId.includes(clientId)) {
        errors.push(`[${fileName}] cognito.clientId tiene un valor placeholder: "${clientId}"`);
    }

    if (!apiUrl) {
        errors.push(`[${fileName}] apiBaseUrl está vacío`);
    } else if (PLACEHOLDERS.apiBaseUrl.includes(apiUrl)) {
        errors.push(`[${fileName}] apiBaseUrl tiene un valor placeholder: "${apiUrl}"`);
    }

    return errors;
}

function getTargetEnv() {
    const envArg = process.argv.find(a => a.startsWith('--env='));
    if (envArg) {
        return envArg.split('=')[1];
    }
    return 'dev';
}

function main() {
    const target = getTargetEnv();
    console.log(`\n🔍 Validando entorno: ${target}\n`);

    const envFiles = {
        dev:  { file: 'environment.dev.ts', label: 'Desarrollo' },
        prod: { file: 'environment.prod.ts', label: 'Producción' }
    };

    let filesToValidate = [];
    if (target === 'all') {
        filesToValidate = [envFiles.dev, envFiles.prod];
    } else if (target === 'prod') {
        filesToValidate = [envFiles.prod];
    } else {
        filesToValidate = [envFiles.dev];
    }

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

    console.log('');

    if (allErrors.length > 0) {
        console.error('❌ Validación FALLIDA. Errores encontrados:\n');
        allErrors.forEach(e => console.error(`   • ${e}`));
        console.error('\n📝 Configura los valores correctos en src/app/environments/ antes de hacer build o push.\n');
        process.exit(1);
    }

    console.log('✅ Variables de entorno válidas.\n');
}

main();
