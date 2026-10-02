import dayjs from 'dayjs';
import * as zod from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { analysesApi } from '../../../api/AnalysesApi';
import { entriesPageSchema, type EntriesPage, type EntriesQuery } from '../../../api/types';
import {
  indexedDbStorage,
  readFromIndexedDb,
  removeFromIndexedDb,
  writeToIndexedDb,
} from '../../../shared/storage/indexedDbStorage';
import { createDedupedStorage } from '../../../shared/storage/dedupedStorage';
import { waitForHydration } from '../../../shared/storage/waitForHydration';
import { filterRecord } from '../../../shared/utils/records';

const MAX_CACHED_ENTRY_PAGES = 200;

const entriesIndexStorage = createDedupedStorage(indexedDbStorage);
const PAGE_STORAGE_PREFIX = 'log-analyzer:entries-page:';

const indexEntrySchema = zod.object({ analysisId: zod.string(), cachedAt: zod.number() });
const persistedIndexSchema = zod.object({ index: zod.record(zod.string(), indexEntrySchema) });

type PageIndex = Record<string, zod.infer<typeof indexEntrySchema>>;

interface EntriesState {
  index: PageIndex;
  pagesInMemory: Record<string, EntriesPage>;
  hasHydrated: boolean;
  loadPage: (analysisId: string, query: EntriesQuery, signal?: AbortSignal) => Promise<EntriesPage>;
  removeAnalyses: (analysisIds: ReadonlySet<string>) => void;
}

const toCacheKey = (analysisId: string, { levels, search, sort, page, pageSize }: EntriesQuery): string =>
  JSON.stringify([analysisId, [...levels].sort(), search, sort, page, pageSize]);

const toStorageKey = (cacheKey: string) => `${PAGE_STORAGE_PREFIX}${cacheKey}`;

const splitIndex = (index: PageIndex, shouldKeep: (cacheKey: string, analysisId: string) => boolean) => {
  const kept: PageIndex = {};
  const removedKeys: string[] = [];

  for (const [cacheKey, indexEntry] of Object.entries(index)) {
    if (shouldKeep(cacheKey, indexEntry.analysisId)) {
      kept[cacheKey] = indexEntry;
    } else {
      removedKeys.push(cacheKey);
    }
  }

  return { kept, removedKeys };
};

const newestKeys = (index: PageIndex): ReadonlySet<string> =>
  new Set(
    Object.entries(index)
      .sort(([, left], [, right]) => right.cachedAt - left.cachedAt)
      .slice(0, MAX_CACHED_ENTRY_PAGES)
      .map(([cacheKey]) => cacheKey),
  );

const readStoredPage = async (cacheKey: string): Promise<EntriesPage | undefined> => {
  const storedPage = entriesPageSchema.safeParse(await readFromIndexedDb(toStorageKey(cacheKey)));
  return storedPage.success ? storedPage.data : undefined;
};

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => {
      const dropPages = (shouldKeep: (cacheKey: string, analysisId: string) => boolean) => {
        const { kept, removedKeys } = splitIndex(get().index, shouldKeep);
        if (removedKeys.length === 0) return;

        const removed = new Set(removedKeys);
        set((state) => ({
          index: kept,
          pagesInMemory: filterRecord(state.pagesInMemory, (cacheKey) => !removed.has(cacheKey)),
        }));
        void removeFromIndexedDb(removedKeys.map(toStorageKey));
      };

      const rememberPage = (cacheKey: string, analysisId: string, page: EntriesPage) => {
        set((state) => ({
          index: { ...state.index, [cacheKey]: { analysisId, cachedAt: dayjs().valueOf() } },
          pagesInMemory: { ...state.pagesInMemory, [cacheKey]: page },
        }));
        void writeToIndexedDb(toStorageKey(cacheKey), page);
        const keep = newestKeys(get().index);
        dropPages((candidateKey) => keep.has(candidateKey));
      };

      return {
        index: {},
        hasHydrated: false,
        pagesInMemory: {},

        loadPage: async (analysisId, query, signal) => {
          await waitForHydration(useEntriesStore);
          const cacheKey = toCacheKey(analysisId, query);

          const pageInMemory = get().pagesInMemory[cacheKey];
          if (pageInMemory) return pageInMemory;

          if (get().index[cacheKey]) {
            const storedPage = await readStoredPage(cacheKey);
            if (storedPage) {
              set((state) => ({ pagesInMemory: { ...state.pagesInMemory, [cacheKey]: storedPage } }));
              return storedPage;
            }
          }

          const page = await analysesApi.getEntries(analysisId, query, signal);
          rememberPage(cacheKey, analysisId, page);
          return page;
        },

        removeAnalyses: (analysisIds) => dropPages((_cacheKey, pageAnalysisId) => !analysisIds.has(pageAnalysisId)),
      };
    },
    {
      name: 'log-analyzer:entries-index',
      storage: createJSONStorage(() => entriesIndexStorage),
      partialize: (state) => ({ index: state.index }),
      merge: (persisted, current) => {
        const restored = persistedIndexSchema.safeParse(persisted);
        return restored.success ? { ...current, index: restored.data.index } : current;
      },
      onRehydrateStorage: () => () => useEntriesStore.setState({ hasHydrated: true }),
    },
  ),
);
