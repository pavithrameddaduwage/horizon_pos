import { NextRequest, NextResponse } from 'next/server';
import { posDataStore } from '@/lib/services/pos-ingestion-service';
import { RetailerCode } from '@/lib/types/pos';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const retailer = searchParams.get('retailer') as RetailerCode | null;

  const batches = posDataStore.getBatches(retailer || undefined);
  return NextResponse.json({ batches });
}
