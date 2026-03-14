# Actualiza el APK en la landing (frontend/public + commit)
# Ejecutar cuando el build preview EAS termine (Status: finished)
# Uso: .\scripts\actualizar-apk-landing.ps1 [-BuildId "cb00afa2-..."]
param(
    [string]$BuildId
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

# Si no se pasó BuildId, obtener el último preview finished
if (-not $BuildId) {
    Write-Host "Obteniendo último build preview..."
    $list = npx eas build:list --platform android --profile preview --limit 5 2>&1 | Out-String
    if ($list -match "Status\s+finished") {
        if ($list -match "ID\s+([a-f0-9\-]+)") {
            $BuildId = $matches[1].Trim()
            Write-Host "Usando build: $BuildId"
        }
    }
}

if (-not $BuildId) {
    Write-Host "Ejecuta: .\scripts\actualizar-apk-landing.ps1 -BuildId <ID>"
    Write-Host "ID del build en: https://expo.dev/accounts/lynx0106/projects/nexora-mobile/builds"
    exit 1
}

Write-Host "Verificando build $BuildId..."
$view = npx eas build:view $BuildId 2>&1 | Out-String

if ($view -notmatch "Status\s+finished") {
    Write-Host "Build aun no terminado. Espera y vuelve a ejecutar."
    npx eas build:view $BuildId
    exit 1
}

# Extraer Application Archive URL (formato: https://expo.dev/artifacts/eas/XXX.apk)
$artifactUrl = $null
if ($view -match "Application Archive URL\s+(\S+)") {
    $artifactUrl = $matches[1].Trim()
}
if ($view -match "Build Artifacts URL\s+(\S+)" -and $matches[1] -notmatch "<in progress>") {
    $artifactUrl = $matches[1].Trim()
}

if (-not $artifactUrl -or $artifactUrl -match "<in progress>") {
    Write-Host "No se pudo obtener la URL. Copiala manualmente de:"
    Write-Host "https://expo.dev/accounts/lynx0106/projects/nexora-mobile/builds/$BuildId"
    Write-Host ""
    Write-Host "Luego: .\scripts\download-apk.ps1 -ArtifactUrl ""<URL>"""
    exit 1
}

Write-Host "Descargando APK desde $artifactUrl ..."
& "$PSScriptRoot\download-apk.ps1" -ArtifactUrl $artifactUrl

Write-Host ""
Write-Host "=== Siguiente paso ==="
Write-Host "git add frontend/public/nexora-mobile.apk frontend/src/components/landing/LandingAppMobile.tsx"
Write-Host "git commit -m 'chore: actualizar APK landing'"
Write-Host "git push"
