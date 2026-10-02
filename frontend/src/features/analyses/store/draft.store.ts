import * as zod from 'zod';
import { create } from 'zustand';
import { persistWithDebounce, readPersisted } from '../../../shared/storage/debouncedPersistence';

const draftSchema = zod.object({
  name: zod.string(),
  content: zod.string(),
  fileName: zod.string().optional(),
});

type Draft = zod.infer<typeof draftSchema>;

interface DraftState extends Draft {
  setName: (name: string) => void;
  setContent: (content: string, fileName?: string) => void;
  reset: () => void;
}

const DRAFT_STORAGE_KEY = 'log-analyzer:new-analysis-draft';
const DRAFT_WRITE_DELAY_IN_MILLISECONDS = 500;
const MAX_PERSISTED_CONTENT_LENGTH = 1024 * 1024;

const INITIAL_DRAFT: Draft = { name: '', content: '', fileName: undefined };

const toPersistedDraft = ({ name, content, fileName }: Draft): Draft =>
  content.length > MAX_PERSISTED_CONTENT_LENGTH ? { name, content: '', fileName: undefined } : { name, content, fileName };

export const useDraftStore = create<DraftState>()((set) => ({
  ...INITIAL_DRAFT,
  ...readPersisted(DRAFT_STORAGE_KEY, draftSchema),
  setName: (name) => set({ name }),
  setContent: (content, fileName) => set({ content, fileName }),
  reset: () => set(INITIAL_DRAFT),
}));

persistWithDebounce(useDraftStore, {
  key: DRAFT_STORAGE_KEY,
  delayInMilliseconds: DRAFT_WRITE_DELAY_IN_MILLISECONDS,
  select: toPersistedDraft,
});
