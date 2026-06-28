# Security Policy

open-cycle is public so users and reviewers can inspect the local-only
tracking behavior. Please report security issues responsibly.

## Supported Scope

Security reports may cover:

- Local data handling in the web/mobile tracker.
- API authentication, validation, rate limiting, and local persistence.
- Android release configuration, permissions, backup behavior, and packaging.
- Website privacy, redirects, headers, and public release workflows.
- Accidental exposure risks for secrets, keystores, tokens, or generated build
  artifacts.

## Not in Scope

- Requests to bypass the source-available license.
- Vulnerabilities in a user's personal device, browser, operating system, or
  network outside this project.
- Attacks requiring access to private keystores, Cloudflare tokens, GitHub
  secrets, or local `.env` files that are not committed to this repository.

## Reporting

Use GitHub's private vulnerability reporting feature if it is enabled for the
repository. If private reporting is unavailable, open a minimal public issue that
does not include exploit details, secrets, private keys, credentials, or personal
data.

Please include:

- Affected area: app, API, Android package, website, workflow, or documentation.
- Reproduction steps.
- Expected and actual behavior.
- Any relevant environment details.

Do not include:

- Cloudflare API tokens.
- Android upload keystores or passwords.
- GitHub access tokens.
- User cycle data.
- Private `.env` values.

## Security Posture

The public mobile build is designed for local-only use:

- No account required.
- No cloud sync required.
- No hidden tracking in app code.
- No Android internet permission in the public local-only build.
- Android backup disabled.
- Keystores, `.env` files, build artifacts, and generated app bundles are ignored.
- Android upload keystore handling is documented in `docs/android-keystore-handling.md`.

Run the release checks before publishing:

```bash
npm run validate:release
npm run validate:android -- --require-aab
```
