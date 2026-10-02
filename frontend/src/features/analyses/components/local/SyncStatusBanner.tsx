import { Alert, Button } from '@mui/material';
import { useIsOnline } from '../../../../shared/connectivity/connectivity.store';
import { SyncStatus, type PendingAnalysis } from '../../store/outbox.store';

interface SyncStatusBannerProps {
  pending: PendingAnalysis;
  onRetry: () => void;
}

export const SyncStatusBanner = ({ pending, onRetry }: SyncStatusBannerProps) => {
  const online = useIsOnline();

  if (pending.status === SyncStatus.Failed) {
    return (
      <Alert
        severity="error"
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        Upload failed: {pending.failureReason ?? 'unknown error'}. The analysis is still saved on this device.
      </Alert>
    );
  }

  if (pending.status === SyncStatus.Syncing) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Uploading to the server…
      </Alert>
    );
  }

  return (
    <Alert severity="warning" sx={{ mb: 3 }}>
      {online
        ? 'Analysed on this device. The server is not reachable yet, so the upload is retried automatically.'
        : 'Analysed on this device. It will be uploaded automatically when you are back online.'}
    </Alert>
  );
};
