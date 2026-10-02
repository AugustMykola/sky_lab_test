import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { SortOrder, sortOrderSchema } from '../../../../api/types';

interface SortToggleProps {
  value: SortOrder;
  onChange: (sort: SortOrder) => void;
}

export const SortToggle = ({ value, onChange }: SortToggleProps) => (
  <ToggleButtonGroup
    size="small"
    exclusive
    value={value}
    aria-label="Sort by date"
    onChange={(_event, selectedSort: unknown) => {
      const parsedSort = sortOrderSchema.safeParse(selectedSort);
      if (parsedSort.success) onChange(parsedSort.data);
    }}
  >
    <ToggleButton value={SortOrder.Asc}>Oldest first</ToggleButton>
    <ToggleButton value={SortOrder.Desc}>Newest first</ToggleButton>
  </ToggleButtonGroup>
);
