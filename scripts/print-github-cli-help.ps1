param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Command {
  param([string]$Name)

  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Find-GitHubCli {
  $command = Get-Command "gh" -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $candidates = @(
    (Join-Path $env:ProgramFiles "GitHub CLI\gh.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "GitHub CLI\gh.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\GitHub CLI\gh.exe"),
    (Join-Path $env:USERPROFILE "AppData\Local\Programs\GitHub CLI\gh.exe")
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return ""
}

$hasGh = Test-Command "gh"
$ghPath = Find-GitHubCli
$hasWinget = Test-Command "winget"

Write-Host "OpenCycle GitHub CLI helper"
Write-Host ""
Write-Host "This helper does not read, print, or store GitHub tokens, Cloudflare tokens, Play Console credentials, keystore passwords, or signing keys."
Write-Host ""

if ($hasGh) {
  Write-Host "GitHub CLI appears to be installed."
  Write-Host ""
  Write-Host "Check authentication:"
  Write-Host "gh auth status -h github.com"
  Write-Host ""
  Write-Host "If authentication is missing or expired, run:"
  Write-Host "gh auth login"
} elseif ($ghPath) {
  $ghFolder = Split-Path -Parent $ghPath
  Write-Host "GitHub CLI appears to be installed but is not on PATH."
  Write-Host ""
  Write-Host "For this PowerShell session, run:"
  Write-Host ('$env:PATH = ' + '"' + ($ghFolder -replace '"', '""') + ';$env:PATH"')
  Write-Host ""
  Write-Host "Then check authentication:"
  Write-Host "gh auth status -h github.com"
  Write-Host ""
  Write-Host "If authentication is missing or expired, run:"
  Write-Host "gh auth login"
} else {
  Write-Host "GitHub CLI was not found on PATH."
  Write-Host ""
  if ($hasWinget) {
    Write-Host "Install with winget:"
    Write-Host "winget install --id GitHub.cli"
  } else {
    Write-Host "Install GitHub CLI from:"
    Write-Host "https://cli.github.com/"
  }
  Write-Host ""
  Write-Host "Open a new terminal after installing, then run:"
  Write-Host "gh auth login"
}

Write-Host ""
Write-Host "After GitHub CLI is installed and authenticated, re-check:"
Write-Host "npm run validate:owner-tools"
Write-Host ""
Write-Host "Then set Cloudflare deployment secrets through prompts only:"
Write-Host "npm run github:setup-deploy-secrets"
