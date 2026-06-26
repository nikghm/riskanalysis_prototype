// Zentrale Klassifizierung von Risiken auf Basis von Name und Risikogruppe.
// Erweiterbar: einfach neue Keywords oder Typen hinzufügen.

export type AnalysisType =
  | 'smard'
  | 'pegelonline'
  | 'supplier'
  | 'cyber'
  | 'workforce'
  | 'regulatory'
  | 'macro'
  | 'environmental'
  | 'generic';

// Typen ohne direkte API-Anbindung – zeigen das Kontextformular
export type ContextAnalysisType = Exclude<AnalysisType, 'smard' | 'pegelonline'>;

export const ANALYSIS_TYPE_LABELS: Record<AnalysisType, string> = {
  smard:         'Energie-/Strompreisrisiko',
  pegelonline:   'Hochwasser-/Pegelrisiko',
  supplier:      'Lieferantenrisiko',
  cyber:         'Cyber- und IT-Risiko',
  workforce:     'Fachkräftemangel',
  regulatory:    'Regulatorisches Risiko',
  macro:         'Makroökonomisches Risiko',
  environmental: 'Umwelt-/Klimarisiko',
  generic:       'Allgemeines Risiko',
};

function matches(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

const ENERGY_KEYWORDS = [
  'energiepreis', 'strompreis', 'energiekosten', 'stromkosten',
  'energierisiko', 'stromrisiko', 'energieversorgung', 'stromversorgung',
  'energie', 'strom', 'energy', 'electricity',
];

const WATER_KEYWORDS = [
  'hochwasser', 'niedrigwasser', 'wasserstand', 'pegel',
  'rhein', 'elbe', 'donau', 'weser', 'oder',
  'binnenschiff', 'schifffahrt', 'überflutung', 'flut',
  'wasser', 'fluss', 'water', 'river', 'flood', 'transportweg',
];

const SUPPLIER_KEYWORDS = [
  'lieferant', 'lieferausfall', 'lieferkette', 'lieferkettenrisiko',
  'rohstoff', 'einkauf', 'beschaffung', 'zulieferer',
  'materialengpass', 'materialknappheit', 'versorgungsrisiko', 'supplier',
  'sourcing', 'procurement', 'warengruppe',
];

const CYBER_KEYWORDS = [
  'cyber', 'it-sicherheit', 'datenschutz', 'hackerangriff',
  'ransomware', 'it-ausfall', 'ot-angriff', 'cyberangriff',
  'phishing', 'sicherheitslücke', 'datenverlust', 'systemausfall',
  'it-risiko', 'informationssicherheit',
];

const WORKFORCE_KEYWORDS = [
  'fachkräfte', 'personal', 'arbeitskräfte', 'mitarbeiter',
  'fachkräftemangel', 'personalengpass', 'qualifikation',
  'rekrutierung', 'stellenbesetzung', 'fluktuation',
  'personalmangel', 'workforce', 'arbeitsmarkt',
];

const REGULATORY_KEYWORDS = [
  'regulierung', 'compliance', 'gesetz', 'vorschrift', 'sanktion',
  'genehmigung', 'zulassung', 'regulatorisch', 'verordnung',
  'richtlinie', 'lizenz', 'regulation', 'rechtlich', 'haftung',
  'rechtliche', 'gerichtsverfahren',
];

const MACRO_KEYWORDS = [
  'inflation', 'konjunktur', 'rezession', 'wechselkurs',
  'zinsen', 'bip', 'makro', 'währung', 'kaufkraft',
  'wirtschaftsrisiko', 'marktrisiko', 'preisrisiko', 'deflation',
  'wirtschaftsabschwung',
];

const ENVIRONMENTAL_KEYWORDS = [
  'klimawandel', 'umwelt', 'naturkatastrophe', 'dürre', 'sturm',
  'erdbeben', 'co2', 'emissionen', 'klimarisiko', 'biodiversität',
  'klimaextrem', 'environmental', 'extreme wetterereignisse',
];

// Priorität: Direkte APIs zuerst, dann spezifischere Typen, Generic als Fallback
export function detectAnalysisType(name: string, group?: string): AnalysisType {
  const text = [name, group ?? ''].join(' ').toLowerCase();

  if (matches(text, ENERGY_KEYWORDS))        return 'smard';
  if (matches(text, WATER_KEYWORDS))         return 'pegelonline';
  if (matches(text, SUPPLIER_KEYWORDS))      return 'supplier';
  if (matches(text, CYBER_KEYWORDS))         return 'cyber';
  if (matches(text, WORKFORCE_KEYWORDS))     return 'workforce';
  if (matches(text, REGULATORY_KEYWORDS))    return 'regulatory';
  if (matches(text, MACRO_KEYWORDS))         return 'macro';
  if (matches(text, ENVIRONMENTAL_KEYWORDS)) return 'environmental';

  return 'generic';
}
