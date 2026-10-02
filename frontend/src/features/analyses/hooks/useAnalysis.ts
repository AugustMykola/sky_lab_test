import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toListItem } from '../mappers';
import { useAnalysesStore } from '../store/analyses.store';
import { useDeleteAnalysis } from './useDeleteAnalysis';

export const useAnalysis = (id: string) => {
  const navigate = useNavigate();
  const detailsEntry = useAnalysesStore((state) => state.details[id]);
  const cachedListItem = useAnalysesStore((state) => state.list.find((listItem) => listItem.id === id));
  const loadAnalysis = useAnalysesStore((state) => state.loadAnalysis);
  const deletion = useDeleteAnalysis({ onDeleted: () => navigate('/analyses', { replace: true }) });

  useEffect(() => {
    void loadAnalysis(id);
  }, [id, loadAnalysis]);

  const analysis = detailsEntry?.analysis;

  return {
    overview: analysis ? toListItem(analysis) : cachedListItem,
    summary: analysis?.summary,
    error: detailsEntry?.error,
    reload: () => loadAnalysis(id),
    deletion,
  };
};
