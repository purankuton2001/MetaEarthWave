import type {NextApiRequest, NextApiResponse} from 'next';
import {analyzeTheme} from '../../../lib/server/themeService';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {res.setHeader('Allow', 'GET'); return res.status(405).json({error: 'この操作は利用できません。'});}
  if (!process.env.TREG_TOKEN || !process.env.TYPESAFE_API_KEY) return res.status(503).json({error: '話題の感情分析は準備中です。'});
  if (typeof req.query.id !== 'string' || req.query.id.length > 500) return res.status(400).json({error: '話題を選び直してください。'});
  try {return res.status(200).json(await analyzeTheme(req.query.id));}
  catch (error) {return res.status(error instanceof Error && error.message === 'Unknown theme' ? 404 : 502).json({error: 'この話題を分析できませんでした。別の話題を選ぶか、少し待ってお試しください。'});}
}
