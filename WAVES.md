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
Real Jev accuracy and latency have not been verified with a live credential.

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

## Wave captions

When a new wave appears (a local Jev post, or a new post from the shared feed that is under 10 seconds old),
its text plays as a short lyric-video caption over the globe, using motion recipes ported from
[JIZURA](https://github.com/852wa/JIZURA) (MIT, see `THIRD_PARTY_NOTICES.md`).
The post is split into up to four short cuts at punctuation. The dominant emotion picks the typeface,
colour and motions: joy pops and bounces, sadness blurs in (sometimes vertically) and sinks, anger slices
and glitches, anxiety types and jitters, empathy rises and sways. A ripple and leader line point at the wave
while it faces the camera.
About half of captions (`ORBIT_CHANCE`) instead wrap the whole post (up to 28 characters) around the
globe as a tilted ring of text that revolves once or so; the back half is mirrored and dimmed as it passes
behind the globe, and the spin speed follows the emotion (anger fastest, sadness slowest).
Each caption also gets a look from its emotion (with some variation per post): a two-colour gradient fill,
optional RGB-split chromatic aberration (anger, anxiety), 3D extrusion (joy, anger, empathy), outline-only type,
a shimmer that slides the colours along the text (joy, empathy), and ambient particles: sparkles (joy, empathy),
rain (sadness), rising embers (anger) or glitch bars (anxiety). Up to three captions queue; reduced-motion users get a plain fade.
Planner: `src/lib/waveCaption.ts`, renderer: `src/lib/waveCaptionDraw.ts`, overlay: `src/components/WaveCaption.tsx`.

## Validation

`node --test tests/wave-emotion.cjs tests/wave-caption.cjs`
`yarn tsc --noEmit`
`yarn build`
