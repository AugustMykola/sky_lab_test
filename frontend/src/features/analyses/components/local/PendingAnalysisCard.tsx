import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import { Box, Button, Card, CardActionArea, CardActions, CardContent, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { formatDateTime } from '../../../../shared/format';
import { SyncStatus, type PendingAnalysis } from '../../store/outbox.store';
import { LevelCountList } from '../history/LevelCountList';
import { SyncStatusChip } from './SyncStatusChip';

interface PendingAnalysisCardProps {
  pending: PendingAnalysis;
  onRetry: (localId: string) => void;
  onDelete: (localId: string) => void;
}

export const PendingAnalysisCard = ({ pending, onRetry, onDelete }: PendingAnalysisCardProps) => (
  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderStyle: 'dashed' }}>
    <CardActionArea component={RouterLink} to={`/analyses/${pending.localId}`} sx={{ flexGrow: 1, alignItems: 'flex-start' }}>
      <CardContent>
        <Box sx={{ mb: 1 }}>
          <SyncStatusChip status={pending.status} />
        </Box>
        <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>
          {pending.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {formatDateTime(pending.createdAt)} · {pending.summary.totalEntries.toLocaleString()} entries
        </Typography>
        <LevelCountList levelCounts={pending.summary.levelCounts} invalidCount={pending.summary.invalidCount} />
      </CardContent>
    </CardActionArea>
    <CardActions sx={{ justifyContent: 'flex-end' }}>
      {pending.status === SyncStatus.Failed && (
        <Button size="small" startIcon={<ReplayIcon />} onClick={() => onRetry(pending.localId)}>
          Retry
        </Button>
      )}
      <Button
        size="small"
        color="error"
        startIcon={<DeleteOutlineIcon />}
        disabled={pending.status === SyncStatus.Syncing}
        onClick={() => onDelete(pending.localId)}
      >
        Delete
      </Button>
    </CardActions>
  </Card>
);
