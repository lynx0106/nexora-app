#!/usr/bin/env pwsh
# Analiza el repositorio y sugiere archivos para limpieza

Write-Host "🧹 Análisis de Limpieza - Nexora App" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$sugerencias = @()
$paraEliminar = @()
$paraArchivar = @()

# 1. Analizar logs
Write-Host "📄 1. Analizando Logs..." -ForegroundColor Yellow
$logs = Get-ChildItem -Recurse -Filter "*.log" -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules" }

if ($logs) {
    $totalSize = ($logs | Measure-Object -Property Length -Sum).Sum / 1KB
    Write-Host "    Encontrados $($logs.Count) logs ($([math]::Round($totalSize, 2)) KB)" -ForegroundColor Gray
    
    foreach ($log in $logs | Select-Object -First 5) {
        $size = [math]::Round($log.Length / 1KB, 2)
        Write-Host "    - $($log.Name) (${size} KB)" -ForegroundColor Gray
        $paraEliminar += $log.FullName
    }
    
    if ($logs.Count -gt 5) {
        Write-Host "    ... y $($logs.Count - 5) más" -ForegroundColor Gray
    }
} else {
    Write-Host "    ✅ No se encontraron logs" -ForegroundColor Green
}
Write-Host ""

# 2. Analizar archivos Markdown
Write-Host "📑 2. Analizando Documentación Markdown..." -ForegroundColor Yellow
$mds = Get-ChildItem -Filter "*.md" | Where-Object { $_.Name -ne "README.md" -and $_.Name -ne "SESIONES.md" }

$potencialmenteObsoletos = @()
foreach ($md in $mds) {
    $diasDesdeModificacion = ((Get-Date) - $md.LastWriteTime).Days
    $content = Get-Content $md.FullName -Raw -ErrorAction SilentlyContinue
    
    # Heurísticas de obsolescencia
    $esObsoleto = $false
    $razon = ""
    
    if ($md.Name -match "DIAGNOSTICO_" -and $diasDesdeModificacion -gt 7) {
        $esObsoleto = $true
        $razon = "Diagnóstico antiguo (>$diasDesdeModificacion días)"
    }
    elseif ($md.Name -match "PLAN_.*" -and $content -match "✅.*100%") {
        $esObsoleto = $true
        $razon = "Plan completado al 100%"
    }
    elseif ($md.Name -match "CORS_FIX|TEMP_|BACKUP_") {
        $esObsoleto = $true
        $razon = "Archivo temporal o de backup"
    }
    elseif ($diasDesdeModificacion -gt 60) {
        $esObsoleto = $true
        $razon = "Sin modificaciones en 60+ días"
    }
    
    if ($esObsoleto) {
        $potencialmenteObsoletos += [PSCustomObject]@{
            Archivo = $md.Name
            Dias = $diasDesdeModificacion
            Razon = $razon
            Tamano = [math]::Round($md.Length / 1KB, 2)
        }
    }
}

if ($potencialmenteObsoletos.Count -gt 0) {
    Write-Host "    ⚠️  Documentos potencialmente obsoletos:" -ForegroundColor Yellow
    foreach ($doc in $potencialmenteObsoletos) {
        Write-Host "    - $($doc.Archivo) ($($doc.Dias) días)" -ForegroundColor Gray
        Write-Host "      Razón: $($doc.Razon)" -ForegroundColor DarkGray
        $paraArchivar += $doc.Archivo
    }
} else {
    Write-Host "    ✅ No se detectaron documentos obsoletos obvios" -ForegroundColor Green
}
Write-Host ""

# 3. Buscar archivos duplicados/similares
Write-Host "🔍 3. Buscando posibles duplicados..." -ForegroundColor Yellow
$temas = @{}
foreach ($md in $mds) {
    $tema = $md.Name -replace "^(.+?)(_.*)?$", '$1' -replace "\d{4}.*", '' -replace "-", "_"
    if ($temas.ContainsKey($tema)) {
        $temas[$tema] += $md.Name
    } else {
        $temas[$tema] = @($md.Name)
    }
}

$duplicados = $temas.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }
if ($duplicados) {
    Write-Host "    ⚠️  Posibles documentos sobre mismo tema:" -ForegroundColor Yellow
    foreach ($dup in $duplicados) {
        Write-Host "    - Tema '$($dup.Key)':" -ForegroundColor Gray
        $dup.Value | ForEach-Object { Write-Host "      * $_" -ForegroundColor DarkGray }
    }
} else {
    Write-Host "    ✅ No se detectaron duplicados obvios" -ForegroundColor Green
}
Write-Host ""

# 4. Archivos temporales
Write-Host "🗑️  4. Buscando archivos temporales..." -ForegroundColor Yellow
$tempPatterns = @("*.tmp", "*.temp", "*.bak", "*.backup", "*.old", "*.original", "npm-debug.log*", "yarn-debug.log*")
$temporales = @()

foreach ($pattern in $tempPatterns) {
    $found = Get-ChildItem -Recurse -Filter $pattern -ErrorAction SilentlyContinue | 
        Where-Object { $_.FullName -notmatch "node_modules" }
    $temporales += $found
}

if ($temporales.Count -gt 0) {
    Write-Host "    Encontrados $($temporales.Count) archivos temporales:" -ForegroundColor Gray
    $temporales | Select-Object -First 5 | ForEach-Object {
        Write-Host "    - $($_.Name)" -ForegroundColor Gray
        $paraEliminar += $_.FullName
    }
} else {
    Write-Host "    ✅ No se encontraron archivos temporales" -ForegroundColor Green
}
Write-Host ""

# 5. Tamaño de carpetas grandes
Write-Host "📊 5. Analizando tamaño de carpetas..." -ForegroundColor Yellow
$carpetas = @("backend", "frontend", "nexora-mobile", ".agents/skills")
foreach ($carpeta in $carpetas) {
    if (Test-Path $carpeta) {
        $size = (Get-ChildItem $carpeta -Recurse -File -ErrorAction SilentlyContinue | 
            Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "    $carpeta`: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
    }
}
Write-Host ""

# RESUMEN
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📋 RESUMEN DE LIMPIEZA" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if ($paraEliminar.Count -gt 0) {
    Write-Host "🗑️  SEGURO ELIMINAR ($($paraEliminar.Count) archivos):" -ForegroundColor Green
    $paraEliminar | Select-Object -First 10 | ForEach-Object {
        Write-Host "   - $_" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($paraArchivar.Count -gt 0) {
    Write-Host "📦 CONSIDERAR ARCHIVAR:" -ForegroundColor Yellow
    $paraArchivar | ForEach-Object {
        Write-Host "   - $_" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($paraEliminar.Count -eq 0 -and $paraArchivar.Count -eq 0) {
    Write-Host "✅ Repositorio está limpio" -ForegroundColor Green
} else {
    Write-Host "💡 COMANDOS SUGERIDOS:" -ForegroundColor Cyan
    if ($paraEliminar.Count -gt 0) {
        Write-Host "   # Eliminar logs seguros" -ForegroundColor Gray
        Write-Host "   .agents/skills/nexora-cleanup/scripts/limpiar-logs.ps1" -ForegroundColor White
    }
    if ($paraArchivar.Count -gt 0) {
        Write-Host "   # Archivar documentos obsoletos" -ForegroundColor Gray
        Write-Host "   .agents/skills/nexora-cleanup/scripts/archivar-obsoletos.ps1" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Para más detalles, revisar: SESIONES.md y documentación vigente" -ForegroundColor Gray
