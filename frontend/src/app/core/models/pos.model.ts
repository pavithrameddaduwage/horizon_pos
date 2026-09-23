export type RetailerCode = 'HOBBY_LOBBY' | 'FIVE_BELOW' | 'KOHLS' | 'MSI' | 'MIS';
export type BatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface IngestionBatchRecord {
  id: string;
  retailerCode: RetailerCode;
  fileName: string;
  fileSizeBytes: number;
  totalRows: number;
  validRows: number;
  errorRows: number;
  departmentTag?: string;
  vendorNumberTag?: string;
  reportingYear?: number;
  reportingMonth?: number;
  status: BatchStatus;
  errorSummary?: Array<{ row: number; column?: string; error: string; rawData?: any }>;
  uploadedBy: string;
  uploadedAt: string;
  completedAt?: string;
  createdAt?: string;
}

export interface HobbyLobbyRow {
  id: string;
  batchId?: string;
  company?: string;
  vendorNumber: string;
  vendorName: string;
  buyerNumber: string;
  buyerName: string;
  department?: string;
  itemNumber: string;
  itemDescription: string;
  vendorStockNumber?: string;
  size?: string;
  color?: string;
  sellDown?: number | string;
  onHand: number;
  onOrder: number;
  firstCost?: number | string;
  preprice?: number | string;
  retailPrice?: number | string;
  sales2Yr?: number | string;
  salesLY?: number | string;
  sales12M?: number | string;
  // 12 LY Month fields
  lyJanSales?: number | string;
  lyFebSales?: number | string;
  lyMarSales?: number | string;
  lyAprSales?: number | string;
  lyMaySales?: number | string;
  lyJunSales?: number | string;
  lyJulSales?: number | string;
  lyAugSales?: number | string;
  lySepSales?: number | string;
  lyOctSales?: number | string;
  lyNovSales?: number | string;
  lyDecSales?: number | string;
  // 12 CY Month fields
  cyJanSales?: number | string;
  cyFebSales?: number | string;
  cyMarSales?: number | string;
  cyAprSales?: number | string;
  cyMaySales?: number | string;
  cyJunSales?: number | string;
  cyJulSales?: number | string;
  cyAugSales?: number | string;
  cySepSales?: number | string;
  cyOctSales?: number | string;
  cyNovSales?: number | string;
  cyDecSales?: number | string;
  reportingYear?: number;
  reportingMonth?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface FiveBelowRow {
  id: string;
  batchId?: string;
  reportFamily?: string;
  family?: string;
  department?: string;
  sku?: string;
  skuDesc?: string;
  itemNumber?: string;
  itemDescription?: string;
  salesUWTD?: number;
  salesDYTD?: number | string;
  salesUWtd?: number;
  salesDYtd?: number | string;
  storeOHU?: number;
  storeOhUnits?: number;
  invOHU?: number;
  invOhU?: number;
  wohLCW?: number | string;
  wohLcw?: number | string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface AnalyticsSummary {
  totalBatches: number;
  totalProcessedRows: number;
  totalRetailers: number;
  totalOnHandUnits: number;
  totalSalesRevenue: number;
}

export interface UploadResponse {
  success: boolean;
  batchId?: string;
  retailerCode?: RetailerCode;
  vendorNumber?: string;
  departmentTag?: string;
  reportingYear?: number;
  reportingMonth?: number;
  totalRows?: number;
  validRows?: number;
  errorRows?: number;
  message?: string;
  errors?: any[];
}
