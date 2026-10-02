import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Container, IconButton, Toolbar } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useOutboxSync } from '../../features/analyses/hooks/useOutboxSync';
import { OfflineBanner } from '../../shared/connectivity/OfflineBanner';
import { NotificationsHost } from '../../shared/notifications/NotificationsHost';
import styles from './AppLayout.module.scss';
import { Brand } from './Brand';
import { DesktopNav } from './DesktopNav';
import { MobileNavDrawer } from './MobileNavDrawer';

export const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useOutboxSync();

  return (
    <Box className={styles.root}>
      <AppBar position="sticky" elevation={0} color="inherit" className={styles.appBar}>
        <Toolbar>
          <IconButton
            edge="start"
            aria-label="Open navigation"
            className={styles.menuButton}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Brand />
          <DesktopNav />
        </Toolbar>
      </AppBar>

      <OfflineBanner />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Container component="main" maxWidth="lg" className={styles.main}>
        <Outlet />
      </Container>

      <NotificationsHost />
    </Box>
  );
};
