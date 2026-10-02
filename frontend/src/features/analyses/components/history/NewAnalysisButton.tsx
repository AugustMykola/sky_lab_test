import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const NewAnalysisButton = () => (
  <Button component={RouterLink} to="/analyses/new" variant="contained" startIcon={<AddIcon />}>
    New analysis
  </Button>
);
