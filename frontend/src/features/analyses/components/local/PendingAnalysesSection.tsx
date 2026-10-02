import { Grid, Typography } from '@mui/material';
import type { PendingAnalysis } from '../../store/outbox.store';
import { PendingAnalysisCard } from './PendingAnalysisCard';

interface PendingAnalysesSectionProps {
  pending: PendingAnalysis[];
  onRetry: (localId: string) => void;
  onDelete: (localId: string) => void;
}

export const PendingAnalysesSection = ({ pending, onRetry, onDelete }: PendingAnalysesSectionProps) => (
  <>
    <Typography variant="overline" color="text.secondary" component="h2">
      On this device · not uploaded yet
    </Typography>
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {pending.map((pendingAnalysis) => (
        <Grid key={pendingAnalysis.localId} size={{ xs: 12, sm: 6, lg: 4 }}>
          <PendingAnalysisCard pending={pendingAnalysis} onRetry={onRetry} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  </>
);
