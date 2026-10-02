import { Alert, List, ListItem, ListItemText, Paper } from '@mui/material';
import type { InvalidLine } from '../../../../api/types';
import { monospaceSx } from '../../../../shared/styles/typography';

interface InvalidLinesListProps {
  lines: InvalidLine[];
  total: number;
}

export const InvalidLinesList = ({ lines, total }: InvalidLinesListProps) => (
  <>
    <Alert severity="info" sx={{ mb: 2 }}>
      These lines did not match <code>YYYY-MM-DD HH:mm:ss LEVEL message</code> and were skipped.
      {total > lines.length && ` Showing the first ${lines.length} of ${total.toLocaleString()}.`}
    </Alert>
    <Paper variant="outlined">
      <List dense disablePadding>
        {lines.map((line) => (
          <ListItem key={line.lineNumber} divider>
            <ListItemText
              primary={`#${line.lineNumber}: ${line.content}`}
              secondary={line.reason}
              slotProps={{ primary: { sx: { ...monospaceSx, overflowWrap: 'anywhere' } } }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  </>
);
