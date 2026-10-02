import { describe, expect, it } from 'vitest';
import { createUuid } from './uuid';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createUuid', () => {
  it('produces RFC 4122 version 4 UUIDs', () => {
    expect(createUuid()).toMatch(UUID_V4_PATTERN);
  });

  it('does not repeat across many calls', () => {
    const generated = new Set(Array.from({ length: 10_000 }, () => createUuid()));
    expect(generated.size).toBe(10_000);
  });
});
