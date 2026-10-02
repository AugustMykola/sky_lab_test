import { MAX_SEARCH_LENGTH } from '@log-analyzer/domain';
import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SearchField = ({ value, onChange, className }: SearchFieldProps) => (
  <TextField
    className={className}
    size="small"
    label="Search messages"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      },
      htmlInput: { maxLength: MAX_SEARCH_LENGTH },
    }}
  />
);
