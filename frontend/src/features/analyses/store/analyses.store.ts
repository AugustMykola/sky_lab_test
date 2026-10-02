import * as zod from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { analysesApi } from '../../../api/AnalysesApi';
import { toApiError, type ApiError } from '../../../api/ApiError';
import {
  analysisListItemSchema,
  analysisSchema,
  type Analysis,
  type AnalysisListItem,
  type CreateAnalysisPayload,
} from '../../../api/types';
import { RequestStatus } from '../../../shared/state/requestStatus';
import {
  indexedDbStorage,
  readFromIndexedDb,
  removeFromIndexedDb,
  writeToIndexedDb,
} from '../../../shared/storage/indexedDbStorage';
import { createDedupedStorage } from '../../../shared/storage/dedupedStorage';
import { waitForHydration } from '../../../shared/storage/waitForHydration';
import { filterRecord } from '../../../shared/utils/records';
import { toListItem } from '../mappers';
import { useEntriesStore } from './entries.store';

interface AnalysisDetailsEntry {
  status: RequestStatus;
  analysis?: Analysis;
  error?: ApiError;
}

type AnalysisDetails = Record<string, AnalysisDetailsEntry>;

interface AnalysesState {
  list: AnalysisListItem[];
  listError?: ApiError;
  hasLoadedList: boolean;
  hasHydrated: boolean;
  details: AnalysisDetails;
  loadList: () => Promise<void>;
  loadAnalysis: (id: string) => Promise<void>;
  addAnalysis: (analysis: Analysis) => void;
  createAnalysis: (payload: CreateAnalysisPayload) => Promise<Analysis>;
  deleteAnalysis: (id: string) => Promise<void>;
}

const DETAILS_STORAGE_PREFIX = 'log-analyzer:analysis:';
const NOT_FOUND_STATUS = 404;

const persistedListSchema = zod.object({ list: zod.array(analysisListItemSchema) });

const toDetailsKey = (id: string) => `${DETAILS_STORAGE_PREFIX}${id}`;

const byNewestFirst = (left: AnalysisListItem, right: AnalysisListItem): number =>
  right.createdAt.localeCompare(left.createdAt);

const loadedEntry = (analysis: Analysis): AnalysisDetailsEntry => ({ status: RequestStatus.Success, analysis });

const analysesStorage = createDedupedStorage(indexedDbStorage);

const readStoredAnalysis = async (id: string): Promise<Analysis | undefined> => {
  const stored = analysisSchema.safeParse(await readFromIndexedDb(toDetailsKey(id)));
  return stored.success ? stored.data : undefined;
};

interface ListSnapshot {
  listIds: ReadonlySet<string>;
  knownIds: ReadonlySet<string>;
}

const mergeWithLocalChanges = (
  fetched: AnalysisListItem[],
  current: AnalysisListItem[],
  { listIds }: ListSnapshot,
): AnalysisListItem[] => {
  const currentIds = new Set(current.map((listItem) => listItem.id));
  const fetchedIds = new Set(fetched.map((listItem) => listItem.id));
  const deletedLocally = (id: string) => listIds.has(id) && !currentIds.has(id);
  const addedLocally = current.filter((listItem) => !listIds.has(listItem.id) && !fetchedIds.has(listItem.id));

  return [...fetched.filter((listItem) => !deletedLocally(listItem.id)), ...addedLocally].sort(byNewestFirst);
};

const findStaleIds = (fetched: AnalysisListItem[], { knownIds }: ListSnapshot): ReadonlySet<string> => {
  const fetchedIds = new Set(fetched.map((listItem) => listItem.id));
  return new Set([...knownIds].filter((id) => !fetchedIds.has(id)));
};

const removeAnalysisRequest = async (id: string): Promise<void> => {
  try {
    await analysesApi.remove(id);
  } catch (caughtError) {
    if (toApiError(caughtError).status !== NOT_FOUND_STATUS) throw caughtError;
  }
};

const waitForCaches = () => Promise.all([waitForHydration(useAnalysesStore), waitForHydration(useEntriesStore)]);

export const useAnalysesStore = create<AnalysesState>()(
  persist(
    (set, get) => {
      const setDetails = (id: string, entry: AnalysisDetailsEntry) =>
        set((state) => ({ details: { ...state.details, [id]: entry } }));

      const rememberAnalysis = (analysis: Analysis) => {
        setDetails(analysis.id, loadedEntry(analysis));
        void writeToIndexedDb(toDetailsKey(analysis.id), analysis);
      };

      const fetchAnalysis = async (id: string): Promise<void> => {
        const stored = await readStoredAnalysis(id);
        if (stored) {
          setDetails(id, loadedEntry(stored));
          return;
        }
        rememberAnalysis(await analysesApi.getById(id));
      };

      return {
        list: [],
        listError: undefined,
        hasLoadedList: false,
        hasHydrated: false,
        details: {},

        loadList: async () => {
          await waitForCaches();
          set({ listError: undefined });
          const { list: listAtRequest, details: detailsAtRequest } = get();
          const listIds = new Set(listAtRequest.map((listItem) => listItem.id));
          const snapshot: ListSnapshot = { listIds, knownIds: new Set([...listIds, ...Object.keys(detailsAtRequest)]) };
          try {
            const fetched = await analysesApi.list();
            const staleIds = findStaleIds(fetched, snapshot);
            set((state) => ({
              list: mergeWithLocalChanges(fetched, state.list, snapshot),
              hasLoadedList: true,
              details: filterRecord(state.details, (id) => !staleIds.has(id)),
            }));
            useEntriesStore.getState().removeAnalyses(staleIds);
            void removeFromIndexedDb([...staleIds].map(toDetailsKey));
          } catch (caughtError) {
            set({ listError: toApiError(caughtError) });
          }
        },

        loadAnalysis: async (id) => {
          await waitForHydration(useAnalysesStore);
          const cached = get().details[id];
          if (cached?.status === RequestStatus.Success || cached?.status === RequestStatus.Loading) return;

          setDetails(id, { status: RequestStatus.Loading });
          try {
            await fetchAnalysis(id);
          } catch (caughtError) {
            setDetails(id, { status: RequestStatus.Error, error: toApiError(caughtError) });
          }
        },

        addAnalysis: (analysis) => {
          set((state) => ({
            list: [toListItem(analysis), ...state.list.filter((listItem) => listItem.id !== analysis.id)].sort(
              byNewestFirst,
            ),
          }));
          rememberAnalysis(analysis);
        },

        createAnalysis: async (payload) => {
          await waitForHydration(useAnalysesStore);
          const analysis = await analysesApi.create(payload);
          get().addAnalysis(analysis);
          return analysis;
        },

        deleteAnalysis: async (id) => {
          await waitForCaches();
          await removeAnalysisRequest(id);
          set((state) => ({
            list: state.list.filter((listItem) => listItem.id !== id),
            details: filterRecord(state.details, (detailsId) => detailsId !== id),
          }));
          useEntriesStore.getState().removeAnalyses(new Set([id]));
          void removeFromIndexedDb([toDetailsKey(id)]);
        },
      };
    },
    {
      name: 'log-analyzer:analyses-cache',
      storage: createJSONStorage(() => analysesStorage),
      partialize: (state) => ({ list: state.list }),
      merge: (persisted, current) => {
        const restored = persistedListSchema.safeParse(persisted);
        return restored.success
          ? { ...current, list: restored.data.list, hasLoadedList: restored.data.list.length > 0 }
          : current;
      },
      onRehydrateStorage: () => () => useAnalysesStore.setState({ hasHydrated: true }),
    },
  ),
);
