import {axes, Emotions} from './waveEmotion';
export type PreviewState = {text: string; status: 'idle' | 'waiting' | 'loading' | 'ready' | 'error'; emotions?: Emotions};
export async function requestEmotions(text: string, signal: AbortSignal): Promise<Emotions> {
  const response = await fetch('/api/wave-emotion', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text}), signal});
  const result = await response.json();
  if (!response.ok || !axes.every(axis => typeof result.emotions?.[axis] === 'number' && Number.isFinite(result.emotions[axis]) && result.emotions[axis] >= 0 && result.emotions[axis] <= 1)) throw new Error('Analysis unavailable');
  return result.emotions;
}
// Throttle request starts instead of waiting for typing to stop. Requests are
// serial; each completed snapshot can animate while newer text is queued.
export function createEmotionPreview(notify: (state: PreviewState) => void, analyze = requestEmotions, interval = 800) {
  let text = '', version = 0, epoch = 0, disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flight: AbortController | undefined;
  let nextStart = 0, displayedVersion = -1;
  let shown: {text: string; emotions?: Emotions} = {text: ''};
  const cache = new Map<string, Emotions>();
  function schedule() {
    if (disposed || !text || cache.has(text) || flight || timer) return;
    timer = setTimeout(() => {timer = undefined; void run();}, Math.max(0, nextStart - Date.now()));
  }
  async function run() {
    const current = text, revision = version, generation = epoch;
    if (disposed || !current || flight) return;
    const controller = new AbortController(); flight = controller;
    nextStart = Date.now() + interval;
    notify({...shown, status: 'loading'});
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const emotions = await analyze(current, controller.signal);
      if (disposed || controller.signal.aborted || generation !== epoch) return;
      if (cache.size >= 20) cache.delete(cache.keys().next().value);
      cache.set(current, emotions);
      if (revision >= displayedVersion) {
        displayedVersion = revision; shown = {text: current, emotions};
        notify({...shown, status: current === text ? 'ready' : 'waiting'});
      }
    } catch {
      if (!disposed && generation === epoch && revision === version) notify({...shown, status: 'error'});
    } finally {
      clearTimeout(timeout); flight = undefined;
      if (revision !== version) schedule();
    }
  }
  return {
    update(value: string) {
      if (disposed) return;
      const next = value.trim();
      if (next === text) return;
      text = next; version++;
      if (!text) {
        epoch++; shown = {text: ''}; displayedVersion = version;
        if (timer) clearTimeout(timer); timer = undefined;
        notify({text: '', status: 'idle'}); return;
      }
      const emotions = cache.get(text);
      if (emotions) {shown = {text, emotions}; displayedVersion = version;}
      notify({...shown, status: emotions ? 'ready' : 'waiting'});
      schedule();
    },
    dispose() {disposed = true; version++; if (timer) clearTimeout(timer); flight?.abort(); cache.clear();},
  };
}
