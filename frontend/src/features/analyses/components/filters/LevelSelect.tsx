import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select } from '@mui/material';
import * as zod from 'zod';
import { LOG_LEVELS, logLevelSchema, type LogLevel } from '../../../../api/types';

const LABEL = 'Levels';
const LABEL_ID = 'level-filter-label';

const levelListSchema = zod.array(logLevelSchema);

const parseLevels = (value: string | string[]) =>
  levelListSchema.safeParse(typeof value === 'string' ? value.split(',') : value);

interface LevelSelectProps {
  value: LogLevel[];
  onChange: (levels: LogLevel[]) => void;
  className?: string;
}

export const LevelSelect = ({ value, onChange, className }: LevelSelectProps) => (
  <FormControl size="small" className={className}>
    <InputLabel id={LABEL_ID} shrink>
      {LABEL}
    </InputLabel>
    <Select
      labelId={LABEL_ID}
      multiple
      displayEmpty
      value={value}
      input={<OutlinedInput label={LABEL} notched />}
      renderValue={(selected) => (selected.length === 0 ? 'All' : selected.join(', '))}
      onChange={(event) => {
        const levels = parseLevels(event.target.value);
        if (levels.success) onChange(levels.data);
      }}
    >
      {LOG_LEVELS.map((level) => (
        <MenuItem key={level} value={level}>
          <Checkbox size="small" checked={value.includes(level)} />
          <ListItemText primary={level} />
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);
