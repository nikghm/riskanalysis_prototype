'use client';

import { useState } from 'react';
import { UploadDropzone } from '@/components/UploadDropzone';
import { RiskList } from '@/components/RiskList';
import { parseCSV } from '@/lib/csvParser';
import type { Risk } from '@/types/risk';

type View = 'upload' | 'results';

export default function Home() {
  const [view, setView]           = useState<View>('upload');
  const [risks, setRisks]         = useState<Risk[]>([]);
  const [parseError, setParseError] = useState<string>();

  async function handleFile(file: File) {
    const result = await parseCSV(file);
    if (result.error || result.risks.length === 0) {
      setParseError(result.error ?? 'Keine Risiken erkannt.');
      return;
    }
    setParseError(undefined);
    setRisks(result.risks);
    setView('results');
  }

  function handleReset() {
    setView('upload');
    setRisks([]);
    setParseError(undefined);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 flex items-center justify-center p-8">
      {view === 'upload' ? (
        <div className="w-full max-w-2xl">
          <UploadDropzone onFile={handleFile} error={parseError} />
        </div>
      ) : (
        <RiskList risks={risks} onReset={handleReset} />
      )}
    </main>
  );
}
