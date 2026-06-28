#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install from https://cli.github.com/" >&2
  exit 1
fi

OWNER="${GITHUB_OWNER:-kborndorff}"
REPO="${GITHUB_REPO:-open-cycle}"
PAGES_PROJECT="${CF_PAGES_PROJECT_NAME:-open-cycle}"
WORKER_NAME="${CF_WORKER_NAME:-open-cycle-legacy-redirect}"
REPO_REF="${OWNER}/${REPO}"

echo "Repo: ${REPO_REF}"
read -r -s -p "CF_API_TOKEN: " CF_API_TOKEN
printf '\n'
read -r -s -p "CF_ACCOUNT_ID: " CF_ACCOUNT_ID
printf '\n'

printf '%s' "$CF_API_TOKEN" | gh secret set CF_API_TOKEN -R "$REPO_REF" --body -
printf '%s' "$CF_ACCOUNT_ID" | gh secret set CF_ACCOUNT_ID -R "$REPO_REF" --body -
printf '%s' "$PAGES_PROJECT" | gh variable set CF_PAGES_PROJECT_NAME -R "$REPO_REF" --body -
printf '%s' "$WORKER_NAME" | gh variable set CF_WORKER_NAME -R "$REPO_REF" --body -

unset CF_API_TOKEN CF_ACCOUNT_ID
echo "Cloudflare secrets + deploy variables were stored in GitHub Actions for ${REPO_REF}."
