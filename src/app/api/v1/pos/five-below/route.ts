import { NextRequest, NextResponse } from 'next/server';
import { posDataStore } from '@/lib/services/pos-ingestion-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reportFamily = searchParams.get('family') || undefined;
  const department = searchParams.get('dept') || undefined;
  const sku = searchParams.get('sku') || undefined;

  const data = posDataStore.getFiveBelowData({ reportFamily, department, sku });
  return NextResponse.json({
    total: data.length,
    data,
  });
}
