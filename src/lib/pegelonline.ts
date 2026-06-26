// PEGELONLINE – Wasserstandsdaten der Wasserstraßen- und Schifffahrtsverwaltung des Bundes
// Basis-URL: https://pegelonline.wsv.de/webservices/rest-api/v2
// Keine Authentifizierung erforderlich. Unterstützt CORS.
//
// Verwendete Endpunkte:
//   Stationsliste:    GET /stations.json
//   Aktuelle Messung: GET /stations/{shortname}/W/currentmeasurement.json
//   Zeitreihe:        GET /stations/{shortname}/W/measurements.json?start=P1D
//
// "W" steht für Wasserstand (water level).
// "P1D" ist eine ISO-8601-Dauer: 1 Tag zurück vom aktuellen Zeitpunkt.
//
// ⚠ Standard-Station: KAUB am Rhein (Rhein-km 546)
//   Kaub ist ein kritischer Referenzpegel für die Rheinschifffahrt,
//   da dort die Fahrrinnentiefe besonders schnell sinkt (Engpassfunktion).
//   Um eine andere Station zu verwenden, DEFAULT_STATION_SHORTNAME anpassen.
//   Verfügbare Stationen: https://pegelonline.wsv.de/webservices/rest-api/v2/stations.json

const PEGELONLINE_BASE = 'https://pegelonline.wsv.de/webservices/rest-api/v2';

// ⚠ Hier anpassen für andere Pegelmessstellen (Shortname aus der Stationsliste):
export const DEFAULT_STATION_SHORTNAME = 'KAUB';

const WATER_KEYWORDS = [
  'hochwasser', 'niedrigwasser', 'wasserstand', 'pegel',
  'rhein', 'elbe', 'donau', 'weser', 'oder',
  'transportweg', 'binnenschiff', 'schifffahrt',
  'überflutung', 'flut', 'dürre',
  'wasser', 'fluss', 'water', 'river', 'flood',
];

export function isWaterRisk(name: string): boolean {
  const lower = name.toLowerCase();
  return WATER_KEYWORDS.some((kw) => lower.includes(kw));
}

// Interne Typen für die PEGELONLINE-API-Antworten
interface StationListItem {
  uuid: string;
  shortname: string;
  longname: string;
  km?: number;
  agency?: string;
  water: {
    shortname: string;
    longname: string;
  };
}

interface ApiCurrentMeasurement {
  timestamp: string;
  value: number;
  stateMnwMhw?: string;
  stateNswHsw?: string;
}

interface ApiMeasurementPoint {
  timestamp: string;
  value: number;
}

// Exportierter Typ für die UI
export interface PegelData {
  stationShortname: string;
  stationLongname: string;
  waterShortname: string;
  waterLongname: string;
  km?: number;
  unit: string;
  currentValue: number;
  currentTimestamp: string;
  stateMnwMhw?: string;
  recentMeasurements: { timestamp: string; value: number }[];
}

// Wird ausschließlich server-seitig aufgerufen (Route Handler)
export async function fetchPegelData(): Promise<PegelData> {
  const shortname = DEFAULT_STATION_SHORTNAME;

  // Schritt 1: Stationsliste abrufen, um Metadaten (Gewässer, km) zu erhalten.
  // Die Liste ändert sich selten → 1h cachen.
  const stationsRes = await fetch(`${PEGELONLINE_BASE}/stations.json`, {
    next: { revalidate: 3600 },
  });
  if (!stationsRes.ok) {
    throw new Error(`PEGELONLINE Stationsliste nicht abrufbar: HTTP ${stationsRes.status}`);
  }
  const stations = (await stationsRes.json()) as StationListItem[];
  const station = stations.find((s) => s.shortname === shortname);
  if (!station) {
    throw new Error(
      `Station "${shortname}" nicht in PEGELONLINE gefunden. ` +
        `Shortname in src/lib/pegelonline.ts prüfen oder unter ${PEGELONLINE_BASE}/stations.json nachschlagen.`
    );
  }

  // Schritt 2: Aktuelle Messung abrufen. Messwerte können sich alle 15 min ändern → 5 min cachen.
  const measureUrl = `${PEGELONLINE_BASE}/stations/${shortname}/W/currentmeasurement.json`;
  const measureRes = await fetch(measureUrl, { next: { revalidate: 300 } });
  if (!measureRes.ok) {
    throw new Error(
      `Aktuelle Messung für Station "${shortname}" nicht verfügbar: HTTP ${measureRes.status}`
    );
  }
  const current = (await measureRes.json()) as ApiCurrentMeasurement;

  // Schritt 3: Zeitreihe der letzten 24 Stunden – optional, wird bei Fehler übersprungen.
  let recentMeasurements: { timestamp: string; value: number }[] = [];
  try {
    const tsRes = await fetch(
      `${PEGELONLINE_BASE}/stations/${shortname}/W/measurements.json?start=P1D`,
      { next: { revalidate: 300 } }
    );
    if (tsRes.ok) {
      const points = (await tsRes.json()) as ApiMeasurementPoint[];
      // Letzten 5 Messwerte aus dem 24h-Fenster anzeigen
      recentMeasurements = points.slice(-5).map((p) => ({
        timestamp: p.timestamp,
        value: p.value,
      }));
    }
  } catch {
    // Zeitreihe nicht kritisch – aktueller Wert genügt für den Prototyp
  }

  return {
    stationShortname: station.shortname,
    stationLongname: station.longname,
    waterShortname: station.water.shortname,
    waterLongname: station.water.longname,
    km: station.km,
    unit: 'cm',
    currentValue: current.value,
    currentTimestamp: current.timestamp,
    stateMnwMhw: current.stateMnwMhw,
    recentMeasurements,
  };
}
