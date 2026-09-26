import https from 'https';

export function jsonRequest(url: URL, headers: Record<string, string>, body?: unknown, timeout = 20000): Promise<any> {
  if (url.protocol !== 'https:') return Promise.reject(new Error('HTTPS required'));
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const request = https.request(url, {method: payload ? 'POST' : 'GET', headers: {...headers, ...(payload ? {'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(payload))} : {})}}, response => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {data += chunk; if (data.length > 2_000_000) request.destroy(new Error('Response too large'));});
      response.on('error', reject);
      response.on('end', () => {
        try {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) throw new Error(`Upstream HTTP ${response.statusCode}`);
          resolve(JSON.parse(data));
        } catch (error) {reject(error);}
      });
    });
    const timer = setTimeout(() => request.destroy(new Error('Upstream timeout')), timeout);
    request.on('close', () => clearTimeout(timer));
    request.on('error', reject);
    request.end(payload);
  });
}
