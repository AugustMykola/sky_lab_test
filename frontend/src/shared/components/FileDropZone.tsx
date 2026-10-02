import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { Typography } from '@mui/material';
import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import styles from './FileDropZone.module.scss';

interface FileDropZoneProps {
  accept?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
}

export const FileDropZone = ({ accept, hint, error, disabled = false, onFile }: FileDropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  const className = [styles.zone, dragging && styles.dragging, error && styles.error, disabled && styles.disabled]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <div
        className={className}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <UploadFileOutlinedIcon color={error ? 'error' : 'action'} fontSize="large" />
        <Typography>
          <strong>Click to upload</strong> or drag and drop
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = '';
          }}
        />
      </div>
      {error && (
        <Typography variant="body2" color="error" role="alert" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </div>
  );
};
