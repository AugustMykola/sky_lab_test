import { Card, CardContent, Grid, Skeleton } from '@mui/material';
import { indexes } from '../../../../shared/components/skeletons/indexes';
import { STAT_CARD_COUNT, STAT_GRID_SIZE } from '../details/SummaryStats';

export const StatCardsSkeleton = () => (
  <Grid container spacing={2} aria-busy="true">
    {indexes(STAT_CARD_COUNT).map((index) => (
      <Grid key={index} size={STAT_GRID_SIZE}>
        <Card variant="outlined">
          <CardContent>
            <Skeleton width="50%" />
            <Skeleton variant="text" sx={{ fontSize: '2.1rem' }} width="40%" />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);
