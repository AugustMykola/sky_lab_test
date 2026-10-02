import { Grid, type GridProps } from '@mui/material';
import { LOG_LEVELS, type AnalysisCounts } from '../../../../api/types';
import { LEVEL_COLORS } from '../../../../shared/components/LevelChip';
import { StatCard } from '../../../../shared/components/StatCard';

export const STAT_GRID_SIZE: GridProps['size'] = { xs: 6, sm: 4, md: 'grow' };

export const STAT_CARD_COUNT = LOG_LEVELS.length + 2;

export const SummaryStats = ({ counts }: { counts: AnalysisCounts }) => (
  <Grid container spacing={2}>
    <Grid size={STAT_GRID_SIZE}>
      <StatCard label="Total entries" value={counts.totalEntries} />
    </Grid>
    {LOG_LEVELS.map((level) => (
      <Grid key={level} size={STAT_GRID_SIZE}>
        <StatCard label={level} value={counts.levelCounts[level]} color={LEVEL_COLORS[level]} />
      </Grid>
    ))}
    <Grid size={STAT_GRID_SIZE}>
      <StatCard label="Invalid lines" value={counts.invalidCount} color="text.secondary" />
    </Grid>
  </Grid>
);
