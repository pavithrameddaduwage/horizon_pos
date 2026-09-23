// Type Definitions for Multi-Retailer POS Ingestion Portal

export type RetailerCode = 'HOBBY_LOBBY' | 'FIVE_BELOW' | 'KOHLS' | 'MIS';

export type FiveBelowFamily = 'BOOKS' | 'PARTY_GAG' | 'CREATE' | 'STATIONARY' | 'TOY' | 'OTHER';

export type BatchStatus = 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';

export interface IngestionBatchRecord {
  id: string;
  retailerCode: RetailerCode;
  fileName: string;
  fileSizeBytes: number;
  reportFamily?: string | null;
  departmentTag?: string | null;
  totalRows: number;
  validRows: number;
  errorRows: number;
  status: BatchStatus;
  errorSummary?: Array<{ row: number; column?: string; error: string; sampleData?: string }> | null;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Hobby Lobby Row Structure (43 Columns)
export interface HobbyLobbyRow {
  company: string;
  vendorNumber: string;
  vendorName: string;
  buyerNumber: string;
  buyerName: string;
  itemNumber: string;
  itemDescription: string;
  vendorStockNumber: string;
  size: string;
  color: string;
  sellDown: number;
  onHand: number;
  onOrder: number;
  firstCost: number;
  preprice: number;
  retailPrice: number;
  sales2Yr: number;
  salesLY: number;
  sales12M: number;
  monthlySalesLY: Record<string, number>; // { jan, feb, ... dec }
  monthlySalesCY: Record<string, number>; // { jan, feb, ... dec }
  reportingYear?: number;
  reportingMonth?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

// Five Below Row Structure (Dynamic Family Columns)
export interface FiveBelowRow {
  reportFamily: FiveBelowFamily;
  reportDate?: string;
  department?: string;
  subDepartment?: string;
  className?: string;
  subClassName?: string;
  vendorNumber?: string;
  vendorName?: string;
  styleId?: string;
  styleDesc?: string;
  sku?: string;
  skuDesc?: string;
  gtin?: string;
  vendorCasePack?: number;
  innerCasePack?: number;
  firstReceiptDate?: string;
  lastReceiptDate?: string;
  currUnitRetailPrice?: number;
  itemCost?: number;
  landedCost?: number;
  salesUWTD?: number;
  salesDWTD?: number;
  salesULCW?: number;
  salesDLCW?: number;
  storeSellThruLCW?: number;
  storesWithSalesLCW?: number;
  storesWithOH?: number;
  salesUL6W?: number;
  salesUYTD?: number;
  salesDYTD?: number;
  invOHU?: number;
  storeOHU?: number;
  dcOHU?: number;
  dc3OHU?: number;
  dc4OHU?: number;
  dc5OHU?: number;
  dc6OHU?: number;
  dc7OHU?: number;
  totalPackawayOHU?: number;
  wohLCW?: number;
  storeWohLCW?: number;
  dcWohLCW?: number;
  currOOU?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

// Kohl's POS Row Structure
export interface KohlsRow {
  storeNumber: string;
  storeName?: string;
  vendorNumber: string;
  sku: string;
  upc?: string;
  styleNumber?: string;
  colorCode?: string;
  sizeCode?: string;
  department?: string;
  className?: string;
  subclass?: string;
  posUnits: number;
  posDollars: number;
  regularUnits: number;
  regularDollars: number;
  markdownUnits: number;
  markdownDollars: number;
  returnUnits: number;
  returnDollars: number;
  storeOHUnits: number;
  onOrderUnits: number;
  inTransitUnits: number;
  weekEndDate?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

// MIS Enterprise POS Row Structure
export interface MisRow {
  storeId: string;
  registerId: string;
  cashierId?: string;
  shiftId?: string;
  receiptNumber: string;
  lineNumber: number;
  sku: string;
  description?: string;
  department?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  tenderType?: string;
  transactionTime: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface ParseResult<T> {
  success: boolean;
  retailer: RetailerCode;
  detectedFamily?: string;
  detectedDepartments: string[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  data: T[];
  errors: Array<{ row: number; column?: string; error: string; sampleData?: string }>;
  schemaMatchPercentage: number;
}
