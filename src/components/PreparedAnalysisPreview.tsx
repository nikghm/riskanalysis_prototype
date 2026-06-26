'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PreparedContext } from '@/lib/dataSources';
import type { AiSection } from '@/lib/ai/buildGeminiPrompt';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

type AiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; sections: AiSection }
  | { status: 'success-raw'; text: string }
  | { status: 'error'; message: string };

type TextSectionKey = Exclude<keyof AiSection, 'risikostufe'>;

// -----------------------------------------------------------------------
// Section config
// -----------------------------------------------------------------------

const SECTION_LABELS: Record<TextSectionKey, string> = {
  risikolageBegruendung:      'Begründung der Einstufung',
  hinweiseDatenquellen:       'Hinweise aus Datenquellen',
  bedeutungUnternehmen:       'Bedeutung für das Unternehmen',
  fehlendeInformationen:      'Fehlende Informationen',
  empfohleneNaechstePruefung: 'Empfohlene nächste Prüfung',
};

const SECTION_ORDER: TextSectionKey[] = [
  'risikolageBegruendung',
  'hinweiseDatenquellen',
  'bedeutungUnternehmen',
  'fehlendeInformationen',
  'empfohleneNaechstePruefung',
];

// -----------------------------------------------------------------------
// Risk level badge
// -----------------------------------------------------------------------

function getStufeStyle(stufe: string): { badge: string; dot: string } {
  const s = stufe.toLowerCase();
  if (s.includes('akut'))            return { badge: 'bg-red-100 text-red-800 border-red-300',              dot: 'bg-red-500'    };
  if (s.includes('aufmerksamkeit'))  return { badge: 'bg-amber-100 text-amber-800 border-amber-300',        dot: 'bg-amber-500'  };
  if (s.includes('vorsorglich'))     return { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',     dot: 'bg-yellow-500' };
  return                                    { badge: 'bg-gray-100 text-gray-600 border-gray-200',            dot: 'bg-gray-400'   };
}

function RisikoBadge({ stufe }: { stufe: string }) {
  const { badge, dot } = getStufeStyle(stufe);
  return (
    <div className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border text-sm font-semibold ${badge}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      {stufe}
    </div>
  );
}

// -----------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------

interface Props {
  context: PreparedContext;
  onBack: () => void;
}

export function PreparedAnalysisPreview({ context, onBack }: Props) {
  const { risk, analysisTypeLabel, userInputs, dataSources, missingInternalData } = context;
  const [aiState, setAiState] = useState<AiState>({ status: 'idle' });
  const [showBasis, setShowBasis] = useState(false);

  const hasResult = aiState.status === 'success' || aiState.status === 'success-raw';

  async function startAnalysis() {
    setAiState({ status: 'loading' });
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      const json = await res.json() as { sections?: AiSection; rawText?: string; error?: string };
      if (!res.ok) {
        setAiState({ status: 'error', message: json.error ?? `HTTP ${res.status}` });
        return;
      }
      if (json.sections) {
        setAiState({ status: 'success', sections: json.sections });
      } else if (json.rawText) {
        setAiState({ status: 'success-raw', text: json.rawText });
      } else {
        setAiState({ status: 'error', message: 'Unerwartetes Antwortformat von der API.' });
      }
    } catch (e) {
      setAiState({ status: 'error', message: e instanceof Error ? e.message : 'Netzwerkfehler' });
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">
            {hasResult ? 'KI-Einschätzung' : 'Analysekontext (Vorschau)'}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            {hasResult
              ? 'Gemini 2.5 Flash · unterstützend, kein Ersatz für Fachurteil'
              : `${analysisTypeLabel} · bereit für KI-Analyse`}
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Zurück zur Eingabe
        </button>
      </div>

      {/* ── IDLE: compact context preview ── */}
      {aiState.status === 'idle' && (
        <>
          <PreviewSection title="Risikodaten">
            <Row label="Risikoname" value={risk.name} />
            {risk.group && <Row label="Risikogruppe" value={risk.group} />}
            {risk.probability && <Row label="Wahrscheinlichkeit" value={risk.probability} />}
            {risk.impact && <Row label="Auswirkung" value={risk.impact} />}
            {risk.score && <Row label="Risikowert" value={risk.score} />}
            <Row label="Analyse-Typ" value={analysisTypeLabel} accent />
          </PreviewSection>

          {userInputs.length > 0 && (
            <PreviewSection title="Ihre Angaben">
              {userInputs.map((input) => (
                <Row
                  key={input.fieldId}
                  label={input.label}
                  value={input.value.trim() || '— nicht angegeben'}
                  muted={!input.value.trim()}
                />
              ))}
            </PreviewSection>
          )}

          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Gemini erstellt auf dieser Basis eine qualitative Risikoeinschätzung.
              Eingaben werden nicht dauerhaft gespeichert.
            </p>
            <button
              onClick={startAnalysis}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              KI-Analyse starten
            </button>
          </div>
        </>
      )}

      {/* ── LOADING ── */}
      {aiState.status === 'loading' && (
        <div className="flex items-center justify-center gap-2.5 text-sm text-gray-500 py-8">
          <svg
            className="animate-spin h-4 w-4 text-blue-500 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          KI-Analyse wird durchgeführt…
        </div>
      )}

      {/* ── ERROR ── */}
      {aiState.status === 'error' && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex flex-col gap-2">
          <p className="text-sm font-medium text-red-700">Fehler bei der KI-Analyse</p>
          <p className="text-xs text-red-600">{aiState.message}</p>
          <button
            onClick={startAnalysis}
            className="self-start text-xs text-red-600 underline underline-offset-2 hover:text-red-800 cursor-pointer mt-1"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* ── SUCCESS: structured result ── */}
      {aiState.status === 'success' && (
        <>
          {/* Risk level badge */}
          <RisikoBadge stufe={aiState.sections.risikostufe} />

          {/* AI sections */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex flex-col divide-y divide-gray-100 bg-white">
              {SECTION_ORDER.map((key) => {
                const text = aiState.sections[key];
                if (!text?.trim()) return null;
                return (
                  <div key={key} className="px-4 py-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
                      {SECTION_LABELS[key]}
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collapsible Analysegrundlage */}
          <Collapsible
            label="Analysegrundlage anzeigen"
            open={showBasis}
            onToggle={() => setShowBasis((b) => !b)}
          >
            <div className="flex flex-col gap-3 px-4 py-3">
              <BasisBlock title="Risikodaten">
                <Row label="Risikoname" value={risk.name} />
                {risk.group && <Row label="Risikogruppe" value={risk.group} />}
                {risk.probability && <Row label="Wahrscheinlichkeit" value={risk.probability} />}
                {risk.impact && <Row label="Auswirkung" value={risk.impact} />}
                {risk.score && <Row label="Risikowert" value={risk.score} />}
              </BasisBlock>

              {userInputs.length > 0 && (
                <BasisBlock title="Nutzereingaben">
                  {userInputs.map((input) => (
                    <Row
                      key={input.fieldId}
                      label={input.label}
                      value={input.value.trim() || '— nicht angegeben'}
                      muted={!input.value.trim()}
                    />
                  ))}
                </BasisBlock>
              )}

              {dataSources.length > 0 && (
                <BasisBlock title="Datenquellenkandidaten">
                  {dataSources.map((src) => (
                    <div key={src.name} className="text-xs leading-relaxed">
                      <span className="font-medium text-gray-600">{src.name}</span>
                      <span className="text-gray-400"> · {src.description}</span>
                    </div>
                  ))}
                </BasisBlock>
              )}

              {missingInternalData.length > 0 && (
                <BasisBlock title="Fehlende interne Daten">
                  {missingInternalData.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="text-gray-300 mt-0.5 select-none">•</span>
                      {item}
                    </div>
                  ))}
                </BasisBlock>
              )}
            </div>
          </Collapsible>
        </>
      )}

      {/* ── SUCCESS-RAW: fallback for unstructured response ── */}
      {aiState.status === 'success-raw' && (
        <>
          <div className="rounded-xl border border-blue-200 overflow-hidden">
            <div className="px-4 py-3 bg-blue-600">
              <h4 className="text-sm font-semibold text-white">KI-Einschätzung</h4>
              <p className="text-xs text-blue-200 mt-0.5">Gemini 2.5 Flash</p>
            </div>
            <div className="px-4 py-4 bg-white">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aiState.text}</p>
            </div>
          </div>

          <Collapsible
            label="Analysegrundlage anzeigen"
            open={showBasis}
            onToggle={() => setShowBasis((b) => !b)}
          >
            <div className="flex flex-col gap-3 px-4 py-3">
              <BasisBlock title="Risikodaten">
                <Row label="Risikoname" value={risk.name} />
                {risk.group && <Row label="Risikogruppe" value={risk.group} />}
              </BasisBlock>
              {userInputs.length > 0 && (
                <BasisBlock title="Nutzereingaben">
                  {userInputs.map((input) => (
                    <Row
                      key={input.fieldId}
                      label={input.label}
                      value={input.value.trim() || '— nicht angegeben'}
                      muted={!input.value.trim()}
                    />
                  ))}
                </BasisBlock>
              )}
            </div>
          </Collapsible>
        </>
      )}

      {/* Disclaimer */}
      {aiState.status !== 'loading' && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Hinweis:</span> Die Einschätzung ist unterstützend und ersetzt keine
          fachliche Risikobewertung. Sie trifft keine abschließenden Aussagen über die Betroffenheit des Unternehmens.
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Helper components
// -----------------------------------------------------------------------

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
  muted = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span
        className={`text-xs text-right break-words max-w-[60%] ${
          accent ? 'font-semibold text-green-700'
          : muted  ? 'text-gray-300 italic'
          : 'font-medium text-gray-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function BasisBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

function Collapsible({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span>{label}</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-slate-50">
          {children}
        </div>
      )}
    </div>
  );
}
