// Parser for Five Below POS Weekly Reports
// Detects report families (Books, Party/Gag, Create, Stationary, Toy) and handles flexible column layouts.

import { FiveBelowFamily, FiveBelowRow, ParseResult } from '../types/pos';
import Papa from 'papaparse';

function cleanNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).trim();
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1);
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1);
  }
  str = str.replace(/[$,%\s]/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

function normalizeHeader(h: string): string {
  return (h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectFiveBelowFamily(headers: string[], fileName?: string): FiveBelowFamily {
  const normHeaders = headers.map(normalizeHeader);
  const fn = (fileName || '').toLowerCase();

  // Filename hints
  if (fn.includes('party') || fn.includes('gag')) return 'PARTY_GAG';
  if (fn.includes('book')) return 'BOOKS';
  if (fn.includes('create')) return 'CREATE';
  if (fn.includes('station') || fn.includes('stat')) return 'STATIONARY';
  if (fn.includes('toy')) return 'TOY';

  // Header signatures
  const headerJoined = normHeaders.join(' ');
  if (headerJoined.includes('dcno3ohu') || headerJoined.includes('dcno4ohu') || headerJoined.includes('totalpackawayohu')) {
    return 'PARTY_GAG';
  }
  if (headerJoined.includes('concat') || (normHeaders.includes('landeditemcost') && normHeaders.includes('vendorcasepacksku'))) {
    return 'STATIONARY';
  }
  if (normHeaders.includes('subclass') && normHeaders.includes('salesul6w')) {
    return headerJoined.includes('salesuwtd') ? 'TOY' : 'CREATE';
  }
  if (normHeaders.includes('subdepartment') && normHeaders.includes('styledesc')) {
    return 'BOOKS';
  }

  return 'OTHER';
}

export function parseFiveBelowCSV(
  csvContent: string,
  options?: { familyOverride?: FiveBelowFamily; fileName?: string }
): ParseResult<FiveBelowRow> {
  const result: ParseResult<FiveBelowRow> = {
    success: true,
    retailer: 'FIVE_BELOW',
    detectedDepartments: [],
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    data: [],
    errors: [],
    schemaMatchPercentage: 100,
  };

  const parsed = Papa.parse<string[]>(csvContent, {
    skipEmptyLines: 'greedy',
    header: false,
  });

  if (!parsed.data || parsed.data.length < 2) {
    result.success = false;
    result.errors.push({
      row: 0,
      error: 'File contains no header or data rows.',
    });
    return result;
  }

  const rawHeaders = parsed.data[0].map((h) => (h || '').trim());
  const detectedFamily = options?.familyOverride || detectFiveBelowFamily(rawHeaders, options?.fileName);
  result.detectedFamily = detectedFamily;
  result.totalRows = parsed.data.length - 1;

  // Build header lookup map (normalized header -> column index)
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, idx) => {
    const norm = normalizeHeader(h);
    if (!(norm in headerMap)) {
      headerMap[norm] = idx;
    }
  });

  const getCol = (row: string[], ...aliases: string[]): string => {
    for (const alias of aliases) {
      const norm = normalizeHeader(alias);
      if (norm in headerMap && row[headerMap[norm]] !== undefined) {
        return row[headerMap[norm]].trim();
      }
    }
    return '';
  };

  const getNum = (row: string[], ...aliases: string[]): number => {
    return cleanNumber(getCol(row, ...aliases));
  };

  const departmentsSet = new Set<string>();

  for (let i = 1; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNum = i + 1;

    if (row.length < 5) {
      result.errorRows++;
      result.errors.push({
        row: rowNum,
        error: 'Row has too few columns.',
        sampleData: row.join(' | ').slice(0, 100),
      });
      continue;
    }

    // Dynamic extraction with aliases across families
    const department =
      getCol(row, 'Department', 'Dept') ||
      (detectedFamily !== 'OTHER' ? detectedFamily.replace('_', ' ') : 'General');
    const subDepartment = getCol(row, 'Sub Department', 'SubDept', 'Sub Dept');
    const className = getCol(row, 'Class');
    const subClassName = getCol(row, 'Sub Class', 'SubClass');
    const vendorNumber = getCol(row, 'Vendor Number', 'Vendor');
    const vendorName = getCol(row, 'Vendor Name', 'Vendor');
    const styleId = getCol(row, 'Style ID', 'Vendor Style', 'Vendor style');
    const styleDesc = getCol(row, 'Style Desc', 'SKU Description');
    const sku = getCol(row, 'SKU', 'SKU number');
    const skuDesc = getCol(row, 'SKU Description', 'Style Desc');
    const gtin = getCol(row, 'GTIN');

    if (department) departmentsSet.add(department);

    const parsedRow: FiveBelowRow = {
      reportFamily: detectedFamily,
      reportDate: getCol(row, 'Report / Date', 'DATE', 'Date'),
      department,
      subDepartment,
      className,
      subClassName,
      vendorNumber: vendorNumber || 'VENDOR_FB',
      vendorName: vendorName || 'Five Below Vendor',
      styleId,
      styleDesc,
      sku: sku || styleId || `SKU_${rowNum}`,
      skuDesc,
      gtin,
      vendorCasePack: Math.round(getNum(row, 'Vendor Case Pack', 'Vendor case pack', 'Vendor case pack_sku', 'Vendor case pack_sty')),
      innerCasePack: Math.round(getNum(row, 'Inner Case Pack', 'Inner Case Pack_sku', 'Inner Case Pack_sty')),
      firstReceiptDate: getCol(row, 'First Receipt Date', 'First Receipt date_sku', 'First Receipt Date_sty'),
      lastReceiptDate: getCol(row, 'Last Receipt Date', 'Last Receipt Date_sku', 'Last Receipt Date_sty'),
      currUnitRetailPrice: getNum(row, 'Curr Unit Retail Price', 'Curr Unit Ret Price_sty', 'Curr Unit Retail Price_sku'),
      itemCost: getNum(row, 'Item Cost'),
      landedCost: getNum(row, 'Landed Item Cost'),
      salesUWTD: Math.round(getNum(row, 'Sales U WTD')),
      salesDWTD: getNum(row, 'Sales $ WTD'),
      salesULCW: Math.round(getNum(row, 'Sales U LCW')),
      salesDLCW: getNum(row, 'Sales $ LCW'),
      storeSellThruLCW: getNum(row, 'Store Sell Thru LCW', 'Store Sell-Thru LCW'),
      storesWithSalesLCW: Math.round(getNum(row, '# Stores w/Sales LCW', '# Stores w Sales LCW')),
      storesWithOH: Math.round(getNum(row, '# Stores w/ OH', '# Stores w  OH')),
      salesUL6W: Math.round(getNum(row, 'Sales U L6W')),
      salesUYTD: Math.round(getNum(row, 'Sales U YTD')),
      salesDYTD: getNum(row, 'Sales $ YTD'),
      invOHU: Math.round(getNum(row, 'Inv OH U')),
      storeOHU: Math.round(getNum(row, 'Store OH U')),
      dcOHU: Math.round(getNum(row, 'DC OH U')),
      dc3OHU: Math.round(getNum(row, 'DC No#3 OH U')),
      dc4OHU: Math.round(getNum(row, 'DC No#4 OH U')),
      dc5OHU: Math.round(getNum(row, 'DC No#5 OH U')),
      dc6OHU: Math.round(getNum(row, 'DC No#6 OH U')),
      dc7OHU: Math.round(getNum(row, 'DC No#7 OH U')),
      totalPackawayOHU: Math.round(getNum(row, 'Total Packaway OH U')),
      wohLCW: getNum(row, 'WOH LCW'),
      storeWohLCW: getNum(row, 'Store WOH LCW'),
      dcWohLCW: getNum(row, 'DC WOH LCW'),
      currOOU: Math.round(getNum(row, 'Curr. OO U', 'Curr. OO')),
    };

    result.data.push(parsedRow);
    result.validRows++;
  }

  result.detectedDepartments = Array.from(departmentsSet);
  result.success = result.validRows > 0;
  return result;
}
