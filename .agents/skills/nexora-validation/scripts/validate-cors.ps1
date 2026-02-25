#!/usr/bin/env pwsh
# Valida configuración CORS entre backend y frontend
# Uso: .

param(
    [string]$BackendUrl = $env:NEXT_PUBLIC_API_URL,
    [string]$FrontendUrl = "https://nexora-app.online"
)

if (-not $BackendUrl) {
    # Intentar leer de frontend
    $apiFile = "frontend/src/lib/api.ts"
    if (Test-Path $apiFile) {
        $content = Get-Content $apiFile -Raw
        if ($content -match "API_URL.*=.*'(https?://[^']+)'") {
            $BackendUrl = $Matches[1]
        }
    }
    
    if (-not $BackendUrl) {
        $BackendUrl = "https://nexora-app-production-3104.up.railway.app"
    }
}

Write-Host "🔒 Validación CORS - Nexora App" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: $BackendUrl" -ForegroundColor Gray
Write-Host "Frontend: $FrontendUrl" -ForegroundColor Gray
Write-Host ""

$errors = @()
$warnings = @()

# 1. Verificar que backend responde
Write-Host "1️⃣  Probando conexión a backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/health" -Method GET -TimeoutSec 10
    Write-Host "    ✅ Backend responde: $($health.status)" -ForegroundColor Green
} catch {
    $errors += "Backend no responde en $BackendUrl"
    Write-Host "    ❌ Backend NO responde" -ForegroundColor Red
}
Write-Host ""

# 2. Verificar CORS headers en GET
Write-Host "2️⃣  Verificando headers CORS (GET)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" `
        -Method GET `
        -Headers @{"Origin"=$FrontendUrl} `
        -UseBasicParsing
    
    $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
    $corsCreds = $response.Headers['Access-Control-Allow-Credentials']
    
    if ($corsOrigin) {
        Write-Host "    ✅ Access-Control-Allow-Origin: $corsOrigin" -ForegroundColor Green
    } else {
        $warnings += "Falta header Access-Control-Allow-Origin"
        Write-Host "    ⚠️  Falta Access-Control-Allow-Origin" -ForegroundColor Yellow
    }
    
    if ($corsCreds -eq "true") {
        Write-Host "    ✅ Access-Control-Allow-Credentials: true" -ForegroundColor Green
    } else {
        $warnings += "Falta o incorrecto Access-Control-Allow-Credentials"
        Write-Host "    ⚠️  Falta Access-Control-Allow-Credentials" -ForegroundColor Yellow
    }
} catch {
    $errors += "Error verificando CORS: $($_.Exception.Message)"
    Write-Host "    ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar OPTIONS (preflight)
Write-Host "3️⃣  Verificando OPTIONS (preflight)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/auth/login" `
        -Method OPTIONS `
        -Headers @{
            "Origin"=$FrontendUrl
            "Access-Control-Request-Method"="POST"
            "Access-Control-Request-Headers"="Content-Type"
        } `
        -UseBasicParsing
    
    if ($response.StatusCode -eq 204) {
        Write-Host "    ✅ OPTIONS responde 204 (correcto)" -ForegroundColor Green
        
        $allowOrigin = $response.Headers['Access-Control-Allow-Origin']
        $allowMethods = $response.Headers['Access-Control-Allow-Methods']
        $allowHeaders = $response.Headers['Access-Control-Allow-Headers']
        
        if ($allowOrigin) {
            Write-Host "    ✅ Allow-Origin: $allowOrigin" -ForegroundColor Green
        }
        if ($allowMethods -match "POST") {
            Write-Host "    ✅ Allow-Methods incluye POST" -ForegroundColor Green
        }
    } else {
        $warnings += "OPTIONS responde $($response.StatusCode) en lugar de 204"
        Write-Host "    ⚠️  OPTIONS responde: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 405) {
        $errors += "ERROR 405: Backend no acepta OPTIONS. El código no está actualizado en Railway."
        Write-Host "    ❌ ERROR 405: Backend no acepta OPTIONS" -ForegroundColor Red
        Write-Host "    💡 El código en Railway está desactualizado" -ForegroundColor Cyan
    } else {
        $warnings += "OPTIONS falló con status $status"
        Write-Host "    ⚠️  OPTIONS falló: $status" -ForegroundColor Yellow
    }
}
Write-Host ""

# 4. Verificar configuración en código (local)
Write-Host "4️⃣  Verificando configuración local..." -ForegroundColor Yellow
$runtimeConfig = "backend/src/config/runtime.config.ts"
if (Test-Path $runtimeConfig) {
    $content = Get-Content $runtimeConfig -Raw
    
    if ($content -match [regex]::Escape($FrontendUrl)) {
        Write-Host "    ✅ Código tiene URL del frontend configurada" -ForegroundColor Green
    } else {
        $errors += "backend/src/config/runtime.config.ts no incluye $FrontendUrl"
        Write-Host "    ❌ Código NO tiene URL del frontend" -ForegroundColor Red
    }
    
    if ($content -match [regex]::Escape($BackendUrl)) {
        Write-Host "    ✅ CORS incluye URL del backend" -ForegroundColor Green
    } else {
        $warnings += "CORS no incluye URL del backend (puede ser necesario para desarrollo)"
        Write-Host "    ⚠️  CORS no incluye URL del backend" -ForegroundColor Yellow
    }
} else {
    Write-Host "    ⚠️  No se encontró $runtimeConfig" -ForegroundColor Yellow
}
Write-Host ""

# RESUMEN
Write-Host "================================" -ForegroundColor Cyan
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ CORS CONFIGURADO CORRECTAMENTE" -ForegroundColor Green
} elseif ($errors.Count -eq 0) {
    Write-Host "⚠️  CORS FUNCIONAL (con advertencias)" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
} else {
    Write-Host "❌ CORS TIENE PROBLEMAS CRÍTICOS" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "SOLUCIONES:" -ForegroundColor Cyan
    Write-Host "  1. Verificar Railway Dashboard → Variables → CORS_ORIGINS" -ForegroundColor White
    Write-Host "  2. Asegurar que Railway tiene el último commit de GitHub" -ForegroundColor White
    Write-Host "  3. Si persiste error 405, el código no está actualizado en Railway" -ForegroundColor White
}
Write-Host "================================" -ForegroundColor Cyan
