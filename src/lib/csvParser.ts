import Papa from 'papaparse';
import type { Risk, ParseResult } from '@/types/risk';

const NAME_COLS   = ['risiko', 'risk', 'risikobezeichnung', 'name', 'bezeichnung'];
const GROUP_COLS  = ['risikogruppe', 'kategorie', 'category', 'gruppe'];
const PROB_COLS   = ['eintrittswahrscheinlichkeit', 'wahrscheinlichkeit', 'probability'];
const IMPACT_COLS = ['auswirkung', 'impact', 'schadenshöhe', 'schadenshoehe'];
const SCORE_COLS  = ['risikowert', 'score', 'risk score', 'bewertung'];

/** Finds the first header that matches any of the given lowercase candidates. */
function findCol(headers: string[], candidates: string[]): string | undefined {
  return headers.find((h) => candidates.includes(h.toLowerCase().trim()));
}

function toNumber(val: string | undefined): number | null {
  if (!val) return null;
  const n = parseFloat(val.replace(',', '.'));
  return isNaN(n) ? null : n;
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers: string[] = result.meta.fields ?? [];

        if (headers.length === 0) {
          resolve({ risks: [], error: 'Die CSV-Datei enthält keine Spalten.' });
          return;
        }

        const nameCol = findCol(headers, NAME_COLS);
        if (!nameCol) {
          resolve({
            risks: [],
            error:
              'Keine erkennbare Risiko-Spalte gefunden. ' +
              `Erwartet z. B.: ${NAME_COLS.join(', ')}.`,
          });
          return;
        }

        const groupCol  = findCol(headers, GROUP_COLS);
        const probCol   = findCol(headers, PROB_COLS);
        const impactCol = findCol(headers, IMPACT_COLS);
        const scoreCol  = findCol(headers, SCORE_COLS);

        const rows = result.data as Record<string, string>[];

        const risks: Risk[] = rows
          .map((row): Risk | null => {
            const name = row[nameCol]?.trim();
            if (!name) return null;

            const probVal   = probCol   ? row[probCol]?.trim()   : undefined;
            const impactVal = impactCol ? row[impactCol]?.trim() : undefined;
            const scoreVal  = scoreCol  ? row[scoreCol]?.trim()  : undefined;

            const probNum  = toNumber(probVal);
            const impactNum = toNumber(impactVal);
            const scoreNum = toNumber(scoreVal);

            let computedScore: number | undefined;
            if (scoreNum !== null) {
              computedScore = scoreNum;
            } else if (probNum !== null && impactNum !== null) {
              computedScore = probNum * impactNum;
            }

            return {
              name,
              group:       groupCol  ? row[groupCol]?.trim()  || undefined : undefined,
              probability: probVal   || undefined,
              impact:      impactVal || undefined,
              score:       scoreVal  || undefined,
              computedScore,
            };
          })
          .filter((r): r is Risk => r !== null);

        if (risks.length === 0) {
          resolve({ risks: [], error: 'Die CSV-Datei enthält keine lesbaren Risiken.' });
          return;
        }

        // Sort descending by computedScore if any row has one
        if (risks.some((r) => r.computedScore !== undefined)) {
          risks.sort((a, b) => (b.computedScore ?? 0) - (a.computedScore ?? 0));
        }

        resolve({ risks: risks.slice(0, 5) });
      },
      error: () => {
        resolve({ risks: [], error: 'Fehler beim Lesen der CSV-Datei.' });
      },
    });
  });
}
