// NextAuth's unused App Router branch imports this on Next.js 12.
// Workers call its Pages API handler with explicit request/response objects.
export function headers(): never {throw new Error('App Router headers are not used by this Pages Router application');}
export function cookies(): never {throw new Error('App Router cookies are not used by this Pages Router application');}
