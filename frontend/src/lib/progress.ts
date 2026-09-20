// localStorage-backed reading progress. No backend account, so progress lives in the browser.
const KEY = "hv-progress-v1";
const SCORE_KEY = "hv-scores-v1";

function readSet(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

export function getCompleted(): string[] {
  return Array.from(readSet());
}

export function isCompleted(slug: string): boolean {
  return readSet().has(slug);
}

export function toggleCompleted(slug: string): boolean {
  const set = readSet();
  if (set.has(slug)) set.delete(slug);
  else set.add(slug);
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* storage unavailable — progress simply does not persist */
  }
  return set.has(slug);
}

export function getBestScore(topicSlug: string): number | null {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return map[topicSlug] ?? null;
  } catch {
    return null;
  }
}

export function saveBestScore(topicSlug: string, percent: number): void {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    if ((map[topicSlug] ?? -1) < percent) {
      map[topicSlug] = percent;
      localStorage.setItem(SCORE_KEY, JSON.stringify(map));
    }
  } catch {
    /* ignore */
  }
}
