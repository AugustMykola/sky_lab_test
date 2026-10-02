import { Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS, isNavItemActive } from './navItems';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MobileNavDrawer = ({ open, onClose }: MobileNavDrawerProps) => {
  const { pathname } = useLocation();

  return (
    <Drawer open={open} onClose={onClose}>
      <List component="nav" sx={{ width: 260 }}>
        {NAV_ITEMS.map((navItem) => (
          <ListItemButton
            key={navItem.to}
            component={RouterLink}
            to={navItem.to}
            selected={isNavItemActive(navItem, pathname)}
            onClick={onClose}
          >
            <ListItemIcon>{navItem.icon}</ListItemIcon>
            <ListItemText primary={navItem.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};
