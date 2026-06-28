# Play Console submit bundle

This generated folder contains public-safe Play Console submission materials for open-cycle.

It intentionally does not include the signed AAB, upload keystore, passwords, Play Console credentials, Cloudflare tokens, or private account screenshots.

Use the files in `graphics/` for the phone, 7-inch tablet, and 10-inch tablet store listing artwork, `store-listing/` for text fields and release notes, `play-console/` for declaration answers, and `evidence/` for public-safe QA proof.

`evidence/visual-evidence-manifest.json` records website, app, emulator, and Play Store graphic dimensions, byte sizes, and SHA-256 hashes.
`evidence/visuals/android-window.xml` records the current `com.opencycle.app` UIAutomator proof for the emulator session.
`evidence/visuals/android-webview-dom.json` records renderer text proof from the emulator WebView.

Use `play-console/field-map.md` or `play-console/field-map.json` as the field-by-field Play Console upload checklist.

Open `visual-review.html` locally to inspect all generated Play graphics, alt text, website visuals, app visuals, and emulator evidence in one place.

Before final Play upload, confirm `open-cycle.com` still passes `npm run validate:custom-domain:live`, upload the already validated signed AAB separately from the private owner workspace, complete signed runtime QA, and record Play Console confirmation.
