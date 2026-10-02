import CloudOffIcon from '@mui/icons-material/CloudOff';
import { Alert, Container } from '@mui/material';
import { useOfflineStrategy } from '../offline/OfflineStrategyContext';
import { useIsOnline } from './connectivity.store';

export const OfflineBanner = () => {
  const online = useIsOnline();
  const { offlineNotice } = useOfflineStrategy();
  if (online) return null;

  return (
    <Container maxWidth="lg" sx={{ pt: 2 }}>
      <Alert severity="warning" icon={<CloudOffIcon />} role="status">
        {offlineNotice}
      </Alert>
    </Container>
  );
};
