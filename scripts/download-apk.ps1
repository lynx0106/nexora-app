# Descarga el APK de EAS y lo coloca en frontend/public/
# Uso: .\scripts\download-apk.ps1 -ArtifactUrl "https://expo.dev/artifacts/eas/xxx.apk"
param(
    [Parameter(Mandatory=$true)]
    [string]$ArtifactUrl
)

$outPath = Join-Path $PSScriptRoot "..\frontend\public\nexora-mobile.apk"
$frontendPublic = Join-Path $PSScriptRoot "..\frontend\public"
if (-not (Test-Path $frontendPublic)) { New-Item -ItemType Directory -Path $frontendPublic -Force }

Write-Host "Descargando APK desde $ArtifactUrl ..."
Invoke-WebRequest -Uri $ArtifactUrl -OutFile $outPath -UseBasicParsing
Write-Host "APK guardado en $outPath"
Write-Host "Siguiente: git add frontend/public/nexora-mobile.apk && git commit -m 'chore: add APK' && git push"
