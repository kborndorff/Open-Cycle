# Cloudflare Pages domain diagnostics

This public-safe note records how to confirm that the Pages project is deployed
and whether the custom domain is attached. It does not require pasting or
printing Cloudflare API tokens.

## Current diagnostic

The latest local Wrangler deploy succeeded for the Pages project:

```text
open-cycle-site
```

Wrangler listed the project domain as:

```text
open-cycle-site.pages.dev
```

That means the Pages deployment is live. The current expected project is
`open-cycle-site`, with `open-cycle.com` and `www.open-cycle.com` attached.

## Recheck with Wrangler

From the repository root, run:

```powershell
npm run validate:cloudflare-pages-domains:live
```

For the owner-side dashboard steps, run:

```powershell
npm run owner-tools:cloudflare-domain-help
```

For the owner-side Cloudflare API helper dry run, run:

```powershell
npm run cloudflare:attach-domains
```

To record DNS status for both public hosts, run:

```powershell
npm run generate:custom-domain-dns
npm run validate:custom-domain-dns
```

This writes:

```text
reports/custom-domain-dns-diagnostics.json
```

This writes a public-safe report to:

```text
reports/cloudflare-pages-domain-attachment.json
```

The validator runs this Wrangler command:

```powershell
npx.cmd wrangler pages project list
```

The `Project Domains` column for `open-cycle-site` should
include:

```text
open-cycle-site.pages.dev, open-cycle.com, www.open-cycle.com
```

If `open-cycle.com` is missing, attach the custom domain in Cloudflare Pages for
the `open-cycle-site` project and wait for Cloudflare to provision it.

## Attachment path

This workspace successfully deploys `site/dist` through Wrangler, but the
available Wrangler Pages project command set does not expose a custom-domain
attachment command. The checked command surface is:

```powershell
npx.cmd wrangler pages --help
npx.cmd wrangler pages project --help
```

For the current Wrangler CLI, `wrangler pages project` supports `list`,
`create`, and `delete`. Attach `open-cycle.com` and `www.open-cycle.com` from
the Cloudflare dashboard for the `open-cycle-site` Pages project, or use
the checked owner-side API helper:

```powershell
npm run cloudflare:attach-domains
npm run cloudflare:attach-domains:apply
```

The apply command requires `CF_ACCOUNT_ID` and `CF_API_TOKEN` in the owner shell
and uses Cloudflare's Pages Domains API. Do not put Cloudflare API tokens on the
command line or in generated reports.

## Validate after attaching

After Cloudflare shows the domain on the Pages project, run:

```powershell
npm run validate:custom-domain:live
npm run release:handoff
```

The live custom-domain report is written to:

```text
reports/live-custom-domain-publication.json
```
