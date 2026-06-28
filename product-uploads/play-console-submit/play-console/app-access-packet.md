# Play App access packet

This packet is public-safe. It prepares owner-side Play Console App access answers without storing login credentials, test accounts, Play Console credentials, signing passwords, keystore paths, Cloudflare tokens, service-account JSON, or signed release artifacts.

## Official policy reference

- Manage target audience and app content settings: https://support.google.com/googleplay/android-developer/answer/9867159

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free

## Owner Play Console answers

- Login required: No
- Account creation available: No
- Special access instructions required: No
- Test account credentials required: No
- Paid feature gate blocks review: No
- Network access required for core review path: No
- Reviewer instructions: No login, account, test credentials, subscription, purchase, or internet access is required. Install the app, open open-cycle, add an entry, edit it, delete one entry, and clear all entries saved on this device.

## Review path

- Install the app.
- Open open-cycle.
- Add a local cycle entry.
- Edit the entry.
- Delete one entry.
- Clear all local entries.
- Open the privacy/help/source links if network is available; core tracking does not require those links.

## Evidence cross-checks

- Play listing: `store-assets/play/listing.json`
- Local-only runtime: `reports/local-only-runtime.json`
- Android permissions: `reports/android-permissions.json`
- Local-only runtime status: pass
- Android internet permission requested: No

## Validation commands

- `npm run validate:play-app-access`
- `npm run validate:play-metadata`
- `npm run validate:local-only-runtime`
- `npm run validate:android-permissions`
