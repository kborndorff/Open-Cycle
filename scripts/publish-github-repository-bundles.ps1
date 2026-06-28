param(
  [switch]$Apply,
  [switch]$UseArchives,
  [switch]$ForceWithLease,
  [string]$Branch = "main",
  [string]$ProofRepo = "https://github.com/kborndorff/Open-Cycle.git",
  [string]$SourceRepo = "https://github.com/kborndorff/open-cycle-source.git",
  [string]$CommitMessage = "Publish open-cycle release materials",
  [string]$GitUserName = "OpenCycle Release Publisher",
  [string]$GitUserEmail = "kborndorff@users.noreply.github.com"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$OutputRoot = Join-Path $Root "dist\github-repositories"
$WorkRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("open-cycle-github-publish-" + [guid]::NewGuid().ToString("N"))
$Bundles = @(
  @{
    Id = "proofProduct"
    SourceDirectory = Join-Path $OutputRoot "Open-Cycle"
    Archive = Join-Path $OutputRoot "Open-Cycle.zip"
    Repo = $ProofRepo
  },
  @{
    Id = "fullSource"
    SourceDirectory = Join-Path $OutputRoot "open-cycle-source"
    Archive = Join-Path $OutputRoot "open-cycle-source.zip"
    Repo = $SourceRepo
  }
)

function Invoke-CheckedCommand($FilePath, $Arguments, $WorkingDirectory) {
  Write-Host ("> {0} {1}" -f $FilePath, ($Arguments -join " "))
  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$FilePath failed with code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
}

function Copy-BundleToWorktree($Bundle, $Destination) {
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  if ($UseArchives) {
    if (-not (Test-Path -LiteralPath $Bundle.Archive)) {
      throw "Missing archive for $($Bundle.Id): $($Bundle.Archive)"
    }
    Expand-Archive -LiteralPath $Bundle.Archive -DestinationPath $Destination -Force
    return
  }

  if (-not (Test-Path -LiteralPath $Bundle.SourceDirectory)) {
    throw "Missing bundle directory for $($Bundle.Id): $($Bundle.SourceDirectory)"
  }
  Get-ChildItem -LiteralPath $Bundle.SourceDirectory -Force | Copy-Item -Destination $Destination -Recurse -Force
}

function Publish-Bundle($Bundle) {
  $Destination = Join-Path $WorkRoot $Bundle.Id
  Copy-BundleToWorktree $Bundle $Destination

  Write-Host ""
  Write-Host ("Bundle: {0}" -f $Bundle.Id)
  Write-Host ("Repository: {0}" -f $Bundle.Repo)
  Write-Host ("Worktree: {0}" -f $Destination)

  $pushArgs = @("push", "-u", "origin", $Branch)
  if ($ForceWithLease) {
    $pushArgs += "--force-with-lease"
  }

  if (-not $Apply) {
    Write-Host "Dry run only. To publish, rerun with -Apply after owner approval."
    Write-Host "Planned commands:"
    Write-Host "git init -b $Branch"
    Write-Host "git config user.name `"$GitUserName`""
    Write-Host "git config user.email `"$GitUserEmail`""
    Write-Host "git add -A"
    Write-Host "git commit -m `"$CommitMessage`""
    Write-Host "git remote add origin $($Bundle.Repo)"
    if ($ForceWithLease) {
      Write-Host "git fetch origin $Branch"
    }
    Write-Host "git push command:"
    Write-Host ("git {0}" -f ($pushArgs -join " "))
    return
  }

  Invoke-CheckedCommand "git" @("init", "-b", $Branch) $Destination
  Invoke-CheckedCommand "git" @("config", "user.name", $GitUserName) $Destination
  Invoke-CheckedCommand "git" @("config", "user.email", $GitUserEmail) $Destination
  Invoke-CheckedCommand "git" @("add", "-A") $Destination
  Invoke-CheckedCommand "git" @("commit", "-m", $CommitMessage) $Destination
  Invoke-CheckedCommand "git" @("remote", "add", "origin", $Bundle.Repo) $Destination
  if ($ForceWithLease) {
    Invoke-CheckedCommand "git" @("fetch", "origin", $Branch) $Destination
  }
  Invoke-CheckedCommand "git" $pushArgs $Destination
}

Write-Host "OpenCycle GitHub bundle publisher"
Write-Host "This helper publishes already validated public-safe GitHub bundles only when -Apply is supplied."
Write-Host "It does not read, print, or store GitHub tokens, Cloudflare tokens, signing keys, or Play credentials."
Write-Host ""

Push-Location $Root
try {
  npm.cmd run validate:github-repository-bundles
  npm.cmd run validate:github-repository-archives
} finally {
  Pop-Location
}

New-Item -ItemType Directory -Force -Path $WorkRoot | Out-Null

try {
  foreach ($Bundle in $Bundles) {
    Publish-Bundle $Bundle
  }
  Write-Host ""
  if ($Apply) {
    Write-Host "GitHub bundle publication commands completed. Wait for GitHub Actions, then run:"
  } else {
    Write-Host "Dry run completed. No git commits were created and nothing was pushed."
    Write-Host "After owner approval and Git authentication, rerun with:"
    Write-Host "powershell -ExecutionPolicy Bypass -File scripts/publish-github-repository-bundles.ps1 -Apply"
    Write-Host "Then run:"
  }
  Write-Host "npm run validate:github:live"
  Write-Host "npm run validate:github:actions"
} finally {
  if (-not $Apply) {
    Remove-Item -LiteralPath $WorkRoot -Recurse -Force -ErrorAction SilentlyContinue
  } else {
    Write-Host ""
    Write-Host "Temporary publication worktrees kept for inspection:"
    Write-Host $WorkRoot
  }
}
