import type { ReactNode } from 'react';
import type { PreparedContext } from '@/lib/dataSources';

interface Props {
  context: PreparedContext;
  onBack: () => void;
}

export function PreparedAnalysisPreview({ context, onBack }: Props) {
  const { risk, analysisTypeLabel, userInputs, dataSources, missingInternalData } = context;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">Analysekontext (Vorschau)</h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Strukturierte Zusammenfassung – bereit für eine spätere Analyse.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Zurück zur Eingabe
        </button>
      </div>

      {/* Risikodaten */}
      <PreviewSection title="Risikodaten">
        <Row label="Risikoname" value={risk.name} />
        {risk.group && <Row label="Risikogruppe" value={risk.group} />}
        {risk.probability && <Row label="Wahrscheinlichkeit" value={risk.probability} />}
        {risk.impact && <Row label="Auswirkung" value={risk.impact} />}
        {risk.score && <Row label="Risikowert" value={risk.score} />}
        <Row label="Erkannter Analyse-Typ" value={analysisTypeLabel} accent />
      </PreviewSection>

      {/* Kontextinformationen */}
      {userInputs.length > 0 && (
        <PreviewSection title="Kontextinformationen (Ihre Angaben)">
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

      {/* Geeignete Datenquellen */}
      {dataSources.length > 0 && (
        <PreviewSection title="Geeignete externe Datenquellen">
          <div className="flex flex-col gap-1.5 mt-1">
            {dataSources.map((src) => (
              <div key={src.name} className="bg-slate-50 rounded border border-gray-100 px-3 py-2">
                <p className="text-xs font-medium text-gray-700">{src.name}</p>
                <p className="text-xs text-gray-400">{src.description}</p>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Fehlende interne Daten */}
      {missingInternalData.length > 0 && (
        <PreviewSection title="Für eine vertiefte Analyse fehlende interne Daten">
          <ul className="flex flex-col gap-1 mt-1">
            {missingInternalData.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-gray-300 select-none mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* KI-Disclaimer */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
        <span className="font-semibold">Hinweis:</span> Eine spätere KI-Analyse ist ausschließlich
        unterstützend. Sie ersetzt keine fachkundige Risikobeurteilung und trifft keine
        abschließenden Aussagen über die Betroffenheit des Unternehmens.
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Hilfskomponenten
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
          : muted ? 'text-gray-300 italic'
          : 'font-medium text-gray-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
