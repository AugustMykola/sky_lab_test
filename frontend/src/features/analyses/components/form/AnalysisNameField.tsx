import { TextField } from '@mui/material';
import { MAX_NAME_LENGTH } from '@log-analyzer/domain';

interface AnalysisNameFieldProps {
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export const AnalysisNameField = ({ value, error, disabled, onChange }: AnalysisNameFieldProps) => (
  <TextField
    label="Analysis name"
    required
    value={value}
    onChange={(event) => onChange(event.target.value)}
    error={Boolean(error)}
    helperText={error ?? `${value.length}/${MAX_NAME_LENGTH}`}
    slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
    disabled={disabled}
  />
);
