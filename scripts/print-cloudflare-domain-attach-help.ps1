param(
  [string]$ProjectName = "open-cycle",
  [string[]]$Domains = @("open-cycle.com", "www.open-cycle.com")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Command {
  param([string]$Name)

  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "OpenCycle Cloudflare custom-domain attach helper"
Write-Host ""
Write-Host "This helper does not read, print, prompt for, or store Cloudflare API tokens, account IDs, GitHub tokens, Play Console credentials, keystore passwords, or signing keys."
Write-Host ""
Write-Host "Target Pages project: $ProjectName"
Write-Host "Target domains: $($Domains -join ', ')"
Write-Host ""

if (Test-Command "wrangler") {
  Write-Host "Wrangler appears to be installed. You can inspect the Pages project before using the Cloudflare dashboard:"
  Write-Host "wrangler pages project list"
} elseif (Test-Command "npx") {
  Write-Host "Wrangler was not found globally. You can inspect the Pages project without a global install:"
  Write-Host "npx wrangler pages project list"
} else {
  Write-Host "Wrangler and npx were not found on PATH. That is okay; custom-domain attachment can be completed in the Cloudflare dashboard."
}

Write-Host ""
Write-Host "Owner-side dashboard steps:"
Write-Host "1. Open Cloudflare Dashboard."
Write-Host "2. Go to Workers and Pages, then Pages."
Write-Host "3. Open the Pages project named $ProjectName."
Write-Host "4. Open Custom domains."
$StepNumber = 5
foreach ($Domain in $Domains) {
  Write-Host "$StepNumber. Add custom domain: $Domain"
  $StepNumber++
}
Write-Host "$StepNumber. Let Cloudflare create or update the DNS records and provision HTTPS certificates."
$StepNumber++
Write-Host "$StepNumber. Keep Cloudflare tokens, account credentials, registrar access, and DNS recovery codes out of source, chat, commits, issues, pull requests, and generated reports."
Write-Host ""
Write-Host "After Cloudflare shows the domains as active, validate from this workspace:"
Write-Host "npm run validate:cloudflare-pages-domains:live"
Write-Host "npm run validate:custom-domain:live"
Write-Host "npm run validate:site:live -- --url=https://open-cycle.com"
Write-Host "npm run validate:site:live -- --url=https://www.open-cycle.com"
Write-Host ""
Write-Host "If the www host is configured only as a redirect, use the primary privacy URL in Play Console:"
Write-Host "https://open-cycle.com/privacy"
Write-Host ""
Write-Host "Reference docs:"
Write-Host "docs/custom-domain-cloudflare.md"
Write-Host "docs/cloudflare-pages-domain-diagnostics.md"
