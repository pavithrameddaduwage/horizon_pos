import { PrismaClient } from '@prisma/client';

export function getDatabaseUrl(): string {
  if (process.env.DW_USER && process.env.DW_HOST && process.env.DW_NAME) {
    const user = encodeURIComponent(process.env.DW_USER);
    const password = process.env.DW_PASSWORD ? encodeURIComponent(process.env.DW_PASSWORD) : '';
    const host = process.env.DW_HOST || 'localhost';
    const port = process.env.DW_PORT || '5432';
    const dbName = process.env.DW_NAME;
    const auth = password ? `${user}:${password}` : user;
    return `postgresql://${auth}@${host}:${port}/${dbName}?schema=public`;
  }
  return process.env.DATABASE_URL || 'postgresql://postgres:0006@localhost:5432/report_portal_db?schema=public';
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

