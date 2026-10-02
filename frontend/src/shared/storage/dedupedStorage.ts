import type { StateStorage } from 'zustand/middleware';

export const createDedupedStorage = (storage: StateStorage): StateStorage => {
  const lastWritten = new Map<string, string>();

  return {
    getItem: storage.getItem,
    setItem: (key, value) => {
      if (lastWritten.get(key) === value) return;
      lastWritten.set(key, value);
      return storage.setItem(key, value);
    },
    removeItem: (key) => {
      lastWritten.delete(key);
      return storage.removeItem(key);
    },
  };
};
