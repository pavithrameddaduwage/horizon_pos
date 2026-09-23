import { NextRequest, NextResponse } from 'next/server';
import { fiveBelowService } from '@/lib/services/microservices';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportFamily = searchParams.get('family') || undefined;
    const department = searchParams.get('dept') || undefined;
    const sku = searchParams.get('sku') || undefined;

    const data = await fiveBelowService.getData({ reportFamily, department, sku });
    return NextResponse.json({
      service: 'five-below-microservice',
      total: data.length,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Five Below Service Error' }, { status: 500 });
  }
}
