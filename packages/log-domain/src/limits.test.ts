import { describe, expect, it } from 'vitest';
import { isWithinByteLimit, utf8ByteLength } from './limits';

describe('isWithinByteLimit', () => {
  it.each([
    ['short ASCII (fast path)', 'abc', 10, true],
    ['more UTF-16 units than bytes allowed (fast path)', 'abcdef', 5, false],
    ['CJK that fits exactly', '日日', 6, true],
    ['CJK that is one byte over', '日日', 5, false],
    ['emoji pair within limit', '😀', 4, true],
  ])('handles %s', (_caseName, value, maxBytes, expected) => {
    expect(isWithinByteLimit(value, maxBytes)).toBe(expected);
  });
});

describe('utf8ByteLength', () => {
  it.each([
    ['ASCII', 'abc', 3],
    ['Cyrillic', 'Ж', 2],
    ['CJK', '日', 3],
    ['emoji (surrogate pair)', '😀', 4],
    ['lone surrogate (encoded as U+FFFD)', '\uD800', 3],
    ['empty', '', 0],
  ])('counts %s', (_caseName, value, expected) => {
    expect(utf8ByteLength(value)).toBe(expected);
    expect(utf8ByteLength(value)).toBe(new TextEncoder().encode(value).length);
  });
});
