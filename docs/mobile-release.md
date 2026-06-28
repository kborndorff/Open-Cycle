# Mobile release playbook

This doc focuses on Android first (for Play Store), then iOS.

## 1) Android release prerequisites

- Java 17+
- Android SDK + build-tools
- `ANDROID_HOME` or `ANDROID_SDK_ROOT` set
- Java signing tools available from `JAVA_HOME`, `PATH`, or Android Studio JBR
- One release keystore prepared for Play upload signing
- The public mobile app stores cycle entries in device storage only and should
  not expose remote API env configuration.

On this Windows machine, the verified SDK/runtime paths were:

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:JAVA_HOME="$env:ProgramFiles\Android\Android Studio2\jbr"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
```

Create a local upload keystore if you do not already have one:
Print the owner-side signing flow without entering secrets:

```powershell
npm run owner-tools:android-signing-help
npm run validate:android-signing-helper
```


```powershell
npm run mobile:create-upload-keystore -- -DryRun
npm run mobile:create-upload-keystore
```

The keystore helper auto-detects `keytool` from `JAVA_HOME`, `PATH`, and common
Android Studio JBR locations. If auto-detection fails, set `JAVA_HOME` to a
JDK/JBR with Java signing tools before running the non-dry-run command.

The default output is outside the repo at:

```text
%USERPROFILE%\.opencycle\keys\upload-keystore.jks
```

On macOS/Linux:

```bash
chmod +x scripts/create-android-upload-keystore.sh
./scripts/create-android-upload-keystore.sh
```

Do not commit the keystore or passwords. Store the password in a password
manager and keep a backup of the `.jks` file.

## 2) Build and sign `.aab`

From repo root:

```bash
npm install
npm run mobile:init:android
npm run mobile:build:aab
```

This runs:

- web build (`apps/web/dist`)
- local browser/device storage mode by default
- capacitor sync into `apps/mobile/android`
- Gradle `bundleRelease`

The scripted build sets `OPEN_CYCLE_ANDROID_BUILD_ROOT` to a fresh temp
directory before running Gradle. This keeps generated Android build output out
of OneDrive-synced project folders, avoids stale merged web assets, and then
copies the unsigned AAB back to:

```text
apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

After UI changes, refresh public unsigned evidence with:

```bash
npm run mobile:build:aab
npm run mobile:unsigned-aab:evidence -- --require-aab
```

Validate the Android release posture:

```bash
npm run validate:android -- --require-aab
```

Then sign:

```bash
$env:ANDROID_KEYSTORE_PATH="C:\\path\\to\\upload-keystore.jks"
$env:ANDROID_KEYSTORE_PASSWORD="..."
$env:ANDROID_KEY_ALIAS="upload"
$env:ANDROID_KEY_PASSWORD="..."
npm run mobile:sign:aab -- --input=apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

The signing helper uses `jarsigner` for App Bundles and verifies the signed
bundle before reporting success.

You can preview the complete private release sequence without using secrets:

```bash
npm run mobile:release:android -- --dry-run
```

When the private signing environment values are present in your shell, the same
wrapper can run the public release gate, build the unsigned bundle, sign it,
validate the signed bundle, and write the Play preflight report:

```bash
npm run mobile:release:android
```

Useful variants:

```bash
npm run mobile:release:android -- --skip-public-gate
npm run mobile:release:android -- --skip-build
```

On Windows, use the prompted wrapper to avoid typing signing secrets directly
into shell history:

```powershell
npm run mobile:release:android:prompted -- -DryRun
npm run mobile:release:android:prompted
```

If the public release gate has already passed and the unsigned AAB exists, sign
the current bundle without rebuilding:

```powershell
npm run mobile:release:android:prompted -- -SkipBuild -SkipPublicGate
```

The prompted wrapper asks for the upload keystore path and passwords, runs the
same private release flow, and clears the signing environment values afterward.

## 3) Verify before upload

- Confirm `-signed.aab` exists
- Confirm Play Console accepted package name and version code
- Confirm the release build does not include remote API env configuration by
  running `npm run validate:local-only-runtime`.
- Confirm `AndroidManifest.xml` keeps Android backup disabled and omits
  `android.permission.INTERNET` for the public local-only build.
- Generate and validate Android permission evidence with
  `npm run generate:android-permissions` and
  `npm run validate:android-permissions`.
- Confirm the hosted privacy policy is reachable at `/privacy.html`.
- Keep paid features redirect paths (`/features`, `/upgrade`, `/pro`, `/pricing`) untouched

The generated Android project source is intended to be public. Build outputs,
local SDK paths, keystores, copied web assets, and `.aab`/`.apk` artifacts stay
ignored.

## 4) iOS prep

- `npm run mobile:init:ios`
- Keep the public local-only storage behavior unless a future iOS-specific
  architecture is explicitly reviewed.
- Open in Xcode and generate an App Store archive

## 5) Security retention

Release tooling does not weaken standalone API or web security controls:

- Standalone API key auth optional (`API_KEY`)
- CORS policy / origin allowlist
- rate limiting / helmet headers
- entries saved on the user's device
