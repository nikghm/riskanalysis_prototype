// SMARD – Strommarktdaten der Bundesnetzagentur
// Dokumentation: https://www.smard.de/home/marktdaten
//
// API-Struktur:
//   Index:  GET /chart_data/{filter}/{region}/index_{resolution}.json
//   Daten:  GET /chart_data/{filter}/{region}/{filter}_{region}_{resolution}_{timestamp}.json
//
// ⚠ Verwendete Parameter – hier anpassen falls Daten nicht stimmen:
//   SMARD_FILTER     4169  = Day-ahead Großhandelspreise DE-LU (EUR/MWh)
//   SMARD_REGION  "DE-LU"  = Deutschland/Luxemburg-Gebotszone
//   SMARD_RESOLUTION "hour" = stündliche Auflösung
//
// Filter-ID 4169 basiert auf der bekannten SMARD-API-Struktur. Falls sich
// die API geändert hat, kann die aktuelle ID im Netzwerktraffic von
// https://www.smard.de/home/marktdaten nachgeschlagen werden.

const SMARD_BASE = 'https://www.smard.de/app/chart_data';
const SMARD_FILTER = 4169;
const SMARD_REGION = 'DE-LU';
const SMARD_RESOLUTION = 'hour';

export interface SmardDataPoint {
  timestamp: number;
  value: number | null;
}

export interface SmardData {
  latestTimestamp: number;
  latestValue: number | null;
  averageLast5: number | null;
  last5: SmardDataPoint[];
  unit: string;
  filter: number;
  region: string;
}

// Keywords für die Erkennung energiebezogener Risiken (case-insensitive)
const ENERGY_KEYWORDS = [
  'energiepreis', 'strompreis', 'energiekosten', 'stromkosten',
  'energierisiko', 'stromrisiko', 'energieversorgung', 'stromversorgung',
  'energie', 'strom', 'energy', 'electricity',
];

export function isEnergyRisk(name: string): boolean {
  const lower = name.toLowerCase();
  return ENERGY_KEYWORDS.some((kw) => lower.includes(kw));
}

// Wird ausschließlich server-seitig aufgerufen (Route Handler)
export async function fetchSmardData(): Promise<SmardData> {
  // Schritt 1: Verfügbare Zeitstempel-Buckets abrufen
  const indexUrl = `${SMARD_BASE}/${SMARD_FILTER}/${SMARD_REGION}/index_${SMARD_RESOLUTION}.json`;
  const indexRes = await fetch(indexUrl, {
    next: { revalidate: 3600 }, // 1h cachen
  });
  if (!indexRes.ok) {
    throw new Error(`SMARD Index-Abruf fehlgeschlagen: HTTP ${indexRes.status}. Bitte Filter ${SMARD_FILTER} prüfen.`);
  }

  const indexData = (await indexRes.json()) as { timestamps: number[] };
  const { timestamps } = indexData;
  if (!timestamps || timestamps.length === 0) {
    throw new Error(
      `SMARD hat keine Zeitstempel geliefert. Bitte Filter ${SMARD_FILTER} und Region "${SMARD_REGION}" in src/lib/smard.ts prüfen.`
    );
  }

  // Schritt 2: Neuesten Datenbucket abrufen
  const latestTs = timestamps[timestamps.length - 1];
  const dataUrl = `${SMARD_BASE}/${SMARD_FILTER}/${SMARD_REGION}/${SMARD_FILTER}_${SMARD_REGION}_${SMARD_RESOLUTION}_${latestTs}.json`;
  const dataRes = await fetch(dataUrl, {
    next: { revalidate: 3600 },
  });
  if (!dataRes.ok) {
    throw new Error(`SMARD Datenabruf fehlgeschlagen: HTTP ${dataRes.status}`);
  }

  const seriesData = (await dataRes.json()) as { series: [number, number | null][] };
  const series = seriesData.series ?? [];

  // Nur Datenpunkte mit echtem Wert für Durchschnitt und Last-5
  const nonNull = series.filter((p): p is [number, number] => p[1] !== null);
  const last5: SmardDataPoint[] = nonNull.slice(-5).map(([ts, v]) => ({ timestamp: ts, value: v }));

  const latestPoint = nonNull[nonNull.length - 1];
  const latestTimestamp = latestPoint?.[0] ?? latestTs;
  const latestValue = latestPoint?.[1] ?? null;

  const averageLast5 =
    last5.length > 0
      ? last5.reduce((sum, p) => sum + (p.value ?? 0), 0) / last5.length
      : null;

  return {
    latestTimestamp,
    latestValue,
    averageLast5,
    last5,
    unit: 'EUR/MWh',
    filter: SMARD_FILTER,
    region: SMARD_REGION,
  };
}
