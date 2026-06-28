# GitHub + public visibility

Use this checklist to publish the repo publicly:

1. Create an empty public repository on GitHub (for example `open-cycle`).
2. From your local repo root, after creating the repo on GitHub:

Create or update a root `.env` file with:

```bash
PUBLIC_GITHUB_ORG=<github-org-or-user>
PUBLIC_GITHUB_REPO=<github-repo>
```

Then run:

```bash
npm run set-public-links -- --org <github-org-or-user> --repo <github-repo>
```

Windows (Command Prompt):

```bash
set PUBLIC_GITHUB_ORG=<github-org-or-user>
set PUBLIC_GITHUB_REPO=<github-repo>
npm run prepare-site-links
```

Windows PowerShell:

```powershell
$env:PUBLIC_GITHUB_ORG = "<github-org-or-user>"
$env:PUBLIC_GITHUB_REPO = "<github-repo>"
npm run prepare-site-links
```

Unix shells:

```bash
export PUBLIC_GITHUB_ORG=<github-org-or-user>
export PUBLIC_GITHUB_REPO=<github-repo>
npm run prepare-site-links
```

You can also let GitHub provide this automatically:

```bash
GITHUB_REPOSITORY=<github-org-or-user>/<github-repo> npm run set-public-links
```

This updates all public references in this repo (`README`, `site/index.html`, `package.json`, and `docs/github-and-visibility.md`).

Tip: the same command can be run from CI automatically; no local placeholder values are required when `GITHUB_REPOSITORY` is set.

If your local git remote is already configured, this also works automatically:

```bash
git remote set-url origin git@github.com:<github-org-or-user>/<github-repo>.git
git fetch origin
npm run set-public-links
```

3. Then initialize git origin and publish:

```bash
git remote add origin git@github.com:<github-org-or-user>/<github-repo>.git
git branch -M main
git add .
git commit -m "feat: scaffold open-cycle"
git push -u origin main
```

4. In GitHub:
   - enable visibility to **Public**
   - add branch protection as you prefer
   - add required checks from `.github/workflows/ci.yml`
   - add the Android AAB public packaging check from `.github/workflows/android-aab.yml`
   - add repository description like:
     - "open-cycle is a free period tracker that keeps entries on your device"
   - optionally add homepage field in package metadata (scripted by `set-public-links`)
   - confirm GitHub displays `LICENSE.md` and that the repo is described as source-available, not permissive open source
   - confirm GitHub displays `SECURITY.md` for private vulnerability reporting guidance

Then verify the live public repository:

```bash
npm run validate:github:live
npm run validate:github:actions
npm run release:public-ready
```

5. If you prefer, replace placeholders manually instead of using the script:
   - `kborndorff`
   - `open-cycle`
   - `site/index.html`
   - `docs/github-and-visibility.md`
   - any other repository references in docs

6. If needed, run:

```bash
npm run set-public-links -- --org <github-org-or-user> --repo <github-repo>
```

To verify placeholders are fully resolved, run:

```bash
npm run check-public-links
```

Or run both steps together:

```bash
npm run prepare-site-links
```

7. Confirm `site` is deployed via Cloudflare Pages and that `local_cycle.com` legacy-host redirects are active:
   - Set `CF_PAGES_PROJECT_NAME` if your Pages project name differs.
   - Optionally set `CF_WORKER_NAME` if deploying the legacy redirect worker.
   - Add Cloudflare deployment secrets using `docs/deployment-secrets.md`.

Optional workflow note: `deploy-redirect-worker.yml` can keep legacy redirects updated from GitHub pushes.

## Publication packet

Generate a local, ignored handoff packet before making the repository public:

```bash
npm run generate:github-publication-packet
npm run validate:github-publication-packet
npm run validate:github:live
npm run validate:github:actions
npm run release:audit
npm run validate:release-audit
```

The packet is written to `reports/github-publication-packet.md` and summarizes
the public GitHub settings, Cloudflare secret commands, expected workflows, and
private items that must stay out of GitHub.

The final audit is written to `reports/final-release-audit.json` and summarizes
whether public GitHub, Cloudflare, Play Store public readiness, license posture,
and public-safe release handoff artifacts are complete before private signing.
After `npm run validate:github:live` succeeds, it also writes
`reports/live-github-publication.json`, which lets the final audit prove the
repository is actually public instead of merely configured for publication.
After `npm run validate:github:actions` succeeds, it writes
`reports/live-github-actions.json`, which lets the final audit prove the public
CI, Android AAB, and Pages deploy workflows passed.
