import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import HistoryIcon from '@mui/icons-material/History';
import type { ReactNode } from 'react';
import { matchPath } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/analyses', label: 'History', icon: <HistoryIcon /> },
  { to: '/analyses/new', label: 'New analysis', icon: <AddCircleOutlineIcon /> },
];

export const isNavItemActive = ({ to }: NavItem, pathname: string): boolean =>
  matchPath({ path: to, end: true }, pathname) !== null;
