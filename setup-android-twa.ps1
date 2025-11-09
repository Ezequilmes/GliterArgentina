param(
  [string]$ManifestPath = "c:\Users\Admin\Documents\trae_projects\Gliter Argentina\public\manifest.json",
  [string]$ProjectDir = "twa",
  [string]$PackageId = "com.gliter.argentina",
  [string]$AppName = "Gliter Argentina",
  [string]$AppVersionName = "1.0.0",
  [int]$AppVersionCode = 1
)

Write-Host "Preparando entorno Android (TWA)" -ForegroundColor Cyan

function Test-Command {
  param([string]$cmd)
  $result = Get-Command $cmd -ErrorAction SilentlyContinue
  return $null -ne $result
}

function Ensure-NpmGlobal {
  param([string]$pkg, [string]$cmd)
  if (!(Test-Command $cmd)) {
    Write-Host "Instalando $pkg globalmente..." -ForegroundColor Yellow
    npm install -g $pkg
  }
}

# 1) Verificar Node y NPM
if (!(Test-Command node)) { Write-Error "Node.js no está instalado"; exit 1 }
if (!(Test-Command npm)) { Write-Error "npm no está instalado"; exit 1 }

# 2) Instalar Bubblewrap CLI
Ensure-NpmGlobal -pkg "@bubblewrap/cli" -cmd "bubblewrap"

# 3) Crear directorio destino
New-Item -ItemType Directory -Force -Path $ProjectDir | Out-Null

# 4) Inicializar proyecto TWA (no interactivo)
Write-Host "Inicializando proyecto TWA..." -ForegroundColor Green
pushd $ProjectDir
try {
  bubblewrap init --manifest "$ManifestPath" `
    --packageId "$PackageId" `
    --name "$AppName" `
    --appVersionName "$AppVersionName" `
    --appVersionCode $AppVersionCode `
    --use-browser "chrome" `
    --generator "trae"
} catch {
  Write-Warning "Fallo al inicializar TWA: $_"
}

# 5) Compilar APK si SDK/JDK están disponibles
if (Test-Command "gradlew") {
  Write-Host "Compilando APK (release)..." -ForegroundColor Green
  try {
    ./gradlew assembleRelease
    Write-Host "APK generado en app\\build\\outputs\\apk\\release" -ForegroundColor Green
  } catch {
    Write-Warning "Fallo al compilar APK: $_"
  }
} else {
  Write-Warning "Gradle no disponible. Abra el proyecto en Android Studio para compilar."
}

popd
Write-Host "Setup TWA finalizado." -ForegroundColor Cyan

