# open-cycle

open-cycle is a free, privacy-first period tracking app. It keeps cycle entries
on the user's device and stays independent of paid services.

Public proof, product upload materials, and security notes belong in
`kborndorff/Open-Cycle`. The complete inspectable source belongs in
`kborndorff/open-cycle-source`: https://github.com/kborndorff/open-cycle-source

## Structure

- `apps/api`: standalone local API workspace with secure defaults and local persistence for backend/security scrutiny.
- `apps/web`: React UI for local tracking with browser/device storage only.
- `site`: static marketing site and gentle upgrade path to OpenCycle.

## Free + local by design

- No signup required.
- No paid gate in the local core.
- No cloud sync requirement.
- No hidden tracking from the standalone local API workspace or UI.
- Optional standalone local API hardening via `API_KEY` in `apps/api/.env` (disabled by default).
- Browser and mobile builds store cycle entries in browser/device storage only.
- You can delete one entry or clear all local cycle entries when you want a fresh start.
- Local tracking works completely without network dependency for core features.
- No signup, subscriptions, or paid lock-in in the local core.
- API listens on `API_HOST` (defaults to `127.0.0.1`) for local-only operation by default.

## License

This project is source-available, not open source. It is public for scrutiny,
personal non-commercial local use, and security review. It is not licensed for
resale, rebranding, hosted competing services, app store redistribution by
others, or commercial reuse.

See [LICENSE.md](LICENSE.md) for the full terms.

## Local setup (free)

```bash
npm install

copy apps\\api\\.env.example apps\\api\\.env
copy apps\\web\\.env.example apps\\web\\.env
```

Optional standalone API development:

```bash
npm run dev:api
```

Local app development:

```bash
npm run dev:web
```

Optional local site preview:

```bash
npm run dev:site
```

## Owner release helpers (no secrets printed)

The remaining account-side release work is guided by public-safe helper commands.
They print instructions only; they do not push Git commits, attach Cloudflare
domains, upload to Play Console, read keystores, or print secret values.

```bash
npm run release:support-now
npm run generate:release-blockers
npm run validate:release-blockers
npm run owner-tools:cloudflare-domain-help
npm run owner-tools:publish-help
npm run generate:git-publication-preflight
npm run validate:git-publication-preflight
npm run owner-tools:android-signing-help
npm run owner-tools:runtime-qa-help
npm run owner-tools:play-upload-help
```

After reviewing the Cloudflare helper, owners can rehearse the custom-domain API
attach flow without secrets:

```bash
npm run cloudflare:attach-domains
```

Only run the apply command from an owner shell with `CF_ACCOUNT_ID` and
`CF_API_TOKEN` already set:

```bash
npm run cloudflare:attach-domains:apply
```

Validate the helper guidance with:

```bash
npm run validate:owner-support-now
npm run validate:owner-tooling-docs
```

## Scripts

- `npm run dev:api` - run API (`apps/api`).
- `npm run dev:web` - run local UI (`apps/web`).
- `npm test` - run API and web local-storage functional tests.
- `npm run test:visual` - run Playwright visual smoke tests for the built site and app, writing screenshots to `reports/visuals` and `reports/visual-test-report.json`.
- `npm run validate:visual-test-report` - verify the Playwright visual report and expected screenshots.
- `npm run typecheck` - typecheck API and web workspaces.
- `npm run validate:public` - verify public-repo safety checks, license, ignores, and mobile local-only defaults.
- `npm run validate:owner-tools` - check owner-side release tools without reading or printing secrets.
- `npm run release:support-now` - print the current owner-side blocker list and safe helper commands.
- `npm run generate:release-blockers` - generate the compact owner go/no-go blocker report.
- `npm run validate:release-blockers` - verify the blocker report stays current and secret-safe.
- `npm run validate:owner-support-now` - verify the support-now helper stays public-safe.
- `npm run validate:owner-tooling-docs` - verify owner tooling docs list the safe helper suite.
- `npm run validate:signing-readiness` - verify non-secret signing prerequisites before private keystore prompts.
- `npm run validate:cloudflare-readiness` - verify non-secret Cloudflare Pages deployment readiness.
- `npm run owner-tools:gh-help` - print safe GitHub CLI install/authentication guidance.
- `npm run owner-tools:cloudflare-domain-help` - print Cloudflare Pages custom-domain attachment steps without reading tokens.
- `npm run cloudflare:attach-domains` - dry-run the Cloudflare Pages custom-domain API attach plan without reading tokens.
- `npm run cloudflare:attach-domains:apply` - attach `open-cycle.com` and `www.open-cycle.com` through the Cloudflare API using owner-provided shell env vars.
- `npm run validate:cloudflare-domain-api-helper` - verify the Cloudflare API attach helper stays secret-safe.
- `npm run owner-tools:publish-help` - print public GitHub publication commands without running Git.
- `npm run generate:git-publication-preflight` - write an offline Git publication readiness report without pushing code.
- `npm run validate:git-publication-preflight` - verify the Git publication preflight report is public-safe.
- `npm run owner-tools:android-signing-help` - print private Android signing steps without reading keystores or passwords.
- `npm run owner-tools:runtime-qa-help` - print signed-candidate runtime QA steps without handling private artifacts.
- `npm run owner-tools:play-upload-help` - print manual Play Console upload steps without reading Play credentials.
- `npm run owner-tools:env-help` - print safe PowerShell commands for detected Java/Android release tooling.
- `npm run owner-tools:wrangler-help` - print safe optional Wrangler setup guidance for local Cloudflare checks.
- `npm run validate:functions` - verify the validation matrix and required function-level tests are present.
- `npm run validate:workflows` - verify public CI/deploy workflows use expected gates and secret boundaries.
- `npm run generate:workflow-provenance` - write ignored public workflow provenance evidence.
- `npm run validate:workflow-provenance` - verify workflow provenance, unsigned-only Android artifacts, `site/dist` deploys, and secret boundaries.
- `npm run validate:local-only-deps` - verify dependency/config surfaces do not include ads, analytics, crash reporting, push, or hidden-tracking SDK signals.
- `npm run validate:local-only-runtime` - verify app/runtime sources do not include network, analytics, cloud sync, ads, push notifications, or remote API env paths.
- `npm run generate:privacy-parity` - write ignored evidence that app, website, Android, and Play privacy claims agree.
- `npm run validate:privacy-parity` - verify free/local/no collection/no sharing/no ads/no account/no internet permission claims stay aligned.
- `npm run validate:site` - verify `site/dist` has privacy, redirect, and security-header deploy files.
- `npm run validate:site:live -- --url <https-url>` - verify the deployed site serves privacy, headers, scrutiny link, and gentle redirect flow, then write an ignored live-site evidence report.
- `npm run generate:cloudflare-pages-deployment` - write Wrangler-backed Cloudflare Pages deployment evidence for the latest Pages preview and stable Pages domain.
- `npm run validate:cloudflare-pages-deployment` - verify the Cloudflare Pages deployment report is public-safe and still shows the current custom-domain attachment state.
- `npm run validate:android` - verify Android local-only manifest and mobile release settings.
- `npm run generate:android-permissions` - write ignored Android permissions and backup-settings evidence.
- `npm run validate:android-permissions` - verify the public Android manifest requests zero permissions, disables backup, and matches Play identity.
- `npm run generate:visual-evidence` - write the public-safe manifest of website, app, emulator, and Play Store graphic evidence with dimensions and hashes.
- `npm run validate:visual-evidence` - verify the visual evidence manifest matches the generated screenshots and Play Store graphics.
- `npm run generate:play-assets` - generate public-safe Play Store SVG asset sources.
- `npm run export:play-assets` - export Play Store PNG upload assets from the SVG sources.
- `npm run validate:play-assets` - verify generated Play Store asset dimensions, PNG headers, and required copy.
- `npm run generate:play-metadata` - generate Play Store listing/data-safety metadata JSON.
- `npm run validate:play-metadata` - verify Play Store metadata lengths, claims, links, and asset paths.
- `npm run generate:play-release-notes` - generate Play Store release notes for the current Android version.
- `npm run validate:play-release-notes` - verify release notes length, version, and local-only claims.
- `npm run preflight:play-store` - write a local public-safe Play Store readiness report.
- `npm run generate:play-console-packet` - write a public-safe Play Console upload packet from generated metadata.
- `npm run validate:play-console-packet` - verify the generated Play Console packet omits sensitive material.
- `npm run generate:play-console-field-map` - write JSON and Markdown field-by-field Play Console upload values.
- `npm run validate:play-console-field-map` - verify the field map covers listing, graphics, declarations, and private upload boundaries.
- `npm run generate:play-console-submit-bundle` - copy Play listing text, graphics, declaration packets, the visual evidence manifest, and visual QA evidence into `dist/play-console-submit`.
- `npm run validate:play-console-submit-bundle` - verify the submit bundle has expected checksums and no signed AAB, keystore, or credential material.
- `npm run generate:play-upload-confirmation` - create the ignored private Play upload confirmation template.
- `npm run validate:play-upload-confirmation` - verify the upload confirmation structure; add `-- --require-complete` after Play upload.
- `npm run generate:runtime-qa-report` - create a private signed-candidate runtime QA report template.
- `npm run validate:runtime-qa-report` - verify the runtime QA report structure; add `-- --require-complete` before Play upload.
- `npm run generate:emulator-qa-report` - summarize local emulator launch, Cycle Log, saved-entry screenshot, and UIAutomator evidence in `reports/emulator-qa-report.json`.
- `npm run generate:github-publication-packet` - write a public-safe GitHub publication handoff packet.
- `npm run validate:github-publication-packet` - verify the GitHub publication packet omits assigned secrets.
- `npm run validate:github:live` - verify the pushed GitHub repository is public and exposes expected public files.
- `npm run validate:github:actions` - verify public GitHub Actions workflow runs have completed successfully.
- `npm run release:status` - write a public-safe summary of release evidence and remaining private steps.
- `npm run validate:release-status` - verify the generated release status report.
- `npm run release:audit` - write a final public-safe release audit from generated release reports and packets.
- `npm run validate:release-audit` - verify the final release audit has no public blockers.
- `npm run generate:release-evidence-index` - write the ignored public-safe release evidence index.
- `npm run validate:release-evidence-index` - verify the generated release evidence index is complete and secret-safe.
- `npm run validate:release-evidence-docs` - verify the committed public evidence guide links to the release proof chain.
- `npm run release:next` - print the current release audit status, pending checks, and recommended next commands.
- `npm run release:handoff` - refresh function coverage, Play preflight, release status, public handoff packets, private report templates, and audit reports, validate release/public safety reports, and print current next steps.
- `npm run validate:release-handoff` - verify the handoff command stays complete and public-safe.
- `npm run release:public-ready` - run the complete public-safe readiness chain, including Play public readiness, live-site validation, live GitHub publication validation, reports, packets, audit, and public safety.
- `npm run validate:play-store-public` - run the complete no-secrets Play readiness path through unsigned AAB validation and preflight.
- `npm run validate:play-store-private-ready -- --dry-run` - preview the final signed-candidate Play upload gate.
- `npm run validate:play-store-complete -- --dry-run` - preview the final post-upload completion gate.
- `npm run validate:release` - run public-link, safety, test, typecheck, and build gates.
- `npm run build` - build API and web app.
- `npm run start` - start compiled API.
- `npm run start:web` - preview compiled UI.
- `npm run dev:site` - preview site locally.
- `npm run build:site` - build site for deployment.
- `npm run start:site` - preview built site locally.
- `npm run deploy:site:local` - deploy `site/dist` to Cloudflare Pages with local Wrangler auth.
- `npm run deploy:site:local:npx` - deploy `site/dist` through `npx wrangler` if Wrangler is not globally installed.
- `npm run build:mobile:web` - build web assets for mobile shells.
- `npm run mobile:init:android` - create Android platform project.
- `npm run mobile:sync:android` - sync web app into Android platform.
- `npm run mobile:open:android` - open Android project in Android Studio.
- `npm run mobile:build:aab` - build Android App Bundle output from Gradle, using a temp Android build root to avoid stale OneDrive-locked generated assets.
- `npm run mobile:create-upload-keystore` - create a local Play upload keystore outside the repo.
- `npm run mobile:sign:aab` - sign a built `.aab` with Java `jarsigner`.
- `npm run mobile:release:android -- --dry-run` - preview the private local Android release command sequence.
- `npm run mobile:release:android:prompted -- -DryRun` - preview the prompted private Android release wrapper.
- `npm run set-public-links -- --org <github-org-or-user> --repo <github-repo>` - resolve GitHub links for published references.
- `npm run check-public-links` - verify all GitHub placeholders are resolved.
- `npm run prepare-site-links` - set and verify public references in one step.

## Security defaults

- Helmet headers.
- CORS allow-list via `ALLOWED_ORIGINS`.
- Request rate limiting.
- Zod payload validation.
- Optional standalone API `x-api-key` check (`API_KEY`) for local backend experiments that need a tighter guard.
- Local file persistence at `apps/api/data/cycles.json`.

## Optional redirect path to OpenCycle

Advanced-feature paths are gently redirected from:

- The public website and legacy domain routes (`local_cycle.com`, `www.local_cycle.com`, `open-cycle.com`, `www.open-cycle.com`) via static redirects.
- Optional in-app access for these same paths when directly loaded in the local app, with a short gentle countdown.

- `/features`
- `/pro`
- `/upgrade`
- `/pricing`
- `/features/`
- `/pro/`
- `/upgrade/`
- `/pricing/`

The local app itself stays fully local. Direct navigation to advanced-feature paths
shows a short optional redirect notice, so existing core tracking flows remain untouched.

## Deployment

- Publish this repository publicly on GitHub (see `docs/github-and-visibility.md`).
- Deploy `site/` with Cloudflare Pages (`site/dist` includes `_redirects` and `_headers`).
- Optional local Wrangler deploy uses `wrangler.toml` and `site/dist`; build first with `npm run build:site`, then run `npm run deploy:site:local`.
- Add Cloudflare deployment secrets with `docs/deployment-secrets.md`; never commit tokens or keystores.
- If `gh` is unavailable, use `docs/github-web-publication.md` for the public-safe GitHub web UI fallback.
- Prepare owner-side release tools with `docs/owner-tooling.md`; never commit tokens, keystores, passwords, or signed artifacts.
- Use repository metadata links safely with `npm run set-public-links` before publishing.
- Verify placeholders are resolved with:

```bash
npm run check-public-links
```
- Or run both in one step:

```bash
npm run prepare-site-links
```

- For legacy domains (`local_cycle.com`, `www.local_cycle.com`, `open-cycle.com`, `www.open-cycle.com`), use `deploy/cloudflare/redirect-worker.js` or redirect rules.
- This repo includes two publish workflows:
  - `.github/workflows/deploy-site.yml` for Pages.
  - `.github/workflows/deploy-redirect-worker.yml` for the legacy redirect worker (optional).
- Both deploy workflows can be rerun manually from GitHub Actions after secrets,
  variables, or Cloudflare domain settings change.
- If your OpenCycle page links to this repo, update the repository placeholders by running:

```bash
GITHUB_REPOSITORY=yourname/open-cycle npm run set-public-links
```

`GITHUB_REPOSITORY` is automatically populated in GitHub Actions, so local/public links are filled without
manual values when you publish.

If your local git remote already points to GitHub, you can also run:

```bash
npm run set-public-links
```

After the first public push, verify the live repository with:

```bash
npm run validate:github:live
```

## Mobile release prep (Play Store first, iOS next)

### Signed Android App Bundle (`.aab`)

From repo root:

```bash
npm install
npm run build:mobile:web
npm run mobile:build:aab
```

Expected output:

`apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

Then sign it:

```bash
npm run owner-tools:android-signing-help
npm run mobile:release:android:prompted -- -DryRun
npm run mobile:release:android:prompted
npm run mobile:signed-aab:evidence -- --require-signed
```

The prompted signing helper asks for the upload keystore path and passwords
locally, sets signing environment variables only for the signing process, and
clears them afterward. The signing helper uses Java `jarsigner`, which is the
expected signing tool for Android App Bundles.

### iOS release (planned)

- Run iOS initialization once Android validation is complete:
  - `npm run build:mobile:web`
  - `npm run mobile:sync:ios`
- Open with `npm run mobile:open:ios` and archive with Xcode.

See also [docs/mobile-release.md](docs/mobile-release.md) for a full release playbook.
See [docs/play-store-release.md](docs/play-store-release.md) for Play Store listing text,
data-safety answers, and final upload checks.
Use [docs/runtime-qa.md](docs/runtime-qa.md) for signed Android candidate QA.
Use [docs/android-keystore-handling.md](docs/android-keystore-handling.md) for
private upload keystore handling and backup expectations.
Use [docs/release-evidence.md](docs/release-evidence.md) to regenerate the
public-safe evidence trail for scrutiny without exposing private signing or
deployment material.

After the first public GitHub push and before private signing, the one-command
public readiness gate is:

```bash
npm run release:public-ready
```

Use `npm run release:public-ready -- --skip-live-site` only when the hosted site
cannot be reached from the current environment. Use
`npm run release:public-ready -- --skip-live-github --skip-live-actions` only for
pre-push local prep, because the final audit will keep `liveGithubPublication`
and `liveGithubActions` pending until the live checks succeed.

After `open-cycle.com` validation, public GitHub publication/actions validation,
private signing, signed runtime QA, and Play Console upload, the final
completion gate is:

```bash
npm run validate:play-store-complete
```

## Public security review

Use [SECURITY.md](SECURITY.md) for vulnerability reporting guidance. The
`Android AAB Check` GitHub workflow validates public Play Console and Android
evidence without signing secrets, so public CI can prove the release materials
while the real upload keystore stays local.
