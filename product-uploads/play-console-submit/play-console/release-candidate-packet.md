# Play release candidate packet

This packet is public-safe. It summarizes the current Play release candidate without storing signing passwords, keystore paths, Play Console credentials, Cloudflare tokens, service-account JSON, signed AAB files, or private upload confirmations.

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free
- Android version code: 2
- Android version name: 2.0

## Candidate artifacts

- Preflight status: ready-for-private-signing
- Preflight pending private steps: signedAab
- Unsigned AAB exists: Yes
- Unsigned AAB SHA-256: 04bf93f886d72e8cedd961051f64821a1d724bd7edf50fb2b0a99abf4e4fd44f
- Unsigned AAB size bytes: 2995668
- Unsigned AAB evidence status: pass
- Unsigned AAB evidence SHA-256: 04bf93f886d72e8cedd961051f64821a1d724bd7edf50fb2b0a99abf4e4fd44f
- Unsigned AAB evidence size bytes: 2995668
- Unsigned AAB evidence matches preflight: Yes
- Signed AAB file present locally: Yes
- Current signed candidate ready: No
- Current signed candidate status: signed file exists, but it is not the current validated release candidate
- Signed AAB evidence status: pending-signed-aab
- Signed AAB boundary: private owner-side artifact only.

## Play Console inputs

- Store listing metadata: `store-assets/play/listing.json`
- Release notes: `store-assets/play/release-notes.txt`
- Play App content packet: `reports/play-app-content-packet.md`
- Play Console upload packet: `reports/play-console-upload-packet.md`

## Release notes

```text
open-cycle 2.0

- Free local cycle logging with no account, ads, hidden tracking, or cloud sync.
- Cycle data stays on your device for core tracking.
- Public source and privacy policy are available for review.
```

## Owner upload boundary

- Do not upload the unsigned AAB to production.
- Signed candidate is locally ready only when preflight status is `ready-for-play-upload`, `Current signed candidate ready` is `Yes`, and signed AAB evidence status is `pass`.
- Re-run `npm run mobile:release:android:prompted` only if rebuilding or replacing the signed AAB.
- Keep `npm run mobile:signed-aab:evidence -- --require-signed` passing for the selected signed AAB.
- Keep `npm run validate:runtime-qa-report -- --require-complete` passing for the signed candidate before Play upload.
- Record Play Console upload confirmation only in the ignored private owner-side report.

## Validation commands

- `npm run validate:play-release-candidate`
- `npm run mobile:unsigned-aab:evidence -- --require-aab`
- `npm run preflight:play-store`
- `npm run validate:android -- --require-aab`
- `npm run validate:play-app-content`
