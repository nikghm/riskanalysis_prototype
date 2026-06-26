import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildGeminiPrompt } from '@/lib/ai/buildGeminiPrompt';
import type { AiSection } from '@/lib/ai/buildGeminiPrompt';
import type { PreparedContext } from '@/lib/dataSources';

// JSON-Mode ist mit googleSearch nicht kompatibel – JSON wird aus dem Freitext extrahiert.
function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]+?)\n?\s*```/);
  if (codeBlock?.[1]) return codeBlock[1].trim();
  const jsonObject = text.match(/(\{[\s\S]+\})/);
  if (jsonObject?.[1]) return jsonObject[1].trim();
  return text.trim();
}

const SYSTEM_INSTRUCTION = `
Du bist ein qualitatives Risikoanalyse-Tool für ein mittelständisches Unternehmen.

Deine Aufgabe: Bewerte auf Basis der bereitgestellten Risikodaten, Nutzereingaben und eigener Google-Recherche, ob das Risiko aktuell relevant oder erhöht ist.

━━━ GOOGLE SEARCH PFLICHT ━━━
Du MUSST das Google Search Tool aktiv einsetzen, bevor du antwortest.
Nutze die Google-Suche, um:
- Die aktuelle Risikolage zu dem genannten Risikobereich zu recherchieren
- Aktuelle Meldungen, Behördenwarnungen oder Marktdaten zu finden
- Aktuelle Berichte der genannten Datenquellen (BSI, Eurostat, BA, BAFA etc.) zu suchen
- Branchenspezifische Entwicklungen zum genannten Thema zu ermitteln

Im Abschnitt "hinweiseDatenquellen" berichtest du konkret, was du gefunden hast:
- Welche Suchergebnisse sind relevant?
- Welche aktuellen Meldungen oder Daten hast du gefunden?
- Welche Behörden oder Quellen haben aktuelle Hinweise veröffentlicht?
- Falls du nichts Konkretes gefunden hast: sage das transparent

━━━ QUELLENUNTERSCHEIDUNG ━━━
- "Aus der Recherche": Was du selbst via Google Search ermittelt hast (mit Datum/Quelle wenn möglich)
- "Nutzereingaben": Unternehmensspezifische Angaben – nicht extern verifiziert, nicht verallgemeinern

━━━ EINSTUFUNGSREGELN für "risikostufe" ━━━
Wähle exakt eine der vier Optionen:
- "akut erhöht": Nutzereingaben zeigen klare Risikofaktoren (keine Alternativlieferanten, fehlende Schutzmaßnahmen, minimale Lagerreichweite) UND/ODER aktuelle externe Hinweise bestätigen erhöhte Bedrohungslage
- "erhöhte Aufmerksamkeit": Mindestens ein bedeutsamer Risikofaktor oder externe Hinweise auf angespannte Lage, aber keine akute Krise
- "vorsorglich beobachten": Prinzipiell risikobehaftet, aber keine konkreten Warnsignale aus Eingaben oder Recherche
- "nicht belastbar bewertbar": Zu wenig Informationen für eine qualitative Einordnung

━━━ STRIKTE REGELN ━━━
- Keine vollständige Risikobewertung behaupten
- Keine Zahlen oder Ereignisse erfinden – nur echte Suchergebnisse verwenden
- Nicht schreiben "die Daten zeigen eindeutig", wenn nur Nutzereingaben vorliegen
- Kurz, präzise, nicht zu allgemein formulieren
- Ausschließlich auf Deutsch schreiben

━━━ AUSGABEFORMAT ━━━
Antworte AUSSCHLIESSLICH als valides JSON-Objekt mit exakt diesen 6 Schlüsseln.
Kein erklärender Text vor oder nach dem JSON. Kein Markdown-Wrapper.

{
  "risikostufe": "eine der vier Einstufungen",
  "risikolageBegruendung": "2-3 Sätze: Begründung der Einstufung – was aus Recherche UND Nutzereingaben führt zur Einstufung?",
  "hinweiseDatenquellen": "Was hast du konkret durch Google Search gefunden? Aktuelle Meldungen, Berichte, Daten – mit Quellennennung. Falls nichts Relevantes gefunden: transparent benennen.",
  "bedeutungUnternehmen": "Wie verändern die konkreten Nutzereingaben (z.B. Alternativlieferanten, Lagerreichweite, betroffene Systeme) die Einschätzung? Direkt auf die Angaben eingehen.",
  "fehlendeInformationen": "Welche internen Daten würden die Einschätzung wesentlich präzisieren?",
  "empfohleneNaechstePruefung": "2-3 konkrete intern zu prüfende Datenpunkte oder Maßnahmen."
}
`.trim();

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY ist nicht konfiguriert. Bitte .env.local prüfen.' },
      { status: 500 }
    );
  }

  let context: PreparedContext;
  try {
    context = await req.json() as PreparedContext;
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request Body.' }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildGeminiPrompt(context),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // responseMimeType und googleSearch sind inkompatibel – JSON wird aus dem Text extrahiert
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text ?? '';

    let sections: AiSection;
    try {
      sections = JSON.parse(extractJson(rawText)) as AiSection;
    } catch {
      // Fallback: Rohtext zurückgeben, Frontend zeigt ihn unstrukturiert an
      return NextResponse.json({ rawText });
    }

    return NextResponse.json({ sections });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { error: `Gemini-Fehler: ${message}` },
      { status: 502 }
    );
  }
}
