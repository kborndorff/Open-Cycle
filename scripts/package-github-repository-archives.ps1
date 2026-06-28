param(
  [switch]$SkipBundleValidation
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$OutputRoot = Join-Path $Root "dist\github-repositories"
$ReportPath = Join-Path $Root "reports\github-repository-archives.json"
$Bundles = @(
  @{
    Id = "proofProduct"
    DirectoryName = "Open-Cycle"
    ArchiveName = "Open-Cycle.zip"
    Repository = "https://github.com/kborndorff/Open-Cycle"
  },
  @{
    Id = "fullSource"
    DirectoryName = "open-cycle-source"
    ArchiveName = "open-cycle-source.zip"
    Repository = "https://github.com/kborndorff/open-cycle-source"
  }
)

function Get-FileSha256($Path) {
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

if (-not (Test-Path -LiteralPath $OutputRoot)) {
  throw "Missing GitHub repository staging directory: $OutputRoot. Run npm run generate:github-repository-bundles first."
}

if (-not $SkipBundleValidation) {
  Push-Location $Root
  try {
    npm.cmd run validate:github-repository-bundles
  } finally {
    Pop-Location
  }
}

$archiveReports = @()

foreach ($Bundle in $Bundles) {
  $BundleDir = Join-Path $OutputRoot $Bundle.DirectoryName
  $ArchivePath = Join-Path $OutputRoot $Bundle.ArchiveName

  if (-not (Test-Path -LiteralPath $BundleDir)) {
    throw "Missing GitHub repository staging bundle: $BundleDir"
  }

  Remove-Item -LiteralPath $ArchivePath -Force -ErrorAction SilentlyContinue
  Compress-Archive -Path (Join-Path $BundleDir "*") -DestinationPath $ArchivePath -CompressionLevel Optimal -Force

  $ArchiveItem = Get-Item -LiteralPath $ArchivePath
  $archiveReports += [ordered]@{
    id = $Bundle.Id
    repository = $Bundle.Repository
    directory = ("dist/github-repositories/{0}" -f $Bundle.DirectoryName)
    archive = ("dist/github-repositories/{0}" -f $Bundle.ArchiveName)
    bytes = $ArchiveItem.Length
    sha256 = Get-FileSha256 $ArchivePath
    privateMaterialIncluded = $false
    signedAabIncluded = $false
  }
}

$Report = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  status = "pass"
  outputRoot = "dist/github-repositories"
  privateMaterialIncluded = $false
  signedAabIncluded = $false
  archives = $archiveReports
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$Report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ReportPath -Encoding UTF8

Write-Host "GitHub repository upload archives written to $OutputRoot"
foreach ($Archive in $archiveReports) {
  Write-Host ("{0}: {1} ({2} bytes, sha256 {3})" -f $Archive.id, $Archive.archive, $Archive.bytes, $Archive.sha256)
}
Write-Host "Report written to $ReportPath"
