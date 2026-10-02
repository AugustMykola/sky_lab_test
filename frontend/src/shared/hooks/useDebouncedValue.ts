import { useEffect, useState } from 'react';

export const useDebouncedValue = <T>(value: T, delayInMilliseconds = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayInMilliseconds);
    return () => clearTimeout(timer);
  }, [value, delayInMilliseconds]);

  return debounced;
};
