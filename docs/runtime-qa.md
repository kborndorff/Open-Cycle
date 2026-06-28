# Runtime QA checklist

Use this after installing the signed Play Store candidate on an Android device
or emulator.

Generate a private QA report template before testing:
Print the runtime QA helper without handling private signed artifacts:

```bash
npm run owner-tools:runtime-qa-help
npm run validate:runtime-qa-helper
npm run generate:signed-runtime-qa-preflight
npm run validate:signed-runtime-qa-preflight
```


```bash
npm run generate:runtime-qa-report
npm run validate:runtime-qa-report
```

If the report already exists, the generator will not overwrite it. Use
`npm run generate:runtime-qa-report -- --force` only when you intentionally want
to replace the private QA template.

After completing the signed-candidate checks, mark every item in
`reports/runtime-qa-report.md`, fill the placeholders, keep the signed AAB
SHA-256 and byte size matched to the current signed artifact, and run:

```bash
npm run validate:runtime-qa-report -- --require-complete
```

## Install candidate

- Build: `npm run mobile:build:aab`
- Sign: `npm run mobile:sign:aab`
- Verify: `npm run validate:android -- --require-signed`
- Preflight local install tooling:
  `npm run generate:signed-runtime-qa-preflight` and
  `npm run validate:signed-runtime-qa-preflight`
- Install through Play internal testing, bundletool, or Android Studio.
- Keep the signed AAB SHA-256 and byte size in the report matched to
  `reports/signed-aab-evidence.json`.

## Local-only tracking checks

- Launch app with airplane mode enabled.
- Confirm the app opens without login, account creation, or network prompt.
- Add a cycle entry with date, flow, symptoms, mood, and notes.
- Close and reopen the app.
- Confirm the cycle entry remains visible.
- Update the flow.
- Confirm the updated name remains after another close/reopen.
- Delete the cycle entry.
- Confirm the cycle entry is gone after another close/reopen.
- Add two cycle entries, clear all local entries, and confirm both are removed.

## Privacy and permissions checks

- Confirm Android app info shows no network-facing permission requested by the public build.
- Confirm Android app info does not list Internet permission
  (`android.permission.INTERNET`).
- Confirm no location permission prompt appears.
- Confirm no account, contact, photos, media, or notification permission prompt appears.
- Confirm no analytics, crash reporting, ad, push notification, or cloud sync
  prompt appears.
- Confirm Android backup remains disabled in the manifest validation output.

## Optional Local Cycle link checks

- Confirm the core cycle log remains usable without Local Cycle.
- Open any visible Local Cycle link manually.
- Confirm the link opens outside core tracking and is clearly optional.

## Store listing evidence

- Capture at least two phone screenshots after adding sample local cycle entries.
- Capture optional tablet screenshots if preparing tablet listing assets.
- Use `store-assets/play/feature-graphic.svg` as the source for the Play feature graphic export.
- Record the signed AAB path and validation command output in release notes.
