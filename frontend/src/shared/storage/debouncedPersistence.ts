import type * as zod from 'zod';
import type { StoreApi } from 'zustand';

interface DebouncedPersistenceOptions<State, Saved> {
  key: string;
  delayInMilliseconds: number;
  select: (state: State) => Saved;
}

const readJson = (key: string): unknown => {
  try {
    const json = localStorage.getItem(key);
    return json === null ? undefined : JSON.parse(json);
  } catch {
    return undefined;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  }
};

export const readPersisted = <Saved>(key: string, schema: zod.ZodType<Saved>): Saved | undefined => {
  const stored = schema.safeParse(readJson(key));
  return stored.success ? stored.data : undefined;
};

export const persistWithDebounce = <State, Saved>(
  store: StoreApi<State>,
  { key, delayInMilliseconds, select }: DebouncedPersistenceOptions<State, Saved>,
) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const save = () => {
    clearTimeout(timer);
    timer = undefined;
    writeJson(key, select(store.getState()));
  };

  const flushPending = () => {
    if (timer !== undefined) save();
  };

  store.subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(save, delayInMilliseconds);
  });
  window.addEventListener('pagehide', flushPending);
};
