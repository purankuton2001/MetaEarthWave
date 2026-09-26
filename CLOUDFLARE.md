# Cloudflare deployment

URL: https://meta-earth-wave.com

Fallback: https://metaearthwave.watanabe-koto.workers.dev

The apex custom domain is managed by the `routes` entry in `wrangler.jsonc`.

The existing Next.js 12 frontend is statically exported; `cloudflare/worker.ts`
adapts the existing Pages API handlers to Workers requests and responses.
No Next.js server or SSR endpoint is exposed. API handlers, including NextAuth,
run with Node compatibility. `next/headers` is stubbed only for NextAuth's unused
App Router branch. Pages Router requests always pass explicit request/response objects.

## Build and publish

Use Node 22 (see package.json engines) and Wrangler 4.129.1 or later:

```sh
npm run build:cloudflare
wrangler deploy --dry-run
wrangler deploy
```

The build uses `.next-cloudflare` so the ordinary local `.next` build remains separate.
Images are served directly. The unused archival `public/earth.jpg` (28 MB)
is excluded via `out/.assetsignore`; the actual earth texture stays in the deployment.

Set server-only secrets using `wrangler secret put NAME`:

- TYPESAFE_API_KEY: Jev analysis
- TREG_TOKEN, TREG_ORG: trend/post retrieval
- NEXTAUTH_SECRET: session signing
- TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET: optional X login
- NEXTAUTH_URL: set to the public origin when configuring X login

Never use NEXT_PUBLIC_* for authentication secrets.
The initial deployment has Jev/treg credentials and NEXTAUTH_SECRET.
X credentials and a posting WebSocket server were not present locally, so X login/posting
is not configured. Geolocation requires the visitor's browser permission.
Individual waves remain local to the visitor's browser, as before deployment.

## Verification on 2026-09-25

Production build and export, Workers dry run, and 24 existing tests passed.
The deployed site renders the globe. Live Jev input and trend availability were
checked separately; a deployment does not replenish the external treg balance.
Theme caches are per Worker isolate, not a durable shared cache.

## Refresh interval

Trend refresh, server cache TTL and treg accepted cache age are 6 hours.
Existing trend waves remain visible for up to two refresh periods (12 hours)
so they do not disappear before the next refresh. Refresh remains visitor-driven,
not a centralized scheduled job; the interval is not an account-wide spend cap.
Personal input preview remains real-time (minimum request start spacing 800 ms).
