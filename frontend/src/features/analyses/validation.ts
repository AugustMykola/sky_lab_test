import { isWithinByteLimit, MAX_CONTENT_BYTES, MAX_NAME_LENGTH } from '@log-analyzer/domain';
import * as zod from 'zod';

const analysisFormSchema = zod.object({
  name: zod
    .string()
    .trim()
    .min(1, 'Enter a name for the analysis')
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  content: zod
    .string()
    .refine((value) => value.trim() !== '', 'Paste a log or upload a .txt file')
    .refine((value) => isWithinByteLimit(value, MAX_CONTENT_BYTES), 'Log must be smaller than 5 MB'),
});

type AnalysisFormValues = zod.infer<typeof analysisFormSchema>;

export interface AnalysisFormErrors {
  name?: string;
  content?: string;
}

export const validateAnalysisForm = (values: AnalysisFormValues): AnalysisFormErrors => {
  const result = analysisFormSchema.safeParse(values);
  if (result.success) return {};

  const firstIssueFor = (field: keyof AnalysisFormValues) =>
    result.error.issues.find(({ path }) => path[0] === field)?.message;

  return { name: firstIssueFor('name'), content: firstIssueFor('content') };
};

export const isAnalysisFormValid = (values: AnalysisFormValues): boolean =>
  analysisFormSchema.safeParse(values).success;

const TXT_EXTENSION = '.txt';
const TEXT_MIME_TYPE = 'text/plain';

export const validateLogFile = (file: File): string | undefined => {
  const isText = file.type === TEXT_MIME_TYPE || file.name.toLowerCase().endsWith(TXT_EXTENSION);
  if (!isText) return 'Only .txt files are supported';
  if (file.size > MAX_CONTENT_BYTES) return 'File must be smaller than 5 MB';
  if (file.size === 0) return 'File is empty';
  return undefined;
};
