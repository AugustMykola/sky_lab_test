import { Box, Chip, Typography } from '@mui/material';
import { LOG_LEVELS, type LevelCounts } from '../../../../api/types';
import { LevelChip } from '../../../../shared/components/LevelChip';

interface LevelCountListProps {
  levelCounts: LevelCounts;
  invalidCount: number;
}

export const LevelCountList = ({ levelCounts, invalidCount }: LevelCountListProps) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
    {LOG_LEVELS.filter((level) => levelCounts[level] > 0).map((level) => (
      <Box key={level} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LevelChip level={level} />
        <Typography variant="body2">{levelCounts[level].toLocaleString()}</Typography>
      </Box>
    ))}
    {invalidCount > 0 && <Chip size="small" label={`${invalidCount} invalid`} variant="outlined" />}
  </Box>
);
