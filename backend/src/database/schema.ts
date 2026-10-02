export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS analyses (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    summary     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS entries (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id  TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    line_number  INTEGER NOT NULL,
    timestamp    TEXT NOT NULL,
    level        TEXT NOT NULL,
    message      TEXT NOT NULL,

    UNIQUE (analysis_id, line_number)
  );

  CREATE INDEX IF NOT EXISTS idx_entries_analysis_ts
    ON entries (analysis_id, timestamp, line_number);

  CREATE INDEX IF NOT EXISTS idx_entries_analysis_level
    ON entries (analysis_id, level);

  CREATE TABLE IF NOT EXISTS client_requests (
    client_id    TEXT PRIMARY KEY,
    analysis_id  TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE
  );
`;
