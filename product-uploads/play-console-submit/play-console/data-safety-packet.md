# Play Console data safety packet

This packet is public-safe. It describes the local-only public build and does not include Play Console credentials, keystore paths, signing passwords, Cloudflare tokens, or private account data.

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Privacy policy URL: https://open-cycle.com/privacy
- Temporary privacy policy fallback before custom-domain validation: https://open-cycle-site.pages.dev/privacy
- Custom-domain validation command before final Play upload: `npm run validate:custom-domain:live`

## Data collection

- Data collected: None
- Location data collected: No
- Health data collected: No
- Financial info collected: No
- Contacts collected: No
- Photos, videos, audio, or files collected: No
- Device identifiers collected by app code: No
- Advertising ID used: No

## Sharing and security

- Data shared with third parties: No
- Data encrypted in transit: Not applicable for core tracking because the public local-only build does not transmit cycle data.
- Android internet permission: Not requested by the public local-only build.
- Runtime network and analytics scan: no fetch, XMLHttpRequest, WebSocket, analytics, ad, push, cloud sync, or remote API environment path is allowed.
- Data deletion request URL: Not applicable because the app does not create accounts or store server-side user data.
- Account deletion required: No
- Account deletion reason: The app does not create accounts.
- User data deletion: Users can delete one entry or clear all entries saved on this device in the app. Uninstalling the app also removes app storage according to Android behavior.
- In-app local deletion controls: users can delete one cycle entry or clear all local cycle entries without an account.

## Owner Play Console answers

- Does the app collect or share any required user data types? No.
- Does the app use advertising ID? No.
- Does the app create accounts? No.
- Does the app require a data deletion request mechanism? No, because there is no account and no server-side user data.
- Is core cycle tracking usable without network access? Yes.

## Validation commands

- `npm run validate:play-metadata`
- `npm run validate:play-data-safety`
- `npm run validate:local-only-deps`
- `npm run validate:local-only-runtime`
- `npm run validate:android -- --require-aab`
