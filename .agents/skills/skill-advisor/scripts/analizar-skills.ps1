#!/usr/bin/env pwsh
# Analiza las skills existentes y detecta gaps de cobertura

Write-Host "🔍 Análisis de Skills - Nexora App" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$skillsDir = ".agents/skills"
$sesionesFile = "SESIONES.md"

# 1. Listar skills existentes
Write-Host "📦 Skills Existentes:" -ForegroundColor Yellow
$skills = @()
if (Test-Path $skillsDir) {
    $skillDirs = Get-ChildItem $skillsDir -Directory
    foreach ($dir in $skillDirs) {
        $skillMd = Join-Path $dir.FullName "SKILL.md"
        if (Test-Path $skillMd) {
            $content = Get-Content $skillMd -Raw
            # Extraer nombre del frontmatter
            if ($content -match "^---\s*\n.*name:\s*(.+?)\n") {
                $name = $Matches[1].Trim()
            } else {
                $name = $dir.Name
            }
            # Extraer descripción
            if ($content -match "description:\s*(.+?)\n") {
                $desc = $Matches[1].Trim()
            } else {
                $desc = "Sin descripción"
            }
            
            $skills += [PSCustomObject]@{
                Name = $name
                Description = $desc
                Path = $dir.Name
            }
            
            Write-Host "  ✅ $name" -ForegroundColor Green
            Write-Host "     $desc" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

# 2. Analizar SESIONES.md para problemas recurrentes
Write-Host "📊 Análisis de Problemas Recurrentes:" -ForegroundColor Yellow
$problemasRecurrentes = @()

if (Test-Path $sesionesFile) {
    $contenido = Get-Content $sesionesFile -Raw
    
    # Buscar secciones de problemas
    $problemasMatches = [regex]::Matches($contenido, "### 🔴 Problemas Encontrados\s*\n(.*?)(?=### |---|\z)")
    
    $todosProblemas = @()
    foreach ($match in $problemasMatches) {
        $seccion = $match.Groups[1].Value
        # Extraer problemas individuales
        $lineas = $seccion -split "\n" | Where-Object { $_ -match "^- \*\*" -or $_ -match "^-\s+\w+" }
        foreach ($linea in $lineas) {
            $limpio = $linea -replace "^- \*\*", "" -replace "\*\*", "" -replace "^- ", "" -replace "^\s+", ""
            if ($limpio -and $limpio.Length -gt 5) {
                $todosProblemas += $limpio
            }
        }
    }
    
    # Buscar patrones repetidos
    $agrupados = $todosProblemas | Group-Object | Sort-Object Count -Descending | Select-Object -First 5
    
    if ($agrupados.Count -gt 0) {
        foreach ($grupo in $agrupados) {
            if ($grupo.Count -gt 1) {
                Write-Host "  ⚠️  '$($grupo.Name)' - aparece $($grupo.Count) veces" -ForegroundColor Yellow
                $problemasRecurrentes += $grupo.Name
            }
        }
    }
    
    if ($problemasRecurrentes.Count -eq 0) {
        Write-Host "  ✅ No se detectaron problemas recurrentes" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️  No existe $sesionesFile" -ForegroundColor Yellow
}

Write-Host ""

# 3. Detectar gaps de cobertura
Write-Host "🔎 Gaps de Cobertura Detectados:" -ForegroundColor Yellow

$areasComunes = @(
    @{ Nombre = "Desarrollo de código"; Skills = @("nexora-app"); Icono = "💻" },
    @{ Nombre = "Validación pre-commit"; Skills = @("nexora-validation"); Icono = "✅" },
    @{ Nombre = "Documentación de sesiones"; Skills = @("nexora-session-tracker"); Icono = "📝" },
    @{ Nombre = "Setup/onboarding"; Skills = @(); Icono = "🚀" },
    @{ Nombre = "Troubleshooting/debugging"; Skills = @(); Icono = "🐛" },
    @{ Nombre = "Backup y recuperación"; Skills = @(); Icono = "💾" },
    @{ Nombre = "Migraciones de BD"; Skills = @(); Icono = "🗄️" },
    @{ Nombre = "Seguridad y auditoría"; Skills = @(); Icono = "🔒" },
    @{ Nombre = "Performance/optimización"; Skills = @(); Icono = "⚡" }
)

foreach ($area in $areasComunes) {
    $cubierto = $false
    foreach ($skillReq in $area.Skills) {
        if ($skills.Name -contains $skillReq) {
            $cubierto = $true
            break
        }
    }
    
    if ($cubierto) {
        Write-Host "  $($area.Icono) $($area.Nombre): " -NoNewline
        Write-Host "✅ Cubierto" -ForegroundColor Green
    } else {
        Write-Host "  $($area.Icono) $($area.Nombre): " -NoNewline
        Write-Host "❌ No cubierto (potencial skill)" -ForegroundColor Red
    }
}

Write-Host ""

# 4. Recomendaciones
Write-Host "💡 Recomendaciones:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Recomendación basada en problemas recurrentes
if ($problemasRecurrentes.Count -gt 0) {
    Write-Host "🎯 Basado en problemas recurrentes:" -ForegroundColor Yellow
    foreach ($problema in $problemasRecurrentes) {
        Write-Host "  - Considerar agregar prevención de: '$problema'" -ForegroundColor White
    }
    Write-Host ""
}

# Recomendaciones de gaps
Write-Host "🆕 Skills potenciales a crear:" -ForegroundColor Yellow
Write-Host "  1. 'nexora-setup' - Para automatizar setup de nuevos tenants/developers" -ForegroundColor White
Write-Host "  2. 'nexora-troubleshooting' - Guías de debug por tipo de error" -ForegroundColor White
Write-Host "  3. 'nexora-security' - Checklist y auditoría de seguridad" -ForegroundColor White
Write-Host ""

# Mejoras a skills existentes
Write-Host "🔧 Mejoras a skills existentes:" -ForegroundColor Yellow
Write-Host "  - 'nexora-validation': Agregar validación de CORS" -ForegroundColor White
Write-Host "  - 'nexora-session-tracker': Agregar análisis de tiempo entre sesiones" -ForegroundColor White
Write-Host ""

Write-Host "Para crear una nueva skill, consulta: .agents/skills/skill-creator/SKILL.md" -ForegroundColor Gray
