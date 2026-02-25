#!/usr/bin/env pwsh
# Diagnóstico rápido de problemas comunes - Nexora App
# Resuelve problemas en minutos, no horas

param(
    [string]$BackendUrl = "https://nexora-app-production-3104.up.railway.app",
    [string]$FrontendUrl = "https://nexora-app.online",
    [switch]$Verbose
)

Write-Host "🔧 Diagnóstico Rápido - Nexora App" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$solutions = @()

# 1. Health Check Backend
Write-Host "1️⃣  Verificando Backend..." -ForegroundColor Yellow
Write-Host "    URL: $BackendUrl/health" -ForegroundColor Gray
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/health" -Method GET -TimeoutSec 10
    Write-Host "    ✅ Backend ONLINE - $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "    ❌ Backend NO responde" -ForegroundColor Red
    $issues += "Backend caído o URL incorrecta"
    $solutions += "Verificar Railway Dashboard → Services → Ver si está Online"
}
Write-Host ""

# 2. Test CORS Headers
Write-Host "2️⃣  Verificando CORS..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" `
        -Method GET `
        -Headers @{"Origin"=$FrontendUrl} `
        -UseBasicParsing
    
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    if ($corsHeader) {
        Write-Host "    ✅ CORS configurado: $corsHeader" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  CORS header no presente (puede ser OK para GET)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    ❌ Error conectando: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Test POST endpoint (simulado)
Write-Host "3️⃣  Verificando POST/OPTIONS..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/auth/login" `
        -Method OPTIONS `
        -Headers @{
            "Origin"=$FrontendUrl
            "Access-Control-Request-Method"="POST"
        } `
        -UseBasicParsing
    
    if ($response.StatusCode -eq 204) {
        Write-Host "    ✅ OPTIONS responde correctamente (204)" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  OPTIONS responde: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 405) {
        Write-Host "    ❌ ERROR 405: Backend no acepta OPTIONS" -ForegroundColor Red
        $issues += "Error 405 - Backend tiene código antiguo"
        $solutions += "Solución 1: Variable CORS_ORIGINS=* en Railway (30s)`nSolución 2: Verificar Railway tenga último commit"
    } else {
        Write-Host "    ⚠️  Error: $status (puede ser esperado sin auth)" -ForegroundColor Yellow
    }
}
Write-Host ""

# 4. Verificar URL en frontend (si existe)
Write-Host "4️⃣  Verificando configuración Frontend..." -ForegroundColor Yellow
$apiFile = "frontend/src/lib/api.ts"
if (Test-Path $apiFile) {
    $content = Get-Content $apiFile -Raw
    if ($content -match [regex]::Escape($BackendUrl)) {
        Write-Host "    ✅ Frontend apunta a URL correcta" -ForegroundColor Green
    } else {
        # Buscar qué URL tiene
        if ($content -match "API_URL.*=.*'(https?://[^']+)'") {
            $foundUrl = $Matches[1]
            Write-Host "    ❌ Frontend apunta a: $foundUrl" -ForegroundColor Red
            Write-Host "    Debería ser: $BackendUrl" -ForegroundColor Yellow
            $issues += "Frontend tiene URL incorrecta"
            $solutions += "Actualizar frontend/src/lib/api.ts con: export const API_URL = '$BackendUrl'"
        }
    }
} else {
    Write-Host "    ⚠️  No se encontró frontend/src/lib/api.ts" -ForegroundColor Yellow
}
Write-Host ""

# 5. Check Git vs Railway
Write-Host "5️⃣  Verificando sincronización Git-Railway..." -ForegroundColor Yellow
$gitCommit = git log --oneline -1 2>$null
if ($gitCommit) {
    Write-Host "    Git local: $gitCommit" -ForegroundColor Gray
    Write-Host "    ⚠️  Verificar en Railway Dashboard que el commit coincida" -ForegroundColor Yellow
    Write-Host "    Railway → Deployments → Último deploy → Ver commit hash" -ForegroundColor Gray
} else {
    Write-Host "    ⚠️  No es un repositorio git o no hay commits" -ForegroundColor Yellow
}
Write-Host ""

# RESUMEN
Write-Host "===================================" -ForegroundColor Cyan
if ($issues.Count -eq 0) {
    Write-Host "✅ TODO OK - No se detectaron problemas críticos" -ForegroundColor Green
    Write-Host ""
    Write-Host "Si persisten errores en el frontend:" -ForegroundColor Yellow
    Write-Host "  1. Limpiar caché del navegador (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "  2. Verificar consola del navegador (F12)" -ForegroundColor White
} else {
    Write-Host "❌ PROBLEMAS DETECTADOS: $($issues.Count)" -ForegroundColor Red
    Write-Host ""
    for ($i = 0; $i -lt $issues.Count; $i++) {
        Write-Host "$($i+1). $($issues[$i])" -ForegroundColor Red
        Write-Host "   Solución:" -ForegroundColor Yellow
        $solutions[$i] -split "`n" | ForEach-Object { 
            Write-Host "   - $_" -ForegroundColor White
        }
        Write-Host ""
    }
}

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Para más ayuda, ver SKILL.md de troubleshooting" -ForegroundColor Gray
