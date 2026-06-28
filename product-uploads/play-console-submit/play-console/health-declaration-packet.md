# Play Health apps declaration packet

This packet is public-safe. It prepares owner-side Play Console Health Apps declaration answers without storing signing passwords, keystore paths, Play Console credentials, Cloudflare tokens, service-account JSON, or signed release artifacts.

## Official policy references

- Health Content and Services: https://support.google.com/googleplay/android-developer/answer/16679511
- Health apps declaration form guidance: https://support.google.com/googleplay/android-developer/answer/14738291

## App identity

- App name: open-cycle
- Package name: `com.opencycle.app`
- Category: Health & Fitness
- Price: Free
- Health declaration category: Health and fitness > Period Tracking

## Owner Play Console answers

- Does the app provide health features? Yes.
- Health feature to declare: Period Tracking.
- Does the app access Health Connect data? No.
- Does the app request health-related Android permissions? No.
- Android requested permissions count: 0
- Android internet permission requested: No
- Is the app a regulated medical device app? No.
- Does the app diagnose, treat, cure, or prevent any medical condition? No.
- Does the app provide clinical decision support, treatment recommendations, telehealth, prescriptions, emergency care, disease prevention, public health status, or human-subjects research? No.
- Does the app connect to external medical hardware or device sensors for medical functionality? No.
- Does the app sell prescription drugs, supplements, or clinical services? No.
- Does the app include health misinformation or claims contradicting medical consensus? No.

## Required disclaimer posture

- Store listing and app copy must make clear that open-cycle is a personal wellness log, not medical advice, diagnosis, or treatment.
- Store listing and app copy must remind users to talk with a qualified clinician for health concerns.
- Suggested Play Console-safe wording: open-cycle is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk with a qualified clinician for medical advice, diagnosis, or treatment.

## Local-only data posture

- Play data collected: None
- Play data shared with third parties: No
- Play health data collected by app code: No
- Users may enter cycle dates, flow, symptoms, moods, and notes locally on device.
- The public local-only build does not transmit, sell, share, monetize, cloud-sync, or collect that local wellness information.
- Users can delete one cycle entry or clear all local cycle entries in the app.

## Evidence cross-checks

- Play listing: `store-assets/play/listing.json`
- Privacy parity: `reports/privacy-parity.json`
- Android permissions: `reports/android-permissions.json`
- Data safety packet: `reports/play-data-safety-packet.md`
- Content rating packet: `reports/play-content-rating-packet.md`
- Privacy parity status: pass
- Android permissions status: pass

## Validation commands

- `npm run validate:play-health-declaration`
- `npm run validate:play-content-rating`
- `npm run validate:play-metadata`
- `npm run validate:privacy-parity`
- `npm run validate:android-permissions`
- `npm run validate:play-data-safety`
