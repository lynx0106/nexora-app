#!/usr/bin/env pwsh
# Pre-deployment validation script for Nexora App
# Run this BEFORE pushing to main/deploying to production

param(
    [switch]$SkipTests,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$hasErrors = $false

Write-Host "🚀 Validaciones Pre-Deploy - Nexora App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Colores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Gray = "Gray"

# Función para validar URL
function Test-Url {
    param($Url, $Description)
    Write-Host "   - Probando $Description..." -ForegroundColor $Gray -NoNewline
    try {
        $response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host " ✅ OK" -ForegroundColor $Green
        return $true
    } catch {
        Write-Host " ❌ ERROR: $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# 1. Verificar que estamos en main y sincronizados
Write-Host "📋 Paso 1: Verificando Git..." -ForegroundColor Yellow
$currentBranch = git branch --show-current 2>$null
if ($currentBranch -ne "main") {
    Write-Host "❌ ERROR: No estás en la rama main. Estás en: $currentBranch" -ForegroundColor $Red
    Write-Host "   Cambia a main: git checkout main" -ForegroundColor $Gray
    $hasErrors = $true
} else {
    Write-Host "   ✅ Rama: main" -ForegroundColor $Green
}

# Verificar si hay cambios sin commitear
$uncommitted = git status --porcelain 2>$null
if ($uncommitted) {
    Write-Host "❌ ERROR: Hay cambios sin commitear:" -ForegroundColor $Red
    git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor $Gray }
    Write-Host "   Haz commit primero: git add . && git commit -m \"mensaje\"" -ForegroundColor $Yellow
    $hasErrors = $true
} else {
    Write-Host "   ✅ No hay cambios pendientes" -ForegroundColor $Green
}

# Verificar si local está adelantado de origin
$commitsAhead = git rev-list --count origin/main..HEAD 2>$null
if ($commitsAhead -gt 0) {
    Write-Host "   ⚠️  Tienes $commitsAhead commit(s) sin push" -ForegroundColor $Yellow
} else {
    Write-Host "   ✅ Sincronizado con origin/main" -ForegroundColor $Green
}
Write-Host ""

# 2. Validar Backend completamente
Write-Host "🔧 Paso 2: Validando Backend..." -ForegroundColor Yellow
Set-Location backend

# Build de producción
Write-Host "   - Build de producción..." -ForegroundColor $Gray
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Build de backend falló" -ForegroundColor $Red
    $hasErrors = $true
} else {
    Write-Host "   ✅ Build exitoso" -ForegroundColor $Green
}

# Tests (si no se saltan)
if (-not $SkipTests) {
    Write-Host "   - Ejecutando tests..." -ForegroundColor $Gray
    $testResult = npm test 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Tests fallaron" -ForegroundColor $Red
        $hasErrors = $true
    } else {
        Write-Host "   ✅ Tests pasaron" -ForegroundColor $Green
    }
} else {
    Write-Host "   ⏭️  Tests omitidos (--SkipTests)" -ForegroundColor $Yellow
}

Set-Location ..
Write-Host ""

# 3. Validar Frontend
Write-Host "🎨 Paso 3: Validando Frontend..." -ForegroundColor Yellow
Set-Location frontend

Write-Host "   - Build de producción..." -ForegroundColor $Gray
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Build de frontend falló" -ForegroundColor $Red
    $hasErrors = $true
} else {
    Write-Host "   ✅ Build exitoso" -ForegroundColor $Green
}

Set-Location ..
Write-Host ""

# 4. Verificar variables de entorno de producción
Write-Host "🔐 Paso 4: Verificando variables de entorno..." -ForegroundColor Yellow

$requiredVars = @(
    "JWT_SECRET",
    "SUPABASE_DATABASE_URL",
    "NODE_ENV"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if (-not $value) {
        $value = (Get-Content backend/.env -ErrorAction SilentlyContinue | Select-String "^$var=") -replace "^$var=", ""
    }
    if (-not $value) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  WARNING: Variables no encontradas en entorno local:" -ForegroundColor $Yellow
    $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor $Gray }
    Write-Host "   Asegúrate de configurarlas en Railway/Vercel" -ForegroundColor $Yellow
} else {
    Write-Host "   ✅ Variables de entorno verificadas" -ForegroundColor $Green
}
Write-Host ""

# 5. Checklist de despliegue
Write-Host "📋 Paso 5: Checklist de Despliegue..." -ForegroundColor Yellow

checklist @"

Pre-Deploy Checklist:
□ Backend compila sin errores
□ Frontend compila sin errores  
□ Tests pasan (o se revisaron manualmente)
□ Variables de entorno configuradas en Railway
□ Variables de entorno configuradas en Vercel
□ CORS configurado correctamente en backend
□ URL de backend actualizada en frontend
□ Database URL apunta a producción (Supabase)
□ JWT_SECRET es seguro (32+ caracteres)
□ TYPEORM_SYNCHRONIZE=false en producción

"@

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($hasErrors) {
    Write-Host "❌ VALIDACIÓN FALLIDA" -ForegroundColor $Red
    Write-Host "Corrige los errores antes de hacer deploy" -ForegroundColor $Red
    exit 1
} else {
    Write-Host "✅ VALIDACIÓN EXITOSA" -ForegroundColor Green
    Write-Host ""
    Write-Host "Listo para deploy:" -ForegroundColor Cyan
    Write-Host "   git push origin main" -ForegroundColor White
    Write-Host ""
    Write-Host "Luego verifica en:" -ForegroundColor Cyan
    Write-Host "   Railway: https://railway.app/dashboard" -ForegroundColor Gray
    Write-Host "   Vercel:  https://vercel.com/dashboard" -ForegroundColor Gray
    exit 0
}
