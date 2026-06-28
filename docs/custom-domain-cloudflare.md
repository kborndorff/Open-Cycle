# Custom domain and Cloudflare Pages

This project can be published from the public GitHub repository while DNS and
Cloudflare account access stay private.

## Targets

- Primary public site: `https://open-cycle.com`
- Optional `www` alias: `https://www.open-cycle.com`
- Cloudflare Pages project: `open-cycle-site`
- GitHub repository: `https://github.com/kborndorff/Open-Cycle`
- Build output: `site/dist`

## Owner-side setup

Do this only from the Cloudflare account that controls `open-cycle.com`.

1. Publish the current worktree to `https://github.com/kborndorff/Open-Cycle`.
2. Set Cloudflare deployment secrets in GitHub Actions.
3. Let the Pages workflow deploy `site/dist`.
4. In Cloudflare Pages, attach `open-cycle.com` to the `open-cycle-site`
   Pages project.
5. Optionally attach `www.open-cycle.com` and redirect it to the primary host.
6. Keep DNS API tokens, Cloudflare account credentials, and registrar access out
   of GitHub, chat, issues, pull requests, and generated reports.

Wrangler is still useful for deploying and listing Pages projects from this
machine, but the checked Wrangler Pages project command surface exposes
`list`, `create`, and `delete`; it does not expose a custom-domain attachment
subcommand. Use the Cloudflare dashboard for domain attachment, or use the
owner-side API helper below from a private shell. The helper uses Cloudflare's
Pages Domains API (`POST /accounts/{account_id}/pages/projects/{project_name}/domains`)
and does not print or store tokens.

Before entering any secret values, rehearse the owner-side commands:
To print the custom-domain attachment helper without entering secrets, run:

```powershell
npm run owner-tools:cloudflare-domain-help
```

To rehearse the API attach plan without reading tokens, run:

```powershell
npm run cloudflare:attach-domains
```

To capture the current public DNS state for both the apex and `www` hosts, run:

```powershell
npm run generate:custom-domain-dns
npm run validate:custom-domain-dns
```

This writes `reports/custom-domain-dns-diagnostics.json` without reading
Cloudflare tokens or registrar credentials.

To attach both domains through the Cloudflare API, set `CF_ACCOUNT_ID` and
`CF_API_TOKEN` in the owner shell, then run:

```powershell
npm run cloudflare:attach-domains:apply
```

```powershell
npm run release:owner-dry-run
npm run github:setup-deploy-secrets -- -DryRun
```

## Validation

After Cloudflare finishes provisioning the custom domain certificate, run:

```powershell
npm run validate:site:live -- --url=https://open-cycle.com
npm run validate:site:live -- --url=https://www.open-cycle.com
npm run validate:custom-domain:live
```

The same live-site validator checks:

- HTTPS
- Required public pages
- Security headers
- Local-only privacy policy
- Gentle paid-app redirects

If the `www` alias is configured only as a redirect, use the primary host as the
Play Console privacy URL:

```text
https://open-cycle.com/privacy
```

## Public repo boundary

The public repository should include this guide, the Pages workflow, and the
live-site validator. It should not include:

- Cloudflare API tokens
- Cloudflare account credentials
- Registrar credentials
- DNS provider recovery codes
- Private deployment logs containing account identifiers beyond public project
  names
