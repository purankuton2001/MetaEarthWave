import type {NextApiRequest, NextApiResponse} from 'next';
import {analyzeEmotions} from '../../lib/server/analyzeEmotions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({mode: process.env.TYPESAFE_API_KEY ? 'jev' : 'unavailable'});
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({error: 'この操作は利用できません。'}); }
  const text = req.body?.text;
  if (typeof text !== 'string' || !text.trim() || text.length > 280) return res.status(400).json({error: '1〜280文字で入力してください。'});
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) return res.status(503).json({error: '感情分析は現在利用できません。'});
  try {
    return res.status(200).json({source: 'jev', emotions: await analyzeEmotions(text)});
  } catch {
    return res.status(502).json({error: '感情を読み取れませんでした。少し待って、もう一度お試しください。'});
  }
}
export const config = {api: {bodyParser: {sizeLimit: '4kb'}}};
