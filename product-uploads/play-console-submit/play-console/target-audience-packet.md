# Play target audience and children declaration packet

This packet is public-safe. It prepares owner-side Play Console target audience and children-related answers without storing signing passwords, keystore paths, Play Console credentials, Cloudflare tokens, service-account JSON, or signed release artifacts.

## Official policy reference

- Manage target audience and app content settings: https://support.google.com/googleplay/android-developer/answer/9867159

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free

## Owner Play Console answers

- Recommended target age group: 18 and over
- Designed for children: No
- Includes children in target audience: No
- Families Policy intended to apply: No
- Restrict Minor Access recommended: Yes
- Neutral age screen required: No
- Child-directed marketing or store assets: No
- Ads served to children: No
- Contains ads: No
- In-app purchases: No
- Account required: No

## Rationale

- open-cycle is a period tracking and personal wellness log app.
- Period tracking can involve sensitive wellness context even when the public local-only build does not collect or transmit data.
- The store listing, screenshots, feature graphic, and website are not designed for children.
- The app has no ads, no ad SDKs, no in-app purchases, no social sharing, no user-generated public content, no account creation, and no internet permission for core tracking.
- Owner should confirm target audience selections in Play Console before final submission; this packet recommends 18 and over only with Restrict Minor Access enabled for the simplest conservative release posture.

## Evidence cross-checks

- Play listing: `store-assets/play/listing.json`
- Content rating packet: `reports/play-content-rating-packet.md`
- Health declaration packet: `reports/play-health-declaration-packet.md`

## Validation commands

- `npm run validate:play-target-audience`
- `npm run validate:play-content-rating`
- `npm run validate:play-health-declaration`
- `npm run validate:play-metadata`
