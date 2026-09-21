import type {NextApiRequest, NextApiResponse} from 'next';
import {listThemes} from '../../../lib/server/themeService';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {res.setHeader('Allow', 'GET'); return res.status(405).json({error: 'この操作は利用できません。'});}
  if (!process.env.TREG_TOKEN) return res.status(503).json({error: '話題の取得は準備中です。'});
  try {return res.status(200).json(await listThemes());}
  catch {return res.status(502).json({error: '話題を取得できませんでした。少し待ってからお試しください。'});}
}
