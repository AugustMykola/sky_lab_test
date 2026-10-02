import { del, delMany, get, keys, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

const attemptAsync = async <T>(action: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await action();
  } catch {
    return fallback;
  }
};

export const readFromIndexedDb = (key: string): Promise<unknown> => attemptAsync(() => get(key), undefined);

export const writeToIndexedDb = (key: string, value: unknown): Promise<void> =>
  attemptAsync(() => set(key, value), undefined);

export const writeToIndexedDbOrFail = (key: string, value: unknown): Promise<void> => set(key, value);

export const removeFromIndexedDb = (keysToRemove: readonly string[]): Promise<void> =>
  keysToRemove.length === 0 ? Promise.resolve() : attemptAsync(() => delMany([...keysToRemove]), undefined);

export const listIndexedDbKeys = async (prefix: string): Promise<string[]> => {
  const storedKeys = await attemptAsync(() => keys(), []);
  return storedKeys.flatMap((storedKey) =>
    typeof storedKey === 'string' && storedKey.startsWith(prefix) ? [storedKey] : [],
  );
};

export const indexedDbStorage: StateStorage = {
  getItem: (key) => attemptAsync(async () => (await get<string>(key)) ?? null, null),
  setItem: (key, value) => writeToIndexedDb(key, value),
  removeItem: (key) => attemptAsync(() => del(key), undefined),
};
