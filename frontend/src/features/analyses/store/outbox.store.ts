import {
  analysisSummarySchema,
  analyze,
  NO_VALID_LOG_LINES_MESSAGE,
  parseLog,
  type LogEntry,
} from '@log-analyzer/domain';
import dayjs from 'dayjs';
import * as zod from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ApiError, ApiErrorCode, toApiError } from '../../../api/ApiError';
import type { EntriesPage, EntriesQuery } from '../../../api/types';
import { useNotificationsStore } from '../../../shared/notifications/notifications.store';
import { createDedupedStorage } from '../../../shared/storage/dedupedStorage';
import {
  indexedDbStorage,
  listIndexedDbKeys,
  readFromIndexedDb,
  removeFromIndexedDb,
  writeToIndexedDb,
  writeToIndexedDbOrFail,
} from '../../../shared/storage/indexedDbStorage';
import { waitForHydration } from '../../../shared/storage/waitForHydration';
import { filterRecord } from '../../../shared/utils/records';
import { createLocalAnalysisId } from '../local/localAnalysisId';
import { queryEntries } from '../local/queryEntries';
import { useAnalysesStore } from './analyses.store';

export enum SyncStatus {
  Pending = 'pending',
  Syncing = 'syncing',
  Failed = 'failed',
}

export enum UploadTiming {
  Immediately = 'immediately',
  AfterBackoff = 'after-backoff',
}

const ITEM_STORAGE_PREFIX = 'log-analyzer:outbox-item:';
const CONTENT_STORAGE_PREFIX = 'log-analyzer:outbox-content:';
const UNPROCESSABLE_STATUS = 422;
const FIRST_RETRY_DELAY_IN_MILLISECONDS = 15_000;
const MAX_RETRY_DELAY_IN_MILLISECONDS = 5 * 60_000;
const MAX_REMEMBERED_SYNCED_IDS = 100;

const pendingAnalysisSchema = zod.object({
  localId: zod.string(),
  name: zod.string(),
  createdAt: zod.string(),
  summary: analysisSummarySchema,
  status: zod.enum(SyncStatus),
  failureReason: zod.string().optional(),
});

const persistedSyncedIdsSchema = zod.object({ syncedIds: zod.record(zod.string(), zod.string()) });

export type PendingAnalysis = zod.infer<typeof pendingAnalysisSchema>;

interface AddLocalOptions {
  localId?: string;
  uploadTiming?: UploadTiming;
}

interface OutboxState {
  items: PendingAnalysis[];
  parsedEntries: Record<string, LogEntry[]>;
  syncedIds: Record<string, string>;
  syncing: boolean;
  hasHydrated: boolean;
  addLocal: (name: string, content: string, options?: AddLocalOptions) => Promise<PendingAnalysis>;
  loadEntriesPage: (localId: string, query: EntriesQuery) => Promise<EntriesPage>;
  deleteLocal: (localId: string) => boolean;
  retry: (localId: string) => void;
  sync: () => Promise<void>;
}

enum UploadOutcome {
  Uploaded = 'uploaded',
  Rejected = 'rejected',
  Postponed = 'postponed',
  Skipped = 'skipped',
}

const toItemKey = (localId: string) => `${ITEM_STORAGE_PREFIX}${localId}`;
const toContentKey = (localId: string) => `${CONTENT_STORAGE_PREFIX}${localId}`;

const readContent = async (localId: string): Promise<string | undefined> => {
  const stored = zod.string().safeParse(await readFromIndexedDb(toContentKey(localId)));
  return stored.success ? stored.data : undefined;
};

const resumeInterruptedSync = (item: PendingAnalysis): PendingAnalysis =>
  item.status === SyncStatus.Syncing ? { ...item, status: SyncStatus.Pending } : item;

const byNewestFirst = (left: PendingAnalysis, right: PendingAnalysis): number =>
  right.createdAt.localeCompare(left.createdAt);

const readStoredItems = async (): Promise<PendingAnalysis[]> => {
  const itemKeys = await listIndexedDbKeys(ITEM_STORAGE_PREFIX);
  const storedItems = await Promise.all(itemKeys.map((itemKey) => readFromIndexedDb(itemKey)));
  return storedItems
    .flatMap((storedItem) => {
      const parsed = pendingAnalysisSchema.safeParse(storedItem);
      return parsed.success ? [resumeInterruptedSync(parsed.data)] : [];
    })
    .sort(byNewestFirst);
};

const rememberSyncedId = (syncedIds: Record<string, string>, localId: string, serverId: string) =>
  Object.fromEntries([...Object.entries(syncedIds), [localId, serverId]].slice(-MAX_REMEMBERED_SYNCED_IDS));

const retryDelay = (attempt: number): number =>
  Math.min(FIRST_RETRY_DELAY_IN_MILLISECONDS * 2 ** attempt, MAX_RETRY_DELAY_IN_MILLISECONDS);

const syncedIdsStorage = createDedupedStorage(indexedDbStorage);

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set, get) => {
      let retryAttempt = 0;
      let retryTimer: ReturnType<typeof setTimeout> | undefined;
      let anotherPassRequested = false;

      const scheduleRetry = () => {
        clearTimeout(retryTimer);
        if (!navigator.onLine) return;
        retryTimer = setTimeout(() => void get().sync(), retryDelay(retryAttempt));
        retryAttempt += 1;
      };

      const updateItem = (localId: string, patch: Partial<PendingAnalysis>) => {
        set((state) => ({
          items: state.items.map((item) => (item.localId === localId ? { ...item, ...patch } : item)),
        }));
        const updated = get().items.find((item) => item.localId === localId);
        if (updated) void writeToIndexedDb(toItemKey(localId), updated);
      };

      const forget = (localId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.localId !== localId),
          parsedEntries: filterRecord(state.parsedEntries, (key) => key !== localId),
        }));
        void removeFromIndexedDb([toItemKey(localId), toContentKey(localId)]);
      };

      const refreshItemsFromStorage = async () => {
        const storedItems = await readStoredItems();
        const inMemory = new Map(get().items.map((item) => [item.localId, item]));
        set({ items: storedItems.map((storedItem) => inMemory.get(storedItem.localId) ?? storedItem) });
      };

      const isStillPending = (localId: string) =>
        get().items.some((item) => item.localId === localId && item.status === SyncStatus.Pending);

      const upload = async (item: PendingAnalysis): Promise<UploadOutcome> => {
        const content = await readContent(item.localId);
        if (!isStillPending(item.localId)) return UploadOutcome.Skipped;
        if (content === undefined) {
          updateItem(item.localId, { status: SyncStatus.Failed, failureReason: 'The saved log could not be read.' });
          return UploadOutcome.Rejected;
        }

        updateItem(item.localId, { status: SyncStatus.Syncing, failureReason: undefined });
        try {
          const analysis = await useAnalysesStore
            .getState()
            .createAnalysis({ name: item.name, content, clientId: item.localId, createdAt: item.createdAt });
          forget(item.localId);
          set((state) => ({ syncedIds: rememberSyncedId(state.syncedIds, item.localId, analysis.id) }));
          useNotificationsStore.getState().notify(`"${item.name}" uploaded`);
          return UploadOutcome.Uploaded;
        } catch (caughtError) {
          const error = toApiError(caughtError);
          if (error.isRetryable) {
            updateItem(item.localId, { status: SyncStatus.Pending });
            return UploadOutcome.Postponed;
          }
          updateItem(item.localId, { status: SyncStatus.Failed, failureReason: error.message });
          return UploadOutcome.Rejected;
        }
      };

      const nextPending = (attempted: ReadonlySet<string>) =>
        get().items.find((item) => item.status === SyncStatus.Pending && !attempted.has(item.localId));

      const parsedEntriesFor = async (localId: string): Promise<LogEntry[]> => {
        const cached = get().parsedEntries[localId];
        if (cached) return cached;

        const content = await readContent(localId);
        if (content === undefined) return [];

        const entries = parseLog(content).entries;
        set((state) => ({ parsedEntries: { ...state.parsedEntries, [localId]: entries } }));
        return entries;
      };

      return {
        items: [],
        parsedEntries: {},
        syncedIds: {},
        syncing: false,
        hasHydrated: false,

        addLocal: async (
          name,
          content,
          { localId = createLocalAnalysisId(), uploadTiming = UploadTiming.Immediately } = {},
        ) => {
          await waitForHydration(useOutboxStore);
          const parsed = parseLog(content);
          if (parsed.entries.length === 0) {
            throw new ApiError(UNPROCESSABLE_STATUS, ApiErrorCode.Unprocessable, NO_VALID_LOG_LINES_MESSAGE);
          }

          const item: PendingAnalysis = {
            localId,
            name,
            createdAt: dayjs().toISOString(),
            summary: analyze(parsed),
            status: SyncStatus.Pending,
          };
          await writeToIndexedDbOrFail(toContentKey(localId), content);
          await writeToIndexedDbOrFail(toItemKey(localId), item);
          set((state) => ({
            items: [item, ...state.items],
            parsedEntries: { ...state.parsedEntries, [localId]: parsed.entries },
          }));
          if (uploadTiming === UploadTiming.AfterBackoff) {
            scheduleRetry();
          } else if (navigator.onLine) {
            void get().sync();
          }
          return item;
        },

        loadEntriesPage: async (localId, query) => queryEntries(await parsedEntriesFor(localId), query),

        deleteLocal: (localId) => {
          const pending = get().items.find((item) => item.localId === localId);
          if (!pending || pending.status === SyncStatus.Syncing) return false;
          forget(localId);
          useNotificationsStore.getState().notify(`"${pending.name}" deleted from this device`);
          return true;
        },

        retry: (localId) => {
          updateItem(localId, { status: SyncStatus.Pending, failureReason: undefined });
          void get().sync();
        },

        sync: async () => {
          await waitForHydration(useOutboxStore);
          if (get().syncing) {
            anotherPassRequested = true;
            return;
          }

          set({ syncing: true });
          anotherPassRequested = false;
          const attempted = new Set<string>();
          let anyPostponed = false;
          try {
            await refreshItemsFromStorage();
            for (let pending = nextPending(attempted); pending; pending = nextPending(attempted)) {
              attempted.add(pending.localId);
              if ((await upload(pending)) === UploadOutcome.Postponed) anyPostponed = true;
            }
            if (anyPostponed) {
              scheduleRetry();
            } else {
              retryAttempt = 0;
            }
          } finally {
            set({ syncing: false });
          }
          if (anotherPassRequested) void get().sync();
        },
      };
    },
    {
      name: 'log-analyzer:outbox',
      storage: createJSONStorage(() => syncedIdsStorage),
      partialize: (state) => ({ syncedIds: state.syncedIds }),
      merge: (persisted, current) => {
        const restored = persistedSyncedIdsSchema.safeParse(persisted);
        return restored.success ? { ...current, syncedIds: restored.data.syncedIds } : current;
      },
      onRehydrateStorage: () => () => {
        void readStoredItems().then((items) => useOutboxStore.setState({ items, hasHydrated: true }));
      },
    },
  ),
);
