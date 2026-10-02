import QueryStatsIcon from '@mui/icons-material/QueryStats';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import styles from './AppLayout.module.scss';

export const Brand = () => (
  <Box component={RouterLink} to="/analyses" className={styles.brand}>
    <QueryStatsIcon color="primary" />
    <Typography variant="h6" component="span">
      Log Analyzer
    </Typography>
  </Box>
);
