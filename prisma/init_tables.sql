-- ==============================================================================
-- HORIZON POS PORTAL - POSTGRESQL INITIALIZATION & SCHEMA DDL
-- Multi-Retailer Ingestion: Hobby Lobby, Five Below, Kohl's, and MSI
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "RetailerCode" AS ENUM ('HOBBY_LOBBY', 'FIVE_BELOW', 'KOHLS', 'MSI', 'MIS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BatchStatus" AS ENUM ('PENDING', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ingestion Batches Table
CREATE TABLE IF NOT EXISTS "IngestionBatch" (
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
);

CREATE INDEX IF NOT EXISTS "idx_batch_retailer_uploaded" ON "IngestionBatch" ("retailerCode", "uploadedAt");
CREATE INDEX IF NOT EXISTS "idx_batch_status" ON "IngestionBatch" ("status");

-- 3. Hobby Lobby POS Snapshot (43-Columns & Dynamic Departments)
CREATE TABLE IF NOT EXISTS "HobbyLobbyPOS" (
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
);

CREATE INDEX IF NOT EXISTS "idx_hl_batch" ON "HobbyLobbyPOS" ("batchId");
CREATE INDEX IF NOT EXISTS "idx_hl_vendor" ON "HobbyLobbyPOS" ("vendorNumber");
CREATE INDEX IF NOT EXISTS "idx_hl_buyer" ON "HobbyLobbyPOS" ("buyerNumber");
CREATE INDEX IF NOT EXISTS "idx_hl_item" ON "HobbyLobbyPOS" ("itemNumber");
CREATE INDEX IF NOT EXISTS "idx_hl_period" ON "HobbyLobbyPOS" ("reportingYear", "reportingMonth");
CREATE INDEX IF NOT EXISTS "idx_hl_uploaded" ON "HobbyLobbyPOS" ("uploadedAt");

-- 4. Five Below POS (Multi-Family Weekly Feeds)
CREATE TABLE IF NOT EXISTS "FiveBelowPOS" (
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
);

CREATE INDEX IF NOT EXISTS "idx_fb_batch" ON "FiveBelowPOS" ("batchId");
CREATE INDEX IF NOT EXISTS "idx_fb_family" ON "FiveBelowPOS" ("reportFamily");
CREATE INDEX IF NOT EXISTS "idx_fb_department" ON "FiveBelowPOS" ("department");
CREATE INDEX IF NOT EXISTS "idx_fb_sku" ON "FiveBelowPOS" ("sku");
CREATE INDEX IF NOT EXISTS "idx_fb_gtin" ON "FiveBelowPOS" ("gtin");
CREATE INDEX IF NOT EXISTS "idx_fb_uploaded" ON "FiveBelowPOS" ("uploadedAt");

-- 5. Kohl's POS Records (EDI 852 Feeds)
CREATE TABLE IF NOT EXISTS "KohlsPOS" (
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
);

CREATE INDEX IF NOT EXISTS "idx_kh_batch" ON "KohlsPOS" ("batchId");
CREATE INDEX IF NOT EXISTS "idx_kh_store" ON "KohlsPOS" ("storeNumber");
CREATE INDEX IF NOT EXISTS "idx_kh_sku" ON "KohlsPOS" ("sku");
CREATE INDEX IF NOT EXISTS "idx_kh_department" ON "KohlsPOS" ("department");
CREATE INDEX IF NOT EXISTS "idx_kh_uploaded" ON "KohlsPOS" ("uploadedAt");

-- 6. MSI Enterprise POS Records
CREATE TABLE IF NOT EXISTS "MsiPOS" (
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
);

CREATE INDEX IF NOT EXISTS "idx_msi_batch" ON "MsiPOS" ("batchId");
CREATE INDEX IF NOT EXISTS "idx_msi_store" ON "MsiPOS" ("storeId");
CREATE INDEX IF NOT EXISTS "idx_msi_receipt" ON "MsiPOS" ("receiptNumber");
CREATE INDEX IF NOT EXISTS "idx_msi_department" ON "MsiPOS" ("department");
CREATE INDEX IF NOT EXISTS "idx_msi_uploaded" ON "MsiPOS" ("uploadedAt");
