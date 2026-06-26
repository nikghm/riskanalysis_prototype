'use client';

import { useCallback, useState } from 'react';

interface Props {
  onFile: (file: File) => void;
  error?: string;
}

export function UploadDropzone({ onFile, error }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string>();

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setLocalError('Bitte nur .csv-Dateien hochladen.');
        return;
      }
      if (file.size === 0) {
        setLocalError('Die Datei ist leer.');
        return;
      }
      setLocalError(undefined);
      onFile(file);
    },
    [onFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const displayError = localError ?? error;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="CSV-Datei hochladen"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('csv-file-input')?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('csv-file-input')?.click(); }}
        className={[
          'w-full max-w-2xl h-72 rounded-2xl border-2 border-dashed',
          'flex flex-col items-center justify-center cursor-pointer select-none',
          'transition-all duration-200',
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
            : 'border-gray-300 bg-white/60 hover:border-blue-400 hover:bg-white/80',
        ].join(' ')}
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onInputChange}
        />

        <div className="flex flex-col items-center gap-3 px-8 text-center pointer-events-none">
          <svg
            className={`w-12 h-12 transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-300'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className={`text-3xl font-bold transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-700'}`}>
            Upload
          </p>

          <p className="text-sm text-gray-500 font-light leading-relaxed">
            Fügen Sie Ihr exportiertes .csv-File hier per Drag-and-Drop ein
          </p>

          <p className="text-xs text-gray-400">
            oder klicken Sie, um eine Datei auszuwählen
          </p>
        </div>
      </div>

      {displayError && (
        <div className="w-full max-w-2xl rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">⚠</span>
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
