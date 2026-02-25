#!/usr/bin/env pwsh
# Crea una nueva entrada en SESIONES.md
# Uso: .agents/skills/nexora-session-tracker/scripts/new-session-entry.ps1 -Fecha "2026-02-25" -Resumen "Configuración CORS"

param(
    [string]$Fecha = (Get-Date -Format "yyyy-MM-dd"),
    [string]$Resumen = "",
    [string]$Estado = "En progreso",
    [switch]$Interactivo
)

$sesionesFile = "SESIONES.md"

# Crear archivo si no existe
if (-not (Test-Path $sesionesFile)) {
    @"
# Historial de Sesiones - Nexora App

Documento de seguimiento de sesiones de trabajo con Kimi.
Mantiene contexto, avances y tareas pendientes entre conversaciones.

---

"@ | Set-Content $sesionesFile -Encoding UTF8
    Write-Host "✅ Creado $sesionesFile" -ForegroundColor Green
}

if ($Interactivo) {
    Write-Host "📝 Nueva Entrada de Sesión" -ForegroundColor Cyan
    Write-Host "==========================" -ForegroundColor Cyan
    
    $Fecha = Read-Host "Fecha (YYYY-MM-DD) [$(Get-Date -Format "yyyy-MM-dd")]"
    if (-not $Fecha) { $Fecha = Get-Date -Format "yyyy-MM-dd" }
    
    $Resumen = Read-Host "Resumen breve de la sesión"
    
    Write-Host ""
    Write-Host "Estado de la sesión:" -ForegroundColor Yellow
    Write-Host "  1. ✅ Completada"
    Write-Host "  2. 🔄 En progreso"
    Write-Host "  3. 🔴 Bloqueada"
    $estadoOpcion = Read-Host "Selecciona (1-3) [2]"
    switch ($estadoOpcion) {
        "1" { $Estado = "Completada" }
        "3" { $Estado = "Bloqueada" }
        default { $Estado = "En progreso" }
    }
    
    Write-Host ""
    Write-Host "Avances (una línea por avance, línea vacía para terminar):" -ForegroundColor Yellow
    $avances = @()
    do {
        $linea = Read-Host "  -"
        if ($linea) { $avances += $linea }
    } while ($linea)
    
    Write-Host ""
    Write-Host "Problemas encontrados (una línea por problema, vacío para terminar):" -ForegroundColor Yellow
    $problemas = @()
    do {
        $linea = Read-Host "  -"
        if ($linea) { $problemas += $linea }
    } while ($linea)
    
    Write-Host ""
    Write-Host "Tareas para próxima sesión (una línea por tarea, vacío para terminar):" -ForegroundColor Yellow
    $tareas = @()
    do {
        $linea = Read-Host "  -"
        if ($linea) { $tareas += $linea }
    } while ($linea)
    
    # Generar contenido
    $nuevaEntrada = @"

## $Fecha - $Resumen
**Duración:** _pendiente_  
**Estado:** $Estado

### ✅ Avances
"@

    if ($avances.Count -gt 0) {
        foreach ($avance in $avances) {
            $nuevaEntrada += "`n- [x] $avance"
        }
    } else {
        $nuevaEntrada += "`n- [x] _Documentar avances_"
    }
    
    $nuevaEntrada += "`n`n### 🔴 Problemas Encontrados"
    if ($problemas.Count -gt 0) {
        foreach ($problema in $problemas) {
            $nuevaEntrada += "`n- $problema"
        }
    } else {
        $nuevaEntrada += "`n- Ninguno documentado"
    }
    
    $nuevaEntrada += "`n`n### 📋 Tareas Pendientes (Próxima Sesión)"
    if ($tareas.Count -gt 0) {
        foreach ($tarea in $tareas) {
            $nuevaEntrada += "`n- [ ] $tarea"
        }
    } else {
        $nuevaEntrada += "`n- [ ] _Definir próximas tareas_"
    }
    
    $nuevaEntrada += "`n`n---`n"
    
} else {
    # Modo no-interactivo: crear template
    $nuevaEntrada = @"

## $Fecha - $Resumen
**Duración:** _actualizar_  
**Estado:** $Estado

### ✅ Avances
- [x] 

### 🔴 Problemas Encontrados
- 

### 🎯 Decisiones
- 

### 📋 Tareas Pendientes (Próxima Sesión)
- [ ] 

### 🔗 Recursos
- 

---

"@
}

# Agregar al archivo
$nuevaEntrada | Add-Content $sesionesFile -Encoding UTF8

Write-Host ""
Write-Host "✅ Entrada agregada a $sesionesFile" -ForegroundColor Green
Write-Host "📄 Fecha: $Fecha" -ForegroundColor Cyan
Write-Host "📝 Resumen: $Resumen" -ForegroundColor Cyan

# Mostrar últimas 5 líneas
Write-Host ""
Write-Host "Última entrada:" -ForegroundColor Yellow
Get-Content $sesionesFile -Tail 15
