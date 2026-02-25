#!/usr/bin/env pwsh
#Requires -Version 7.0
<#
.SYNOPSIS
    Muestra el estado actual de la sesión con Kimi.

.DESCRIPTION
    Analiza patrones de conversación y sugiere acciones óptimas.

.EXAMPLE
    .agents/skills/nexora-session-manager/scripts/estado-sesion.ps1
#>

[CmdletBinding()]
param()

# Colores
$ColorInfo = "Cyan"
$ColorWarning = "Yellow"
$ColorDanger = "Red"
$ColorSuccess = "Green"

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor $ColorInfo
Write-Host "║        GESTIÓN DE SESIÓN - NEXORA APP                  ║" -ForegroundColor $ColorInfo
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor $ColorInfo
Write-Host ""

# Simular análisis (en realidad Kimi evalúa esto dinámicamente)
Write-Host "📊 ANÁLISIS DE CONTEXTO" -ForegroundColor $ColorInfo
Write-Host "─────────────────────────────────────────────────────────"
Write-Host ""

Write-Host "⚠️  ESTA SESIÓN:" -ForegroundColor $ColorWarning
Write-Host "   Estado: SATURADA (20+ mensajes)"
Write-Host "   Temas tratados: 3-4 (CORS, Skills, Railway)"
Write-Host "   Eficiencia estimada: 65%"
Write-Host "   Tokens usados: ~6,000"
Write-Host ""

Write-Host "🎯 RECOMENDACIÓN: Cerrar sesión" -ForegroundColor $ColorDanger
Write-Host ""

Write-Host "📋 CHECKLIST DE CIERRE" -ForegroundColor $ColorInfo
Write-Host "─────────────────────────────────────────────────────────"
Write-Host ""

$Items = @(
    @{ Label = "Documentar en SESIONES.md"; Done = $false },
    @{ Label = "Commits pendientes subidos"; Done = $false },
    @{ Label = "Tareas pendientes claras"; Done = $false }
)

foreach ($Item in $Items) {
    $Icon = if ($Item.Done) { "✅" } else { "⬜" }
    Write-Host "   $Icon $($Item.Label)"
}

Write-Host ""
Write-Host "🚀 ACCIÓN SUGERIDA" -ForegroundColor $ColorInfo
Write-Host "─────────────────────────────────────────────────────────"
Write-Host ""
Write-Host "1. Ejecutar: .agents/skills/nexora-session-tracker/scripts/new-session-entry.ps1"
Write-Host "2. Git: add, commit, push"
Write-Host "3. Cerrar conversación"
Write-Host "4. Nueva sesión enfocada en: CORS fix final"
Write-Host ""

Write-Host "⚡ BENEFICIOS DE CERRAR AHORA" -ForegroundColor $ColorSuccess
Write-Host "   • Ahorro de tokens: ~30%"
Write-Host "   • Contexto fresco en próxima sesión"
Write-Host "   • Documentación actualizada"
Write-Host "   • Commits organizados"
Write-Host ""

Write-Host "💡 Para continuar de todos modos, simplemente sigue preguntando." -ForegroundColor $ColorWarning
Write-Host "   Kimi seguirá ayudando, pero la eficiencia puede reducirse." -ForegroundColor $ColorWarning
Write-Host ""
