import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Box, Button, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import styles from './PageStates.module.scss';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <Box className={styles.state} role="alert">
    <ErrorOutlineIcon color="error" fontSize="large" />
    <Typography color="error">{message}</Typography>
    {onRetry && (
      <Button variant="outlined" onClick={onRetry}>
        Try again
      </Button>
    )}
  </Box>
);

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <Box className={styles.state}>
    <InboxOutlinedIcon color="disabled" fontSize="large" />
    <Typography variant="h6">{title}</Typography>
    {description && <Typography color="text.secondary">{description}</Typography>}
    {action}
  </Box>
);
