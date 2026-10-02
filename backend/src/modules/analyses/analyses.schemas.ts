import * as zod from 'zod';
import {
  logLevelSchema,
  MAX_CONTENT_BYTES,
  MAX_NAME_LENGTH,
  MAX_SEARCH_LENGTH,
  SortOrder,
  sortOrderSchema,
  isWithinByteLimit,
} from '@log-analyzer/domain';

const MAX_CLIENT_ID_LENGTH = 100;

export const createAnalysisSchema = zod.object({
  name: zod.string().trim().min(1, 'Name is required').max(MAX_NAME_LENGTH),
  content: zod
    .string()
    .refine((value) => isWithinByteLimit(value, MAX_CONTENT_BYTES), 'Log content exceeds 5 MB')
    .refine((value) => value.trim() !== '', 'Log content is required'),
  clientId: zod.string().trim().min(1).max(MAX_CLIENT_ID_LENGTH).optional(),
  createdAt: zod.iso.datetime().optional(),
});

export const idParamsSchema = zod.object({ id: zod.uuid('Invalid analysis id') });

const levelListSchema = zod
  .string()
  .optional()
  .transform((value) => (value ? [...new Set(value.split(',').map((level) => level.trim().toUpperCase()))] : []))
  .pipe(zod.array(logLevelSchema));

export const entriesQuerySchema = zod.object({
  level: levelListSchema,
  q: zod.string().trim().max(MAX_SEARCH_LENGTH).default(''),
  sort: sortOrderSchema.default(SortOrder.Asc),
  page: zod.coerce.number().int().min(1).default(1),
  pageSize: zod.coerce.number().int().min(1).max(200).default(50),
});
