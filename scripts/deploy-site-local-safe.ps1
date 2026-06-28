param(
  [switch]$UseNpx,
  [switch]$DryRun,
  [string]$ProjectName = "open-cycle-site"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Command {
  param([string]$Name)

  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "site\dist"

Write-Host "OpenCycle safe local Cloudflare Pages deploy"
Write-Host ""
Write-Host "This helper does not read, print, or store Cloudflare tokens, account IDs, GitHub tokens, Play Console credentials, keystore passwords, or signing keys."
Write-Host ""

if (!(Test-Path $dist)) {
  throw "Missing site/dist. Run npm run build:site before deploying."
}

if ($UseNpx) {
  if (!(Test-Command "npx")) {
    throw "npx was not found on PATH. Install Node/npm or run npm run owner-tools:wrangler-help."
  }
} elseif (!(Test-Command "wrangler")) {
  throw "wrangler was not found on PATH. Use npm run deploy:site:local:safe:npx or run npm run owner-tools:wrangler-help."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stageParent = Join-Path ([System.IO.Path]::GetTempPath()) "open-cycle-pages-deploy"
$stage = Join-Path $stageParent "site-dist-$timestamp"

New-Item -ItemType Directory -Force -Path $stage | Out-Null
Copy-Item -Path (Join-Path $dist "*") -Destination $stage -Recurse -Force

Write-Host "Staged Cloudflare Pages assets:"
Write-Host $stage
Write-Host ""
Write-Host "Project:"
Write-Host $ProjectName
Write-Host ""

$wranglerArgs = @("pages", "deploy", $stage, "--project-name", $ProjectName, "--commit-dirty=true")

if ($DryRun) {
  if ($UseNpx) {
    Write-Host "Dry run only. Would run:"
    Write-Host "npx wrangler $($wranglerArgs -join ' ')"
  } else {
    Write-Host "Dry run only. Would run:"
    Write-Host "wrangler $($wranglerArgs -join ' ')"
  }
  exit 0
}

if ($UseNpx) {
  & npx wrangler @wranglerArgs
} else {
  & wrangler @wranglerArgs
}
if ($LASTEXITCODE -ne 0) {
  throw "Wrangler Pages deploy failed with code $LASTEXITCODE."
}
