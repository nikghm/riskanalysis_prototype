import { NextResponse } from 'next/server';
import { fetchSmardData } from '@/lib/smard';

export async function GET() {
  try {
    const data = await fetchSmardData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler beim SMARD-Abruf';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
