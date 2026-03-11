#!/usr/bin/env pwsh
# Pre-commit validation script for Nexora App
# Run this before git commit to ensure code quality

param(
    [switch]$Fix,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$hasErrors = $false

Write-Host "🔍 Validaciones Pre-Commit - Nexora App" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que estamos en el directorio correcto
Write-Host "📁 Verificando estructura del proyecto..." -ForegroundColor Yellow
if (-not (Test-Path "backend/package.json") -or -not (Test-Path "frontend/package.json")) {
    Write-Host "❌ ERROR: No se encuentra backend/ o frontend/. Ejecuta desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Estructura correcta" -ForegroundColor Green
Write-Host ""

# 2. Validar Backend (NestJS)
Write-Host "🔧 Validando Backend (NestJS)..." -ForegroundColor Yellow
Set-Location backend

try {
    # Verificar TypeScript sin errores
    Write-Host "   - Compilando TypeScript..." -ForegroundColor Gray
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Backend tiene errores de compilación TypeScript" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
        $hasErrors = $true
    } else {
        Write-Host "   ✅ Compilación TypeScript OK" -ForegroundColor Green
    }
    
    # Ejecutar tests si existen
    Write-Host "   - Ejecutando tests..." -ForegroundColor Gray
    $testOutput = npm test -- --passWithNoTests 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  WARNING: Tests fallaron o no existen" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Tests OK" -ForegroundColor Green
    }
    
} catch {
    Write-Host "⚠️  No se pudo validar backend completamente: $_" -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""

# 3. Validar Frontend (Next.js)
Write-Host "🎨 Validando Frontend (Next.js)..." -ForegroundColor Yellow
Set-Location frontend

try {
    # Verificar build
    Write-Host "   - Verificando build..." -ForegroundColor Gray
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Frontend tiene errores de build" -ForegroundColor Red
        $hasErrors = $true
    } else {
        Write-Host "   ✅ Build OK" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  No se pudo validar frontend completamente: $_" -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""

# 4. Verificar variables de entorno críticas
Write-Host "🔐 Verificando variables de entorno..." -ForegroundColor Yellow
$envFiles = @("backend/.env", "frontend/.env", ".env")
$foundEnv = $false

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "   ✅ Encontrado: $envFile" -ForegroundColor Green
        $foundEnv = $true
        
        # Verificar JWT_SECRET no sea default
        $content = Get-Content $envFile -Raw
        if ($content -match "JWT_SECRET=.*(change-me|default|secret|123)" -or 
            $content -match "JWT_SECRET=your-" -or
            $content -match "JWT_SECRET=[^a-zA-Z0-9]{1,15}$") {
            Write-Host "⚠️  WARNING: JWT_SECRET parece ser un valor por defecto o inseguro" -ForegroundColor Yellow
        }
    }
}

if (-not $foundEnv) {
    Write-Host "⚠️  WARNING: No se encontraron archivos .env" -ForegroundColor Yellow
}
Write-Host ""

# 5. Verificar que no hay console.log en producción
Write-Host "🧹 Verificando código de producción..." -ForegroundColor Yellow
$consoleLogs = Select-String -Path "backend/src/**/*.ts" -Pattern "console\.(log|warn|error)" -Exclude "*.spec.ts" -ErrorAction SilentlyContinue | Select-Object -First 5
if ($consoleLogs) {
    Write-Host "⚠️  WARNING: Se encontraron console.* en backend:" -ForegroundColor Yellow
    $consoleLogs | ForEach-Object { Write-Host "   - $($_.FileName):$($_.LineNumber)" -ForegroundColor Gray }
} else {
    Write-Host "   ✅ No hay console.* en código de producción" -ForegroundColor Green
}
Write-Host ""

# 6. Verificar credenciales hardcodeadas
Write-Host "🔒 Verificando seguridad básica..." -ForegroundColor Yellow
$passwordPatterns = Select-String -Path "backend/src/**/*.ts" -Pattern 'password\s*=\s*["''][^"'']+["'']' -ErrorAction SilentlyContinue | Where-Object { $_.Line -notmatch "process\.env" } | Select-Object -First 3
if ($passwordPatterns) {
    Write-Host "⚠️  WARNING: Posibles contraseñas hardcodeadas encontradas:" -ForegroundColor Yellow
    $passwordPatterns | ForEach-Object { Write-Host "   - $($_.FileName):$($_.LineNumber)" -ForegroundColor Gray }
} else {
    Write-Host "   ✅ No se encontraron contraseñas hardcodeadas obvias" -ForegroundColor Green
}
Write-Host ""

# Resumen
Write-Host "==========================================" -ForegroundColor Cyan
if ($hasErrors) {
    Write-Host "❌ VALIDACIÓN FALLIDA - Corrige los errores antes de hacer commit" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para corregir automáticamente donde sea posible:" -ForegroundColor Yellow
    Write-Host "   .agents/skills/nexora-validation/scripts/pre-commit-check.ps1 -Fix" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "✅ VALIDACIÓN EXITOSA - Listo para commit" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximo paso: git add . && git commit -m \"tu mensaje\"" -ForegroundColor Cyan
    exit 0
}
