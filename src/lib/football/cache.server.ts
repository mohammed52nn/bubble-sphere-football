type Entry = { value: unknown; expires: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number) {
  if (store.size > 300) store.clear();
  store.set(key, { value, expires: Date.now() + ttlMs });
}

/** Cached + de-duplicated async work: identical concurrent calls share one request. */
export async function cached<T>(key: string, ttlMs: number, work: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const promise = work()
    .then((value) => {
      cacheSet(key, value, ttlMs);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

export function cacheDrop(prefix: string) {
  for (const key of [...store.keys()]) if (key.startsWith(prefix)) store.delete(key);
}
