'use client';

import { useState } from 'react';
import type { Risk } from '@/types/risk';
import { isEnergyRisk } from '@/lib/smard';
import type { SmardData } from '@/lib/smard';

interface Props extends Risk {
  rank: number;
}

type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: SmardData }
  | { status: 'error'; message: string }
  | { status: 'unsupported' };

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RiskCard({ rank, name, group, probability, impact, score, computedScore }: Props) {
  const displayScore = score ?? (computedScore !== undefined ? computedScore.toFixed(2) : undefined);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle' });

  const isOpen = analysis.status !== 'idle';

  async function handleAnalyse() {
    if (isOpen) {
      setAnalysis({ status: 'idle' });
      return;
    }

    if (!isEnergyRisk(name)) {
      setAnalysis({ status: 'unsupported' });
      return;
    }

    setAnalysis({ status: 'loading' });
    try {
      const res = await fetch('/api/smard');
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setAnalysis({ status: 'success', data: json as SmardData });
    } catch (e) {
      setAnalysis({
        status: 'error',
        message: e instanceof Error ? e.message : 'Unbekannter Fehler',
      });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Karten-Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Rang-Badge */}
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center">
            {rank}
          </span>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">{name}</h3>

            {group && (
              <p className="text-xs text-gray-400 mt-0.5">{group}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {probability && (
                <span className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Wahrscheinlichkeit:</span> {probability}
                </span>
              )}
              {impact && (
                <span className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Auswirkung:</span> {impact}
                </span>
              )}
              {displayScore && (
                <span className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Risikowert:</span> {displayScore}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          className={`flex-shrink-0 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            isOpen
              ? 'bg-slate-400 hover:bg-slate-500 active:bg-slate-600'
              : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
          }`}
          onClick={handleAnalyse}
        >
          {isOpen ? 'Einklappen' : 'Analysieren'}
        </button>
      </div>

      {/* Aufklappbarer Analyse-Bereich */}
      {isOpen && (
        <div className="border-t border-gray-100 bg-slate-50 px-5 py-4">
          <AnalysisPanel analysis={analysis} />
        </div>
      )}
    </div>
  );
}

function AnalysisPanel({ analysis }: { analysis: AnalysisState }) {
  if (analysis.status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <svg
          className="animate-spin h-4 w-4 text-green-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        SMARD-Daten werden geladen…
      </div>
    );
  }

  if (analysis.status === 'unsupported') {
    return (
      <p className="text-sm text-gray-500 py-2">
        Für dieses Risiko ist in diesem Prototyp noch keine Datenquelle angebunden.
      </p>
    );
  }

  if (analysis.status === 'error') {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 space-y-1">
        <p className="font-medium">Fehler beim Datenabruf</p>
        <p className="text-red-600">{analysis.message}</p>
        <p className="text-red-500 text-xs">
          Bitte SMARD-Filter in <code className="font-mono">src/lib/smard.ts</code> prüfen.
        </p>
      </div>
    );
  }

  if (analysis.status === 'success') {
    const { data } = analysis;
    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">SMARD-Analyse</h4>
          <p className="text-xs text-gray-400 mt-0.5">Datenquelle: Bundesnetzagentur | SMARD.de</p>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Die Daten zeigen strommarktbezogene Entwicklungen und können als Hinweis auf
          energiebezogene Kosten- oder Versorgungsrisiken dienen.
        </p>

        {/* Kennzahlen */}
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="Letzter Zeitpunkt" value={formatTimestamp(data.latestTimestamp)} />
          <MetricBox
            label="Letzter Wert"
            value={
              data.latestValue !== null
                ? `${data.latestValue.toFixed(2)} ${data.unit}`
                : '—'
            }
          />
          {data.averageLast5 !== null && (
            <div className="col-span-2">
              <MetricBox
                label={`Ø letzte ${data.last5.length} Werte`}
                value={`${data.averageLast5.toFixed(2)} ${data.unit}`}
              />
            </div>
          )}
        </div>

        {/* Letzte 5 Werte */}
        {data.last5.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Letzte {data.last5.length} Stundenwerte
            </p>
            <div className="flex flex-col gap-1">
              {data.last5.map((point) => (
                <div
                  key={point.timestamp}
                  className="flex justify-between items-center text-xs bg-white rounded border border-gray-100 px-3 py-1.5"
                >
                  <span className="text-gray-400">{formatTimestamp(point.timestamp)}</span>
                  <span className="font-medium text-gray-800">
                    {point.value !== null ? `${point.value.toFixed(2)} ${data.unit}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
