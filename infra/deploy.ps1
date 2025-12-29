# deploy.ps1
param(
    [string]$Environment = "prod",
    [string]$Region = "us-east-1",
    [string]$GuideFolderName = "guides"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Despliegue de Lambda con ECR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Rutas
$InfraRoot = $PSScriptRoot
$EnvPath = Join-Path $InfraRoot "envs\$Environment"
$GuidePath = Join-Path $InfraRoot "..\$GuideFolderName"

# Verificar que existe la carpeta guides
if (-not (Test-Path $GuidePath)) {
    Write-Error "No se encontro la carpeta $GuideFolderName en: $GuidePath"
    exit 1
}

Write-Host "`n[1/5] Verificando y creando ECR si no existe..." -ForegroundColor Green
Set-Location $EnvPath

# Crear ECR
terraform apply "-var-file=$Environment.tfvars" "-target=module.guides.module.lambda.aws_ecr_repository.lambda_pdf_repo" -auto-approve 2>&1 | Out-Null

Write-Host "`n[2/5] Obteniendo URL del ECR..." -ForegroundColor Green
$ECR_URL = (terraform output -raw ecr_repository_url 2>$null)

if ([string]::IsNullOrEmpty($ECR_URL)) {
    Write-Error "No se pudo obtener la URL del ECR"
    exit 1
}

Write-Host "ECR URL: $ECR_URL" -ForegroundColor Green

# Extraer info
$parts = $ECR_URL -split '/'
$RegistryDomain = $parts[0]
$RepoName = $parts[1]

Write-Host "`n[3/5] Autenticando con ECR..." -ForegroundColor Green

# METODO DIRECTO: Ejecutar el comando completo en una sola linea
$loginCmd = "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $RegistryDomain"

Write-Host "Ejecutando login..." -ForegroundColor Gray

# Ejecutar usando cmd.exe para mejor compatibilidad
$result = cmd /c $loginCmd 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Salida del comando:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Intentando metodo alternativo..." -ForegroundColor Yellow
    
    # METODO ALTERNATIVO: Usar Invoke-Expression
    try {
        Invoke-Expression "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $RegistryDomain"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Login fallido"
        }
        
        Write-Host "Autenticacion exitosa (metodo alternativo)" -ForegroundColor Green
    } catch {
        Write-Error "No se pudo autenticar con ECR. Error: $_"
        exit 1
    }
} else {
    Write-Host "Autenticacion exitosa" -ForegroundColor Green
}

Write-Host "`n[4/5] Construyendo y subiendo imagen Docker..." -ForegroundColor Green
Set-Location $GuidePath

Write-Host "Construyendo imagen desde: $GuidePath" -ForegroundColor Yellow
$env:DOCKER_BUILDKIT=0
docker build --platform=linux/amd64 -t "${ECR_URL}:latest" .


if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al construir imagen Docker"
    exit 1
}

Write-Host "Imagen construida exitosamente" -ForegroundColor Green

Write-Host "Subiendo imagen a ECR..." -ForegroundColor Yellow
docker push "${ECR_URL}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al subir imagen a ECR"
    exit 1
}

Write-Host "Imagen subida exitosamente" -ForegroundColor Green

Write-Host "`n[5/5] Desplegando Lambda y recursos restantes..." -ForegroundColor Green
Set-Location $EnvPath

terraform apply "-var-file=$Environment.tfvars" -auto-approve

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  DESPLIEGUE COMPLETADO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "ECR: $ECR_URL" -ForegroundColor Cyan
} else {
    Write-Error "Error en el despliegue final"
    exit 1
}