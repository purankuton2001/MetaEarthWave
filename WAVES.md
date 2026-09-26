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

START → 波を生み出す → text → browser location permission → 感情の波を生み出す.
User-authored waves use browser geolocation at submission time. No city or coordinate
selector is shown. A denied, unavailable, or timed-out location blocks submission
with a retryable message; no default location is silently substituted. Geolocation
is requested before paid analysis, with a 10-second timeout and a 60-second cache.
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
between seconds 42 and 60. The 40 available visual layers reserve one blended layer per mapped region and prioritize newer personal posts
and never split a blend when capacity is exhausted.

## Wave captions

When a new wave appears (a local Jev post, or a new post from the shared feed that is under 10 seconds old),
its text plays as a short lyric-video caption over the globe. The cut structure is ported from
[JIZURA](https://github.com/852wa/JIZURA) (MIT, see `THIRD_PARTY_NOTICES.md`); the motions are tuned to the
globe's own wave language so the caption reads as part of the water, not a telop laid on top.
The post is split into up to four short cuts at punctuation (runs such as ！？ stay together), and the cuts
cross-dissolve. Every emotion uses the same serif (Zen Old Mincho, paired with the EB Garamond UI): white type
washed with the emotion colour, a soft coloured glow and a quiet dark shadow for legibility. Emotions differ by
motion and tempo, mirroring the globe: joy rises and floats upward, sadness settles in from above, lingers and
sinks (sometimes vertically), anger arrives on a gust, swirls gently and disperses, anxiety comes into focus
unevenly with a slight smooth tremor, and empathy swells in and sways. Glyphs never rotate, bounce, pop or glitch.
A slow ripple and a hairline point at the wave while it faces the camera, and a few foam-like motes drift in the
emotion's direction.
About half of short captions (`ORBIT_CHANCE`, only when the whole post fits in `ORBIT_MAX` = 28 characters) instead
wrap the post around the globe as a tilted ring that turns slowly; the back half is mirrored, dimmed and softened
as it passes behind the globe. Up to three captions queue; reduced-motion users get a plain fade.
Planner: `src/lib/waveCaption.ts`, renderer: `src/lib/waveCaptionDraw.ts`, overlay: `src/components/WaveCaption.tsx`.

## Validation

`node --test tests/*.cjs`
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
GET `/api/themes/:id` accepts only an ID in the current list. It follows up to
12 AnyAPI search pages (requested limit 50, actual provider page size may be lower),
aiming for 120 recent posts in the last 24h, one per author, deduplicating text and
IDs. Fewer than 100 posts is explicitly marked as a limited sample. Search is no
longer restricted to Japanese, but Japanese trend queries still bias the sample;
these results do not represent entire countries or the world.

Batches of 10 posts (at most 3 in flight) score five emotions and infer a broad
posting region using text, language and public profile location when returned by
the search provider. Missing profile fields are left empty; no extra profile
lookup runs. The current atlas supports 24 countries and eight Japanese regions.
It does not infer nationality or exact personal coordinates. News locations,
travel destinations and team names are not sufficient posting-location evidence.
Chosen-region probability must reach .70; language-only assignments require .85
and are restricted to coarse Japanese, Korean and Thai locations. These model
probabilities are not calibrated geolocation accuracy. Other ambiguous languages,
unsupported regions and insufficient evidence remain unknown and are not mapped.

Each mapped region averages its own five emotions, blending color and movement
at its display centroid with a country/region sized footprint. Centroids are
visual anchors, not measured origins. No unknown posts fall back to Tokyo. Group
buttons rotate the globe to that region. Public responses contain aggregate scores,
counts, inference notes and source links, not author profiles or post text. Details
show the actual sample size and unknown count. Browser geolocation remains the
source for the user's own submitted wave.

The aggregate mood gently changes ambient flow speed over four seconds, only
when at least three mapped samples exist. A single user-authored post never
changes global flow. Local region counts can still be small even with 120 total
posts, and should not be interpreted as population opinion.

Aggregates animate as a dated visualization until their age reaches 30 minutes;
this is not a live firehose or a count of newly arriving posts. User-authored
waves last 60 seconds and retain their chosen topic and browser-provided coordinates. Unrelated
local topic posts are hidden when another theme is selected.

Requests are coalesced with a 15-minute bounded in-process cache, a 1-minute
failure backoff, and stale results explicitly labelled for at most 30 minutes.
Treg uses per-endpoint/query/time-window idempotency keys. Caches are per hosting
instance; multi-instance Jev spend is not globally capped. Configure provider
spending limits for production, and use a shared cache for large deployments.
Observed catalog prices: trends $0.001/call, search ~$0.00075/call; Jev is billed
separately. A theme performs up to 12 batch inferences, never one per frame. Search costs
at most approximately $0.009 per theme, plus separately billed inference.
The first analysis is a blocking request with a four-minute client timeout.
Production hosts with short request limits need a background job and shared
result storage before this larger analysis can be deployed reliably.

## Globe-first X discovery (current UI)

The permanent theme selector is replaced with clickable waves on the existing globe.
`/api/themes` assigns a broad topic-related location through a bounded inference
of the title/category. This is not posting-origin inference. If confidence is below
.85 or inference fails, it uses the explicitly labelled Japan trend observation
anchor. This does not claim a real event origin. The source feed remains Japan;
no multi-country collector was added after the interaction design changed.

Waves at the same anchor are grouped; clicking opens a compact list of X search
links. A single-topic wave opens its X search directly. Every link encodes the
original title (including hashtags), opens a new tab with noopener/noreferrer,
and leaves the globe available. Waves stop after 30 minutes without a fresh list
and disappear on the next list update when no longer selected. Selection covers
five category-diverse topics, not every trend.

Emotion analysis runs for the five visible topics with two client jobs at a time;
search remains bounded at 12 calls per topic (about $0.045 total maximum for five),
plus inference. The neutral discovery wave is available immediately, then receives
the overall topic's emotion blend after analysis. Co-located topics share a mixed
wave and have individual emotion-colored dots in their link list. Errors leave a
neutral wave and never manufacture scores. Trend rank and sample size are not
presented as measured discussion volume. Provider fees and caches above still apply.

## Global floating keywords (supersedes globe-first regional anchors)

The current discovery view collects the top five trends from eight markets:
United States, United Kingdom, Brazil, India, France, South Africa, Australia and
Japan. Failed markets are disclosed, and successful coverage is shown in the UI.
This is an eight-market sample, not complete worldwide coverage or a post count.
Exact normalized aliases merge first. A bounded choice evaluation merges other
same-event aliases only at probability >= .90; related-but-different events must
stay separate. If that service fails only exact aliases merge.

For each event, the best rank per country contributes 1/sqrt(rank). Contributions
sum across countries; the top twelve events become individual floating keywords.
Search includes collected aliases joined by OR without a Japanese-language filter.
Keyword placement is a visual layout, never a claimed origin. Font size uses this
cross-market prominence plus emotion intensity. Text gradients preserve all five
emotion weights; a neutral white word indicates analysis is not yet available.
Clicking each keyword opens X directly, without grouping topics into a region list.
Emotion analysis still targets up to 120 posts per event, with two events in flight.
At twelve events the search ceiling is approximately $0.108 per refresh, plus
$0.008 for trend feeds and separately billed analysis/alias matching. This sample
can still be biased by source coverage, aliases and languages returned by search.

If alias inference returns HTTP 401/402/403, the list explicitly reports analysis
unavailable and no post searches are launched. The visible words remain neutral;
exact-name aggregation and rank-based sizing continue. A live verification on
2026-09-21 retrieved all eight countries but the inference provider returned 402,
so live emotion color/size verification is blocked until that account is usable.

## Full-sphere coverage update

Discovery now samples sixteen markets, adding Mexico, Argentina, Nigeria, Kenya,
Indonesia, South Korea, Germany and Turkey to the previous eight. All sixteen
feeds succeeded in local verification. Feed cost ceiling is about $0.016/update;
twelve-topic post search limits remain unchanged. This is still sampled coverage,
not every country in the world.

Keywords use an equal-area golden-angle distribution across the entire globe,
covering both hemispheres and all longitude quadrants. They are no longer confined
to the front/Asian hemisphere. Orbit controls slowly auto-rotate while the keyword
view is active; users can drag to see the other side. Layout remains non-geographic.

## Trend details before external navigation

Wave and keyword clicks now open an accessible modal on the existing page. Only
its explicit `Xで見る` link opens the external search in a new tab. Escape, the
close button and `地球に戻る` dismiss the modal; auto-rotation pauses while open.
The modal follows refreshed analysis results, showing five independent 0–100
strengths, actual sample count, participating markets, rank, aliases and timestamp.
Provider-supplied descriptions appear as the overview when available; missing
summaries and missing scores are labelled rather than fabricated. Pending,
unavailable and failed analysis states are distinguished.
Live verification on 2026-09-22 displayed five emotion values from 120 actual
posts for #Brownlow; the previous billing failure was not present in this check.

## Unified emotion analysis (2026-09-22)

Personal waves and each SNS post now use `server/analyzeEmotions.ts`: one trimmed
`state.utterance`, the same five questions, decoder, model setting and 12-second
upstream timeout. Empathy means the author's expressed understanding of and care
for another person's feelings, not the reader's reaction to the author's distress.
Region questions remain in separate batches and never share the emotion request.
SNS analysis retains three workers, the 120-post target and the existing TTL cache.
At 120 posts this uses 120 emotion requests plus 12 region requests instead of 12
combined requests; latency and request volume increase. Synthetic regression
checks do not establish accuracy on real SNS data. Quote attribution and ambiguous
short text still need independent evaluation.

## Live personal-wave preview

The existing text modal previews feelings while typing, including IME text changes.
Request starts are throttled to at least 800 ms apart, with only one request in flight.
Completed snapshots update the wave while newer text is queued. The last wave stays
visible during updates; clearing text invalidates outstanding snapshots. Cached
newer results cannot be overwritten by an older in-flight result. Closing the modal cancels the request
and clears the 20-entry in-memory cache. The UI explains that draft text is sent
for analysis before submission; previews neither request location nor post to X.
The preview blends five coloured moving wave layers with smooth intensity changes
and honours reduced-motion preferences. Submission reuses a completed result only
when its trimmed text exactly matches, otherwise it analyses the submitted text.
Location permission is still required to place the final wave on the globe.

## Topic overview and observed-country anchors

When a feed has no description, `summarizeTheme` asks Jev Choice to select explanatory
sentences from up to 120 fetched posts. This is an extractive overview, not generated
prose or fact verification. The modal labels excerpts and links to their source posts.
Invalid or low-confidence selections produce no overview; summary failures do not
fail emotion analysis. Reports carry the enriched theme to the globe and its modal.
Waves now anchor near the observed country with the best local trend rank (ties use
country-name order), with a small visual offset. Multiple countries still form one
global topic. The location is an observation point, not a claim about an event's origin.
