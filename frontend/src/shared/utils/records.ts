export const filterRecord = <Value>(
  record: Record<string, Value>,
  shouldKeep: (key: string, value: Value) => boolean,
): Record<string, Value> => Object.fromEntries(Object.entries(record).filter(([key, value]) => shouldKeep(key, value)));
