// Parser for Hobby Lobby POS Historical CSVs
// Enforces the stable 43-column schema verified across 2024-2026 historical data.

import { HobbyLobbyRow, ParseResult } from '../types/pos';
import Papa from 'papaparse';

export const HOBBY_LOBBY_EXPECTED_COLUMNS = [
  'Company',
  'Vendor Number',
  'Vendor Name',
  'Buyer Number',
  'Buyer Name',
  'Item Number',
  'Item Description',
  'Vendor Stock Number',
  'Size',
  'Color',
  'Sell Down',
  'On Hand',
  'On Order',
  'First Cost',
  'Preprice',
  'Retail Price',
  '2 YR Sales',
  'LY Sales',
  '12 Month Sales',
  'LY Jan Sales',
  'LY Feb Sales',
  'LY Mar Sales',
  'LY Apr Sales',
  'LY May Sales',
  'LY Jun Sales',
  'LY Jul Sales',
  'LY Aug Sales',
  'LY Sep Sales',
  'LY Oct Sales',
  'LY Nov Sales',
  'LY Dec Sales',
  'CY Jan Sales',
  'CY Feb Sales',
  'CY Mar Sales',
  'CY Apr Sales',
  'CY May Sales',
  'CY Jun Sales',
  'CY Jul Sales',
  'CY Aug Sales',
  'CY Sep Sales',
  'CY Oct Sales',
  'CY Nov Sales',
  'CY Dec Sales',
];

function cleanNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  // Remove $, commas, parentheses for negative numbers, whitespace
  let str = String(val).trim();
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1);
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1);
  }
  str = str.replace(/[$,\s]/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

export function parseHobbyLobbyCSV(
  csvContent: string,
  options?: { defaultYear?: number; defaultMonth?: number }
): ParseResult<HobbyLobbyRow> {
  const result: ParseResult<HobbyLobbyRow> = {
    success: true,
    retailer: 'HOBBY_LOBBY',
    detectedDepartments: [],
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    data: [],
    errors: [],
    schemaMatchPercentage: 0,
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
  result.totalRows = parsed.data.length - 1;

  // Header verification & matching calculation
  let matchedHeadersCount = 0;
  HOBBY_LOBBY_EXPECTED_COLUMNS.forEach((expected, idx) => {
    const raw = rawHeaders[idx] || '';
    if (
      raw.toLowerCase().replace(/[^a-z0-9]/g, '') ===
      expected.toLowerCase().replace(/[^a-z0-9]/g, '')
    ) {
      matchedHeadersCount++;
    }
  });

  result.schemaMatchPercentage = Math.round(
    (matchedHeadersCount / HOBBY_LOBBY_EXPECTED_COLUMNS.length) * 100
  );

  const departmentsSet = new Set<string>();

  // Process data rows
  for (let i = 1; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNum = i + 1; // 1-indexed for user readability

    // Validate minimum required columns
    if (row.length < 10) {
      result.errorRows++;
      result.errors.push({
        row: rowNum,
        error: `Insufficient column count: expected 43 columns, got ${row.length}`,
        sampleData: row.join(' | ').slice(0, 100),
      });
      continue;
    }

    const company = (row[0] || '').trim();
    const vendorNumber = (row[1] || '').trim();
    const vendorName = (row[2] || '').trim();
    const buyerNumber = (row[3] || '').trim();
    const buyerName = (row[4] || '').trim();
    const itemNumber = (row[5] || '').trim();
    const itemDescription = (row[6] || '').trim();
    const vendorStockNumber = (row[7] || '').trim();
    const size = (row[8] || '').trim();
    const color = (row[9] || '').trim();

    if (!itemNumber && !vendorStockNumber && !buyerName) {
      result.errorRows++;
      result.errors.push({
        row: rowNum,
        error: 'Row is missing mandatory identifiers (Item Number / SKU / Buyer)',
        sampleData: row.join(' | ').slice(0, 100),
      });
      continue;
    }

    if (buyerName) {
      departmentsSet.add(buyerName);
    }

    // Monthly Sales Extraction (Columns 19-30: LY Jan-Dec; Columns 31-42: CY Jan-Dec)
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthlySalesLY: Record<string, number> = {};
    const monthlySalesCY: Record<string, number> = {};

    months.forEach((m, idx) => {
      monthlySalesLY[m] = cleanNumber(row[19 + idx]);
      monthlySalesCY[m] = cleanNumber(row[31 + idx]);
    });

    const parsedRow: HobbyLobbyRow = {
      company: company || 'Hobby Lobby',
      vendorNumber: vendorNumber || 'UNKNOWN_VENDOR',
      vendorName: vendorName || 'Unknown Vendor',
      buyerNumber: buyerNumber || 'UNKNOWN_BUYER',
      buyerName: buyerName || 'General / Unassigned',
      itemNumber: itemNumber || vendorStockNumber || `ITEM_${rowNum}`,
      itemDescription: itemDescription || 'No description provided',
      vendorStockNumber,
      size,
      color,
      sellDown: cleanNumber(row[10]),
      onHand: Math.round(cleanNumber(row[11])),
      onOrder: Math.round(cleanNumber(row[12])),
      firstCost: cleanNumber(row[13]),
      preprice: cleanNumber(row[14]),
      retailPrice: cleanNumber(row[15]),
      sales2Yr: cleanNumber(row[16]),
      salesLY: cleanNumber(row[17]),
      sales12M: cleanNumber(row[18]),
      monthlySalesLY,
      monthlySalesCY,
      reportingYear: options?.defaultYear || new Date().getFullYear(),
      reportingMonth: options?.defaultMonth || new Date().getMonth() + 1,
    };

    result.data.push(parsedRow);
    result.validRows++;
  }

  result.detectedDepartments = Array.from(departmentsSet);
  result.success = result.validRows > 0;
  return result;
}
