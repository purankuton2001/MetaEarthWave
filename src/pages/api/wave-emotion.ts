import type {NextApiRequest, NextApiResponse} from 'next';
import https from 'https';
import {decodeEmotions, questions} from '../../lib/waveEmotion';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({mode: process.env.TYPESAFE_API_KEY ? 'jev' : 'unavailable'});
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({error: 'この操作は利用できません。'}); }
  const text = req.body?.text;
  if (typeof text !== 'string' || !text.trim() || text.length > 280) return res.status(400).json({error: '1〜280文字で入力してください。'});
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) return res.status(503).json({error: '感情分析は現在利用できません。'});
  try {
    const url = new URL('/v1/systemone', process.env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai');
    if (url.protocol !== 'https:') throw new Error('HTTPS required');
    const body = JSON.stringify({model: process.env.TYPESAFE_DEFAULT_MODEL || 'jev-latest', state: {utterance: text.trim()}, questions: questions()});
    const response = await new Promise<any>((resolve, reject) => {
      const request = https.request(url, {method: 'POST', headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)}}, upstream => {
        let data = '';
        upstream.setEncoding('utf8');
        upstream.on('data', chunk => {data += chunk; if (data.length > 100000) request.destroy(new Error('Response too large'));});
        upstream.on('error', reject);
        upstream.on('end', () => {try {if (upstream.statusCode !== 200) throw new Error('Upstream failed'); resolve(JSON.parse(data));} catch (error) {reject(error);}});
      });
      const timer = setTimeout(() => request.destroy(new Error('Timeout')), 12000);
      request.on('close', () => clearTimeout(timer));
      request.on('error', reject);
      request.end(body);
    });
    return res.status(200).json({source: 'jev', emotions: decodeEmotions(response)});
  } catch {
    return res.status(502).json({error: '感情を読み取れませんでした。少し待って、もう一度お試しください。'});
  }
}
export const config = {api: {bodyParser: {sizeLimit: '4kb'}}};
