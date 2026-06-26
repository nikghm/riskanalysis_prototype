import type { Risk } from '@/types/risk';
import { RiskCard } from './RiskCard';

interface Props {
  risks: Risk[];
  onReset: () => void;
}

export function RiskList({ risks, onReset }: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Erkannte Risiken</h1>
        <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Neue Datei laden
        </button>
      </div>

      {risks.length === 0 ? (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-5 py-4 text-yellow-800 text-sm">
          Keine Risiken erkannt. Bitte prüfen Sie das Format Ihrer CSV-Datei.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {risks.map((risk, i) => (
            <RiskCard key={i} rank={i + 1} {...risk} />
          ))}
        </div>
      )}
    </div>
  );
}
