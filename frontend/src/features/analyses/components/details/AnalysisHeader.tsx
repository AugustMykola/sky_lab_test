import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Analysis } from '../../../../api/types';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { formatDateTime } from '../../../../shared/format';

export const BackToHistoryButton = () => (
  <Button component={RouterLink} to="/analyses" startIcon={<ArrowBackIcon />}>
    All analyses
  </Button>
);

interface AnalysisHeaderProps {
  analysis: Pick<Analysis, 'name' | 'createdAt'>;
  canDelete: boolean;
  onDelete: () => void;
}

export const AnalysisHeader = ({ analysis, canDelete, onDelete }: AnalysisHeaderProps) => (
  <>
    <Box sx={{ mb: 1 }}>
      <BackToHistoryButton />
    </Box>
    <PageHeader
      title={analysis.name}
      subtitle={`Created ${formatDateTime(analysis.createdAt)}`}
      actions={
        <Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} disabled={!canDelete} onClick={onDelete}>
          Delete
        </Button>
      }
    />
  </>
);
