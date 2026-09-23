import * as Papa from 'papaparse';

function cleanNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).trim().replace(/[$,\s]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export interface KohlsParsedRow {
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
}

export interface KohlsParseResult {
  success: boolean;
  retailer: 'KOHLS';
  detectedDepartments: string[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  data: KohlsParsedRow[];
  errors: Array<{ row: number; error: string; sampleData?: string }>;
}

export function parseKohlsCSV(csvContent: string): KohlsParseResult {
  const result: KohlsParseResult = {
    success: true,
    retailer: 'KOHLS',
    detectedDepartments: [],
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    data: [],
    errors: [],
  };

  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (!parsed.data || parsed.data.length === 0) {
    result.success = false;
    result.errors.push({ row: 0, error: 'File contains no data rows.' });
    return result;
  }

  result.totalRows = parsed.data.length;
  const deptSet = new Set<string>();

  parsed.data.forEach((row, idx) => {
    const rowNum = idx + 2;
    const storeNumber = row['Store #'] || row['Store Number'] || row['Store'] || '001';
    const vendorNumber = row['Vendor #'] || row['Vendor Number'] || 'KOHLS_VEND';
    const sku = row['SKU'] || row['Item Number'] || row['UPC'] || `SKU_${rowNum}`;
    const department = row['Department'] || row['Dept'] || 'Apparel & Home';

    if (department) deptSet.add(department);

    const parsedRow: KohlsParsedRow = {
      storeNumber,
      storeName: row['Store Name'] || `Kohl's Store #${storeNumber}`,
      vendorNumber,
      sku,
      upc: row['UPC'] || row['GTIN'],
      styleNumber: row['Style #'] || row['Style Number'] || row['Vendor Style'],
      colorCode: row['Color'] || row['Color Code'],
      sizeCode: row['Size'] || row['Size Code'],
      department,
      className: row['Class'],
      subclass: row['Subclass'] || row['Sub Class'],
      posUnits: Math.round(cleanNumber(row['POS Units'] || row['Sales Units'] || row['Units'])),
      posDollars: cleanNumber(row['POS Dollars'] || row['Sales Dollars'] || row['Sales $']),
      regularUnits: Math.round(cleanNumber(row['Regular Units'] || row['Reg Units'])),
      regularDollars: cleanNumber(row['Regular Dollars'] || row['Reg $']),
      markdownUnits: Math.round(cleanNumber(row['Markdown Units'] || row['Promo Units'])),
      markdownDollars: cleanNumber(row['Markdown Dollars'] || row['Promo $']),
      returnUnits: Math.round(cleanNumber(row['Return Units'] || row['Returns'])),
      returnDollars: cleanNumber(row['Return Dollars']),
      storeOHUnits: Math.round(cleanNumber(row['Store OH'] || row['On Hand Units'])),
      onOrderUnits: Math.round(cleanNumber(row['On Order'] || row['On Order Units'])),
      inTransitUnits: Math.round(cleanNumber(row['In Transit'] || row['In Transit Units'])),
      weekEndDate: row['Week Ending Date'] || row['Week Date'] || new Date().toISOString().split('T')[0],
    };

    result.data.push(parsedRow);
    result.validRows++;
  });

  result.detectedDepartments = Array.from(deptSet);
  result.success = result.validRows > 0;
  return result;
}
