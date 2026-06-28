# Play Store release checklist

This document keeps the Play Store submission aligned with the public codebase:
free local tracking, no accounts, no ads, no hidden tracking, and no hidden cloud dependency.

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free
- Ads: No
- In-app purchases: No
- Account required: No
- Internet required for core tracking: No

## Short description

Free cycle tracking with no account, no ads, no hidden tracking, and no cloud sync.

## Full description

open-cycle is a free period and cycle tracker for simple logging. Save dates,
flow, symptoms, moods, and notes directly on your device.

The app is intentionally small: no signup, no account, no ads, no hidden
tracking, no cloud sync, and no required network service for core tracking.
The source is public so people can inspect how the local-only tracker works.

open-cycle is a personal wellness log, not medical advice, diagnosis, or
treatment. Talk with a qualified clinician for health concerns.

Local Cycle offers optional one-time paid features such as reminders, richer
pattern views, exports, and a larger feature set. open-cycle remains free and
usable without those extras. Learn more at https://local-cycle.com.

## Data safety draft

- Data collected: None
- Data shared with third parties: No
- Data encrypted in transit: Not applicable for core tracking because no data is
  transmitted by the public local-only build.
- Account deletion: Not applicable because the app does not create accounts.
- User data deletion: Users can delete individual cycle entries or clear all
  local entries in the app; uninstalling the app removes local app storage
  according to Android behavior.
- Location data: Not collected
- Health data: Not collected
- Financial info: Not collected
- Contacts: Not collected
- Photos/videos/audio/files: Not collected
- Device identifiers: Not collected by app code
- Advertising ID: Not used

## Privacy policy URL

Use the custom-domain privacy URL after `open-cycle.com` is attached and live
validation passes:

```text
https://open-cycle.com/privacy
```

Until the custom domain is live, use the hosted Cloudflare Pages URL as the
temporary fallback:

```text
https://open-cycle-site.pages.dev/privacy
```

Before confirming the final Play upload, run:

```powershell
npm run validate:custom-domain:live
```

## Release artifact checks

Before uploading to Play Console:
Print the Play upload helper without entering account credentials:

```powershell
npm run owner-tools:play-upload-help
npm run validate:play-upload-helper
```


- Run `npm run release:public-ready` for the complete public-safe readiness
  chain after the public GitHub push. Use `-- --skip-live-site` only when the
  hosted site is temporarily unreachable from the current environment. Use
  `-- --skip-live-github` only for pre-push local prep.
- Run `npm run validate:play-store-public` for the complete no-secrets public
  readiness path. It should end with only `signedAab` pending.
- Run `npm run validate:release`.
- Run `npm run generate:play-assets`.
- Run `npm run export:play-assets`.
- Run `npm run validate:play-assets`.
- Run `npm run generate:play-metadata`.
- Run `npm run validate:play-metadata`.
- Run `npm run generate:play-data-safety`.
- Run `npm run validate:play-data-safety`.
- Run `npm run generate:play-content-rating` and
  `npm run validate:play-content-rating` to prepare the public-safe Play
  content rating and app content answers in
  `reports/play-content-rating-packet.md`.
- Run `npm run generate:play-health-declaration` and
  `npm run validate:play-health-declaration` to prepare the public-safe Play
  Health Apps declaration answers in
  `reports/play-health-declaration-packet.md`.
- Run `npm run generate:play-app-access` and
  `npm run validate:play-app-access` to prepare the public-safe Play App
  access answers in `reports/play-app-access-packet.md`.
- Run `npm run generate:play-ads-declaration` and
  `npm run validate:play-ads-declaration` to prepare the public-safe Play ads
  declaration answers in `reports/play-ads-declaration-packet.md`.
- Run `npm run generate:play-target-audience` and
  `npm run validate:play-target-audience` to prepare the public-safe Play
  target audience and children declaration answers in
  `reports/play-target-audience-packet.md`.
- Run `npm run generate:play-testing-rollout` and
  `npm run validate:play-testing-rollout` to prepare the public-safe Play
  testing and production-access plan in
  `reports/play-testing-rollout-packet.md`.
- Run `npm run generate:play-app-content` and
  `npm run validate:play-app-content` to prepare the aggregate public-safe Play
  App content declaration index in `reports/play-app-content-packet.md`.
- Run `npm run preflight:play-store`, then
  `npm run generate:play-release-candidate` and
  `npm run validate:play-release-candidate` to prove the unsigned AAB evidence,
  Play preflight, release notes, and private signed-AAB boundary agree in
  `reports/play-release-candidate-packet.md`.
- Run `npm run validate:signing-readiness`, then
  `npm run generate:android-signing-handoff` and
  `npm run validate:android-signing-handoff` to prepare the public-safe private
  signing handoff in `reports/android-signing-handoff-packet.md`.
- Run `npm run generate:play-production-readiness` and
  `npm run validate:play-production-readiness` to summarize public-ready
  evidence and remaining private production gates in
  `reports/play-production-readiness-packet.md`.
- Run `npm run generate:play-release-notes`.
- Run `npm run validate:play-release-notes`.
- Run `npm run mobile:build:aab`.
- Run `npm run validate:android -- --require-aab` with `JAVA_HOME` set.
- Run `npm run generate:android-permissions` and
  `npm run validate:android-permissions` to prove the public manifest requests
  zero permissions, omits internet access, and disables Android backup.
- Run `npm run preflight:play-store` to generate a local readiness report that
  includes AAB, privacy, Play asset, Play metadata, and release-notes evidence.
- Run `npm run generate:play-console-packet` and
  `npm run validate:play-console-packet` to prepare a public-safe Play Console
  upload packet in `reports/play-console-upload-packet.md` that references the
  release candidate, aggregate App content, testing rollout, target audience,
  ads declaration, App access, Health declaration, content rating, and
  data-safety packets.
- Run `npm run generate:play-console-field-map` and
  `npm run validate:play-console-field-map` to prepare public-safe JSON and
  Markdown field maps for values to enter or confirm in Play Console.
- Run `npm run generate:visual-evidence` and
  `npm run validate:visual-evidence` to record public-safe dimensions, byte
  sizes, and SHA-256 hashes for website screenshots, app screenshots, Android
  emulator screenshots, UIAutomator XML, and Play Store graphics.
- Run `npm run generate:play-console-submit-bundle` and
  `npm run validate:play-console-submit-bundle` after Play Store assets,
  packets, Playwright screenshots, visual evidence, and emulator evidence exist. The generated
  `dist/play-console-submit` folder gathers public-safe listing text, graphics,
  declaration packets, and visual QA evidence for the private Play Console
  upload step. It intentionally excludes the signed AAB and keystore material.
  Open `dist/play-console-submit/visual-review.html` locally to inspect all
  store graphics, alt text, website visuals, app visuals, and emulator evidence
  in one place before uploading.
- Run `npm run release:audit` and `npm run validate:release-audit` for a
  public-safe final audit before private signing and upload.
- Run `npm run validate:site:live -- --url <hosted-site-url>` after Cloudflare
  Pages deploys, then run `npm run validate:custom-domain:live` after
  `open-cycle.com` is attached. Use `https://open-cycle.com/privacy` in Play
  Console for final confirmation.
- Run `npm run validate:github:live` and `npm run validate:github:actions`
  after the public repository is pushed and GitHub Actions completes.
- Run `npm run validate:play-store-complete` only after custom-domain
  validation, public GitHub validation, public GitHub Actions validation,
  private signing, signed runtime QA, and Play Console upload confirmation all
  pass.
- Confirm Android package identity, app name, `versionCode`, and `versionName`
  pass `npm run validate:android`.
- Confirm GitHub's `Android AAB Check` workflow passes and uploads the unsigned AAB artifact.
- If needed, create the upload keystore with `npm run mobile:create-upload-keystore`.
- Review `docs/android-keystore-handling.md` before creating or using the upload keystore.
- Run `npm run validate:signing-readiness` to confirm non-secret signing
  prerequisites are ready before entering keystore prompts.
- Sign the AAB with the real upload keystore using `npm run mobile:sign:aab`.
- Run `npm run validate:android -- --require-signed` after signing.
- Run `npm run validate:play-store-private-ready` after signing and completing
  `reports/runtime-qa-report.md`. It should end with `ready-for-play-upload`.
- Use `npm run owner-tools:runtime-qa-help` and `npm run validate:runtime-qa-helper` for the private signed-candidate runtime QA sequence.
- After Play Console upload, run `npm run generate:play-upload-confirmation`,
  fill `reports/play-console-upload-confirmation.json`, keep `signedAabSha256`
  and `signedAabSizeBytes` matched to the signed AAB you uploaded, then run
  `npm run validate:play-upload-confirmation -- --require-complete`.
- Existing runtime QA and Play upload confirmation reports are preserved by
  default. Use `-- --force` with their generators only when you intentionally
  want to replace the private templates.
- Run `npm run validate:play-store-complete` as the final private completion
  gate. It should end with final audit status `play-upload-confirmed`.
- Confirm the public build exposes no remote API env path by running
  `npm run validate:local-only-runtime`.
- Confirm `AndroidManifest.xml` has no `android.permission.INTERNET`.
- Confirm Android backup remains disabled.
- Confirm `reports/android-permissions.json` passes before final upload.
- Complete `docs/runtime-qa.md` on a signed candidate build.

## Play listing assets

- App icon upload: `store-assets/play/app-icon.png`.
- Feature graphic upload: `store-assets/play/feature-graphic.png`.
- Phone screenshot uploads:
  `store-assets/play/phone-screenshot-1.png`,
  `store-assets/play/phone-screenshot-2.png`,
  `store-assets/play/phone-screenshot-3.png`, and
  `store-assets/play/phone-screenshot-4.png`.
- 7-inch tablet screenshot uploads:
  `store-assets/play/tablet-7-screenshot-1.png`,
  `store-assets/play/tablet-7-screenshot-2.png`,
  `store-assets/play/tablet-7-screenshot-3.png`, and
  `store-assets/play/tablet-7-screenshot-4.png`.
- 10-inch tablet screenshot uploads:
  `store-assets/play/tablet-10-screenshot-1.png`,
  `store-assets/play/tablet-10-screenshot-2.png`,
  `store-assets/play/tablet-10-screenshot-3.png`, and
  `store-assets/play/tablet-10-screenshot-4.png`.
- Editable asset sources are the matching `.svg` files in `store-assets/play`.
- Store listing and data-safety draft are generated at
  `store-assets/play/listing.json`.
- Graphic alt text for the app icon, feature graphic, phone screenshots, and
  tablet screenshots is generated in `store-assets/play/listing.json` under
  `assetAltText` and repeated in `reports/play-console-upload-packet.md`.
- Play release notes are generated at `store-assets/play/release-notes.txt`.
- Real device/emulator screenshots from the signed candidate build.
- Tablet screenshots are generated for both 7-inch and 10-inch Play listing
  sections.
- Final support contact or security-reporting link.
