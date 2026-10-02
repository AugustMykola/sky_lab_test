import { Button } from '@mui/material';
import { Link as RouterLink, Navigate, createBrowserRouter } from 'react-router-dom';
import { AnalysesListPage } from '../features/analyses/pages/AnalysesListPage';
import { AnalysisDetailsPage } from '../features/analyses/pages/AnalysisDetailsPage';
import { NewAnalysisPage } from '../features/analyses/pages/NewAnalysisPage';
import { EmptyState } from '../shared/components/PageStates';
import { AppLayout } from './layout/AppLayout';

const NotFoundPage = () => (
  <EmptyState
    title="Page not found"
    action={
      <Button component={RouterLink} to="/analyses" variant="contained">
        Go to analyses
      </Button>
    }
  />
);

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/analyses" replace /> },
      { path: 'analyses', element: <AnalysesListPage /> },
      { path: 'analyses/new', element: <NewAnalysisPage /> },
      { path: 'analyses/:id', element: <AnalysisDetailsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
