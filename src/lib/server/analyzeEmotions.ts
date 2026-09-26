import {decodeEmotions, Emotions, questions} from '../waveEmotion';
import {jsonRequest} from './jsonRequest';

// Both personal waves and SNS posts use one text and the same five questions.
// Other posts, profile information and region questions must not affect this judgment.
export async function analyzeEmotions(text: string): Promise<Emotions> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error('Jev unavailable');
  const result = await jsonRequest(
    new URL('/v1/systemone', process.env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai'),
    {Authorization: `Bearer ${key}`},
    {model: process.env.TYPESAFE_DEFAULT_MODEL || 'jev-latest', state: {utterance: text.trim()}, questions: questions()},
    12000,
  );
  return decodeEmotions(result);
}
