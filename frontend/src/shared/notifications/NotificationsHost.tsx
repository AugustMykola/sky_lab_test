import { Alert, Snackbar, type SnackbarCloseReason } from '@mui/material';
import { useNotificationsStore } from './notifications.store';

const AUTO_HIDE_DURATION_IN_MILLISECONDS = 3000;

export const NotificationsHost = () => {
  const current = useNotificationsStore((state) => state.current);
  const open = useNotificationsStore((state) => state.open);
  const dismiss = useNotificationsStore((state) => state.dismiss);

  if (!current) return null;

  return (
    <Snackbar
      key={current.id}
      open={open}
      autoHideDuration={AUTO_HIDE_DURATION_IN_MILLISECONDS}
      onClose={(_event, reason: SnackbarCloseReason) => {
        if (reason !== 'clickaway') dismiss();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="success" variant="filled" onClose={dismiss} sx={{ width: '100%' }}>
        {current.message}
      </Alert>
    </Snackbar>
  );
};
