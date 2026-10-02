import { useRef, useState } from 'react';
import { validateLogFile } from '../validation';

export const useLogFileLoader = (onLoaded: (content: string, fileName: string) => void) => {
  const [fileError, setFileError] = useState<string>();
  const latestLoadIdRef = useRef(0);

  const loadFile = async (file: File) => {
    const loadId = ++latestLoadIdRef.current;
    const isLatestLoad = () => loadId === latestLoadIdRef.current;

    const error = validateLogFile(file);
    setFileError(error);
    if (error) return;

    try {
      const content = await file.text();
      if (isLatestLoad()) onLoaded(content, file.name);
    } catch {
      if (isLatestLoad()) setFileError('Could not read the file');
    }
  };

  const resetFileLoading = () => {
    latestLoadIdRef.current += 1;
    setFileError(undefined);
  };

  return { fileError, loadFile, resetFileLoading };
};
