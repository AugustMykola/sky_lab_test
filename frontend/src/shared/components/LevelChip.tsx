import { Chip, type ChipProps } from '@mui/material';
import { LogLevel } from '../../api/types';

const LEVEL_STYLES: Record<LogLevel, Pick<ChipProps, 'color' | 'variant'>> = {
  [LogLevel.Debug]: { color: 'default', variant: 'outlined' },
  [LogLevel.Info]: { color: 'info', variant: 'outlined' },
  [LogLevel.Warn]: { color: 'warning', variant: 'outlined' },
  [LogLevel.Error]: { color: 'error', variant: 'outlined' },
  [LogLevel.Fatal]: { color: 'error', variant: 'filled' },
};

export const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.Debug]: 'text.secondary',
  [LogLevel.Info]: 'info.main',
  [LogLevel.Warn]: 'warning.main',
  [LogLevel.Error]: 'error.main',
  [LogLevel.Fatal]: 'error.dark',
};

export const LevelChip = ({ level }: { level: LogLevel }) => (
  <Chip label={level} size="small" {...LEVEL_STYLES[level]} sx={{ fontWeight: 600, minWidth: 64 }} />
);
