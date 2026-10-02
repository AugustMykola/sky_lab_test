import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Typography } from '@mui/material';

interface FormActionsProps {
  canClear: boolean;
  submitting: boolean;
  offline: boolean;
  onClear: () => void;
}

export const FormActions = ({ canClear, submitting, offline, onClear }: FormActionsProps) => (
  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
    {offline && (
      <Typography variant="body2" color="text.secondary">
        You are offline: the analysis runs on this device and uploads when you reconnect.
      </Typography>
    )}
    <Button onClick={onClear} disabled={!canClear || submitting}>
      Clear
    </Button>
    <Button type="submit" variant="contained" startIcon={<PlayArrowIcon />} loading={submitting}>
      Run analysis
    </Button>
  </Box>
);
