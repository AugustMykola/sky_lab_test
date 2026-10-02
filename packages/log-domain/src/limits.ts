export const MAX_CONTENT_BYTES = 5 * 1024 * 1024;
export const MAX_NAME_LENGTH = 100;
export const MAX_SEARCH_LENGTH = 200;

const ONE_BYTE_LIMIT = 0x80;
const TWO_BYTES_LIMIT = 0x800;
const THREE_BYTES_LIMIT = 0x10000;

const utf8BytesForCodePoint = (codePoint: number): number => {
  if (codePoint < ONE_BYTE_LIMIT) return 1;
  if (codePoint < TWO_BYTES_LIMIT) return 2;
  if (codePoint < THREE_BYTES_LIMIT) return 3;
  return 4;
};

export const utf8ByteLength = (value: string): number => {
  let byteLength = 0;
  for (const character of value) {
    byteLength += utf8BytesForCodePoint(character.codePointAt(0) ?? 0);
  }
  return byteLength;
};

const MAX_UTF8_BYTES_PER_UTF16_UNIT = 3;

export const isWithinByteLimit = (value: string, maxBytes: number): boolean => {
  if (value.length > maxBytes) return false;
  if (value.length * MAX_UTF8_BYTES_PER_UTF16_UNIT <= maxBytes) return true;
  return utf8ByteLength(value) <= maxBytes;
};
