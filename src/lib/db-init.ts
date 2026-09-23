import { PrismaClient } from '@prisma/client';
import { prisma, getDatabaseUrl } from './prisma';

export interface TableStatus {
  tableName: string;
  exists: boolean;
  rowCount: number;
}

export interface DbHealthResult {
  connected: boolean;
  host: string;
  port: string;
  database: string;
  user: string;
  tables: TableStatus[];
  error?: string;
  message: string;
  timestamp: string;
}

const REQUIRED_POS_TABLES = [
  'IngestionBatch',
  'HobbyLobbyPOS',
  'FiveBelowPOS',
  'KohlsPOS',
  'MsiPOS',
];

const INIT_SQL_STATEMENTS = [
  // 1. Enums
  `DO $$ BEGIN CREATE TYPE "RetailerCode" AS ENUM ('HOBBY_LOBBY', 'FIVE_BELOW', 'KOHLS', 'MSI', 'MIS'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "BatchStatus" AS ENUM ('PENDING', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  // 2. Ingestion Batches Table
  `CREATE TABLE IF NOT EXISTS "IngestionBatch" (
    "id" TEXT PRIMARY KEY,
    "retailerCode" "RetailerCode" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "reportFamily" TEXT,
    "departmentTag" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "status" "BatchStatus" NOT NULL DEFAULT 'PENDING',
    "errorSummary" JSONB,
    "uploadedBy" TEXT NOT NULL DEFAULT 'portal_user',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_batch_retailer_uploaded" ON "IngestionBatch" ("retailerCode", "uploadedAt")`,
  `CREATE INDEX IF NOT EXISTS "idx_batch_status" ON "IngestionBatch" ("status")`,

  // 3. Hobby Lobby POS Snapshot
  `CREATE TABLE IF NOT EXISTS "HobbyLobbyPOS" (
    "id" TEXT PRIMARY KEY,
    "batchId" TEXT NOT NULL REFERENCES "IngestionBatch"("id") ON DELETE CASCADE,
    "company" TEXT,
    "vendorNumber" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "buyerNumber" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "department" TEXT,
    "itemNumber" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "vendorStockNumber" TEXT,
    "size" TEXT,
    "color" TEXT,
    "sellDown" DECIMAL(12, 4),
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "onOrder" INTEGER NOT NULL DEFAULT 0,
    "firstCost" DECIMAL(12, 4),
    "preprice" DECIMAL(12, 4),
    "retailPrice" DECIMAL(12, 4),
    "sales2Yr" DECIMAL(14, 4),
    "salesLY" DECIMAL(14, 4),
    "sales12M" DECIMAL(14, 4),
    "monthlySalesLY" JSONB,
    "monthlySalesCY" JSONB,
    "reportingYear" INTEGER,
    "reportingMonth" INTEGER,
    "uploadedBy" TEXT NOT NULL DEFAULT 'portal_user',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_hl_batch" ON "HobbyLobbyPOS" ("batchId")`,
  `CREATE INDEX IF NOT EXISTS "idx_hl_vendor" ON "HobbyLobbyPOS" ("vendorNumber")`,
  `CREATE INDEX IF NOT EXISTS "idx_hl_buyer" ON "HobbyLobbyPOS" ("buyerNumber")`,
  `CREATE INDEX IF NOT EXISTS "idx_hl_item" ON "HobbyLobbyPOS" ("itemNumber")`,
  `CREATE INDEX IF NOT EXISTS "idx_hl_period" ON "HobbyLobbyPOS" ("reportingYear", "reportingMonth")`,
  `CREATE INDEX IF NOT EXISTS "idx_hl_uploaded" ON "HobbyLobbyPOS" ("uploadedAt")`,

  // 4. Five Below POS
  `CREATE TABLE IF NOT EXISTS "FiveBelowPOS" (
    "id" TEXT PRIMARY KEY,
    "batchId" TEXT NOT NULL REFERENCES "IngestionBatch"("id") ON DELETE CASCADE,
    "reportFamily" TEXT NOT NULL,
    "reportDate" TEXT,
    "department" TEXT,
    "subDepartment" TEXT,
    "className" TEXT,
    "subClassName" TEXT,
    "vendorNumber" TEXT,
    "vendorName" TEXT,
    "styleId" TEXT,
    "styleDesc" TEXT,
    "sku" TEXT,
    "skuDesc" TEXT,
    "gtin" TEXT,
    "vendorCasePack" INTEGER,
    "innerCasePack" INTEGER,
    "firstReceiptDate" TEXT,
    "lastReceiptDate" TEXT,
    "currUnitRetailPrice" DECIMAL(12, 4),
    "itemCost" DECIMAL(12, 4),
    "landedCost" DECIMAL(12, 4),
    "salesUWTD" INTEGER DEFAULT 0,
    "salesDWTD" DECIMAL(12, 4),
    "salesULCW" INTEGER DEFAULT 0,
    "salesDLCW" DECIMAL(12, 4),
    "storeSellThruLCW" DECIMAL(8, 4),
    "storesWithSalesLCW" INTEGER DEFAULT 0,
    "storesWithOH" INTEGER DEFAULT 0,
    "salesUL6W" INTEGER DEFAULT 0,
    "salesUYTD" INTEGER DEFAULT 0,
    "salesDYTD" DECIMAL(14, 4),
    "invOHU" INTEGER DEFAULT 0,
    "storeOHU" INTEGER DEFAULT 0,
    "dcOHU" INTEGER DEFAULT 0,
    "dc3OHU" INTEGER DEFAULT 0,
    "dc4OHU" INTEGER DEFAULT 0,
    "dc5OHU" INTEGER DEFAULT 0,
    "dc6OHU" INTEGER DEFAULT 0,
    "dc7OHU" INTEGER DEFAULT 0,
    "totalPackawayOHU" INTEGER DEFAULT 0,
    "wohLCW" DECIMAL(8, 2),
    "storeWohLCW" DECIMAL(8, 2),
    "dcWohLCW" DECIMAL(8, 2),
    "currOOU" INTEGER DEFAULT 0,
    "uploadedBy" TEXT NOT NULL DEFAULT 'portal_user',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_fb_batch" ON "FiveBelowPOS" ("batchId")`,
  `CREATE INDEX IF NOT EXISTS "idx_fb_family" ON "FiveBelowPOS" ("reportFamily")`,
  `CREATE INDEX IF NOT EXISTS "idx_fb_department" ON "FiveBelowPOS" ("department")`,
  `CREATE INDEX IF NOT EXISTS "idx_fb_sku" ON "FiveBelowPOS" ("sku")`,
  `CREATE INDEX IF NOT EXISTS "idx_fb_gtin" ON "FiveBelowPOS" ("gtin")`,
  `CREATE INDEX IF NOT EXISTS "idx_fb_uploaded" ON "FiveBelowPOS" ("uploadedAt")`,

  // 5. Kohl's POS
  `CREATE TABLE IF NOT EXISTS "KohlsPOS" (
    "id" TEXT PRIMARY KEY,
    "batchId" TEXT NOT NULL REFERENCES "IngestionBatch"("id") ON DELETE CASCADE,
    "storeNumber" TEXT NOT NULL,
    "storeName" TEXT,
    "vendorNumber" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "upc" TEXT,
    "styleNumber" TEXT,
    "colorCode" TEXT,
    "sizeCode" TEXT,
    "department" TEXT,
    "className" TEXT,
    "subclass" TEXT,
    "posUnits" INTEGER NOT NULL DEFAULT 0,
    "posDollars" DECIMAL(12, 4) NOT NULL DEFAULT 0,
    "regularUnits" INTEGER NOT NULL DEFAULT 0,
    "regularDollars" DECIMAL(12, 4) NOT NULL DEFAULT 0,
    "markdownUnits" INTEGER NOT NULL DEFAULT 0,
    "markdownDollars" DECIMAL(12, 4) NOT NULL DEFAULT 0,
    "returnUnits" INTEGER NOT NULL DEFAULT 0,
    "returnDollars" DECIMAL(12, 4) NOT NULL DEFAULT 0,
    "storeOHUnits" INTEGER NOT NULL DEFAULT 0,
    "onOrderUnits" INTEGER NOT NULL DEFAULT 0,
    "inTransitUnits" INTEGER NOT NULL DEFAULT 0,
    "weekEndDate" TIMESTAMP(3),
    "uploadedBy" TEXT NOT NULL DEFAULT 'portal_user',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_kh_batch" ON "KohlsPOS" ("batchId")`,
  `CREATE INDEX IF NOT EXISTS "idx_kh_store" ON "KohlsPOS" ("storeNumber")`,
  `CREATE INDEX IF NOT EXISTS "idx_kh_sku" ON "KohlsPOS" ("sku")`,
  `CREATE INDEX IF NOT EXISTS "idx_kh_department" ON "KohlsPOS" ("department")`,
  `CREATE INDEX IF NOT EXISTS "idx_kh_uploaded" ON "KohlsPOS" ("uploadedAt")`,

  // 6. MSI Enterprise POS
  `CREATE TABLE IF NOT EXISTS "MsiPOS" (
    "id" TEXT PRIMARY KEY,
    "batchId" TEXT NOT NULL REFERENCES "IngestionBatch"("id") ON DELETE CASCADE,
    "storeId" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "cashierId" TEXT,
    "shiftId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL DEFAULT 1,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12, 4) NOT NULL,
    "discountAmount" DECIMAL(12, 4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12, 4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12, 4) NOT NULL,
    "tenderType" TEXT,
    "transactionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL DEFAULT 'portal_user',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_msi_batch" ON "MsiPOS" ("batchId")`,
  `CREATE INDEX IF NOT EXISTS "idx_msi_store" ON "MsiPOS" ("storeId")`,
  `CREATE INDEX IF NOT EXISTS "idx_msi_receipt" ON "MsiPOS" ("receiptNumber")`,
  `CREATE INDEX IF NOT EXISTS "idx_msi_department" ON "MsiPOS" ("department")`,
  `CREATE INDEX IF NOT EXISTS "idx_msi_uploaded" ON "MsiPOS" ("uploadedAt")`
];

function getMaintenanceDatabaseUrl(): string {
  const user = encodeURIComponent(process.env.DW_USER || 'postgres');
  const password = process.env.DW_PASSWORD ? encodeURIComponent(process.env.DW_PASSWORD) : '';
  const host = process.env.DW_HOST || 'localhost';
  const port = process.env.DW_PORT || '5432';
  const auth = password ? `${user}:${password}` : user;
  return `postgresql://${auth}@${host}:${port}/postgres?schema=public`;
}

async function ensureDatabaseExists(databaseName: string) {
  const maintenanceUrl = getMaintenanceDatabaseUrl();
  const maintenance = new PrismaClient({
    datasourceUrl: maintenanceUrl,
  });

  try {
    const dbs: Array<{ datname: string }> = await maintenance.$queryRawUnsafe(
      `SELECT datname FROM pg_database WHERE datname = $1`,
      databaseName
    );

    if (dbs.length === 0) {
      console.log(`[DB] Database "${databaseName}" does not exist, creating...`);
      await maintenance.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
      console.log(`[DB] Database "${databaseName}" created successfully.`);
    }
  } catch (err: any) {
    // skip if maintenance db not accessible
  } finally {
    await maintenance.$disconnect().catch(() => {});
  }
}

export async function verifyAndInitDatabase(): Promise<DbHealthResult> {
  const host = process.env.DW_HOST || 'localhost';
  const port = process.env.DW_PORT || '5432';
  const database = process.env.DW_NAME || 'report_portal_db';
  const user = process.env.DW_USER || 'postgres';

  try {
    // 0. Ensure target database exists
    await ensureDatabaseExists(database);

    // 1. Check basic connection to target database
    await prisma.$queryRaw`SELECT 1 as connection_test`;

    // 2. Query existing tables in public schema
    const existingTablesResult: Array<{ table_name: string }> = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const existingTableNames = new Set(existingTablesResult.map((t) => t.table_name));

    const missingTables = REQUIRED_POS_TABLES.filter((t) => !existingTableNames.has(t));

    // 3. If any table is missing, execute each statement individually
    if (missingTables.length > 0) {
      console.log(`[DB] Creating missing POS tables: ${missingTables.join(', ')}`);
      for (const statement of INIT_SQL_STATEMENTS) {
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (stmtErr: any) {
          console.warn('[DB] SQL DDL Statement notice:', stmtErr?.message || stmtErr);
        }
      }
      console.log('[DB] POS tables created successfully.');
    }

    // 4. Check status
    const tableStatuses: TableStatus[] = [];
    for (const tableName of REQUIRED_POS_TABLES) {
      try {
        const countResult: Array<{ count: bigint | number }> = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        tableStatuses.push({
          tableName,
          exists: true,
          rowCount: Number(countResult[0]?.count || 0),
        });
      } catch {
        tableStatuses.push({
          tableName,
          exists: false,
          rowCount: 0,
        });
      }
    }

    const globalDb = global as unknown as { __posDbLogged?: boolean };
    if (!globalDb.__posDbLogged) {
      globalDb.__posDbLogged = true;
      console.log(`[DB] PostgreSQL connected: ${host}:${port}/${database} (tables: ${tableStatuses.filter(t => t.exists).map(t => t.tableName).join(', ')})`);
    }

    return {
      connected: true,
      host,
      port,
      database,
      user,
      tables: tableStatuses,
      message: 'PostgreSQL database connected and all POS tables verified.',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    const globalDb = global as unknown as { __posDbErrorLogged?: boolean };
    if (!globalDb.__posDbErrorLogged) {
      globalDb.__posDbErrorLogged = true;
      console.error(`[DB] Connection failed to ${host}:${port}/${database} - ${error?.message || error}`);
    }

    return {
      connected: false,
      host,
      port,
      database,
      user,
      tables: REQUIRED_POS_TABLES.map((t) => ({ tableName: t, exists: false, rowCount: 0 })),
      error: error?.message || 'Database connection error',
      message: 'Failed to connect to PostgreSQL. Please check your DW_* environment variables.',
      timestamp: new Date().toISOString(),
    };
  }
}
