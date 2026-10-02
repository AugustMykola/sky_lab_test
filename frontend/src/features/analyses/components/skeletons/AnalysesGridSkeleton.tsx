import { Box, Card, CardContent, Grid, Skeleton } from '@mui/material';
import { indexes } from '../../../../shared/components/skeletons/indexes';

const CARD_COUNT = 6;
const CHIP_COUNT = 4;

const AnalysisCardSkeleton = () => (
  <Card variant="outlined">
    <CardContent>
      <Skeleton variant="text" sx={{ fontSize: '1.25rem' }} width="70%" />
      <Skeleton width="55%" />
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        {indexes(CHIP_COUNT).map((index) => (
          <Skeleton key={index} variant="rounded" width={56} height={24} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Skeleton width={64} />
      </Box>
    </CardContent>
  </Card>
);

export const AnalysesGridSkeleton = () => (
  <Grid container spacing={2} aria-busy="true" aria-label="Loading analyses">
    {indexes(CARD_COUNT).map((index) => (
      <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
        <AnalysisCardSkeleton />
      </Grid>
    ))}
  </Grid>
);
