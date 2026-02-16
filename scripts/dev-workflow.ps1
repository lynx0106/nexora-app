# ============================================
# Script de Flujo de Trabajo de Desarrollo
# Nexora App - Tests + Commit + Push
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [switch]$SkipTests,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Colores para output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Header($text) {
    Write-Host "`n$Blue========================================$Reset"
    Write-Host "$Blue$text$Reset"
    Write-Host "$Blue========================================$Reset`n"
}

function Write-Success($text) {
    Write-Host "$Green✅ $text$Reset"
}

function Write-Error($text) {
    Write-Host "$Red❌ $text$Reset"
}

function Write-Warning($text) {
    Write-Host "$Yellow⚠️  $text$Reset"
}

# Obtener el directorio raíz del proyecto
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

Write-Header "FLUJO DE TRABAJO NEXORA APP"
Write-Host "Mensaje de commit: $Message"
Write-Host "Directorio: $ProjectRoot"

# ============================================
# PASO 1: Verificar cambios
# ============================================
Write-Header "PASO 1: Verificando cambios"

$gitStatus = git status --porcelain
if (-not $gitStatus) {
    Write-Warning "No hay cambios para commitear"
    exit 0
}

Write-Host "Archivos modificados:"
git status --short

# ============================================
# PASO 2: Ejecutar Tests (si no se salta)
# ============================================
if (-not $SkipTests) {
    Write-Header "PASO 2: Ejecutando Tests"
    
    # Tests del Backend
    Write-Host "`n📦 Tests del Backend..."
    Set-Location "$ProjectRoot\backend"
    
    try {
        $testOutput = npm test 2>&1
        $testExitCode = $LASTEXITCODE
        
        if ($testExitCode -eq 0) {
            Write-Success "Todos los tests del backend pasaron"
        } else {
            Write-Error "Algunos tests del backend fallaron"
            Write-Host "`nSalida de los tests:"
            Write-Host $testOutput
            
            if (-not $Force) {
                Write-Error "Flujo detenido. Usa -Force para ignorar o -SkipTests para saltar"
                exit 1
            } else {
                Write-Warning "Forzando commit a pesar de los tests fallidos"
            }
        }
    } catch {
        Write-Error "Error ejecutando tests: $_"
        if (-not $Force) {
            exit 1
        }
    }
    
    Set-Location $ProjectRoot
} else {
    Write-Warning "Tests saltados (-SkipTests)"
}

# ============================================
# PASO 3: Agregar archivos
# ============================================
Write-Header "PASO 3: Agregando archivos"

git add -A
Write-Success "Archivos agregados al staging area"

# ============================================
# PASO 4: Crear commit
# ============================================
Write-Header "PASO 4: Creando commit"

try {
    git commit -m "$Message"
    Write-Success "Commit creado exitosamente"
} catch {
    Write-Error "Error creando commit: $_"
    exit 1
}

# ============================================
# PASO 5: Push a origin
# ============================================
Write-Header "PASO 5: Subiendo cambios"

try {
    $currentBranch = git branch --show-current
    Write-Host "Subiendo a branch: $currentBranch"
    
    git push origin $currentBranch
    Write-Success "Cambios subidos exitosamente a origin/$currentBranch"
} catch {
    Write-Error "Error subiendo cambios: $_"
    exit 1
}

# ============================================
# RESUMEN
# ============================================
Write-Header "RESUMEN"
Write-Success "Flujo completado exitosamente!"
Write-Host "`n📊 Estadísticas:"
git log -1 --stat

Write-Host "`n🌐 URLs del proyecto:"
Write-Host "   Frontend: https://nexora-app.online"
Write-Host "   Backend:  https://nexora-app-production-3199.up.railway.app"
Write-Host "   Repo:     https://github.com/lynx0106/nexora-app"
