import { Box, Tab, Tabs } from '@mui/material';
import * as zod from 'zod';
import { LogLevel, type AnalysisCounts } from '../../../../api/types';

export enum AnalysisTab {
  Entries = 'entries',
  Errors = 'errors',
  Invalid = 'invalid',
}

const analysisTabSchema = zod.enum(AnalysisTab);

interface AnalysisTabsProps {
  value: AnalysisTab;
  counts: AnalysisCounts;
  onChange: (tab: AnalysisTab) => void;
}

export const AnalysisTabs = ({ value, counts, onChange }: AnalysisTabsProps) => {
  const errorCount = counts.levelCounts[LogLevel.Error] + counts.levelCounts[LogLevel.Fatal];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4, mb: 2 }}>
      <Tabs
        value={value}
        variant="scrollable"
        allowScrollButtonsMobile
        onChange={(_event, selectedTab: unknown) => {
          const parsedTab = analysisTabSchema.safeParse(selectedTab);
          if (parsedTab.success) onChange(parsedTab.data);
        }}
      >
        <Tab value={AnalysisTab.Entries} label={`Log entries (${counts.totalEntries.toLocaleString()})`} />
        <Tab value={AnalysisTab.Errors} label={`Error statistics (${errorCount.toLocaleString()})`} />
        {counts.invalidCount > 0 && (
          <Tab value={AnalysisTab.Invalid} label={`Invalid lines (${counts.invalidCount.toLocaleString()})`} />
        )}
      </Tabs>
    </Box>
  );
};
