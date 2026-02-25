#!/usr/bin/env pwsh
# Muestra el resumen de la última sesión desde SESIONES.md

$sesionesFile = "SESIONES.md"

if (-not (Test-Path $sesionesFile)) {
    Write-Host "⚠️  No existe $sesionesFile" -ForegroundColor Yellow
    Write-Host "Crea el archivo con:" -ForegroundColor Yellow
    Write-Host "  .agents/skills/nexora-session-tracker/scripts/new-session-entry.ps1 -Interactivo" -ForegroundColor Gray
    exit 1
}

Write-Host "📖 Última Sesión Registrada" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Leer contenido
$contenido = Get-Content $sesionesFile -Raw

# Encontrar última entrada (entre ## y --- o fin de archivo)
$pattern = "## (?<fecha>\d{4}-\d{2}-\d{2}) - (?<titulo>.*?)(?=\n\*\*|$)(?<body>[\s\S]*?)(?=\n## |\z)"
$matches = [regex]::Matches($contenido, $pattern)

if ($matches.Count -eq 0) {
    Write-Host "No se encontraron entradas de sesión." -ForegroundColor Yellow
    exit 1
}

$ultima = $matches[$matches.Count - 1]
$fecha = $ultima.Groups["fecha"].Value
$titulo = $ultima.Groups["titulo"].Value.Trim()
$body = $ultima.Groups["body"].Value.Trim()

Write-Host "📅 Fecha: $fecha" -ForegroundColor Green
Write-Host "📝 Título: $titulo" -ForegroundColor Green
Write-Host ""

# Extraer estado
if ($body -match "\*\*Estado:\*\* (.+)") {
    $estado = $matches[1]
    $color = switch -Regex ($estado) {
        "Completada|Listo|✅" { "Green" }
        "Bloqueada|Error|🔴" { "Red" }
        default { "Yellow" }
    }
    Write-Host "🎯 Estado: $estado" -ForegroundColor $color
    Write-Host ""
}

# Extraer tareas pendientes
if ($body -match "### 📋 Tareas Pendientes[\s\S]*?(?=### |---|\z)") {
    $seccionTareas = $matches[0]
    $tareasPendientes = [regex]::Matches($seccionTareas, "- \[ \] (.+)")
    
    if ($tareasPendientes.Count -gt 0) {
        Write-Host "📋 Tareas para la Próxima Sesión:" -ForegroundColor Cyan
        foreach ($tarea in $tareasPendientes) {
            Write-Host "  - $($tarea.Groups[1].Value)" -ForegroundColor White
        }
    }
}

Write-Host ""
Write-Host "Para ver el historial completo: cat SESIONES.md" -ForegroundColor Gray
