#!/usr/bin/env pwsh
# Valida la configuración de despliegue (Railway, Vercel, Supabase)

Write-Host "🔍 Validando Configuración de Despliegue" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# 1. Validar railway.json
Write-Host "📦 Validando railway.json..." -ForegroundColor Yellow
if (Test-Path "railway.json") {
    try {
        $railwayConfig = Get-Content "railway.json" -Raw | ConvertFrom-Json
        Write-Host "   ✅ railway.json existe y es válido" -ForegroundColor Green
    } catch {
        $issues += "railway.json: formato JSON inválido"
    }
} else {
    $warnings += "railway.json: no existe (opcional pero recomendado)"
}
Write-Host ""

# 2. Validar Procfile
Write-Host "📄 Validando Procfile..." -ForegroundColor Yellow
if (Test-Path "Procfile") {
    $procfile = Get-Content "Procfile" -Raw
    if ($procfile -match "web:") {
        Write-Host "   ✅ Procfile existe" -ForegroundColor Green
    } else {
        $issues += "Procfile: falta entrada 'web'"
    }
} else {
    $issues += "Procfile: no existe"
}
Write-Host ""

# 3. Validar CORS en backend
Write-Host "🔒 Validando CORS..." -ForegroundColor Yellow
$runtimeConfig = Get-Content "backend/src/config/runtime.config.ts" -Raw -ErrorAction SilentlyContinue
if ($runtimeConfig -match "nexora-app\.online") {
    Write-Host "   ✅ CORS configurado" -ForegroundColor Green
} else {
    $warnings += "CORS: verificar URLs de producción"
}
Write-Host ""

# 4. Validar API_URL frontend
Write-Host "🌐 Validando API_URL..." -ForegroundColor Yellow
$apiFile = Get-Content "frontend/src/lib/api.ts" -Raw -ErrorAction SilentlyContinue
if ($apiFile -match "railway\.app") {
    Write-Host "   ✅ API_URL configurado" -ForegroundColor Green
} else {
    $issues += "API_URL: no apunta a Railway"
}
Write-Host ""

# Resumen
Write-Host "=========================================" -ForegroundColor Cyan
if ($issues.Count -gt 0) {
    Write-Host "❌ ERRORES:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    exit 1
} elseif ($warnings.Count -gt 0) {
    Write-Host "⚠️  ADVERTENCIAS:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    exit 0
} else {
    Write-Host "✅ CONFIGURACIÓN OK" -ForegroundColor Green
    exit 0
}
