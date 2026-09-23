import { NextResponse } from 'next/server';
import { posMicroserviceGateway } from '@/lib/services/microservices';

export async function GET() {
  const kpis = await posMicroserviceGateway.getAggregatedKPIs();
  return NextResponse.json({ kpis });
}
