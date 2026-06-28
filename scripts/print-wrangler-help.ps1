param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Command {
  param([string]$Name)

  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

$hasWrangler = Test-Command "wrangler"
$hasNpx = Test-Command "npx"
$hasNpm = Test-Command "npm"

Write-Host "OpenCycle Wrangler helper"
Write-Host ""
Write-Host "This helper does not read, print, or store Cloudflare tokens, account IDs, GitHub tokens, Play Console credentials, keystore passwords, or signing keys."
Write-Host ""

if ($hasWrangler) {
  Write-Host "Wrangler appears to be installed."
  Write-Host ""
  Write-Host "Check version:"
  Write-Host "wrangler --version"
} else {
  Write-Host "Wrangler was not found on PATH."
  Write-Host ""
  if ($hasNpm) {
    Write-Host "Install globally with npm if you want local Cloudflare checks:"
    Write-Host "npm install -g wrangler"
  }
  if ($hasNpx) {
    Write-Host ""
    Write-Host "Or run Wrangler without a global install:"
    Write-Host "npx wrangler --version"
  }
}

Write-Host ""
Write-Host "Preferred public deployment path:"
Write-Host "- GitHub Actions uses cloudflare/wrangler-action and GitHub encrypted secrets."
Write-Host "- Set Cloudflare secrets with npm run github:setup-deploy-secrets or docs/github-web-publication.md."
Write-Host ""
Write-Host "Optional local Pages deploy from this computer:"
Write-Host "npm run build:site"
Write-Host "npm run deploy:site:local"
Write-Host ""
Write-Host "If Wrangler is not installed globally:"
Write-Host "npm run build:site"
Write-Host "npm run deploy:site:local:npx"
Write-Host ""
Write-Host "If OneDrive or another permissioned folder causes local deploy issues, stage site/dist in a temp folder first:"
Write-Host "npm run build:site"
Write-Host "npm run deploy:site:local:safe"
Write-Host ""
Write-Host "Temp-staged deploy without a global Wrangler install:"
Write-Host "npm run build:site"
Write-Host "npm run deploy:site:local:safe:npx"
Write-Host ""
Write-Host "These commands deploy the built site/dist assets using your local Cloudflare auth."
Write-Host "The temp-staged helper passes --commit-dirty=true so local git metadata does not block asset deploys."
Write-Host ""
Write-Host "Custom domain attachment:"
Write-Host "- Dedicated owner helper: npm run owner-tools:cloudflare-domain-help"
Write-Host "- Wrangler can deploy/list this Pages project, but the checked pages project command set exposes list/create/delete only."
Write-Host "- Attach open-cycle.com and www.open-cycle.com in the Cloudflare dashboard for open-cycle."
Write-Host "- Keep Cloudflare API tokens out of command lines, chat, commits, and generated reports."
Write-Host ""
Write-Host "After optional local Wrangler setup, re-check:"
Write-Host "npm run validate:owner-tools"
