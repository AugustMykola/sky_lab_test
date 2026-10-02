import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Chip, type ChipProps } from '@mui/material';
import type { ReactElement } from 'react';
import { useIsOnline } from '../../../../shared/connectivity/connectivity.store';
import { SyncStatus } from '../../store/outbox.store';

interface ChipAppearance {
  label: string;
  color: ChipProps['color'];
  icon: ReactElement;
}

const WAITING_FOR_NETWORK: ChipAppearance = { label: 'Waiting for network', color: 'warning', icon: <CloudOffIcon /> };
const QUEUED_FOR_RETRY: ChipAppearance = { label: 'Queued, retrying automatically', color: 'warning', icon: <ScheduleIcon /> };
const UPLOADING: ChipAppearance = { label: 'Uploading…', color: 'info', icon: <CloudUploadOutlinedIcon /> };
const UPLOAD_FAILED: ChipAppearance = { label: 'Upload failed', color: 'error', icon: <ErrorOutlineIcon /> };

const toAppearance = (status: SyncStatus, online: boolean): ChipAppearance => {
  if (status === SyncStatus.Syncing) return UPLOADING;
  if (status === SyncStatus.Failed) return UPLOAD_FAILED;
  return online ? QUEUED_FOR_RETRY : WAITING_FOR_NETWORK;
};

export const SyncStatusChip = ({ status }: { status: SyncStatus }) => {
  const online = useIsOnline();
  const { label, color, icon } = toAppearance(status, online);
  return <Chip size="small" variant="outlined" color={color} icon={icon} label={label} />;
};
