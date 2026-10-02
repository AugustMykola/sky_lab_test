import { LINE_BREAK_PATTERN } from '@log-analyzer/domain';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Box, Chip, TextField } from '@mui/material';
import { useMemo } from 'react';
import { monospaceSx } from '../../../../shared/styles/typography';

const PLACEHOLDER = `2026-09-30 12:41:02 INFO User connected
2026-09-30 12:41:05 WARN Slow request: 1250ms
2026-09-30 12:41:08 ERROR Database connection failed`;

const LINE_BREAKS = new RegExp(LINE_BREAK_PATTERN.source, 'g');

const countLines = (content: string): number => {
  const trimmed = content.trimEnd();
  if (trimmed === '') return 0;

  let lineBreaks = 0;
  for (const _lineBreak of trimmed.matchAll(LINE_BREAKS)) lineBreaks += 1;
  return lineBreaks + 1;
};

interface LogContentFieldProps {
  value: string;
  fileName?: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export const LogContentField = ({ value, fileName, error, disabled, onChange }: LogContentFieldProps) => {
  const lineCount = useMemo(() => countLines(value), [value]);

  return (
    <Box>
      {fileName && <Chip icon={<DescriptionOutlinedIcon />} label={fileName} size="small" sx={{ mb: 1 }} />}
      <TextField
        label="Log content"
        required
        fullWidth
        multiline
        minRows={8}
        maxRows={18}
        placeholder={PLACEHOLDER}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={Boolean(error)}
        helperText={error ?? `${lineCount.toLocaleString()} lines`}
        disabled={disabled}
        slotProps={{ htmlInput: { spellCheck: false, style: monospaceSx } }}
      />
    </Box>
  );
};
