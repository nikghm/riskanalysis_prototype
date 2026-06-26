import type { PreparedContext } from '@/lib/dataSources';

export interface AiSection {
  risikostufe: string;           // "akut erhöht" | "erhöhte Aufmerksamkeit" | "vorsorglich beobachten" | "nicht belastbar bewertbar"
  risikolageBegruendung: string;
  hinweiseDatenquellen: string;
  bedeutungUnternehmen: string;
  fehlendeInformationen: string;
  empfohleneNaechstePruefung: string;
}

export function buildGeminiPrompt(context: PreparedContext): string {
  const { risk, analysisTypeLabel, userInputs, dataSources, missingInternalData } = context;

  const lines: string[] = [
    '## Risikoinformationen',
    `- Risikoname: ${risk.name}`,
  ];

  if (risk.group)       lines.push(`- Risikogruppe: ${risk.group}`);
  if (risk.probability) lines.push(`- Eintrittswahrscheinlichkeit (Eigeneinschätzung): ${risk.probability}`);
  if (risk.impact)      lines.push(`- Auswirkung (Eigeneinschätzung): ${risk.impact}`);
  if (risk.score)       lines.push(`- Risikowert: ${risk.score}`);
  lines.push(`- Analyse-Typ: ${analysisTypeLabel}`);

  lines.push('');
  lines.push('## Unternehmensspezifischer Kontext (Nutzereingaben – nicht extern verifiziert)');
  const hasFilledInputs = userInputs.some((i) => i.value.trim());
  if (hasFilledInputs) {
    for (const input of userInputs) {
      lines.push(`- ${input.label}: ${input.value.trim() || '(keine Angabe)'}`);
    }
  } else {
    lines.push('Keine spezifischen Kontextangaben gemacht. Eine qualitative Einstufung ist kaum möglich.');
  }

  lines.push('');
  lines.push('## Für diesen Risikobereich relevante Datenquellen (für deine Recherche)');
  for (const src of dataSources) {
    lines.push(`- ${src.name}: ${src.description}`);
  }

  lines.push('');
  lines.push('## Intern fehlende Informationen für eine belastbare Analyse');
  for (const item of missingInternalData) {
    lines.push(`- ${item}`);
  }

  // Concrete search instructions for Gemini
  lines.push('');
  lines.push('## Recherche-Auftrag (Google Search)');
  lines.push('Führe JETZT eine aktive Google-Suche durch. Suche gezielt nach:');
  lines.push(`1. Aktuelle Lage und Entwicklungen: "${risk.name}" 2025`);

  const filledValues = userInputs
    .filter((i) => i.value.trim())
    .map((i) => i.value.trim())
    .slice(0, 2);

  if (filledValues.length > 0) {
    lines.push(`2. Spezifische Aspekte aus den Nutzereingaben: ${filledValues.join(', ')}`);
  }

  if (dataSources.length > 0) {
    const topSources = dataSources.slice(0, 3).map((s) => s.name).join(', ');
    lines.push(`3. Aktuelle Berichte der relevanten Quellen: ${topSources}`);
  }

  lines.push(`4. Aktuelle Risikolage Thema: "${analysisTypeLabel}" Deutschland 2025`);
  lines.push('');
  lines.push('Berichte im Abschnitt "hinweiseDatenquellen" konkret, was du gefunden hast.');
  lines.push('Trenne klar: Was ist ein Suchergebnis? Was ist Nutzereingabe?');
  lines.push('Wenn du nichts Relevantes gefunden hast, sage das transparent.');

  return lines.join('\n');
}
