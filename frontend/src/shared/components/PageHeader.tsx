import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <Box className={styles.header}>
    <Box className={styles.titles}>
      <Typography variant="h4" component="h1" className={styles.title}>
        {title}
      </Typography>
      {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
    </Box>
    {actions && <Box className={styles.actions}>{actions}</Box>}
  </Box>
);
