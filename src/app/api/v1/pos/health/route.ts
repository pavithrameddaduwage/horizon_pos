import { NextResponse } from 'next/server';
import { verifyAndInitDatabase } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await verifyAndInitDatabase();
  const statusCode = result.connected ? 200 : 500;
  return NextResponse.json(result, { status: statusCode });
}
