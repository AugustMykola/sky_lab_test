const UUID_BYTE_COUNT = 16;
const VERSION_BYTE_INDEX = 6;
const VARIANT_BYTE_INDEX = 8;
const VERSION_4_BITS = 0x40;
const RFC_4122_VARIANT_BITS = 0x80;
const LOW_NIBBLE_MASK = 0x0f;
const LOW_SIX_BITS_MASK = 0x3f;
const HYPHEN_POSITIONS: ReadonlySet<number> = new Set([4, 6, 8, 10]);

const toHex = (byte: number) => byte.toString(16).padStart(2, '0');

export const createUuid = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(UUID_BYTE_COUNT));
  bytes[VERSION_BYTE_INDEX] = (bytes[VERSION_BYTE_INDEX] & LOW_NIBBLE_MASK) | VERSION_4_BITS;
  bytes[VARIANT_BYTE_INDEX] = (bytes[VARIANT_BYTE_INDEX] & LOW_SIX_BITS_MASK) | RFC_4122_VARIANT_BITS;

  return [...bytes].map((byte, index) => `${HYPHEN_POSITIONS.has(index) ? '-' : ''}${toHex(byte)}`).join('');
};
