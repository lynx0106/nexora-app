# Ejecutar cuando el build EAS termine (Status: finished)
# Uso: .\scripts\post-build-apk.ps1 -BuildId c1dd4716-1ffc-4359-88a6-1448b743d112
param(
    [Parameter(Mandatory=$true)]
    [string]$BuildId
)

$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

Write-Host "Verificando build $BuildId..."
$view = npx eas build:view $BuildId 2>&1 | Out-String
if ($view -match "Status\s+finished") {
    # Extraer artifact URL si aparece
    if ($view -match "Build Artifacts URL\s+(\S+)") {
        $artifactUrl = $matches[1]
        Write-Host "Descargando desde $artifactUrl"
        & "$PSScriptRoot\download-apk.ps1" -ArtifactUrl $artifactUrl
    } else {
        Write-Host "Obtén la URL del APK desde: https://expo.dev/accounts/lynx0106/projects/nexora-mobile/builds/$BuildId"
        Write-Host "Luego: .\scripts\download-apk.ps1 -ArtifactUrl <URL>"
    }
} else {
    Write-Host "Build aún no terminado. Estado actual:"
    npx eas build:view $BuildId
}
