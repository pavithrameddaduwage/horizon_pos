import { NextRequest, NextResponse } from 'next/server';
import { hobbyLobbyService } from '@/lib/services/microservices';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department') || undefined;
    const buyerName = searchParams.get('buyer') || undefined;
    const vendorNumber = searchParams.get('vendor') || undefined;
    const itemNumber = searchParams.get('sku') || undefined;
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');
    const year = yearStr ? parseInt(yearStr) : undefined;
    const month = monthStr ? parseInt(monthStr) : undefined;

    const data = await hobbyLobbyService.getData({ department, buyerName, vendorNumber, itemNumber, year, month });
    const metrics = hobbyLobbyService.getMetrics();

    return NextResponse.json({
      service: 'hobby-lobby-microservice',
      total: data.length,
      metrics,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Hobby Lobby Service Error' }, { status: 500 });
  }
}
