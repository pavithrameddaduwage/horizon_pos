import { NextRequest, NextResponse } from 'next/server';
import { kohlsService } from '@/lib/services/microservices';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeNumber = searchParams.get('store') || undefined;
    const sku = searchParams.get('sku') || undefined;
    const department = searchParams.get('dept') || undefined;

    const data = await kohlsService.getData({ storeNumber, sku, department });
    return NextResponse.json({
      service: 'kohls-microservice',
      total: data.length,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Kohls Service Error' }, { status: 500 });
  }
}
