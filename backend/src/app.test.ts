import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { IN_MEMORY_DATABASE, openDatabase } from './database/database';

const LOG = [
  '2026-09-30 12:41:02 INFO User connected',
  '2026-09-30 12:41:05 WARN Slow request: 1250ms',
  'not a log line',
  '2026-09-30 12:41:08 ERROR Database connection failed',
  '2026-09-30 12:40:00 ERROR Database connection failed',
].join('\n');

describe('Analyses API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(openDatabase(IN_MEMORY_DATABASE));
  });

  const createAnalysis = () => request(app).post('/api/analyses').send({ name: 'Prod logs', content: LOG });

  it('creates an analysis and returns its summary', async () => {
    const response = await createAnalysis();

    expect(response.status).toBe(201);
    expect(response.body.summary).toMatchObject({
      totalEntries: 4,
      invalidCount: 1,
      levelCounts: { INFO: 1, WARN: 1, ERROR: 2 },
      errorStats: [{ message: 'Database connection failed', count: 2, firstSeen: '2026-09-30 12:40:00' }],
    });
  });

  it('lists, reads and deletes analyses', async () => {
    const { body: created } = await createAnalysis();

    const list = await request(app).get('/api/analyses');
    expect(list.body).toEqual([expect.objectContaining({ id: created.id, name: 'Prod logs', totalEntries: 4 })]);

    expect((await request(app).get(`/api/analyses/${created.id}`)).status).toBe(200);
    expect((await request(app).delete(`/api/analyses/${created.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/analyses/${created.id}`)).status).toBe(404);
  });

  it('filters, searches, sorts and paginates entries on the server', async () => {
    const { body: created } = await createAnalysis();
    const url = `/api/analyses/${created.id}/entries`;

    const sortedDesc = await request(app).get(url).query({ sort: 'desc' });
    expect(sortedDesc.body.items.map((entry: { timestamp: string }) => entry.timestamp)).toEqual([
      '2026-09-30 12:41:08',
      '2026-09-30 12:41:05',
      '2026-09-30 12:41:02',
      '2026-09-30 12:40:00',
    ]);

    const errors = await request(app).get(url).query({ level: 'ERROR,WARN' });
    expect(errors.body.total).toBe(3);

    const search = await request(app).get(url).query({ q: 'slow' });
    expect(search.body.items).toEqual([expect.objectContaining({ level: 'WARN' })]);

    const page = await request(app).get(url).query({ pageSize: 3, page: 2 });
    expect(page.body).toMatchObject({ total: 4, page: 2, pageSize: 3 });
    expect(page.body.items).toHaveLength(1);
  });

  it('searches case-insensitively for non-ASCII text too', async () => {
    const content = ['2026-09-30 12:00:00 ERROR Помилка бази даних', '2026-09-30 12:00:01 INFO Усе гаразд'].join('\n');
    const { body: created } = await request(app).post('/api/analyses').send({ name: 'Cyrillic', content });

    const response = await request(app).get(`/api/analyses/${created.id}/entries`).query({ q: 'ПОМИЛКА' });

    expect(response.body.items).toEqual([expect.objectContaining({ message: 'Помилка бази даних' })]);
  });

  it('answers an unsupported body encoding with 415 instead of 500', async () => {
    const response = await request(app)
      .post('/api/analyses')
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'x-unknown')
      .send('{}');

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('treats LIKE wildcards in search literally', async () => {
    const { body: created } = await createAnalysis();
    const response = await request(app).get(`/api/analyses/${created.id}/entries`).query({ q: '%' });
    expect(response.body.total).toBe(0);
  });

  it.each([
    ['empty name', { name: '  ', content: LOG }, 400],
    ['missing content', { name: 'x' }, 400],
    ['no valid lines', { name: 'x', content: 'garbage\nmore garbage' }, 422],
  ])('rejects %s', async (_caseName, body, status) => {
    const response = await request(app).post('/api/analyses').send(body);
    expect(response.status).toBe(status);
    expect(response.body.error.code).toEqual(expect.any(String));
  });

  it('rejects malformed ids and unknown query values', async () => {
    expect((await request(app).get('/api/analyses/not-a-uuid')).status).toBe(400);

    const { body: created } = await createAnalysis();
    expect((await request(app).get(`/api/analyses/${created.id}/entries`).query({ level: 'NOPE' })).status).toBe(400);
  });

  it('accepts a log just under 5 MB even when JSON escaping doubles the request body', async () => {
    const quotedLine = `2026-09-30 12:41:02 INFO ${'"'.repeat(100)}`;
    const content = Array.from({ length: 40_000 }, () => quotedLine).join('\n');
    expect(Buffer.byteLength(content)).toBeLessThan(5 * 1024 * 1024);
    expect(Buffer.byteLength(JSON.stringify({ content }))).toBeGreaterThan(8 * 1024 * 1024);

    const response = await request(app).post('/api/analyses').send({ name: 'Quotes', content });

    expect(response.status).toBe(201);
  });

  it('rejects content over 5 MB of UTF-8 with a validation error instead of 413', async () => {
    const cjkLine = `2026-09-30 12:41:02 INFO ${'日'.repeat(100)}`;
    const content = Array.from({ length: 20_000 }, () => cjkLine).join('\n');
    expect(content.length).toBeLessThan(5 * 1024 * 1024);
    expect(Buffer.byteLength(content)).toBeGreaterThan(5 * 1024 * 1024);

    const response = await request(app).post('/api/analyses').send({ name: 'CJK', content });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([{ field: 'content', message: 'Log content exceeds 5 MB' }]);
  });

  it('returns 500 (not 400) when a stored row is corrupted', async () => {
    const database = openDatabase(IN_MEMORY_DATABASE);
    const appWithCorruptedRow = createApp(database);
    database
      .prepare('INSERT INTO analyses (id, name, created_at, summary) VALUES (?, ?, ?, ?)')
      .run('7d1f2b8e-0c5a-4b8e-9f3a-1c2d3e4f5a6b', 'broken', '2026-01-01T00:00:00.000Z', '{"unexpected":true}');

    const response = await request(appWithCorruptedRow).get('/api/analyses');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('answers a repeated history request with 304 when nothing changed', async () => {
    await createAnalysis();
    const first = await request(app).get('/api/analyses');
    expect(first.headers['cache-control']).toBe('no-cache');
    expect(first.headers.etag).toEqual(expect.any(String));

    const unchanged = await request(app).get('/api/analyses').set('If-None-Match', first.headers.etag);
    expect(unchanged.status).toBe(304);

    await createAnalysis();
    const changed = await request(app).get('/api/analyses').set('If-None-Match', first.headers.etag);
    expect(changed.status).toBe(200);
  });

  it('treats a repeated upload with the same clientId as idempotent', async () => {
    const body = { name: 'Offline upload', content: LOG, clientId: 'local-123' };

    const first = await request(app).post('/api/analyses').send(body);
    const repeated = await request(app).post('/api/analyses').send(body);

    expect(first.status).toBe(201);
    expect(repeated.status).toBe(200);
    expect(repeated.body.id).toBe(first.body.id);
    expect((await request(app).get('/api/analyses')).body).toHaveLength(1);
  });

  it('keeps the original createdAt of an analysis made offline and clamps one from the future to now', async () => {
    const madeOffline = await request(app)
      .post('/api/analyses')
      .send({ name: 'Monday', content: LOG, clientId: 'local-monday', createdAt: '2026-09-28T09:00:00.000Z' });
    const beforeRequest = Date.now();
    const fastClock = await request(app)
      .post('/api/analyses')
      .send({ name: 'Fast clock', content: LOG, createdAt: '2999-01-01T00:00:00.000Z' });

    expect(madeOffline.body.createdAt).toBe('2026-09-28T09:00:00.000Z');
    expect(fastClock.status).toBe(201);
    expect(Date.parse(fastClock.body.createdAt)).toBeGreaterThanOrEqual(beforeRequest - 1000);
    expect(Date.parse(fastClock.body.createdAt)).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('accepts a log under 5 MB whose control characters inflate the JSON body far beyond 12 MB', async () => {
    const controlLine = `2026-09-30 12:41:02 INFO ${'\u0001'.repeat(100)}`;
    const content = Array.from({ length: 36_000 }, () => controlLine).join('\n');
    expect(Buffer.byteLength(content)).toBeLessThan(5 * 1024 * 1024);
    expect(Buffer.byteLength(JSON.stringify({ content }))).toBeGreaterThan(12 * 1024 * 1024);

    const response = await request(app).post('/api/analyses').send({ name: 'Control characters', content });

    expect(response.status).toBe(201);
  });

  it('gives repeated levels in the filter the same result as unique ones', async () => {
    const { body: created } = await createAnalysis();
    const url = `/api/analyses/${created.id}/entries`;

    const unique = await request(app).get(url).query({ level: 'ERROR' });
    const repeated = await request(app).get(url).query({ level: 'ERROR,ERROR,error' });

    expect(repeated.status).toBe(200);
    expect(repeated.body).toEqual(unique.body);
  });

  it('allows the same clientId again after the analysis was deleted', async () => {
    const body = { name: 'Offline upload', content: LOG, clientId: 'local-456' };
    const first = await request(app).post('/api/analyses').send(body);
    await request(app).delete(`/api/analyses/${first.body.id}`);

    const again = await request(app).post('/api/analyses').send(body);

    expect(again.status).toBe(201);
    expect(again.body.id).not.toBe(first.body.id);
  });

  it('returns 400 for malformed JSON and 404 for unknown routes', async () => {
    const malformed = await request(app).post('/api/analyses').set('Content-Type', 'application/json').send('{bad');
    expect(malformed.status).toBe(400);
    expect((await request(app).get('/api/nope')).status).toBe(404);
  });
});
