import { NextRequest, NextResponse } from 'next/server';
import { msiService } from '@/lib/services/microservices';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('store') || undefined;
    const registerId = searchParams.get('register') || undefined;
    const sku = searchParams.get('sku') || undefined;
    const tenderType = searchParams.get('tender') || undefined;

    const data = await msiService.getData({ storeId, registerId, sku, tenderType });
    return NextResponse.json({
      service: 'msi-microservice',
      total: data.length,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'MSI Service Error' }, { status: 500 });
  }
}
