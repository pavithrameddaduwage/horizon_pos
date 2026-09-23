import { NextRequest, NextResponse } from 'next/server';
import { posDataStore } from '@/lib/services/pos-ingestion-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerName = searchParams.get('buyer') || undefined;
  const vendorNumber = searchParams.get('vendor') || undefined;
  const itemNumber = searchParams.get('sku') || undefined;
  const yearStr = searchParams.get('year');
  const year = yearStr ? parseInt(yearStr) : undefined;

  const data = posDataStore.getHobbyLobbyData({ buyerName, vendorNumber, itemNumber, year });
  return NextResponse.json({
    total: data.length,
    data,
  });
}
