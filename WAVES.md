# Jev emotion waves

The existing `/` page accepts text and renders five blended emotions on its globe.
The original bright purple/cyan palette, additive globe color, music, score panel,
and Twitter submission path remain. No separate page or preview controls ship.

## Setup

Use Node.js 22 (`.nvmrc`), `yarn install --frozen-lockfile`, then `yarn dev`.
The Yarn engine check is disabled for the legacy next-auth Node range; Node 22
is pinned in package.json and .nvmrc and verified by the production build.
Copy `.env.example` to `.env.local` and set `TYPESAFE_API_KEY` on the server.
Without a key, emotion analysis is disabled and POST returns 503. No keyword/demo
fallback is included. Upstream errors return 502, with a 12-second request timeout.
Live Jev calls were verified locally for SNS samples and a user-authored wave.
Model accuracy has not been independently evaluated.

## Usage and storage

START → 波を生み出す → text and location → 感情の波を生み出す.
The location defaults to Tokyo; users can choose a city or enter latitude/longitude.
The message panel displays the five estimated strengths without test sliders.

Jev posts live in this browser session only (20 maximum); reload clears them.
Shared delivery and persistence of Jev posts are not implemented.
`NEXT_PUBLIC_WEBSOCKET_URL` configures the original shared feed.
Twitter posting requires the original authentication and backend.

## Visual behavior

The globe and background share a continuous procedural flow field.
Joy lifts, sadness sinks, anger swirls, anxiety adds small irregular movements,
and empathy mixes gently. The five strengths blend with normalized weights.
Colored waves remain within radius 0.16 on the unit sphere; weaker displacement
travels outward at 0.065 units/second and fades by radius 0.36. A post does not
change the entire globe or background. Posts expire after 60 seconds, fading
between seconds 42 and 60. The 20 available visual layers prioritize newer posts
and never split a blend when capacity is exhausted.

## Validation

`node --test tests/wave-emotion.cjs`
`yarn tsc --noEmit`
`yarn build`

## Live themes

Set `TREG_TOKEN`, optional identity-token `TREG_ORG`, and `TYPESAFE_API_KEY`
in server-side environment variables. Do not prefix these with NEXT_PUBLIC.
The original globe page now offers five Japanese X trend themes, automatically
refreshing while the page is open every 15 minutes. No background scheduler runs
when no one is viewing the site.

GET `/api/themes` retrieves Japanese trends via TikHub through treg. Category
coverage is preferred over a pure rank list (sports, culture, society, everyday).
Exact hashtag/width/case variants are merged; semantic event alias merging and
inference of which current match is being discussed are not implemented.
GET `/api/themes/:id` accepts only an ID in the current list, retrieves up to 20
recent search results via AnyAPI, and samples at most 8 posts from the last 24h,
one per author, removing repeated text and IDs. A single Jev batch scores all
five emotions independently for each sampled post. Public responses contain
aggregate scores and source links, not copies of author profiles or post text.

The aggregate mood gently changes the ambient flow speed, with a four-second
transition. A single user-authored post never changes global flow.

At present, sports groups use explicit mentions of eight supported national
teams. They do NOT infer nationality, support, or a team's true public mood.
Posts mentioning both/neither remain a separate group. Without two mentioned
teams, the overall five-emotion blend is shown. Named cities in theme titles use the topic location. Tokyo is an explicitly
labelled symbolic origin for unlocated themes. Group links rotate the globe to that group.

Aggregates animate as a dated visualization until their age reaches 30 minutes;
this is not a live firehose or a count of newly arriving posts. User-authored
waves last 60 seconds and retain their chosen topic and coordinates. Unrelated
local topic posts are hidden when another theme is selected.

Requests are coalesced with a 15-minute bounded in-process cache, a 1-minute
failure backoff, and stale results explicitly labelled for at most 30 minutes.
Treg uses per-endpoint/query/time-window idempotency keys. Caches are per hosting
instance; multi-instance Jev spend is not globally capped. Configure provider
spending limits for production, and use a shared cache for large deployments.
Observed catalog prices: trends $0.001/call, search ~$0.00075/call; Jev is billed
separately. Loading a theme performs one batch inference, never one per frame.
