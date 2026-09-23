import { NextRequest, NextResponse } from 'next/server';
import { posMicroserviceGateway } from '@/lib/services/microservices';
import { RetailerCode } from '@/lib/types/pos';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const retailer = searchParams.get('retailer') as RetailerCode | null;

  const batches = posMicroserviceGateway.getAllBatches(retailer || undefined);
  return NextResponse.json({ batches });
}
