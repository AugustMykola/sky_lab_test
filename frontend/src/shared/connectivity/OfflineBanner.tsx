import CloudOffIcon from '@mui/icons-material/CloudOff';
import { Alert, Container } from '@mui/material';
import { useIsOnline } from './connectivity.store';

export const OfflineBanner = () => {
  const online = useIsOnline();
  if (online) return null;

  return (
    <Container maxWidth="lg" sx={{ pt: 2 }}>
      <Alert severity="warning" icon={<CloudOffIcon />} role="status">
        You are offline. Saved data is shown, new analyses run on this device and upload when you reconnect.
      </Alert>
    </Container>
  );
};
