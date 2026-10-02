import dayjs from 'dayjs';

const format = (level: string, message: string) => `${dayjs().toISOString()} ${level} ${message}`;

export const logger = {
  info: (message: string) => console.log(format('INFO', message)),
  error: (message: string, error?: unknown) => console.error(format('ERROR', message), error ?? ''),
};
