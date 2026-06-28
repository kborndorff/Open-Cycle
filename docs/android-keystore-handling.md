# Android upload keystore handling

This guide documents how open-cycle handles the private Android upload
keystore boundary.

Do not commit upload keystores, passwords, key aliases tied to private releases,
signed AABs, Play Console credentials, or password-manager exports.

## Default location

The helper creates the upload keystore outside the repository by default:

```text
%USERPROFILE%\.opencycle\keys\upload-keystore.jks
```

Create a keystore only from a private owner machine:
Print the signing helper without entering secrets:

```powershell
npm run owner-tools:android-signing-help
npm run validate:android-signing-helper
```


```powershell
npm run mobile:create-upload-keystore -- -DryRun
npm run mobile:create-upload-keystore
```

The helper looks for `keytool` from `JAVA_HOME`, `PATH`, and common Android
Studio JBR locations. If the dry run cannot resolve `keytool`, install Android
Studio or set `JAVA_HOME` to a JDK/JBR before creating the private upload
keystore.

The public repository should contain the helper scripts and documentation, not
the generated `.jks` file.

## Backup expectations

- Store the `.jks` file in at least one encrypted backup location.
- Store the keystore password and key password in a password manager.
- Keep a note of which Play Console app uses the upload key.
- Do not store the keystore and passwords together in an unencrypted folder.
- Do not attach the keystore to GitHub issues, pull requests, releases, or
  Actions artifacts.

## Signing boundary

Before private signing, run:

```powershell
npm run validate:signing-readiness
```

Then use the prompted private release flow:

```powershell
npm run mobile:release:android:prompted -- -DryRun
npm run mobile:release:android:prompted
```

If the current unsigned AAB and public release validation are already complete,
the owner can sign without rebuilding:

```powershell
npm run mobile:release:android:prompted -- -SkipBuild -SkipPublicGate
```

The prompted wrapper asks for the upload keystore path and passwords locally,
sets signing environment variables only for the signing process, and clears them
afterward.

## If the keystore is lost

Losing the upload keystore can block app updates until the Play Console account
owner completes Google's upload-key reset process. Treat the upload keystore as
private release infrastructure, not as a generated build artifact.

If a reset is needed, follow Play Console's current upload-key reset flow from
the owner account. Do not publish reset evidence, private keys, or support
conversation screenshots in the public repository.

## Public repo safety checks

The public repo is expected to keep these boundaries:

- `.gitignore` excludes `.jks`, `.keystore`, `.aab`, `.apk`, Android build
  outputs, private reports, and environment files.
- Public GitHub Actions build unsigned AAB evidence only.
- Signed AABs are created locally with private owner material.
- Play upload confirmations and runtime QA reports stay in ignored `reports/`
  files unless intentionally redacted before sharing.
