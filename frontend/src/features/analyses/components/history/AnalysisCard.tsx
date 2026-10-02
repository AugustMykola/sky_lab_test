import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { Button, Card, CardActionArea, CardActions, CardContent, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { AnalysisListItem } from '../../../../api/types';
import { formatDateTime } from '../../../../shared/format';
import { LevelCountList } from './LevelCountList';

interface AnalysisCardProps {
  analysis: AnalysisListItem;
  canDelete: boolean;
  onDelete: (analysis: AnalysisListItem) => void;
}

export const AnalysisCard = ({ analysis, canDelete, onDelete }: AnalysisCardProps) => (
  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardActionArea component={RouterLink} to={`/analyses/${analysis.id}`} sx={{ flexGrow: 1, alignItems: 'flex-start' }}>
      <CardContent>
        <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>
          {analysis.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {formatDateTime(analysis.createdAt)} · {analysis.totalEntries.toLocaleString()} entries
        </Typography>
        <LevelCountList levelCounts={analysis.levelCounts} invalidCount={analysis.invalidCount} />
      </CardContent>
    </CardActionArea>
    <CardActions sx={{ justifyContent: 'flex-end' }}>
      <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} disabled={!canDelete} onClick={() => onDelete(analysis)}>
        Delete
      </Button>
    </CardActions>
  </Card>
);
