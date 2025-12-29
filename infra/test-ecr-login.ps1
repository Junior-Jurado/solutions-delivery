# test-ecr-login.ps1
$Region = "us-east-1"
$AccountId = "386452074334"
$RegistryDomain = "$AccountId.dkr.ecr.$Region.amazonaws.com"

Write-Host "=== Test de autenticacion ECR ===" -ForegroundColor Cyan

# Test 1: Verificar que AWS CLI funciona
Write-Host "`n1. Verificando AWS CLI..." -ForegroundColor Yellow
aws sts get-caller-identity

# Test 2: Obtener token
Write-Host "`n2. Obteniendo token de ECR..." -ForegroundColor Yellow
$token = aws ecr get-login-password --region $Region
if ($token) {
    Write-Host "Token obtenido: $($token.Substring(0,20))..." -ForegroundColor Green
} else {
    Write-Host "Error obteniendo token" -ForegroundColor Red
    exit 1
}

# Test 3: Verificar Docker
Write-Host "`n3. Verificando Docker..." -ForegroundColor Yellow
docker version

# Test 4: Login usando CMD
Write-Host "`n4. Intentando login con CMD..." -ForegroundColor Yellow
cmd /c "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $RegistryDomain"

Write-Host "`nResultado: LASTEXITCODE = $LASTEXITCODE" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Red" })

# Test 5: Verificar repositorios
Write-Host "`n5. Listando repositorios ECR..." -ForegroundColor Yellow
aws ecr describe-repositories --region $Region