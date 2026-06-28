# Deployment secrets

This repo is designed to stay public while deployment credentials stay private.
Do not commit Cloudflare API tokens, account IDs, Android keystores, passwords,
or Play Console credentials.

## Cloudflare Pages deployment

The site workflow deploys `site/dist` through Wrangler:

- Workflow: `.github/workflows/deploy-site.yml`
- Trigger: push to `main` or manual `workflow_dispatch`
- Local Wrangler config: `wrangler.toml`
- Post-deploy check: `npm run validate:site:live -- --url=https://<project>.pages.dev`
- Live evidence report: `reports/live-site-publication.json` (ignored)
- Required GitHub secrets:
  - `CF_API_TOKEN`
  - `CF_ACCOUNT_ID`
- Optional GitHub variable:
  - `CF_PAGES_PROJECT_NAME`

Before doing account-side release work, you can check local owner tools without
printing any secret values:

```powershell
npm run validate:owner-tools
```

Use a Cloudflare API token scoped only to this deployment. Prefer the smallest
scope Cloudflare allows for Pages deployment and avoid using a global API key.

### One paste PowerShell setup

Run this from any PowerShell session where `gh` is authenticated to GitHub.
The token and account ID are read from prompts and piped to GitHub secrets, so
they are not stored in the repository and are not typed directly into shell
history.

Recommended one-command helper:

```powershell
npm run github:setup-deploy-secrets -- -DryRun
npm run github:setup-deploy-secrets
```

Use this if you need to target a different repository, Pages project, or worker
name:

```powershell
npm run github:setup-deploy-secrets -- -Repo kborndorff/Open-Cycle -PagesProject open-cycle-site -WorkerName open-cycle-legacy-redirect -DryRun
npm run github:setup-deploy-secrets -- -Repo kborndorff/Open-Cycle -PagesProject open-cycle-site -WorkerName open-cycle-legacy-redirect
```

### Optional local Wrangler deploy

If you want to deploy from this computer the same way your other apps do, build
the site first and let Wrangler read the public `wrangler.toml` Pages settings:

```powershell
npm run build:site
npm run deploy:site:local
```

If Wrangler is not installed globally, use:

```powershell
npm run build:site
npm run deploy:site:local:npx
```

If OneDrive or another permissioned workspace path causes local Wrangler deploy
issues, stage the already-built `site/dist` files in a fresh temp folder first:

```powershell
npm run build:site
npm run deploy:site:local:safe
```

If Wrangler is not installed globally and you still want the temp-staged path:

```powershell
npm run build:site
npm run deploy:site:local:safe:npx
```

These commands deploy `site/dist` to the public Pages project name
`open-cycle-site`. They still rely on your local Cloudflare authentication
and must not be given an API token in the command line. The temp-staged helper
passes `--commit-dirty=true` so Wrangler does not block or distract on local git
metadata while deploying already-built public assets.

The helper is a thin wrapper around these prompt-only GitHub CLI commands:

```powershell
$repo = "kborndorff/Open-Cycle"
$pagesProject = "open-cycle-site"
$workerName = "open-cycle-legacy-redirect"

$cfTokenSecure = Read-Host "Paste Cloudflare API token" -AsSecureString
$cfTokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($cfTokenSecure)
$cfToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($cfTokenPtr)
$cfToken | gh secret set CF_API_TOKEN --repo $repo
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($cfTokenPtr)
Remove-Variable cfToken, cfTokenSecure, cfTokenPtr

$cfAccountIdSecure = Read-Host "Paste Cloudflare account ID" -AsSecureString
$cfAccountIdPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($cfAccountIdSecure)
$cfAccountId = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($cfAccountIdPtr)
$cfAccountId | gh secret set CF_ACCOUNT_ID --repo $repo
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($cfAccountIdPtr)
Remove-Variable cfAccountId, cfAccountIdSecure, cfAccountIdPtr

gh variable set CF_PAGES_PROJECT_NAME --repo $repo --body $pagesProject
gh variable set CF_WORKER_NAME --repo $repo --body $workerName
```

### Manual interactive setup

If you prefer to avoid variables entirely, run these and paste values only when
`gh` prompts for them:

```powershell
gh secret set CF_API_TOKEN --repo kborndorff/Open-Cycle
gh secret set CF_ACCOUNT_ID --repo kborndorff/Open-Cycle
gh variable set CF_PAGES_PROJECT_NAME --repo kborndorff/Open-Cycle --body open-cycle-site
gh variable set CF_WORKER_NAME --repo kborndorff/Open-Cycle --body open-cycle-site-legacy-redirect
```

## Legacy redirect worker

The optional legacy redirect workflow uses the same Cloudflare secrets:

- Workflow: `.github/workflows/deploy-redirect-worker.yml`
- Trigger: push to `main` for redirect-worker changes or manual `workflow_dispatch`
- Required GitHub secrets:
  - `CF_API_TOKEN`
  - `CF_ACCOUNT_ID`
- Optional GitHub variable:
  - `CF_WORKER_NAME`

Only enable this workflow if the legacy domains are ready to route through the
worker.

## Custom domain

Use `docs/custom-domain-cloudflare.md` for the owner-side `open-cycle.com`
Cloudflare Pages setup. Keep DNS tokens, registrar credentials, and Cloudflare
account access outside GitHub.

Public-safe local check:

```powershell
npm run validate:custom-domain
```

## Android signing secrets

Keep the Android upload keystore local by default. The public GitHub workflow
builds and validates an unsigned `.aab`, which proves packaging without exposing
signing material.

Recommended private signing flow:

```powershell
npm run mobile:release:android:prompted -- -DryRun
npm run mobile:release:android:prompted
```

Manual private signing flow:

```powershell
npm run mobile:create-upload-keystore
$keystorePath = Read-Host "Path to upload keystore"
$keystorePassword = Read-Host "Keystore password"
$keyPassword = Read-Host "Key password"
Set-Item Env:ANDROID_KEYSTORE_PATH $keystorePath
Set-Item Env:ANDROID_KEY_ALIAS "upload"
Set-Item Env:ANDROID_KEYSTORE_PASSWORD $keystorePassword
Set-Item Env:ANDROID_KEY_PASSWORD $keyPassword
npm run mobile:sign:aab -- --input=apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
Remove-Variable keystorePath, keystorePassword, keyPassword
```

Do not add Android keystores or signing passwords as GitHub secrets unless you
intentionally want CI to produce signed release artifacts.
