const PREFIX = 'chitumbatv_';
const VERSION = 'v1';

type Key = 'clients' | 'mensalidades' | 'filiais' | 'usuarios' | 'activities' | 'metrics';

function makeKey(key: Key) {
  return `${PREFIX}${key}_${VERSION}`;
}

export function get<T>(key: Key): T | null {
  try {
    const raw = localStorage.getItem(makeKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function set<T>(key: Key, value: T) {
  try {
    localStorage.setItem(makeKey(key), JSON.stringify(value));
  } catch {}
}

export function clear(key: Key) {
  try {
    localStorage.removeItem(makeKey(key));
  } catch {}
}

export function loadOrInit<T>(key: Key, fallback: T): T {
  const existing = get<T>(key);
  if (existing) return existing;
  set<T>(key, fallback);
  return fallback;
}