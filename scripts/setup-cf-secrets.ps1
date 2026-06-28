param(
  [string]$Owner = "kborndorff",
  [string]$Repo = "open-cycle",
  [string]$PagesProject = "open-cycle",
  [string]$WorkerName = "open-cycle-legacy-redirect"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required. Install from https://cli.github.com/ and sign in with 'gh auth login'."
}

$repoRef = "$Owner/$Repo"
Write-Host "Repo: $repoRef"

$secureToken = Read-Host -AsSecureString -Prompt "CF_API_TOKEN"
$secureAccount = Read-Host -AsSecureString -Prompt "CF_ACCOUNT_ID"

$cfApiToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
)
$cfAccountId = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAccount)
)

try {
  $cfApiToken | gh secret set CF_API_TOKEN -R $repoRef --body -
  $cfAccountId | gh secret set CF_ACCOUNT_ID -R $repoRef --body -
  $PagesProject | gh variable set CF_PAGES_PROJECT_NAME -R $repoRef --body -
  $WorkerName | gh variable set CF_WORKER_NAME -R $repoRef --body -
  Write-Host "Cloudflare secrets and deployment variables were stored for $repoRef."
}
finally {
  [System.GC]::Collect()
}
