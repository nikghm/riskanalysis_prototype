'use client';

import { useState } from 'react';
import type { Risk } from '@/types/risk';
import type { SmardData } from '@/lib/smard';
import type { PegelData } from '@/lib/pegelonline';
import { detectAnalysisType } from '@/lib/detectAnalysisType';
import type { ContextAnalysisType } from '@/lib/detectAnalysisType';
import type { PreparedContext } from '@/lib/dataSources';
import { RiskContextForm } from '@/components/RiskContextForm';
import { PreparedAnalysisPreview } from '@/components/PreparedAnalysisPreview';

interface Props extends Risk {
  rank: number;
}

// Formularwerte werden beim Wechsel zur Vorschau zwischengespeichert,
// damit "Zurück zur Eingabe" die Felder nicht zurücksetzt.
type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; source: 'smard';        data: SmardData }
  | { status: 'success'; source: 'pegelonline';  data: PegelData }
  | { status: 'error';   message: string }
  | { status: 'context-form';    analysisType: ContextAnalysisType; savedValues?: Record<string, string> }
  | { status: 'context-preview'; context: PreparedContext;          formValues: Record<string, string>   };

function formatUnixMs(ms: number): string {
  return new Date(ms).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatIso(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

    const type = detectAnalysisType(name, group);

    if (type === 'smard') {
      setAnalysis({ status: 'loading' });
      try {
        const res  = await fetch('/api/smard');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setAnalysis({ status: 'success', source: 'smard', data: json as SmardData });
      } catch (e) {
        setAnalysis({ status: 'error', message: e instanceof Error ? e.message : 'Unbekannter Fehler' });
      }
      return;
    }

    if (type === 'pegelonline') {
      setAnalysis({ status: 'loading' });
      try {
        const res  = await fetch('/api/pegelonline');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setAnalysis({ status: 'success', source: 'pegelonline', data: json as PegelData });
      } catch (e) {
        setAnalysis({ status: 'error', message: e instanceof Error ? e.message : 'Unbekannter Fehler' });
      }
      return;
    }

    // Alle übrigen Typen → Kontextformular
    setAnalysis({ status: 'context-form', analysisType: type });
  }

  // Risikodaten für das Kontextformular und die Vorschau
  const riskSnapshot = { name, group, probability, impact, score: displayScore };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Karten-Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center">
            {rank}
          </span>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">{name}</h3>
            {group && <p className="text-xs text-gray-400 mt-0.5">{group}</p>}

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
          <AnalysisPanel
            analysis={analysis}
            risk={riskSnapshot}
            setAnalysis={setAnalysis}
            formatUnixMs={formatUnixMs}
            formatIso={formatIso}
          />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Routing auf die richtige Panel-Komponente
// -----------------------------------------------------------------------

type RiskSnapshot = { name: string; group?: string; probability?: string; impact?: string; score?: string };

function AnalysisPanel({
  analysis,
  risk,
  setAnalysis,
  formatUnixMs,
  formatIso,
}: {
  analysis:      AnalysisState;
  risk:          RiskSnapshot;
  setAnalysis:   (s: AnalysisState) => void;
  formatUnixMs:  (ms: number) => string;
  formatIso:     (iso: string) => string;
}) {
  if (analysis.status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <svg className="animate-spin h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Daten werden geladen…
      </div>
    );
  }

  if (analysis.status === 'error') {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 space-y-1">
        <p className="font-medium">Fehler beim Datenabruf</p>
        <p className="text-red-600">{analysis.message}</p>
      </div>
    );
  }

  if (analysis.status === 'success' && analysis.source === 'smard') {
    return <SmardPanel data={analysis.data} formatUnixMs={formatUnixMs} />;
  }

  if (analysis.status === 'success' && analysis.source === 'pegelonline') {
    return <PegelPanel data={analysis.data} formatIso={formatIso} />;
  }

  if (analysis.status === 'context-form') {
    return (
      <RiskContextForm
        analysisType={analysis.analysisType}
        risk={risk}
        initialValues={analysis.savedValues}
        onPrepare={(context, formValues) =>
          setAnalysis({ status: 'context-preview', context, formValues })
        }
      />
    );
  }

  if (analysis.status === 'context-preview') {
    return (
      <PreparedAnalysisPreview
        context={analysis.context}
        onBack={() =>
          setAnalysis({
            status: 'context-form',
            analysisType: analysis.context.analysisType,
            savedValues: analysis.formValues,
          })
        }
      />
    );
  }

  return null;
}

// -----------------------------------------------------------------------
// SMARD-Panel
// -----------------------------------------------------------------------

function SmardPanel({ data, formatUnixMs }: { data: SmardData; formatUnixMs: (ms: number) => string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="font-semibold text-gray-800 text-sm">SMARD-Analyse</h4>
        <p className="text-xs text-gray-400 mt-0.5">Datenquelle: Bundesnetzagentur | SMARD.de</p>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Die Daten zeigen strommarktbezogene Entwicklungen und können als Hinweis auf
        energiebezogene Kosten- oder Versorgungsrisiken dienen.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <MetricBox label="Letzter Zeitpunkt" value={formatUnixMs(data.latestTimestamp)} />
        <MetricBox
          label="Letzter Wert"
          value={data.latestValue !== null ? `${data.latestValue.toFixed(2)} ${data.unit}` : '—'}
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

      {data.last5.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Letzte {data.last5.length} Stundenwerte</p>
          <div className="flex flex-col gap-1">
            {data.last5.map((point) => (
              <div key={point.timestamp} className="flex justify-between items-center text-xs bg-white rounded border border-gray-100 px-3 py-1.5">
                <span className="text-gray-400">{formatUnixMs(point.timestamp)}</span>
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

// -----------------------------------------------------------------------
// PEGELONLINE-Panel
// -----------------------------------------------------------------------

function PegelPanel({ data, formatIso }: { data: PegelData; formatIso: (iso: string) => string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="font-semibold text-gray-800 text-sm">PEGELONLINE-Analyse</h4>
        <p className="text-xs text-gray-400 mt-0.5">Datenquelle: WSV | PEGELONLINE</p>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Die Daten zeigen Wasserstände an ausgewählten Pegeln und können Hinweise auf
        Hochwasser-, Niedrigwasser- oder transportbezogene Risiken liefern.
      </p>

      {/* Station & Gewässer */}
      <div className="bg-white rounded-lg border border-gray-100 px-3 py-2.5 flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <p className="text-xs text-gray-400">Station</p>
          <p className="text-sm font-medium text-gray-800">
            {data.stationLongname}
            {data.stationLongname !== data.stationShortname && (
              <span className="text-gray-400 font-normal"> ({data.stationShortname})</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Gewässer</p>
          <p className="text-sm font-medium text-gray-800">{data.waterLongname}</p>
        </div>
        {data.km !== undefined && (
          <div>
            <p className="text-xs text-gray-400">Fluss-km</p>
            <p className="text-sm font-medium text-gray-800">{data.km.toFixed(1)}</p>
          </div>
        )}
      </div>

      {/* Aktuelle Messung */}
      <div className="grid grid-cols-2 gap-2">
        <MetricBox label="Aktueller Wasserstand" value={`${data.currentValue} ${data.unit}`} />
        <MetricBox label="Zeitpunkt" value={formatIso(data.currentTimestamp)} />
        {data.stateMnwMhw && (
          <div className="col-span-2">
            <MetricBox label="Zustand (MNW/MHW)" value={data.stateMnwMhw} />
          </div>
        )}
      </div>

      {/* Letzte Messwerte */}
      {data.recentMeasurements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            Letzte {data.recentMeasurements.length} Messwerte (24 h)
          </p>
          <div className="flex flex-col gap-1">
            {data.recentMeasurements.map((point) => (
              <div key={point.timestamp} className="flex justify-between items-center text-xs bg-white rounded border border-gray-100 px-3 py-1.5">
                <span className="text-gray-400">{formatIso(point.timestamp)}</span>
                <span className="font-medium text-gray-800">{point.value} {data.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fachliche Grenze */}
      <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-700 leading-relaxed">
        Die Daten bilden die Wasserstandssituation an einer Messstelle ab. Die konkrete
        Betroffenheit eines Unternehmens hängt von Standort, Transportwegen und internen
        Lieferketten ab.
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Gemeinsame Hilfskomponenten
// -----------------------------------------------------------------------

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
