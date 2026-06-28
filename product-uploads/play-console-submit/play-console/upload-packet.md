# Play Console upload packet

This packet is public-safe. It does not include signing passwords, keystore paths, Cloudflare tokens, or Play Console credentials.

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free
- Ads: No
- In-app purchases: No
- Account required: No
- Internet required for core tracking: No

## Store listing

### Short description

Free privacy-first period tracker. No account, ads, or cloud sync.

### Full description

open-cycle is a simple, free, privacy-first period tracker. Save dates, flow, symptoms, moods, and notes so you can remember what happened and notice patterns over time.

You do not need an account to use the tracker. There are no ads, no required cloud sync, and no required internet connection to add or review entries. Your saved entries stay on your phone.

open-cycle is a personal wellness log, not medical advice, diagnosis, or treatment. Talk with a doctor or qualified clinician about health concerns.

For reminders, exports, richer pattern views, and a larger feature set, Local Cycle offers a separate one-time paid option at local-cycle.com. open-cycle remains free for everyday tracking.

## Privacy and support

- Privacy policy URL: https://open-cycle.com/privacy
- Temporary privacy policy fallback before custom-domain validation: https://open-cycle-site.pages.dev/privacy
- Custom-domain validation command before final Play upload: `npm run validate:custom-domain:live`
- Support URL: https://github.com/kborndorff/Open-Cycle/issues

## Data safety

- Dedicated packet: `reports/play-data-safety-packet.md`
- Content rating and app content packet: `reports/play-content-rating-packet.md`
- Health apps declaration packet: `reports/play-health-declaration-packet.md`
- App access packet: `reports/play-app-access-packet.md`
- Ads declaration packet: `reports/play-ads-declaration-packet.md`
- Target audience and children declaration packet: `reports/play-target-audience-packet.md`
- Testing and production access packet: `reports/play-testing-rollout-packet.md`
- Aggregate App content packet: `reports/play-app-content-packet.md`
- Release candidate packet: `reports/play-release-candidate-packet.md`
- Data collected: None
- Data shared with third parties: No
- Location data collected: No
- Health data collected: No
- Advertising ID used: No
- User data deletion: Users can delete one entry or clear all entries saved on this device in the app. Uninstalling the app also removes app storage according to Android behavior.
- In-app local deletion controls: delete one cycle entry or clear all local cycle entries.

## Graphics and screenshots

- App icon: `store-assets/play/app-icon.png`
- Feature graphic: `store-assets/play/feature-graphic.png`
- Phone screenshot: `store-assets/play/phone-screenshot-1.png`
- Phone screenshot: `store-assets/play/phone-screenshot-2.png`
- Phone screenshot: `store-assets/play/phone-screenshot-3.png`
- Phone screenshot: `store-assets/play/phone-screenshot-4.png`
- 7-inch tablet screenshot: `store-assets/play/tablet-7-screenshot-1.png`
- 7-inch tablet screenshot: `store-assets/play/tablet-7-screenshot-2.png`
- 7-inch tablet screenshot: `store-assets/play/tablet-7-screenshot-3.png`
- 7-inch tablet screenshot: `store-assets/play/tablet-7-screenshot-4.png`
- 10-inch tablet screenshot: `store-assets/play/tablet-10-screenshot-1.png`
- 10-inch tablet screenshot: `store-assets/play/tablet-10-screenshot-2.png`
- 10-inch tablet screenshot: `store-assets/play/tablet-10-screenshot-3.png`
- 10-inch tablet screenshot: `store-assets/play/tablet-10-screenshot-4.png`

### Alt text

- `store-assets/play/app-icon.png`: open-cycle circular cycle tracker icon with four marked cycle points.
- `store-assets/play/feature-graphic.png`: open-cycle feature graphic describing free local period tracking with no account or cloud sync.
- `store-assets/play/phone-screenshot-1.png`: Phone view of the cycle log form, saved entries, and no-internet-required message.
- `store-assets/play/phone-screenshot-2.png`: Phone dashboard showing simple entries, latest entry summary, and privacy copy that says entries stay on this device.
- `store-assets/play/phone-screenshot-3.png`: Phone view showing recent cycle entries with edit and delete controls.
- `store-assets/play/phone-screenshot-4.png`: Phone controls screen showing total entries and clear-all local entries option.
- `store-assets/play/tablet-7-screenshot-1.png`: 7-inch tablet dashboard showing entry count, latest entry, and no internet requirement.
- `store-assets/play/tablet-7-screenshot-2.png`: 7-inch tablet entry form for date, flow, mood, symptoms, notes, and saving an entry.
- `store-assets/play/tablet-7-screenshot-3.png`: 7-inch tablet review screen with recent entries plus edit and delete controls.
- `store-assets/play/tablet-7-screenshot-4.png`: 7-inch tablet privacy screen showing no ads or hidden tracking and clear-all local entries.
- `store-assets/play/tablet-10-screenshot-1.png`: 10-inch tablet dashboard showing entry count, latest entry, and no internet requirement.
- `store-assets/play/tablet-10-screenshot-2.png`: 10-inch tablet entry form for date, flow, mood, symptoms, notes, and saving an entry.
- `store-assets/play/tablet-10-screenshot-3.png`: 10-inch tablet review screen with recent entries plus edit and delete controls.
- `store-assets/play/tablet-10-screenshot-4.png`: 10-inch tablet privacy screen showing no ads or hidden tracking and clear-all local entries.

## Release notes

```text
open-cycle 2.0

- Free local cycle logging with no account, ads, hidden tracking, or cloud sync.
- Cycle data stays on your device for core tracking.
- Public source and privacy policy are available for review.
```

## AAB artifacts

- Unsigned AAB exists: Yes
- Unsigned AAB SHA-256: 04bf93f886d72e8cedd961051f64821a1d724bd7edf50fb2b0a99abf4e4fd44f
- Signed AAB file present locally: Yes
- Current signed candidate ready: No
- Current signed candidate status: signed file exists, but it is not the current validated release candidate
- Signed AAB evidence status: pending-signed-aab

## Private upload boundary and confirmation

- Signed AAB status: locally created and validated only when `Current signed candidate ready` is `Yes` and `npm run preflight:play-store` reports `ready-for-play-upload`.
- Signed runtime QA status: complete when `npm run validate:runtime-qa-report -- --require-complete` passes.
- Re-run `npm run mobile:release:android:prompted` only if rebuilding or replacing the private signed AAB.
- Keep `docs/runtime-qa.md` and `reports/runtime-qa-report.md` matched to the signed candidate selected for upload.
- Remaining before final Play upload: confirm `open-cycle.com` still passes `npm run validate:custom-domain:live`, then upload the current validated signed AAB, store listing, graphics, final custom-domain privacy URL, and release notes in Play Console.
- Generate or update `reports/play-console-upload-confirmation.json` after upload.
- Keep `signedAabSha256` and `signedAabSizeBytes` matched to the uploaded signed AAB.
- Set `dataSafetySubmitted` to `true` after submitting the Play Data safety form.
- Keep `dataSafetyDataCollected` as `None`.
- Keep `dataSafetyDataSharedWithThirdParties` as `false`.
- Set `noAdsOrAdvertisingIdConfirmed` to `true` after confirming ads and Advertising ID are not used.
- Set `noAccountCreationConfirmed` to `true` after confirming the app creates no accounts.
- Set `noInternetPermissionConfirmed` to `true` after confirming Play lists no Internet permission for the signed candidate.
- Set `signedRuntimeQaComplete` to `true` only after the signed runtime QA validator passes for the uploaded candidate.
- Run `npm run validate:play-upload-confirmation -- --require-complete` before final completion.

## Public validation evidence

- `npm run validate:release`
- `npm run validate:play-store-public`
- `npm run validate:site:live -- --url=https://open-cycle-site.pages.dev`
- `npm run validate:custom-domain:live`
- `npm run validate:play-content-rating`
- `npm run validate:play-health-declaration`
- `npm run validate:play-app-access`
- `npm run validate:play-ads-declaration`
- `npm run validate:play-target-audience`
- `npm run validate:play-testing-rollout`
- `npm run validate:play-app-content`
- `npm run validate:play-release-candidate`
- `npm run validate:play-data-safety`
- `npm run validate:play-upload-confirmation`
- `npm run release:status`
