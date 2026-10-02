import { Box, Skeleton } from '@mui/material';
import { TableSkeleton } from '../../../../shared/components/skeletons/TableSkeleton';
import { StatCardsSkeleton } from './StatCardsSkeleton';

export const AnalysisDetailsSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading analysis">
    <Skeleton width={120} sx={{ mb: 2 }} />
    <Skeleton variant="text" sx={{ fontSize: '2.1rem' }} width="45%" />
    <Skeleton width="25%" sx={{ mb: 3 }} />
    <StatCardsSkeleton />
    <Box sx={{ display: 'flex', gap: 3, mt: 4, mb: 2 }}>
      <Skeleton width={120} height={36} />
      <Skeleton width={140} height={36} />
    </Box>
    <TableSkeleton rows={8} columns={4} />
  </Box>
);
