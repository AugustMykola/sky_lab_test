import { Grid } from '@mui/material';
import type { AnalysisListItem } from '../../../../api/types';
import { AnalysisCard } from './AnalysisCard';

interface AnalysesGridProps {
  analyses: AnalysisListItem[];
  canDelete: boolean;
  onDelete: (analysis: AnalysisListItem) => void;
}

export const AnalysesGrid = ({ analyses, canDelete, onDelete }: AnalysesGridProps) => (
  <Grid container spacing={2}>
    {analyses.map((analysis) => (
      <Grid key={analysis.id} size={{ xs: 12, sm: 6, lg: 4 }}>
        <AnalysisCard analysis={analysis} canDelete={canDelete} onDelete={onDelete} />
      </Grid>
    ))}
  </Grid>
);
