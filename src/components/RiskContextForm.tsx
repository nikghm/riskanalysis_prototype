'use client';

import { useState } from 'react';
import type { ContextAnalysisType } from '@/lib/detectAnalysisType';
import { ANALYSIS_TYPE_LABELS } from '@/lib/detectAnalysisType';
import { DATA_SOURCES, MISSING_INTERNAL_DATA } from '@/lib/dataSources';
import type { PreparedContext } from '@/lib/dataSources';

interface Field {
  id: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

const FIELDS: Record<ContextAnalysisType, Field[]> = {
  supplier: [
    { id: 'material',      label: 'Betroffenes Material / Warengruppe',   placeholder: 'z.B. Elektronikbauteile, Stahl' },
    { id: 'country',       label: 'Herkunftsland des Lieferanten',        placeholder: 'z.B. China, Taiwan' },
    { id: 'alternatives',  label: 'Anzahl alternativer Lieferanten',      placeholder: 'z.B. 2' },
    { id: 'criticality',   label: 'Kritikalität für die Produktion',      placeholder: 'z.B. hoch – kein Ersatz kurzfristig möglich' },
    { id: 'inventory',     label: 'Lagerreichweite in Tagen',             placeholder: 'z.B. 30' },
  ],
  cyber: [
    { id: 'systems',       label: 'Kritische Systeme',                              placeholder: 'z.B. ERP, SCADA, Produktionsleitsystem' },
    { id: 'otAffected',    label: 'Produktions-IT oder OT betroffen?',              placeholder: 'z.B. Ja – OT-Netz direkt verbunden' },
    { id: 'measures',      label: 'Bestehende Schutzmaßnahmen',                     placeholder: 'z.B. Firewall, MFA, regelmäßige Backups' },
    { id: 'incidents',     label: 'Frühere Vorfälle',                               placeholder: 'z.B. Ransomware-Angriff 2022, oder „keine bekannt"' },
    { id: 'itDependency',  label: 'Produktionsabhängigkeit von IT-Systemen',        placeholder: 'z.B. Produktionsstopp bei ERP-Ausfall' },
    { id: 'software',      label: 'Bekannte Software- / Systemkomponenten',         placeholder: 'z.B. Windows Server, Siemens S7' },
  ],
  workforce: [
    { id: 'profession',     label: 'Betroffene Berufsgruppe',          placeholder: 'z.B. Zerspanungsmechaniker, Softwareentwickler' },
    { id: 'location',       label: 'Standort / Region',                placeholder: 'z.B. Bayern, Ruhrgebiet' },
    { id: 'openPositions',  label: 'Anzahl offener Stellen',           placeholder: 'z.B. 12' },
    { id: 'duration',       label: 'Bisherige Besetzungsdauer',        placeholder: 'z.B. durchschnittlich 8 Monate' },
    { id: 'qualification',  label: 'Benötigte Qualifikation',          placeholder: 'z.B. Ausbildung + 3 Jahre Erfahrung' },
    { id: 'special',        label: 'Besondere Anforderungen / Schichtmodell', placeholder: 'z.B. 3-Schicht, Schweißerpass' },
  ],
  regulatory: [
    { id: 'regulation',  label: 'Betroffene Regulierung / Vorschrift', placeholder: 'z.B. EU-Lieferkettensorgfaltspflichten, NIS2' },
    { id: 'processes',   label: 'Betroffene Prozesse oder Produkte',   placeholder: 'z.B. Chemikalienhandling, IT-Sicherheit' },
    { id: 'status',      label: 'Aktueller Compliance-Status',         placeholder: 'z.B. in Umsetzung, noch nicht konform' },
    { id: 'deadline',    label: 'Umsetzungsfrist',                     placeholder: 'z.B. 01.01.2026' },
  ],
  macro: [
    { id: 'indicator',  label: 'Betroffener makroökonomischer Indikator', placeholder: 'z.B. Inflationsrate, EUR/USD-Kurs' },
    { id: 'exposure',   label: 'Unternehmensexposition',                   placeholder: 'z.B. 30 % Umsatz in USD-Märkten' },
    { id: 'hedging',    label: 'Bestehende Absicherungsmaßnahmen',         placeholder: 'z.B. Währungshedging bis Q2 2025, oder „keine"' },
    { id: 'contracts',  label: 'Preisanpassungsklauseln in Verträgen?',    placeholder: 'z.B. Ja, mit 6-monatiger Verzögerung' },
  ],
  environmental: [
    { id: 'event',       label: 'Art des Umweltereignisses',              placeholder: 'z.B. Dürre, Extremregen, Sturm' },
    { id: 'location',    label: 'Betroffener Standort / Region',          placeholder: 'z.B. Werk Stuttgart, Rheintal' },
    { id: 'dependency',  label: 'Betriebliche Abhängigkeit vom Ereignis', placeholder: 'z.B. Kühlwasserbedarf, Zulieferertransporte' },
    { id: 'insurance',   label: 'Versicherungsschutz für Elementarschäden', placeholder: 'z.B. Ja, bis 5 Mio. €, oder „nicht versichert"' },
  ],
  generic: [
    { id: 'context', label: 'Zusätzlicher Unternehmenskontext', placeholder: 'Relevante interne Details zu diesem Risiko…', multiline: true },
  ],
};

interface Props {
  analysisType: ContextAnalysisType;
  risk: { name: string; group?: string; probability?: string; impact?: string; score?: string };
  // Gespeicherte Werte beim Zurücknavigieren aus der Vorschau
  initialValues?: Record<string, string>;
  onPrepare: (context: PreparedContext, formValues: Record<string, string>) => void;
}

export function RiskContextForm({ analysisType, risk, initialValues, onPrepare }: Props) {
  const fields = FIELDS[analysisType];
  const sources = DATA_SOURCES[analysisType];

  const [values, setValues] = useState<Record<string, string>>(
    initialValues ?? Object.fromEntries(fields.map((f) => [f.id, '']))
  );

  function handleChange(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  function handlePrepare() {
    const context: PreparedContext = {
      risk,
      analysisType,
      analysisTypeLabel: ANALYSIS_TYPE_LABELS[analysisType],
      userInputs: fields.map((f) => ({ fieldId: f.id, label: f.label, value: values[f.id] ?? '' })),
      dataSources: sources,
      missingInternalData: MISSING_INTERNAL_DATA[analysisType],
    };
    onPrepare(context, values);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-800 text-sm">Zusätzliche Kontextinformationen</h4>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">
            {ANALYSIS_TYPE_LABELS[analysisType]}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Diese Angaben strukturieren den Analysekontext für eine spätere Auswertung.
          Die Eingaben verlassen Ihren Browser nicht und werden nicht gespeichert.
        </p>
      </div>

      {/* Risikospezifische Felder */}
      <div className="flex flex-col gap-3">
        {fields.map((field) =>
          field.multiline ? (
            <div key={field.id}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                rows={4}
                placeholder={field.placeholder}
                value={values[field.id] ?? ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            </div>
          ) : (
            <div key={field.id}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder={field.placeholder}
                value={values[field.id] ?? ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            </div>
          )
        )}
      </div>

      {/* Geeignete Datenquellen */}
      {sources.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Geeignete Datenquellen</p>
          <div className="flex flex-col gap-1.5">
            {sources.map((src) => (
              <div key={src.name} className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-xs font-medium text-gray-700">{src.name}</p>
                <p className="text-xs text-gray-400">{src.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hinweis + Button */}
      <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
        <p className="text-xs text-amber-600">
          Die Eingaben werden nicht gespeichert und gehen beim Einklappen verloren.
        </p>
        <button
          className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          onClick={handlePrepare}
        >
          Analyse vorbereiten
        </button>
      </div>
    </div>
  );
}
