import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import type { LogEntry } from '../../../../api/types';
import { LevelChip } from '../../../../shared/components/LevelChip';
import { monospaceSx } from '../../../../shared/styles/typography';

const EntryRow = ({ entry }: { entry: LogEntry }) => (
  <TableRow hover>
    <TableCell sx={{ ...monospaceSx, color: 'text.secondary' }}>{entry.lineNumber}</TableCell>
    <TableCell sx={{ ...monospaceSx, whiteSpace: 'nowrap' }}>{entry.timestamp}</TableCell>
    <TableCell>
      <LevelChip level={entry.level} />
    </TableCell>
    <TableCell sx={{ ...monospaceSx, overflowWrap: 'anywhere' }}>{entry.message}</TableCell>
  </TableRow>
);

export const EntriesTableView = ({ entries }: { entries: LogEntry[] }) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 72 }}>Line</TableCell>
          <TableCell sx={{ width: 180 }}>Timestamp</TableCell>
          <TableCell sx={{ width: 96 }}>Level</TableCell>
          <TableCell>Message</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map((entry) => (
          <EntryRow key={entry.lineNumber} entry={entry} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
