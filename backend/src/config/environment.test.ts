import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadEnvironment } from './environment';

describe('loadEnvironment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses defaults when variables are not set', () => {
    vi.stubEnv('PORT', undefined);
    vi.stubEnv('DB_PATH', undefined);
    expect(loadEnvironment()).toEqual({ port: 3000, databasePath: 'data/log-analyzer.db' });
  });

  it('reads and coerces provided variables', () => {
    vi.stubEnv('PORT', '8081');
    vi.stubEnv('DB_PATH', '/data/test.db');
    expect(loadEnvironment()).toEqual({ port: 8081, databasePath: '/data/test.db' });
  });

  it('fails fast on an invalid port instead of listening on NaN', () => {
    vi.stubEnv('PORT', 'abc');
    expect(() => loadEnvironment()).toThrow();
  });
});
