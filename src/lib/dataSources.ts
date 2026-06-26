import type { ContextAnalysisType } from './detectAnalysisType';

export interface DataSource {
  name: string;
  description: string;
}

// Strukturierter Analysekontext, den RiskContextForm an PreparedAnalysisPreview übergibt
export interface PreparedContext {
  risk: {
    name: string;
    group?: string;
    probability?: string;
    impact?: string;
    score?: string;
  };
  analysisType: ContextAnalysisType;
  analysisTypeLabel: string;
  // Jedes Eingabefeld mit Label und eingegebenem Wert
  userInputs: { fieldId: string; label: string; value: string }[];
  dataSources: DataSource[];
  missingInternalData: string[];
}

export const DATA_SOURCES: Record<ContextAnalysisType, DataSource[]> = {
  supplier: [
    { name: 'Eurostat COMEXT',                            description: 'EU-Außenhandelsstatistik nach Waren und Partnern' },
    { name: 'UN Comtrade',                                description: 'Globale Handelsstatistik der Vereinten Nationen' },
    { name: 'World Bank Pink Sheet',                      description: 'Rohstoff- und Erzeugerpreisindizes' },
    { name: 'EU Sanctions Map',                           description: 'Geografische Darstellung aktiver EU-Sanktionen' },
    { name: 'EU consolidated financial sanctions list',   description: 'Konsolidierte EU-Sanktionsliste (natürliche und juristische Personen)' },
    { name: 'HHI (Herfindahl-Hirschman-Index)',           description: 'Konzentrationsmaß für Lieferanten- und Rohstoffmärkte' },
  ],
  cyber: [
    { name: 'BSI-Lagebericht',          description: 'Jährlicher Bericht zur IT-Sicherheitslage in Deutschland' },
    { name: 'ENISA Threat Landscape',   description: 'EU-weite Analyse von Cyberbedrohungslagen' },
    { name: 'NVD / CVE-Datenbank',      description: 'NIST National Vulnerability Database – bekannte Schwachstellen' },
  ],
  workforce: [
    { name: 'Engpassanalyse der BA',        description: 'Bundesagentur für Arbeit: Berufe mit Engpässen nach Region' },
    { name: 'Gemeldete Arbeitsstellen (BA)',description: 'Statistik offener Stellen nach Berufsgruppe und Bundesland' },
    { name: 'IAB-Stellenerhebung',          description: 'Institut für Arbeitsmarkt- und Berufsforschung: Stellenangebot' },
    { name: 'Destatis GENESIS',             description: 'Erwerbstätigenstatistik, Qualifikationsstruktur' },
    { name: 'Eurostat Labour Market',       description: 'EU-weite Arbeitsmarktindikatoren' },
    { name: 'Eurostat Labour Costs',        description: 'Lohnkostenentwicklung im EU-Vergleich' },
  ],
  regulatory: [
    { name: 'EUR-Lex / Cellar',                          description: 'Datenbank für EU-Rechtsakte und Richtlinien' },
    { name: 'BAFA',                                       description: 'Bundesamt für Wirtschaft und Ausfuhrkontrolle' },
    { name: 'ECHA / ECHA CHEM',                           description: 'Europäische Chemikalienagentur – Stoffdatenbank' },
    { name: 'EU consolidated financial sanctions list',   description: 'Konsolidierte EU-Sanktionsliste' },
    { name: 'Bundesgesetzblatt',                          description: 'Offizielle deutsche Rechtsvorschriften und Verordnungen' },
  ],
  macro: [
    { name: 'Destatis GENESIS',     description: 'BIP, Inflation, Außenhandel, Branchenstatistiken' },
    { name: 'Eurostat HICP',        description: 'Harmonisierter Verbraucherpreisindex für EU-Länder' },
    { name: 'Eurostat Energy',      description: 'EU-Energiepreise, -bilanzen und -verbrauch' },
    { name: 'ECB Data Portal',      description: 'Leitzinsen, Wechselkurse, Geldmenge' },
    { name: 'World Bank Pink Sheet',description: 'Globale Rohstoff- und Marktpreise' },
  ],
  environmental: [
    { name: 'DWD Climate Data Center',       description: 'Klimadaten und -projektionen des Deutschen Wetterdienstes' },
    { name: 'Copernicus Climate Data Store', description: 'EU-Klimadienst: historische und projizierte Klimadaten' },
    { name: 'PEGELONLINE',                   description: 'Wasserstandsdaten der Wasserstraßen- und Schifffahrtsverwaltung' },
    { name: 'Umweltbundesamt',               description: 'Umweltdaten und Klimaindikatoren für Deutschland' },
    { name: 'DEHSt',                         description: 'Deutsche Emissionshandelsstelle – CO₂-Zertifikate und Emissionsdaten' },
    { name: 'European Environment Agency',   description: 'EU-weite Umwelt- und Klimadaten' },
  ],
  generic: [
    { name: 'Destatis GENESIS', description: 'Allgemeine Wirtschafts- und Unternehmensstatistiken' },
    { name: 'Eurostat',         description: 'EU-weite Statistiken zu Wirtschaft, Gesellschaft und Umwelt' },
  ],
};

// Interne Daten, die für eine vertiefte Analyse je Typ fehlen würden
export const MISSING_INTERNAL_DATA: Record<ContextAnalysisType, string[]> = {
  supplier: [
    'Aktuelle Lagerbestände und Reichweiten nach Material',
    'Lieferantenverträge und Konditionen (Fristen, Pönalen)',
    'Historische Bestellmengen und Liefertreue je Lieferant',
    'Eigene Lieferantenbewertungen (Qualität, Zuverlässigkeit)',
    'Bestehende Alternativlieferanten und deren Kapazitäten',
  ],
  cyber: [
    'ISMS-Dokumentation und letzte Sicherheitsaudits',
    'Netzwerkpläne und Systemarchitektur (IT/OT-Trennung)',
    'Ergebnisse aus Schwachstellenscans oder Penetrationstests',
    'Aktueller Patch-Status kritischer Systeme',
    'Incident-Response-Plan und letzte Testdurchführung',
  ],
  workforce: [
    'HR-Daten: Altersstruktur, Fluktuation, Fehlzeiten',
    'Durchschnittliche Stellenbesetzungszeiten nach Berufsgruppe',
    'Qualifikationsmatrix der Belegschaft',
    'Nachwuchsprogramme und laufende Ausbildungszahlen',
    'Lohnbenchmarks gegenüber lokalem Arbeitsmarkt',
  ],
  regulatory: [
    'Laufende Genehmigungen und deren Ablaufdaten',
    'Ergebnisse aktueller Compliance-Audits',
    'Laufende oder drohende Rechtsverfahren',
    'Meldepflichten und deren Erfüllungsstatus',
    'Zertifizierungen (ISO, branchenspezifisch) und Verfallsdaten',
  ],
  macro: [
    'Preisanpassungsklauseln in laufenden Kundenverträgen',
    'Währungsabsicherungen (Hedging) und deren Laufzeit',
    'Einkaufspreishistorie für wichtige Inputfaktoren',
    'Umsatz- und Margenstruktur nach Absatzmarkt',
    'Kreditlinien und Zinskonditionen',
  ],
  environmental: [
    'Betriebsstandorte und deren Exposition gegenüber Extremwetter',
    'Unternehmenseigene Klimarisikoanalysen oder -szenarien',
    'Versicherungsverträge für Elementarschäden',
    'CO₂-Bilanz und Emissionshandelszertifikate',
    'Abhängigkeit von wasserintensiven Produktionsprozessen',
  ],
  generic: [
    'Interne Risikodokumentation und bisherige Schadenshistorie',
    'Verantwortlichkeiten und Eskalationswege für das Risiko',
    'Bestehende Maßnahmen zur Risikominderung',
    'Finanzielle Risikoexposition (Worst-Case-Schäden)',
    'Versicherungsschutz und Selbstbehalte',
  ],
};
