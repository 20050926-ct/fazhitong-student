# Auto-export WebGL to public/court-3d via Unity batchmode (needs Unity Hub 2022.3.x or UNITY_EDITOR).
# Optional: $env:UNITY_EDITOR = 'C:\...\Unity.exe'
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$desktop = (Resolve-Path (Join-Path $repoRoot '..')).Path
$d3 = Join-Path $desktop '3D'
$marker = Join-Path 'Assets' 'Editor\CourtWebGLDeploy.cs'
$unityProject = Get-ChildItem $d3 -Directory -ErrorAction SilentlyContinue |
  Where-Object { Test-Path (Join-Path $_.FullName $marker) } |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $unityProject) {
  Write-Error "Unity project not found: expected Desktop/3D/*/Assets/Editor/CourtWebGLDeploy.cs"
  exit 1
}

$unityExe = $env:UNITY_EDITOR
if (-not $unityExe -or -not (Test-Path $unityExe)) {
  $hub = Join-Path $env:ProgramFiles 'Unity\Hub\Editor'
  if (-not (Test-Path $hub)) {
    $hub = Join-Path "${env:ProgramFiles(x86)}" 'Unity\Hub\Editor'
  }
  if (-not (Test-Path $hub)) {
    Write-Error "Unity not found. Install Unity Hub + editor 2022.3.x, or set UNITY_EDITOR to Unity.exe. Or use Unity menu item CourtWebGLDeploy."
    exit 1
  }
  $dir = Get-ChildItem $hub -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^2022\.3' } |
    Sort-Object Name -Descending |
    Select-Object -First 1
  if (-not $dir) {
    Write-Error "No Unity 2022.3.x under $hub. Install one or set UNITY_EDITOR."
    exit 1
  }
  $unityExe = Join-Path $dir.FullName 'Editor\Unity.exe'
}

if (-not (Test-Path $unityExe)) {
  Write-Error "Unity.exe missing: $unityExe"
  exit 1
}

Write-Host "Unity: $unityExe"
Write-Host "Project: $unityProject"

$p = Start-Process -FilePath $unityExe -ArgumentList @(
  '-batchmode',
  '-nographics',
  '-quit',
  '-projectPath', $unityProject,
  '-executeMethod', 'CourtWebGLDeploy.PerformBuild'
) -Wait -PassThru

if ($p.ExitCode -ne 0) {
  Write-Error "Unity exited with $($p.ExitCode). Check Editor.log or Unity Console."
  exit $p.ExitCode
}

$out = Join-Path $repoRoot 'public\court-3d\index.html'
if (-not (Test-Path $out)) {
  Write-Warning "public/court-3d/index.html missing; build may have failed."
  exit 1
}

$patchIndex = Join-Path $repoRoot 'scripts\patch-court-3d-index.cjs'
$patchFw = Join-Path $repoRoot 'scripts\patch-court-3d-framework-orientation.cjs'
if (Test-Path $patchIndex) {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    & node $patchIndex
    if (Test-Path $patchFw) {
      & node $patchFw
    }
  } else {
    Write-Warning "node not in PATH; run manually: npm run patch:court-3d"
  }
}

Write-Host "OK: $(Join-Path $repoRoot 'public\court-3d')"
