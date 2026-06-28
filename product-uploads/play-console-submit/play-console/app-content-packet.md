# Play App content packet

This packet is public-safe. It indexes Play Console App content declarations without storing Play Console credentials, tester identifiers, ad account identifiers, signing passwords, keystore paths, Cloudflare tokens, service-account JSON, or signed release artifacts.

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free

## App content declaration map

| Area | Evidence packet | Status | Validation command |
| --- | --- | --- | --- |
| Data safety | `reports/play-data-safety-packet.md` | present | `npm run validate:play-data-safety` |
| Content rating and app content | `reports/play-content-rating-packet.md` | present | `npm run validate:play-content-rating` |
| Health Apps declaration | `reports/play-health-declaration-packet.md` | present | `npm run validate:play-health-declaration` |
| App access | `reports/play-app-access-packet.md` | present | `npm run validate:play-app-access` |
| Ads declaration | `reports/play-ads-declaration-packet.md` | present | `npm run validate:play-ads-declaration` |
| Target audience and children | `reports/play-target-audience-packet.md` | present | `npm run validate:play-target-audience` |
| Testing and production access | `reports/play-testing-rollout-packet.md` | present | `npm run validate:play-testing-rollout` |

## Owner Play Console summary

- Data safety: no collection and no sharing.
- App access: no login, no account, no test credentials, no paid gate, and no network-required core review path.
- Ads: no ads, no ad SDKs, no Advertising ID, and no ad monetization.
- Content rating: no user-generated public content, no social sharing, no location collection, no purchases, and no internet permission for core tracking.
- Health declaration: Period Tracking, not a regulated medical device, no Health Connect, no health permissions, and clear not-medical-advice posture.
- Target audience: conservative 18 and over recommendation, not child-directed, and Restrict Minor Access recommended for owner review.
- Testing and rollout: internal or closed testing plan, affected new personal-account closed testing guidance, and private signed evidence boundary.

## Validation commands

- `npm run validate:play-app-content`
- `npm run validate:play-data-safety`
- `npm run validate:play-content-rating`
- `npm run validate:play-health-declaration`
- `npm run validate:play-app-access`
- `npm run validate:play-ads-declaration`
- `npm run validate:play-target-audience`
- `npm run validate:play-testing-rollout`
