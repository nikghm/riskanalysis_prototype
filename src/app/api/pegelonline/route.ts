import { NextResponse } from 'next/server';
import { fetchPegelData } from '@/lib/pegelonline';

export async function GET() {
  try {
    const data = await fetchPegelData();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler beim PEGELONLINE-Abruf';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
