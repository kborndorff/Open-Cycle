#!/usr/bin/env bash
set -euo pipefail

OUTPUT_PATH="${ANDROID_UPLOAD_KEYSTORE_PATH:-$HOME/.opencycle/keys/upload-keystore.jks}"
ALIAS="${ANDROID_UPLOAD_KEY_ALIAS:-upload}"
VALIDITY_DAYS="${ANDROID_UPLOAD_KEY_VALIDITY_DAYS:-9125}"
DISTINGUISHED_NAME="${ANDROID_UPLOAD_KEY_DNAME:-CN=open-cycle,O=OpenCycle,C=US}"
DRY_RUN="${ANDROID_UPLOAD_KEY_DRY_RUN:-}"

if [[ -z "${JAVA_HOME:-}" ]]; then
  echo "JAVA_HOME must point to a JDK/JBR with keytool." >&2
  exit 1
fi

KEYTOOL="$JAVA_HOME/bin/keytool"
if [[ ! -x "$KEYTOOL" ]]; then
  echo "Could not find executable keytool at $KEYTOOL" >&2
  exit 1
fi

if [[ "$DRY_RUN" == "1" || "$DRY_RUN" == "true" ]]; then
  echo "Android upload keystore dry run"
  echo "No keystore will be created and no passwords will be requested."
  echo
  echo "Would use keytool:"
  echo "$KEYTOOL"
  echo
  echo "Would create keystore at:"
  echo "$OUTPUT_PATH"
  echo
  echo "Would use alias: $ALIAS"
  echo "Would use validity days: $VALIDITY_DAYS"
  echo "Would use distinguished name: $DISTINGUISHED_NAME"
  echo
  echo "Run without ANDROID_UPLOAD_KEY_DRY_RUN only from a private owner machine when you are ready to create the upload keystore."
  exit 0
fi

mkdir -p "$(dirname "$OUTPUT_PATH")"
if [[ -e "$OUTPUT_PATH" ]]; then
  echo "Keystore already exists at $OUTPUT_PATH. Move it aside before creating a new upload key." >&2
  exit 1
fi

read -r -s -p "New keystore password: " OPENCYCLE_ANDROID_STOREPASS
printf '\n'
read -r -s -p "New key password: " OPENCYCLE_ANDROID_KEYPASS
printf '\n'
export OPENCYCLE_ANDROID_STOREPASS OPENCYCLE_ANDROID_KEYPASS

"$KEYTOOL" -genkeypair \
  -v \
  -keystore "$OUTPUT_PATH" \
  -storetype JKS \
  -storepass:env OPENCYCLE_ANDROID_STOREPASS \
  -keypass:env OPENCYCLE_ANDROID_KEYPASS \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY_DAYS" \
  -dname "$DISTINGUISHED_NAME"

unset OPENCYCLE_ANDROID_STOREPASS OPENCYCLE_ANDROID_KEYPASS

echo
echo "Created Android upload keystore:"
echo "$OUTPUT_PATH"
echo
echo "For this terminal session, set:"
echo "export ANDROID_KEYSTORE_PATH=\"$OUTPUT_PATH\""
echo "export ANDROID_KEY_ALIAS=\"$ALIAS\""
echo "export ANDROID_KEYSTORE_PASSWORD=<same password you entered>"
echo "export ANDROID_KEY_PASSWORD=<same key password you entered>"
