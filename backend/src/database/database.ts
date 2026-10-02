import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA } from './schema';

export type SqliteDatabase = Database.Database;

export const IN_MEMORY_DATABASE = ':memory:';

export const UNICODE_LOWER_FUNCTION = 'unicode_lower';

const toUnicodeLower = (value: unknown) => (typeof value === 'string' ? value.toLowerCase() : value);

export const openDatabase = (filePath: string): SqliteDatabase => {
  if (filePath !== IN_MEMORY_DATABASE) fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new Database(filePath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.function(UNICODE_LOWER_FUNCTION, { deterministic: true }, toUnicodeLower);
  database.exec(SCHEMA);
  return database;
};
