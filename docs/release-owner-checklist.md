# Release owner checklist

This checklist covers the remaining account-side and private steps for the
OpenCycle / open-cycle public release. Keep secret values, keystore files,
Play Console credentials, and signed artifacts out of GitHub.

## 1. GitHub and Cloudflare setup

- Check local owner-side release tools without printing secrets:

```powershell
npm run validate:owner-tools
npm run release:owner-dry-run
```

- If tools are missing, follow `docs/owner-tooling.md`.
- To print safe GitHub CLI setup commands, run:

```powershell
npm run owner-tools:gh-help
```

- To print safe owner-side GitHub publication commands, run:

```powershell
npm run owner-tools:publish-help
```

- To print safe Java/Android setup commands, run:

```powershell
npm run owner-tools:env-help
```

- To print optional Wrangler setup guidance for local Cloudflare checks, run:

```powershell
npm run owner-tools:wrangler-help
```

- If local Wrangler has trouble reading from the OneDrive-backed workspace path,
  deploy the built `site/dist` assets from a fresh temp folder instead:

```powershell
npm run build:site
npm run deploy:site:local:safe
```

  The temp-staged helper passes `--commit-dirty=true` so Wrangler deploys the
  already-built public Pages assets without turning local git metadata into a
  release blocker.

- Confirm GitHub CLI is authenticated for `kborndorff/Open-Cycle`.
- If GitHub CLI is unavailable, use `docs/github-web-publication.md`.
- Confirm non-secret Cloudflare deployment readiness:

```powershell
npm run validate:cloudflare-readiness
npm run validate:custom-domain
```

- Review `docs/custom-domain-cloudflare.md` before attaching `open-cycle.com`
  to Cloudflare Pages.
- Confirm the local public-push file set is ready for GitHub publication:

```powershell
npm run validate:public-push
```

- Confirm the public/private artifact boundary is intact:

```powershell
npm run validate:public-artifacts
```

- Confirm the app runtime remains truly local-only:

```powershell
npm run validate:local-only-runtime
```

- Review the public evidence guide before pushing, then generate and validate
  the public-safe evidence index:

```powershell
npm run generate:release-evidence-index
npm run validate:release-evidence-index
npm run validate:release-evidence-docs
```

  See `docs/release-evidence.md` for the reviewer-facing evidence map.

- Set Cloudflare deployment secrets with the prompt-only helper:

```powershell
npm run github:setup-deploy-secrets -- -DryRun
npm run github:setup-deploy-secrets
```

- Paste `CF_API_TOKEN` and `CF_ACCOUNT_ID` only into the PowerShell prompts.
- Do not paste Cloudflare API tokens into chat, commits, issues, docs, or shell history.
- Confirm the GitHub repository is public only after `npm run validate:public` passes.

## 2. Public push and hosted site

- Push the current worktree to `https://github.com/kborndorff/Open-Cycle`.
- Wait for GitHub Actions to finish.
- Confirm the Cloudflare Pages workflow deploys `site/dist`.
- If secrets, variables, or Cloudflare domain settings change after the first
  push, rerun the Pages deploy manually from GitHub Actions with
  `workflow_dispatch`.
- Attach `open-cycle.com` to the Cloudflare Pages project from the Cloudflare
  account.
- After certificate provisioning, validate the custom domain:

```powershell
npm run validate:site:live -- --url=https://open-cycle.com
npm run validate:cloudflare-pages-domains:live
npm run validate:custom-domain:live
```

- Run the public readiness gate after the push:

```powershell
npm run release:public-ready
```

- If only debugging before push, use dry-run mode instead:

```powershell
npm run release:public-ready -- --dry-run
```

To print the same public-ready plan without live network checks, use:

```powershell
npm run release:public-ready -- --dry-run --skip-live-site --skip-live-cloudflare-domains --skip-live-custom-domain --skip-live-github --skip-live-actions
```

## 3. Android signing

- Print the signing helper without entering secrets:

```powershell
npm run owner-tools:android-signing-help
npm run validate:android-signing-helper
```

- Keep the upload keystore outside the repository.
- Keep signed AAB files out of public GitHub Actions artifacts. The public
  Android workflow may publish unsigned build evidence only; private signing is
  handled locally unless a later Play-upload-only automation is explicitly
  reviewed.
- Review `docs/android-keystore-handling.md` before creating or using the upload keystore.
- Confirm unsigned AAB packaging evidence exists:

```powershell
npm run mobile:build:aab
npm run mobile:unsigned-aab:evidence -- --require-aab
```

  The unsigned AAB build uses a temp Gradle build root through
  `OPEN_CYCLE_ANDROID_BUILD_ROOT`, then copies the generated bundle back to the
  canonical Android output path. This avoids stale or locked generated files in
  OneDrive-backed workspaces.

- Create a local upload keystore if needed:

```powershell
npm run mobile:create-upload-keystore -- -DryRun
npm run mobile:create-upload-keystore
```

- Build and sign the Android App Bundle with the prompted private release flow:

```powershell
npm run validate:signing-readiness
npm run mobile:release:android:prompted -- -DryRun
npm run mobile:release:android:prompted
```

  If `npm run validate:release` already passed and
  `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab` exists,
  sign the current bundle without rebuilding:

```powershell
npm run mobile:release:android:prompted -- -SkipBuild -SkipPublicGate
```

- Print the signed AAB SHA-256 and byte size for runtime QA and Play upload
  confirmation:

```powershell
npm run mobile:signed-aab:evidence -- --require-signed
```

- Sync signed AAB SHA-256 and byte size into the private runtime QA and Play
  upload confirmation templates:

```powershell
npm run mobile:signed-aab:sync-evidence
```

- Confirm the signed AAB remains local and is not committed.

## 4. Signed runtime QA

- Print the runtime QA helper without handling private signed artifacts:

```powershell
npm run owner-tools:runtime-qa-help
npm run validate:runtime-qa-helper
```

- Generate the private runtime QA report:

```powershell
npm run generate:runtime-qa-report
```

- If `reports/runtime-qa-report.md` already exists, the generator preserves it.
  Use `npm run generate:runtime-qa-report -- --force` only to intentionally
  replace the template.
- Install the signed candidate on a device or emulator.
- Complete every checklist item in `reports/runtime-qa-report.md`.
- Keep the signed AAB SHA-256 and byte size matched to the current signed AAB.
- Validate the completed report:

```powershell
npm run validate:runtime-qa-report -- --require-complete
```

## 5. Play Console upload

- Print the Play upload helper without entering account credentials:

```powershell
npm run owner-tools:play-upload-help
npm run validate:play-upload-helper
```

- Upload the signed AAB to Play Console.
- Use the custom-domain privacy URL after `npm run validate:custom-domain:live`
  passes:

```text
https://open-cycle.com/privacy
```

- If Play Console setup needs to start before the custom domain is live, use
  this temporary fallback only until `open-cycle.com` validation passes:

```text
https://open-cycle-site.pages.dev/privacy
```

- Generate and fill the private upload confirmation:

```powershell
npm run generate:play-upload-confirmation
```

- If `reports/play-console-upload-confirmation.json` already exists, the
  generator preserves it. Use `npm run generate:play-upload-confirmation -- --force`
  only to intentionally replace the template.
- Fill `reports/play-console-upload-confirmation.json` after upload.
- Keep `signedAabSha256` and `signedAabSizeBytes` matched to the uploaded signed AAB.
- Set `dataSafetySubmitted`, `noAdsOrAdvertisingIdConfirmed`,
  `noAccountCreationConfirmed`, `noInternetPermissionConfirmed`, and
  `signedRuntimeQaComplete` to `true` only after confirming each item in Play
  Console and the signed runtime QA report.
- Keep `dataSafetyDataCollected` as `None` and
  `dataSafetyDataSharedWithThirdParties` as `false`.
- Validate the completed confirmation:

```powershell
npm run validate:play-upload-confirmation -- --require-complete
```

## 6. Final completion gate

Run the final private completion gate:

```powershell
npm run validate:play-store-complete
```

Success means the final audit should report `play-upload-confirmed` with no
pending or failed checks.

## Quick status helper

To regenerate the shortest owner go/no-go list from the current final audit:

```powershell
npm run generate:release-blockers
npm run validate:release-blockers
```

Then open `reports/release-blocker-report.md` for each remaining owner-only
gate, helper command, proof command, and private-material boundary.

To print the current audit status and recommended next commands:

```powershell
npm run release:next
```

To print only the immediate owner-support actions with secret-safe prompt
commands:

```powershell
npm run release:support-now
```

To verify the handoff command stays public-safe, refresh owner-tool readiness,
function coverage, Play preflight, release status, public handoff packets,
private report templates, and the final audit, then validate release and
public-safety reports before printing next steps:

```powershell
npm run release:handoff
```
