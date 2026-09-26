import waveEmotion from '../src/pages/api/wave-emotion';
import themes from '../src/pages/api/themes';
import theme from '../src/pages/api/themes/[id]';
import auth from '../src/pages/api/auth/[...nextauth]';
import restricted from '../src/pages/api/restricted';

type Env = {ASSETS: {fetch(request: Request): Promise<Response>}};
// Adapt the existing Pages API handlers without shipping the Next.js server.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const headers = new Headers({'Cache-Control': 'no-store'});
    const jsonError = (status: number, error: string) => new Response(JSON.stringify({error}), {status, headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}});
    const query: Record<string, any> = Object.fromEntries(url.searchParams);
    let handler: any;
    if (url.pathname === '/api/wave-emotion') handler = waveEmotion;
    else if (url.pathname === '/api/themes') handler = themes;
    else if (/^\/api\/themes\/[^/]+$/.test(url.pathname)) {
      try {query.id = decodeURIComponent(url.pathname.slice('/api/themes/'.length));} catch {return jsonError(400, 'Invalid topic');}
      handler = theme;
    } else if (url.pathname.startsWith('/api/auth/')) {
      query.nextauth = url.pathname.slice('/api/auth/'.length).split('/'); handler = auth;
    } else if (url.pathname === '/api/restricted') handler = restricted;
    else return jsonError(404, 'Not found');
    if (!['GET', 'POST', 'HEAD'].includes(request.method)) return jsonError(405, 'Method not allowed');
    if (request.method === 'POST' && request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return jsonError(403, 'Invalid origin');
    let body: any;
    if (request.body) {
      const reader = request.body.getReader(); let size = 0; const parts: Uint8Array[] = [];
      while (true) {const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 4096) {await reader.cancel(); return jsonError(413, 'Request too large');} parts.push(part.value);}
      const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) {bytes.set(part, offset); offset += part.length;}
      const text = new TextDecoder().decode(bytes);
      try {body = request.headers.get('Content-Type')?.includes('application/x-www-form-urlencoded') ? Object.fromEntries(new URLSearchParams(text)) : text ? JSON.parse(text) : undefined;} catch {return jsonError(400, 'Invalid request');}
    }
    const cookies: Record<string, string> = {};
    for (const part of (request.headers.get('Cookie') || '').split(';')) {const i = part.indexOf('='); if (i > 0) {try {cookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1));} catch {}}}
    let status = 200, result: any = null;
    const req = {method: request.method, body, query, cookies, headers: {...Object.fromEntries(request.headers), 'x-forwarded-host': url.host, 'x-forwarded-proto': url.protocol.slice(0, -1)}, url: url.pathname + url.search};
    const res: any = {
      status(code: number) {status = code; return res;},
      getHeader(name: string) {return name.toLowerCase() === 'set-cookie' ? (headers as Headers & {getSetCookie(): string[]}).getSetCookie() : headers.get(name);},
      setHeader(name: string, value: string | string[]) {headers.delete(name); for (const item of Array.isArray(value) ? value : [value]) headers.append(name, String(item)); return res;},
      json(value: unknown) {headers.set('Content-Type', 'application/json; charset=utf-8'); result = JSON.stringify(value); return res;},
      send(value: unknown) {if (typeof value === 'object' && value !== null) return res.json(value); result = value; return res;},
      end(value?: unknown) {if (value !== undefined) result = value; return res;},
    };
    try {await handler(req, res); return new Response(request.method === 'HEAD' ? null : result, {status, headers});}
    catch {return jsonError(500, '処理できませんでした。しばらく待ってお試しください。');}
  },
};
