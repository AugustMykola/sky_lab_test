import type { SqliteDatabase } from './database';

export type RunInTransaction = <T>(work: () => T) => T;

export const createTransactionRunner =
  (database: SqliteDatabase): RunInTransaction =>
  (work) =>
    database.transaction(work)();
