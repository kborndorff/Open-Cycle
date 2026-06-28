# Validation matrix

This matrix maps the public free/local promise to automated checks in the repo.
It is intentionally small, public-safe, and runnable without signing secrets.

## Core local tracking functions

| Function or behavior | Evidence |
| --- | --- |
| Create cycle entry locally | `apps/web/test/api.local.test.ts`: `local storage mode creates, lists, updates, and deletes cycle entries without network` |
| List cycle entries locally | `apps/web/test/api.local.test.ts`: `local storage mode creates, lists, updates, and deletes cycle entries without network` |
| Sort cycle entries newest first | `apps/web/test/api.local.test.ts`: `local storage mode sorts cycle entries newest first and recovers from corrupt local data` |
| Update cycle entry locally | `apps/web/test/api.local.test.ts`: `local storage mode creates, lists, updates, and deletes cycle entries without network` |
| Delete cycle entry locally | `apps/web/test/api.local.test.ts`: `local storage mode creates, lists, updates, and deletes cycle entries without network` |
| Clear all local cycle entries | `apps/web/test/api.local.test.ts`: `local storage mode clears all cycle entries without network` |
| Reject invalid local create payloads | `apps/web/test/api.local.test.ts`: `local storage mode rejects invalid cycle entry payloads` |
| Reject invalid local update payloads | `apps/web/test/api.local.test.ts`: `local storage mode validates updates and missing records` |
| Recover from corrupt browser storage | `apps/web/test/api.local.test.ts`: `local storage mode sorts cycle entries newest first and recovers from corrupt local data` |
| Avoid network in local mode | `apps/web/test/api.local.test.ts`: local test fetch stub throws if any network request is attempted |

## Standalone local API workspace functions

| Function or behavior | Evidence |
| --- | --- |
| Public health checks | `apps/api/test/api.test.ts`: `health endpoints stay public and report service status` |
| Create/list/get/update/delete cycle records | `apps/api/test/api.test.ts`: `cycle CRUD persists local records and returns expected statuses` |
| Clear all standalone local API cycle records | `apps/api/test/api.test.ts`: `cycle clear-all removes local records and reports deleted count` |
| Ignore malformed standalone local API storage records | `apps/api/test/api.test.ts`: `API storage ignores malformed local cycle records and normalizes valid entries` |
| Reject invalid API payloads and ids | `apps/api/test/api.test.ts`: `cycle validation rejects invalid payloads and ids` |
| Protect standalone API routes when `API_KEY` is configured | `apps/api/test/api.test.ts`: `API key guard protects API routes when configured` |

## Release and public-safety gates

| Requirement | Evidence |
| --- | --- |
| Public repo has source-available terms | `npm run validate:public` checks `LICENSE.md` and package metadata |
| Public repo excludes secrets and keystores | `npm run validate:public` checks committed files and `.gitignore` |
| Public repo publication boundary is documented | `npm run generate:public-repo-manifest`, then `npm run validate:public-repo-manifest` checks `reports/public-repository-publication-manifest.md` |
| Android private signing helper stays owner-controlled | `npm run owner-tools:android-signing-help` prints commands only; `npm run validate:android-signing-helper` checks it does not prompt for or print signing secrets |
| Play upload helper stays owner-controlled | `npm run owner-tools:play-upload-help` prints manual Play Console steps only; `npm run validate:play-upload-helper` checks it does not include upload automation or service-account secrets |
| Public GitHub publication helper stays owner-controlled | `npm run owner-tools:publish-help` prints commands only; `npm run validate:github-publication-helper` checks it does not run Git or print secrets |
| Public build avoids ads, analytics, crash reporting, push notifications, and hidden-tracking SDKs | `npm run validate:local-only-deps` scans dependency/config surfaces for incompatible SDK signals |
| Public app runtime avoids network, analytics, cloud sync, and remote API env paths | `npm run validate:local-only-runtime` scans app/runtime sources and `.env.example` |
| App, website, Android, and Play Store privacy claims stay aligned | `npm run generate:privacy-parity`, then `npm run validate:privacy-parity` checks `reports/privacy-parity.json` |
| Cloudflare Pages output deploys from `site/dist` | `npm run validate:site` and `.github/workflows/deploy-site.yml` |
| Cloudflare custom-domain owner steps are documented without secrets | `npm run owner-tools:cloudflare-domain-help` prints the dashboard steps; `npm run validate:cloudflare-domain-help` checks the helper stays public-safe |
| Website privacy, scrutiny link, and gentle Local Cycle feature-link flow are deployed | `npm run validate:site` checks `index.html`, `privacy.html`, `open-cycle.html`, `script.js`, `upgrade.js`, `_headers`, and `_redirects` in `site/dist` |
| Website and app render correctly at desktop and phone sizes | `npm run test:visual` runs Playwright checks against built `site/dist` and `apps/web/dist`, verifies no horizontal overflow, exercises local cycle-entry creation, and writes screenshots to `reports/visuals` plus `reports/visual-test-report.json` |
| Website, app, emulator, and Play Store graphics have machine-readable visual evidence | `npm run generate:visual-evidence`, then `npm run validate:visual-evidence` writes and verifies `reports/visual-evidence-manifest.json` with PNG dimensions, byte sizes, and SHA-256 hashes |
| Hosted Cloudflare Pages site serves the validated website behavior | `npm run validate:site:live -- --url <https-url>` checks live HTTPS, security headers, privacy page, scrutiny link, gentle redirect route, and writes `reports/live-site-publication.json` |
| Wrangler-backed Cloudflare Pages deployment evidence is captured | `npm run generate:cloudflare-pages-deployment`, then `npm run validate:cloudflare-pages-deployment` checks `reports/cloudflare-pages-deployment.json` for the latest Pages deployment, stable Pages domain, and pending or attached custom-domain state |
| Local Wrangler deploy uses site/dist | `wrangler.toml`, `npm run deploy:site:local`, and `npm run deploy:site:local:npx` deploy the built Pages output without putting Cloudflare tokens on the command line |
| Public GitHub workflows keep release gates and secret boundaries intact | `npm run validate:workflows` |
| Public GitHub workflow provenance report proves unsigned-only Android evidence, `site/dist` deploys, read-only permissions, and no Play/signing automation | `npm run generate:workflow-provenance`, then `npm run validate:workflow-provenance` checks `reports/workflow-provenance.json` |
| Play Store assets are generated and valid | `npm run generate:play-assets`, `npm run export:play-assets`, `npm run validate:play-assets` |
| Play Store listing/data-safety metadata is generated and valid | `npm run generate:play-metadata`, `npm run validate:play-metadata` |
| Play Store content rating and app content answers are generated and valid | `npm run generate:play-content-rating`, then `npm run validate:play-content-rating` checks `reports/play-content-rating-packet.md` against listing, privacy parity, Android permissions, and data-safety evidence |
| Play Store Health Apps declaration answers are generated and valid | `npm run generate:play-health-declaration`, then `npm run validate:play-health-declaration` checks `reports/play-health-declaration-packet.md` for Period Tracking, not-medical-device, no Health Connect, no health permissions, and disclaimer posture |
| Play Store App access answers are generated and valid | `npm run generate:play-app-access`, then `npm run validate:play-app-access` checks `reports/play-app-access-packet.md` for no login, no account, no test credentials, no paid gate, no network-required core review path, and local-only evidence |
| Play Store ads declaration answers are generated and valid | `npm run generate:play-ads-declaration`, then `npm run validate:play-ads-declaration` checks `reports/play-ads-declaration-packet.md` for no ads, no ad SDK dependencies, no Advertising ID, no ad monetization, and no location data for ads |
| Play Store target audience and children declaration answers are generated and valid | `npm run generate:play-target-audience`, then `npm run validate:play-target-audience` checks `reports/play-target-audience-packet.md` for the conservative 18+ target audience recommendation, no child-directed marketing, no Families ads posture, and owner review reminder |
| Play Store testing and production-access plan is generated and valid | `npm run generate:play-testing-rollout`, then `npm run validate:play-testing-rollout` checks `reports/play-testing-rollout-packet.md` for internal/closed testing posture, 12-tester/14-day production-access guidance for affected new personal accounts, and no tester identifiers |
| Aggregate Play App content declaration index is generated and valid | `npm run generate:play-app-content`, then `npm run validate:play-app-content` checks `reports/play-app-content-packet.md` and every individual Play App content packet |
| Play release candidate evidence is aligned | `npm run generate:play-release-candidate`, then `npm run validate:play-release-candidate` checks `reports/play-release-candidate-packet.md` against Play preflight, unsigned AAB evidence, release notes, Android version identity, and private signed-AAB boundary |
| Android private signing handoff is generated and valid | `npm run generate:android-signing-handoff`, then `npm run validate:android-signing-handoff` checks `reports/android-signing-handoff-packet.md` for signing readiness, unsigned evidence, release candidate, runtime QA template, and secret-safe private signing boundaries |
| Play production readiness private gates are summarized safely | `npm run generate:play-production-readiness`, then `npm run validate:play-production-readiness` checks `reports/play-production-readiness-packet.md` for current release status, pending private gates, and no premature production-complete claim |
| Play Store release notes are generated and valid | `npm run generate:play-release-notes`, `npm run validate:play-release-notes` |
| Play Store preflight captures final upload evidence | `npm run preflight:play-store` writes `reports/play-store-preflight.json` with AAB, asset, metadata, release-notes, privacy, and runtime QA checks |
| Complete no-secrets Play readiness path leaves only signing pending | `npm run validate:play-store-public` runs release validation, unsigned AAB build, Android AAB validation, and preflight |
| Public-safe release status summarizes evidence and private blockers | `npm run release:status`, then `npm run validate:release-status` checks `reports/release-status.json` |
| Final public-safe release audit summarizes GitHub, Cloudflare, Play, license, and remaining private work | `npm run release:audit`, then `npm run validate:release-audit` checks `reports/final-release-audit.json` |
| Release completion matrix maps every major release area to concrete proof | `npm run generate:release-completion-matrix`, then `npm run validate:release-completion-matrix` checks `reports/release-completion-matrix.md` and `reports/release-completion-matrix.json` |
| Release blocker report maps remaining owner-only gates to exact helper and proof commands | `npm run generate:release-blockers`, then `npm run validate:release-blockers` checks `reports/release-blocker-report.md` and `reports/release-blocker-report.json` |
| Public reviewer evidence guide is complete and secret-safe | `docs/release-evidence.md`, `npm run generate:release-evidence-index`, `npm run validate:release-evidence-index`, and `npm run validate:release-evidence-docs` |
| Complete public-safe release readiness chain | `npm run release:public-ready` runs public Play readiness, live-site validation, live GitHub publication validation, handoff packets, final audit, and public-safety validation |
| Public-safe Play Console upload packet is generated without secrets | `npm run generate:play-console-packet`, then `npm run validate:play-console-packet` checks `reports/play-console-upload-packet.md` |
| Play Console submit bundle gathers upload materials without private signing files | `npm run generate:play-console-submit-bundle`, then `npm run validate:play-console-submit-bundle` checks `dist/play-console-submit` after visual evidence and emulator evidence exist |
| Private Play Console upload confirmation avoids credentials and proves final account-side upload | `npm run generate:play-upload-confirmation`, then `npm run validate:play-upload-confirmation -- --require-complete` after upload |
| Public-safe GitHub publication handoff packet is generated without assigned secrets | `npm run generate:github-publication-packet`, then `npm run validate:github-publication-packet` checks `reports/github-publication-packet.md` |
| Live GitHub repository is public and exposes expected scrutiny files | `npm run validate:github:live` checks the public GitHub API and raw files after push and writes `reports/live-github-publication.json` |
| Live GitHub Actions checks passed publicly | `npm run validate:github:actions` checks latest public workflow runs for CI, Android AAB, and Pages deploy, then writes `reports/live-github-actions.json` |
| Android public build is local-only | `npm run validate:android -- --require-aab` checks manifest and `.aab` contents |
| Android manifest minimizes permissions and disables backup | `npm run generate:android-permissions`, then `npm run validate:android-permissions` checks `reports/android-permissions.json` |
| Android Play identity is consistent with store metadata | `npm run validate:android` checks Capacitor app ID/name, Gradle namespace/application ID/version, manifest labels, string resources, and `listing.json` |
| Full public release gate | `npm run validate:release` |

## Private release checks

These checks require local/private material and should not expose secrets in
GitHub:

| Requirement | Evidence |
| --- | --- |
| Signed Play upload bundle | `npm run mobile:sign:aab` with the private upload keystore |
| Signed bundle validation | `npm run validate:android -- --require-signed` |
| Runtime QA on signed candidate | `npm run generate:runtime-qa-report`, then `npm run validate:runtime-qa-report -- --require-complete` after filling `reports/runtime-qa-report.md` |
| Emulator screenshot and UIAutomator evidence is summarized | `npm run generate:emulator-qa-report` writes `reports/emulator-qa-report.json` from launch, Cycle Log, saved-entry screenshots, and `reports/visuals/android-window.xml` |
| Runtime QA helper stays owner-controlled | `npm run owner-tools:runtime-qa-help` prints the signed-candidate QA sequence only; `npm run validate:runtime-qa-helper` checks it does not include device-install automation or private credentials |
| Owner support now helper summarizes remaining private/external actions | `npm run release:support-now` prints current evidence and safe owner helpers; `npm run validate:owner-support-now` checks it does not include secret assignments |
| Owner tooling guide documents current helper suite | `npm run validate:owner-tooling-docs` checks `docs/owner-tooling.md` lists all safe helper commands without secret assignments |
| Final private Play upload readiness | `npm run validate:play-store-private-ready` requires live custom-domain privacy validation, signed AAB validation, completed runtime QA, final preflight, and Play Console packet |
| Play Console upload completed | `npm run validate:play-upload-confirmation -- --require-complete` checks the private ignored upload confirmation |
| Completed Play Store release handoff | `npm run validate:play-store-complete` requires live custom-domain validation, public GitHub publication/actions validation, signed validation, completed runtime QA, Play upload confirmation, and final audit status `play-upload-confirmed` |
