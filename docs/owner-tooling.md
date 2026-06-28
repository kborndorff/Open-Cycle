# Owner tooling setup

This guide explains how to satisfy `npm run validate:owner-tools` before public
GitHub publication, Android signing, and Play Console upload.

It is public-safe by design. Do not paste Cloudflare tokens, Play Console
credentials, upload keystore passwords, or signed artifacts into this file,
chat, commits, issues, or shell history.

## Check current tool readiness

Run this from the repository root:

```powershell
npm run validate:owner-tools
```

If Java or Android SDK paths are missing, print safe setup commands for common
Windows Android Studio locations:

```powershell
npm run owner-tools:env-help
```

The helper does not read or print secrets. By default it only prints commands
for the current shell. If you intentionally want to persist detected `JAVA_HOME`
and `ANDROID_HOME` values for your Windows user, run:

```powershell
npm run owner-tools:env-help -- -ApplyToUser
```

Open a new terminal after persisting user environment variables.

The report at `reports/owner-release-tools.json` records tool presence only. It
does not read, print, or store secret values.

## Safe owner helper suite

These commands print owner-side instructions only. They do not upload files, push
Git commits, attach Cloudflare domains, read keystores, read Play credentials,
or print secret values.

```powershell
npm run release:support-now
npm run validate:owner-support-now
npm run generate:release-blockers
npm run validate:release-blockers
npm run owner-tools:cloudflare-domain-help
npm run validate:cloudflare-domain-help
npm run cloudflare:attach-domains
npm run validate:cloudflare-domain-api-helper
npm run owner-tools:publish-help
npm run validate:github-publication-helper
npm run github:publish-bundles:dry-run
npm run validate:github-bundle-publisher
npm run generate:git-publication-preflight
npm run validate:git-publication-preflight
npm run owner-tools:android-signing-help
npm run validate:android-signing-helper
npm run owner-tools:android-tooling-help
npm run validate:android-tooling-helper
npm run owner-tools:runtime-qa-help
npm run validate:runtime-qa-helper
npm run owner-tools:play-upload-help
npm run validate:play-upload-helper
```

Use these helpers before entering secrets or touching private signed artifacts.
They are public-safe guidance surfaces for the remaining Cloudflare, GitHub,
Android signing, signed runtime QA, and Play Console upload work. The Git
publication preflight does not push code or contact GitHub; it records missing
local Git setup such as author email, origin, branch, and first commit. The
GitHub bundle publisher is a dry run unless the owner explicitly uses
`npm run github:publish-bundles:apply`; it publishes only the already validated
public-safe GitHub bundles. The
`cloudflare:attach-domains` command is a dry run by default; only the
`cloudflare:attach-domains:apply` command performs the Cloudflare API action,
and only from an owner shell with `CF_ACCOUNT_ID` and `CF_API_TOKEN` set.

For the shortest go/no-go list after the final audit, regenerate the blocker
report:

```powershell
npm run generate:release-blockers
npm run validate:release-blockers
```

Use strict mode only when you want missing required tools to fail the command:

```powershell
npm run validate:owner-tools -- --strict
```

## GitHub CLI

`gh` is needed for GitHub secret setup and live public repository checks.

Print safe GitHub CLI setup guidance:

```powershell
npm run owner-tools:gh-help
```

Install GitHub CLI with your preferred trusted installer, then authenticate:

```powershell
gh auth login
gh auth status -h github.com
```

After `gh` is authenticated, set Cloudflare deployment secrets only through the
prompted helper:

```powershell
npm run github:setup-deploy-secrets
```

Paste Cloudflare values only into the prompts. Do not put them directly on a
command line.

If `gh` is unavailable, use `docs/github-web-publication.md` to set repository
visibility, GitHub Actions secrets, and GitHub Actions variables through the
GitHub web UI.

## Java signing tools

`jarsigner` and `keytool` are required for Android App Bundle signing and signed
AAB verification.

Android Studio includes a bundled Java runtime. On many Windows machines it is
under one of these folders:

```text
C:\Program Files\Android\Android Studio\jbr
C:\Program Files\Android\Android Studio2\jbr
```

For the current PowerShell session, point `JAVA_HOME` at the installed Java
runtime and put its `bin` folder first on `PATH`:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

Then confirm the tools are visible:

```powershell
jarsigner -help
keytool -help
npm run validate:owner-tools
```

If Android Studio is installed in a different folder, use that local path
instead.

## Android SDK

Gradle needs the Android SDK to build the Play Store `.aab`.

Install or confirm the Android SDK through Android Studio, then set
`ANDROID_HOME` or `ANDROID_SDK_ROOT` to the SDK folder. A common Windows user
SDK path is:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

To persist the setting for future PowerShell sessions:

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

For signed runtime QA in the current PowerShell session, also put Platform Tools
and Emulator on `PATH`:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"
```

Open a new terminal after changing user environment variables, then rerun:

```powershell
npm run validate:owner-tools
npm run owner-tools:android-tooling-help
```

## Wrangler

`wrangler` is recommended for optional local Cloudflare deploy checks. The
public GitHub Pages workflow uses `cloudflare/wrangler-action`, so local
Wrangler is helpful but not required for the public-safe handoff.

Print safe Wrangler setup guidance:

```powershell
npm run owner-tools:wrangler-help
```

If you install Wrangler locally, confirm it is visible:

```powershell
wrangler --version
npm run validate:owner-tools
```

For optional local Pages deploys, use the direct `site/dist` path first:

```powershell
npm run build:site
npm run deploy:site:local
```

If the OneDrive-backed workspace path causes local Wrangler file access issues,
use the temp-staged deploy helper instead:

```powershell
npm run build:site
npm run deploy:site:local:safe
```

The temp-staged helper passes `--commit-dirty=true` because this release path is
for deploying already-built public `site/dist` assets, not for proving git
commit metadata.

Without a global Wrangler install, use:

```powershell
npm run build:site
npm run deploy:site:local:safe:npx
```

## Private signing flow

After `gh`, `jarsigner`, `keytool`, and the Android SDK are visible, use the
prompted private Android release flow:

```powershell
npm run mobile:release:android:prompted
```

Keep the upload keystore and passwords outside GitHub. The prompted flow keeps
signing values local to your shell and clears them after the command exits.
