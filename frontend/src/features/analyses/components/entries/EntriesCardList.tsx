import { Box, Paper, Stack, Typography } from '@mui/material';
import type { LogEntry } from '../../../../api/types';
import { LevelChip } from '../../../../shared/components/LevelChip';
import { monospaceSx } from '../../../../shared/styles/typography';

const EntryCard = ({ entry }: { entry: LogEntry }) => (
  <Paper variant="outlined" sx={{ p: 1.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      <LevelChip level={entry.level} />
      <Typography variant="caption" color="text.secondary" sx={monospaceSx}>
        {entry.timestamp} · #{entry.lineNumber}
      </Typography>
    </Box>
    <Typography variant="body2" sx={{ ...monospaceSx, overflowWrap: 'anywhere' }}>
      {entry.message}
    </Typography>
  </Paper>
);

export const EntriesCardList = ({ entries }: { entries: LogEntry[] }) => (
  <Stack spacing={1}>
    {entries.map((entry) => (
      <EntryCard key={entry.lineNumber} entry={entry} />
    ))}
  </Stack>
);
