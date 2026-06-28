# Release evidence guide

open-cycle is public for scrutiny, not for exposing private release material.
This guide explains how reviewers and maintainers can regenerate the public-safe
evidence trail while keeping credentials, upload keys, signed bundles, and Play
Console account data private.

## Public-safe evidence command

Run this from the repository root:

```powershell
npm run release:handoff
```

The handoff command refreshes public-safe validation reports, owner handoff
packets, private report templates, the final audit, and the release evidence
index. It intentionally does not sign Android bundles, create keystores, upload
to Play Console, set GitHub secrets, or print Cloudflare tokens.

For the evidence index only:

```powershell
npm run generate:release-evidence-index
npm run validate:release-evidence-index
npm run generate:release-completion-matrix
npm run validate:release-completion-matrix
npm run generate:release-blockers
npm run validate:release-blockers
npm run generate:visual-evidence
npm run validate:visual-test-report
npm run validate:visual-evidence
npm run generate:signed-runtime-qa-preflight
npm run validate:signed-runtime-qa-preflight
npm run generate:cloudflare-pages-deployment
npm run validate:cloudflare-pages-deployment
npm run validate:release-evidence-docs
npm run generate:public-repo-manifest
npm run validate:public-repo-manifest
```

The generated index is written to:

```text
reports/release-evidence-index.md
reports/release-completion-matrix.md
reports/release-blocker-report.md
```

`reports/` is ignored by Git. Regenerate report files locally when you need
fresh evidence.

## Evidence map

| Requirement | Public-safe evidence |
| --- | --- |
| Source-available public visibility without commercial reuse permission | `LICENSE.md`, `npm run validate:license`, `npm run validate:public` |
| Full release completion proof across app, site, GitHub, security/privacy, and Play Store gates | `reports/release-completion-matrix.md`, `npm run generate:release-completion-matrix`, `npm run validate:release-completion-matrix` |
| Owner-only go/no-go blocker list for final release gates | `reports/release-blocker-report.md`, `npm run generate:release-blockers`, `npm run validate:release-blockers` |
| No committed secrets, keystores, signed bundles, or private artifacts | `.gitignore`, `npm run validate:public`, `npm run validate:release-artifacts`, `npm run validate:public-artifacts` |
| Public GitHub publication boundary is explicit before push | `reports/public-repository-publication-manifest.md`, `npm run generate:public-repo-manifest`, `npm run validate:public-repo-manifest` |
| Truly free and local app runtime | `npm run validate:local-only-runtime`, `reports/local-only-runtime.json` |
| No ads, analytics, crash reporting, push notifications, hidden tracking, cloud sync, or remote API runtime paths | `npm run validate:local-only-deps`, `npm run validate:local-only-runtime` |
| App, website, Android, and Play Store privacy claims agree | `npm run generate:privacy-parity`, `npm run validate:privacy-parity`, `reports/privacy-parity.json` |
| Function-level validation for core cycle tracking | `docs/validation-matrix.md`, `npm run validate:functions` |
| Public GitHub workflow provenance and secret boundaries | `npm run validate:workflows`, `npm run generate:workflow-provenance`, `npm run validate:workflow-provenance`, `reports/workflow-provenance.json` |
| Website build and Cloudflare Pages output from `site/dist` | `npm run build:site`, `npm run validate:site`, `wrangler.toml` |
| Live hosted site behavior and privacy page | `npm run validate:site:live -- --url=https://open-cycle-site.pages.dev` |
| Wrangler-backed Cloudflare Pages deployment evidence | `npm run generate:cloudflare-pages-deployment`, `npm run validate:cloudflare-pages-deployment`, `reports/cloudflare-pages-deployment.json` |
| Custom-domain DNS status for apex and `www` | `npm run generate:custom-domain-dns`, `npm run validate:custom-domain-dns`, `reports/custom-domain-dns-diagnostics.json` |
| Custom domain publication after owner attaches domains | `npm run validate:cloudflare-pages-domains:live`, `npm run validate:custom-domain:live` |
| Cloudflare custom-domain attachment owner guide | `npm run owner-tools:cloudflare-domain-help`, `npm run validate:cloudflare-domain-help`, `docs/custom-domain-cloudflare.md` |
| Public GitHub scrutiny after push | `npm run validate:github:live`, `npm run validate:github:actions` |
| GitHub publication owner guide | `npm run owner-tools:publish-help`, `npm run validate:github-publication-helper`, `docs/github-web-publication.md` |
| Unsigned Android AAB packaging evidence | `npm run mobile:unsigned-aab:evidence -- --require-aab`, `reports/unsigned-aab-evidence.json` |
| Android private signing owner guide | `npm run owner-tools:android-signing-help`, `npm run validate:android-signing-helper`, `docs/android-keystore-handling.md` |
| Play Console upload owner guide | `npm run owner-tools:play-upload-help`, `npm run validate:play-upload-helper`, `docs/play-store-release.md` |
| Android permission minimization and backup posture | `npm run generate:android-permissions`, `npm run validate:android-permissions`, `reports/android-permissions.json` |
| Website and app Playwright visual run | `npm run test:visual`, `npm run validate:visual-test-report`, `reports/visual-test-report.json` |
| Website, app, emulator, and Play graphic visual proof | `npm run generate:visual-evidence`, `npm run validate:visual-evidence`, `reports/visual-evidence-manifest.json` |
| Play Store data-safety answers | `npm run generate:play-data-safety`, `npm run validate:play-data-safety` |
| Play Store content rating and app content answers | `npm run generate:play-content-rating`, `npm run validate:play-content-rating`, `reports/play-content-rating-packet.md` |
| Play Store Health Apps declaration answers | `npm run generate:play-health-declaration`, `npm run validate:play-health-declaration`, `reports/play-health-declaration-packet.md` |
| Play Store App access answers | `npm run generate:play-app-access`, `npm run validate:play-app-access`, `reports/play-app-access-packet.md` |
| Play Store ads declaration answers | `npm run generate:play-ads-declaration`, `npm run validate:play-ads-declaration`, `reports/play-ads-declaration-packet.md` |
| Play Store target audience and children declaration answers | `npm run generate:play-target-audience`, `npm run validate:play-target-audience`, `reports/play-target-audience-packet.md` |
| Play Store testing and production-access plan | `npm run generate:play-testing-rollout`, `npm run validate:play-testing-rollout`, `reports/play-testing-rollout-packet.md` |
| Aggregate Play App content declarations | `npm run generate:play-app-content`, `npm run validate:play-app-content`, `reports/play-app-content-packet.md` |
| Play release candidate evidence alignment | `npm run generate:play-release-candidate`, `npm run validate:play-release-candidate`, `reports/play-release-candidate-packet.md` |
| Android signing handoff and private boundary | `npm run generate:android-signing-handoff`, `npm run validate:android-signing-handoff`, `reports/android-signing-handoff-packet.md` |
| Play production readiness private gate summary | `npm run generate:play-production-readiness`, `npm run validate:play-production-readiness`, `reports/play-production-readiness-packet.md` |
| Play Console upload packet without secrets | `npm run generate:play-console-packet`, `npm run validate:play-console-packet` |
| Play Console field-by-field upload map | `npm run generate:play-console-field-map`, `npm run validate:play-console-field-map`, `reports/play-console-field-map.md` |
| Play Console submit bundle without signed/private files | `npm run generate:play-console-submit-bundle`, `npm run validate:play-console-submit-bundle` after screenshots, visual evidence, and emulator QA evidence exist |
| Signed runtime QA local install preflight | `npm run generate:signed-runtime-qa-preflight`, `npm run validate:signed-runtime-qa-preflight`, `reports/signed-runtime-qa-preflight.json` |
| Owner-side private signing and runtime QA | `npm run mobile:signed-aab:evidence -- --require-signed`, `npm run validate:runtime-qa-report -- --require-complete` |
| Runtime QA owner guide | `npm run owner-tools:runtime-qa-help`, `npm run validate:runtime-qa-helper`, `docs/runtime-qa.md` |
| Owner support now guide | `npm run release:support-now`, `npm run validate:owner-support-now`, `docs/release-owner-checklist.md` |
| Owner tooling guide | `npm run validate:owner-tooling-docs`, `docs/owner-tooling.md` |
| Final Play Console upload confirmation | `npm run validate:play-upload-confirmation -- --require-complete`, `npm run validate:play-store-complete` |

## Public/private boundary

Public-safe:

- Source files, docs, validation scripts, metadata, workflow definitions, and
  unsigned AAB evidence.
- Generated reports that contain hashes, statuses, and validation summaries but
  no credentials.
- Cloudflare Pages public URLs and GitHub public URLs.

Private owner-side:

- Cloudflare API tokens and account secrets.
- Android upload keystores and keystore passwords.
- Play service-account JSON and Play Console account state.
- Signed `.aab` files and any account-side upload confirmation details.

Never paste or commit secret values, keystores, signed AAB files, Play
credentials, or Cloudflare tokens. Use prompt-based helpers and GitHub secrets
for account-side configuration.

## Review flow

1. Run `npm run validate:public` to confirm public repository safety.
2. Run `npm run release:handoff` to regenerate the evidence chain.
3. Open `reports/release-evidence-index.md` to see every evidence file and
   validation command.
4. For live publication, run the live validators after the GitHub push and
   Cloudflare custom-domain attachment.
5. For Play Store completion, run the private signing, runtime QA, upload
   confirmation, and `npm run validate:play-store-complete` gates locally.
