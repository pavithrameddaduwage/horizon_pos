import { NextResponse } from 'next/server';
import { posDataStore } from '@/lib/services/pos-ingestion-service';

export async function GET() {
  const kpis = posDataStore.getKPIs();
  return NextResponse.json({ kpis });
}
