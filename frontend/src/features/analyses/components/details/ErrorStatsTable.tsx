import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import {
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ErrorStat } from '../../../../api/types';
import { LevelChip } from '../../../../shared/components/LevelChip';

const NoErrors = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 4, justifyContent: 'center' }}>
    <CheckCircleOutlineIcon color="success" />
    <Typography>No ERROR or FATAL messages in this log.</Typography>
  </Box>
);

const ErrorStatsGrid = ({ stats }: { stats: ErrorStat[] }) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small" sx={{ minWidth: 640 }}>
      <TableHead>
        <TableRow>
          <TableCell>Level</TableCell>
          <TableCell>Message</TableCell>
          <TableCell align="right">Count</TableCell>
          <TableCell>First seen</TableCell>
          <TableCell>Last seen</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {stats.map((errorStat) => (
          <TableRow key={`${errorStat.level}:${errorStat.message}`} hover>
            <TableCell>
              <LevelChip level={errorStat.level} />
            </TableCell>
            <TableCell sx={{ overflowWrap: 'anywhere' }}>{errorStat.message}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              {errorStat.count.toLocaleString()}
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{errorStat.firstSeen}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{errorStat.lastSeen}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

interface ErrorStatsTableProps {
  stats: ErrorStat[];
  groupCount: number;
}

export const ErrorStatsTable = ({ stats, groupCount }: ErrorStatsTableProps) => {
  if (stats.length === 0) return <NoErrors />;

  return (
    <>
      {groupCount > stats.length && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing the {stats.length} most frequent of {groupCount.toLocaleString()} distinct error messages.
        </Alert>
      )}
      <ErrorStatsGrid stats={stats} />
    </>
  );
};
