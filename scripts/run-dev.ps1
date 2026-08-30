# Run dev server when "npm" is not on PATH (Node not installed or PATH not refreshed).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/run-dev.ps1
$ErrorActionPreference = 'Stop'

function Find-NpmCmd {
  $candidates = @(
    (Join-Path $env:ProgramFiles 'nodejs\npm.cmd'),
    (Join-Path ${env:ProgramFiles(x86)} 'nodejs\npm.cmd')
  )
  foreach ($p in $candidates) {
    if (Test-Path -LiteralPath $p) { return $p }
  }
  $cmd = Get-Command npm -ErrorAction SilentlyContinue
  if ($cmd -and $cmd.Source) { return $cmd.Source }
  return $null
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $repoRoot

$npm = Find-NpmCmd
if (-not $npm) {
  Write-Host ''
  Write-Host '未找到 npm：本机未安装 Node.js，或安装后未加入 PATH。' -ForegroundColor Yellow
  Write-Host ''
  Write-Host '请任选一种方式修复后，关闭并重新打开 PowerShell，再执行本脚本：' -ForegroundColor Cyan
  Write-Host '  1) 打开 https://nodejs.org/zh-cn 下载 LTS 安装包，安装时勾选 “Add to PATH”。' -ForegroundColor White
  Write-Host '  2) 管理员 PowerShell 执行：winget install OpenJS.NodeJS.LTS' -ForegroundColor White
  Write-Host ''
  exit 1
}

Write-Host "Using npm: $npm" -ForegroundColor DarkGray
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'node_modules'))) {
  Write-Host 'Running npm install ...' -ForegroundColor Cyan
  & $npm install
}

Write-Host 'Starting dev server ...' -ForegroundColor Cyan
& $npm run dev
