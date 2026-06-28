# Play Console content rating and app content packet

This packet is public-safe. It gives owner-side Play Console answer guidance without storing signing passwords, keystore paths, Play Console credentials, Cloudflare tokens, service-account JSON, or signed release artifacts.

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free
- Distribution posture: Free local-only personal wellness log.

## App content answers

- Contains ads: No
- Uses Advertising ID: No
- In-app purchases: No
- Account creation or login required: No
- User-generated content or social sharing: No
- User-to-user interaction: No
- Location collection: No
- Device identifiers collected by app code: No
- Health data collected by app code: No
- Sensitive data transmitted off device: No
- Android internet permission requested: No
- Data collected: None
- Data shared with third parties: No

## Content rating posture

- Intended use: simple local cycle tracking for personal wellness logging.
- Medical posture: open-cycle is a personal wellness log, not medical advice, diagnosis, or treatment. Talk with a qualified clinician for health concerns.
- Content posture: no violence, sexual content, gambling, controlled substances, hate, harassment, social features, or purchases are implemented by the public local-only build.
- Data posture: users may enter cycle dates, flow, symptoms, moods, and notes locally on device, but the app code does not collect, transmit, sell, share, or monetize that information.
- Deletion posture: users can delete one cycle entry or clear all local cycle entries in the app.

## Evidence cross-checks

- Play listing: `store-assets/play/listing.json`
- Privacy parity: `reports/privacy-parity.json`
- Android permissions: `reports/android-permissions.json`
- Data safety packet: `reports/play-data-safety-packet.md`
- Privacy parity status: pass
- Android permissions status: pass
- Android requested permissions: 0

## Validation commands

- `npm run validate:play-content-rating`
- `npm run validate:play-metadata`
- `npm run validate:privacy-parity`
- `npm run validate:android-permissions`
- `npm run validate:play-data-safety`
