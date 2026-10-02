import { Alert, Card, CardContent, Divider, Typography } from '@mui/material';
import type { FormEvent } from 'react';
import { FileDropZone } from '../../../shared/components/FileDropZone';
import { PageHeader } from '../../../shared/components/PageHeader';
import { AnalysisNameField } from '../components/form/AnalysisNameField';
import { FormActions } from '../components/form/FormActions';
import { LogContentField } from '../components/form/LogContentField';
import { useCreateAnalysis } from '../hooks/useCreateAnalysis';

export const NewAnalysisPage = () => {
  const viewModel = useCreateAnalysis();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void viewModel.submit();
  };

  return (
    <>
      <PageHeader
        title="New analysis"
        subtitle="Paste a log or upload a .txt file. Your unfinished input is saved automatically."
      />

      <Card variant="outlined" component="form" onSubmit={handleSubmit} noValidate>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {viewModel.serverError && <Alert severity="error">{viewModel.serverError}</Alert>}

          <AnalysisNameField
            value={viewModel.values.name}
            error={viewModel.errors.name}
            disabled={viewModel.submitting}
            onChange={viewModel.setName}
          />

          <FileDropZone
            accept=".txt,text/plain"
            hint=".txt up to 5 MB"
            error={viewModel.fileError}
            disabled={viewModel.submitting}
            onFile={viewModel.loadFile}
          />

          <Divider>
            <Typography variant="body2" color="text.secondary">
              or paste the log
            </Typography>
          </Divider>

          <LogContentField
            value={viewModel.values.content}
            fileName={viewModel.values.fileName}
            error={viewModel.errors.content}
            disabled={viewModel.submitting}
            onChange={viewModel.setContent}
          />

          <FormActions canClear={viewModel.hasDraft} submitting={viewModel.submitting} offline={viewModel.offline} onClear={viewModel.clear} />
        </CardContent>
      </Card>
    </>
  );
};
