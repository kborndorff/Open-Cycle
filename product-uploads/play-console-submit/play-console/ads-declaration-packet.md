# Play ads declaration packet

This packet is public-safe. It prepares owner-side Play Console ads and Advertising ID answers without storing ad account identifiers, Play Console credentials, signing passwords, keystore paths, Cloudflare tokens, service-account JSON, or signed release artifacts.

## Official policy reference

- Google Play Ads policy: https://support.google.com/googleplay/android-developer/answer/9857753

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free

## Owner Play Console answers

- Contains ads: No
- Uses Advertising ID: No
- Uses ad SDKs: No
- Serves ads to children: No
- Uses location data for ads: No
- Uses analytics for ads measurement: No
- Monetization through ads: No
- In-app purchases or subscriptions: No
- Made-for-ads behavior: No

## Evidence cross-checks

- Play listing: `store-assets/play/listing.json`
- Privacy parity: `reports/privacy-parity.json`
- Local-only runtime: `reports/local-only-runtime.json`
- Android permissions: `reports/android-permissions.json`
- Privacy parity status: pass
- Local-only runtime status: pass
- Android requested permissions count: 0
- Android internet permission requested: No

## Validation commands

- `npm run validate:play-ads-declaration`
- `npm run validate:play-metadata`
- `npm run validate:privacy-parity`
- `npm run validate:local-only-runtime`
- `npm run validate:android-permissions`
