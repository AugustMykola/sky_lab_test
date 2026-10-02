import { Box, Button } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import styles from './AppLayout.module.scss';
import { NAV_ITEMS, isNavItemActive } from './navItems';

export const DesktopNav = () => {
  const { pathname } = useLocation();

  return (
    <Box component="nav" className={styles.desktopNav}>
      {NAV_ITEMS.map((navItem) => {
        const active = isNavItemActive(navItem, pathname);
        return (
          <Button
            key={navItem.to}
            component={RouterLink}
            to={navItem.to}
            startIcon={navItem.icon}
            color={active ? 'primary' : 'inherit'}
            aria-current={active ? 'page' : undefined}
          >
            {navItem.label}
          </Button>
        );
      })}
    </Box>
  );
};
