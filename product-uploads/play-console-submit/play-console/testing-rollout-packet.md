# Play testing and production access packet

This packet is public-safe. It prepares owner-side Play Console testing and rollout steps without storing tester emails, Play Console credentials, account screenshots, signing passwords, keystore paths, Cloudflare tokens, service-account JSON, or signed release artifacts.

## Official policy reference

- App testing requirements for new personal developer accounts: https://support.google.com/googleplay/android-developer/answer/14151465

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free
- Unsigned AAB SHA-256: 168a73c586600e714af651ab0d0ecf0f5fae72d2675225825365e108a3ae9536
- Unsigned AAB size bytes: 2995682

## Account-type decision

- If this Play developer account is a new personal account created after November 13, 2023, plan for a closed test before production access.
- If this Play developer account is not subject to the new personal-account testing requirement, owner should record that decision privately in Play Console notes or release records.
- Do not commit tester email lists, Play Console screenshots, account identifiers, or private review correspondence.

## Closed testing plan

- Recommended initial track: Internal testing with trusted owner devices before closed testing.
- Required track for new personal accounts before production access: Closed testing.
- Minimum testers for affected new personal accounts: 12 opted-in testers.
- Minimum continuous opt-in duration for affected new personal accounts: 14 days.
- Tester instructions: exercise create, edit, delete-one-entry, clear-all-local-entries, local-only/no-network behavior, privacy/help links, and app restart persistence.
- Feedback channel: private owner-controlled channel or Play Console testing feedback.
- Tester data boundary: testers should avoid entering highly sensitive real notes during pre-production testing.

## Production access application prompts

- About closed test: summarize tester recruitment, engagement, features exercised, and feedback collection method.
- About app: describe open-cycle as a free local period tracking and personal wellness log for adults, with no account, ads, cloud sync, or internet permission for core tracking.
- Production readiness: summarize issues fixed, validation commands run, signed runtime QA outcome, and final Play Console packet evidence.
- Expected first-year installs: owner estimate required in Play Console; do not commit account projections if considered private.

## Rollout posture

- Start with internal or closed testing before production.
- Use staged production rollout if available and appropriate.
- Keep signed AAB evidence private owner-side.
- Keep Play upload confirmation private owner-side.
- Public GitHub may include unsigned AAB evidence and public-safe release reports only.

## Evidence cross-checks

- Play listing: `store-assets/play/listing.json`
- Unsigned AAB evidence: `reports/unsigned-aab-evidence.json`
- Target audience packet: `reports/play-target-audience-packet.md`
- Play Console upload packet: `reports/play-console-upload-packet.md`
- Runtime QA template: `reports/runtime-qa-report.md`

## Validation commands

- `npm run validate:play-testing-rollout`
- `npm run validate:play-target-audience`
- `npm run validate:play-console-packet`
- `npm run validate:runtime-qa-report`
- `npm run release:next`
