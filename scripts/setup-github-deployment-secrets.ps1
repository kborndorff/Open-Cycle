param(
  [string]$Repo = "kborndorff/Open-Cycle",
  [string]$PagesProject = "open-cycle-site",
  [string]$WorkerName = "open-cycle-legacy-redirect",
  [switch]$DryRun,
  [switch]$SkipWorkerVariable
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Read-SecretValue {
  param([string]$Prompt)

  $secureValue = Read-Host $Prompt -AsSecureString
  $valuePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($valuePointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($valuePointer)
    Remove-Variable secureValue -ErrorAction SilentlyContinue
  }
}

function Set-GitHubSecretFromPrompt {
  param(
    [string]$Name,
    [string]$Prompt
  )

  $secretValue = Read-SecretValue $Prompt
  try {
    if ([string]::IsNullOrWhiteSpace($secretValue)) {
      throw "$Name cannot be empty."
    }

    $secretValue | gh secret set $Name --repo $Repo
  } finally {
    Remove-Variable secretValue -ErrorAction SilentlyContinue
  }
}

if ($DryRun) {
  $ghCommand = Get-Command "gh" -ErrorAction SilentlyContinue

  Write-Host ""
  Write-Host "Dry run only. No secret prompts will be shown and no GitHub secrets or variables will be changed."
  Write-Host "Repository target: $Repo"
  Write-Host "GitHub CLI detected: $(if ($ghCommand) { "yes" } else { "no" })"
  Write-Host ""
  Write-Host "Would set GitHub Actions secrets:"
  Write-Host "- CF_API_TOKEN"
  Write-Host "- CF_ACCOUNT_ID"
  Write-Host ""
  Write-Host "Would set GitHub Actions variables:"
  Write-Host "- CF_PAGES_PROJECT_NAME = $PagesProject"
  if (-not $SkipWorkerVariable) {
    Write-Host "- CF_WORKER_NAME = $WorkerName"
  }
  Write-Host ""
  Write-Host "Run without -DryRun when you are ready to paste Cloudflare values into secure prompts."
  exit 0
}

Require-Command "gh"

Write-Host "Checking GitHub CLI authentication..."
gh auth status | Out-Host

Write-Host "Setting Cloudflare deployment secrets for $Repo."
Write-Host "Secret values are read from prompts and piped directly to GitHub."

Set-GitHubSecretFromPrompt -Name "CF_API_TOKEN" -Prompt "Paste Cloudflare API token"
Set-GitHubSecretFromPrompt -Name "CF_ACCOUNT_ID" -Prompt "Paste Cloudflare account ID"

gh variable set CF_PAGES_PROJECT_NAME --repo $Repo --body $PagesProject

if (-not $SkipWorkerVariable) {
  gh variable set CF_WORKER_NAME --repo $Repo --body $WorkerName
}

Write-Host "GitHub deployment secrets and variables are set for $Repo."
