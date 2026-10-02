import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toApiError } from '../../../api/ApiError';
import { useIsOnline } from '../../../shared/connectivity/connectivity.store';
import { useNotificationsStore } from '../../../shared/notifications/notifications.store';
import { createLocalAnalysisId } from '../local/localAnalysisId';
import { useAnalysesStore } from '../store/analyses.store';
import { UploadTiming, useOutboxStore } from '../store/outbox.store';
import { useDraftStore } from '../store/draft.store';
import { isAnalysisFormValid, validateAnalysisForm, type AnalysisFormErrors } from '../validation';
import { useLogFileLoader } from './useLogFileLoader';

export const useCreateAnalysis = () => {
  const navigate = useNavigate();
  const { name, content, fileName, setName, setContent, reset } = useDraftStore();
  const createAnalysis = useAnalysesStore((state) => state.createAnalysis);
  const addLocal = useOutboxStore((state) => state.addLocal);
  const notify = useNotificationsStore((state) => state.notify);
  const online = useIsOnline();
  const { fileError, loadFile, resetFileLoading } = useLogFileLoader(setContent);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>();

  const errors: AnalysisFormErrors = submitted ? validateAnalysisForm({ name, content }) : {};

  const createOnServer = async (clientId: string): Promise<string> => {
    const analysis = await createAnalysis({ name: name.trim(), content, clientId });
    notify(`"${analysis.name}" analysed: ${analysis.summary.totalEntries.toLocaleString()} entries`);
    return analysis.id;
  };

  const createOnDevice = async (clientId: string, uploadTiming: UploadTiming): Promise<string> => {
    const pending = await addLocal(name.trim(), content, { localId: clientId, uploadTiming });
    notify(`"${pending.name}" analysed on this device. It will be uploaded when the server is reachable.`);
    return pending.localId;
  };

  const createWithFallback = async (clientId: string): Promise<string> => {
    try {
      return await createOnServer(clientId);
    } catch (caughtError) {
      if (!toApiError(caughtError).isRetryable) throw caughtError;
      return createOnDevice(clientId, UploadTiming.AfterBackoff);
    }
  };

  const submit = async () => {
    setSubmitted(true);
    setServerError(undefined);
    if (!isAnalysisFormValid({ name, content })) return;

    setSubmitting(true);
    try {
      const clientId = createLocalAnalysisId();
      const createdId = online
        ? await createWithFallback(clientId)
        : await createOnDevice(clientId, UploadTiming.Immediately);
      reset();
      navigate(`/analyses/${createdId}`);
    } catch (caughtError) {
      setServerError(toApiError(caughtError).message);
    } finally {
      setSubmitting(false);
    }
  };

  const clear = () => {
    resetFileLoading();
    reset();
    setSubmitted(false);
    setServerError(undefined);
  };

  return {
    values: { name, content, fileName },
    errors,
    fileError,
    serverError,
    submitting,
    offline: !online,
    hasDraft: name !== '' || content !== '',
    setName,
    setContent: (value: string) => setContent(value),
    loadFile,
    submit,
    clear,
  };
};
