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
  monthlySalesLY?: Record<string, number>;
  monthlySalesCY?: Record<string, number>;
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
  totalRows?: number;
  validRows?: number;
  errorRows?: number;
  message?: string;
  errors?: any[];
}
