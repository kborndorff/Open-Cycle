# GitHub web publication fallback

Use this guide if GitHub CLI (`gh`) is not installed yet, or if you prefer to
finish repository visibility and Cloudflare secret setup through GitHub's web
UI.

Do not paste Cloudflare API tokens, account IDs, Play Console credentials,
keystore passwords, or signed artifacts into this file, chat, commits, issues,
or pull requests.

## Repository visibility

- Proof/product repository target: `https://github.com/kborndorff/Open-Cycle`
- Full source repository target: `https://github.com/kborndorff/open-cycle-source`
- Visibility target: Public
- Homepage target after custom-domain validation: `https://open-cycle.com`
- Temporary homepage fallback: `https://open-cycle-site.pages.dev`
- Description target: `open-cycle is a free period tracker that keeps entries on your device`

Use `kborndorff/Open-Cycle` for public proof, security/privacy docs, store-facing
upload materials, release evidence helpers, and product publication checks. Use
`kborndorff/open-cycle-source` for the complete inspectable source tree. Keep
signed AAB files, keystores, Play credentials, tokens, private screenshots, and
unredacted generated reports out of both repositories.

GitHub may display this repository with different casing, such as
`kborndorff/Open-Cycle`. That is acceptable. The important release requirement
is that this worktree is pushed to the public repository default branch and the
live validators pass afterward.

Before making the repository public, use the public repository publication manifest to review exactly what should be visible and what must stay private.

```powershell
npm run owner-tools:publish-help
npm run validate:github-publication-helper
npm run release:handoff
npm run validate:public
npm run generate:public-repo-manifest
npm run validate:public-repo-manifest
npm run generate:github-repository-bundles
npm run validate:github-repository-bundles
npm run package:github-repository-bundles
npm run validate:github-repository-archives
```

The public manifest now includes the SEO/blog pages, `robots.txt`,
`sitemap.xml`, and `llms.txt`, so the privacy-first period tracking content is
part of the publication proof.

## Validated ZIP upload fallback

If you are using GitHub's web UI instead of a local Git push, use the generated
ZIP archives as the upload source:

- `dist/github-repositories/Open-Cycle.zip` goes to
  `https://github.com/kborndorff/Open-Cycle`.
- `dist/github-repositories/open-cycle-source.zip` goes to
  `https://github.com/kborndorff/open-cycle-source`.

Before uploading, run:

```powershell
npm run package:github-repository-bundles
npm run validate:github-repository-archives
```

The archive report is `reports/github-repository-archives.json`. It records the
SHA-256 hashes and confirms that signed AABs, APKs, keystores, Play Console
credentials, Cloudflare tokens, GitHub tokens, and private screenshots are not
inside the upload archives.

## Validated bundle publisher

If you prefer a local Git-based publisher but do not want to wire remotes into
this main workspace, use the generated public-safe GitHub bundles:

```powershell
npm run github:publish-bundles:dry-run
```

The dry run validates the staging bundles and upload ZIPs, prepares temporary
clean worktrees, and prints the Git commands without creating commits or
pushing anything.

After owner approval and Git authentication, publish both repositories with:

```powershell
npm run github:publish-bundles:apply
```

That command runs `scripts/publish-github-repository-bundles.ps1 -Apply`, which
initializes a clean Git worktree for each validated public-safe bundle, commits
the staged files, and pushes to the configured repository URLs. It does not
read, print, or store GitHub tokens, Cloudflare tokens, signing keys, or Play
Console credentials.

## Cloudflare Pages secrets

Open the repository settings page:

```text
https://github.com/kborndorff/Open-Cycle/settings/secrets/actions
```

Create these repository secrets:

```text
CF_API_TOKEN
CF_ACCOUNT_ID
```

Paste the Cloudflare token and account ID only into GitHub's encrypted secret
forms. Do not put secret values in command history, source files, docs, issues,
or chat.

## GitHub Actions variables

Open the repository variables page:

```text
https://github.com/kborndorff/Open-Cycle/settings/variables/actions
```

Create these repository variables:

```text
CF_PAGES_PROJECT_NAME = open-cycle-site
CF_WORKER_NAME = open-cycle-legacy-redirect
```

These values are public-safe project names, not credentials.

## After publishing

Wait for GitHub Actions to finish, then run:

```powershell
npm run validate:github:live
npm run validate:github:actions
npm run validate:custom-domain:live
npm run release:handoff
```

If `gh` is later installed and authenticated, the prompt-based helper is still
available:

```powershell
npm run github:setup-deploy-secrets -- -DryRun
npm run github:setup-deploy-secrets
```
