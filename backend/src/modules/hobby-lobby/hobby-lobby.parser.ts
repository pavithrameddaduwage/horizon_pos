import * as Papa from 'papaparse';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

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
  str = str.replace(/[$,\s]/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

export function extractHobbyLobbyMetadataFromFileName(fileName?: string): {
  month?: number;
  monthName?: string;
  year?: number;
  vendorNumber?: string;
} {
  if (!fileName) return {};
  const fn = fileName.toLowerCase();

  let detectedMonth: number | undefined;
  let detectedMonthName: string | undefined;
  MONTH_NAMES.forEach((m, idx) => {
    if (fn.includes(m)) {
      detectedMonth = idx + 1;
      detectedMonthName = m.charAt(0).toUpperCase() + m.slice(1);
    }
  });

  const yearMatch = fn.match(/\b(202[0-9])\b/);
  const detectedYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

  const vendorMatch = fn.match(/vendor[\s_-]*([0-9]{4,7})/i);
  const detectedVendor = vendorMatch ? vendorMatch[1] : undefined;

  return {
    month: detectedMonth,
    monthName: detectedMonthName,
    year: detectedYear,
    vendorNumber: detectedVendor,
  };
}

export interface HobbyLobbyParsedRow {
  company?: string;
  vendorNumber: string;
  vendorName: string;
  buyerNumber: string;
  buyerName: string;
  department: string;
  itemNumber: string;
  itemDescription: string;
  vendorStockNumber?: string;
  size?: string;
  color?: string;
  sellDown?: number;
  onHand: number;
  onOrder: number;
  firstCost?: number;
  preprice?: number;
  retailPrice?: number;
  sales2Yr?: number;
  salesLY?: number;
  sales12M?: number;
  monthlySalesLY?: Record<string, number>;
  monthlySalesCY?: Record<string, number>;
  reportingYear?: number;
  reportingMonth?: number;
}

export interface HobbyLobbyParseResult {
  success: boolean;
  retailer: 'HOBBY_LOBBY';
  detectedDepartments: string[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  data: HobbyLobbyParsedRow[];
  errors: Array<{ row: number; error: string; sampleData?: string }>;
}

export function parseHobbyLobbyCSV(
  csvContent: string,
  options?: { defaultYear?: number; defaultMonth?: number; fileName?: string }
): HobbyLobbyParseResult {
  const meta = extractHobbyLobbyMetadataFromFileName(options?.fileName);
  const effectiveYear = meta.year || options?.defaultYear || new Date().getFullYear();
  const effectiveMonth = meta.month || options?.defaultMonth || new Date().getMonth() + 1;

  const result: HobbyLobbyParseResult = {
    success: true,
    retailer: 'HOBBY_LOBBY',
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
    result.errors.push({
      row: 0,
      error: 'File contains no data rows.',
    });
    return result;
  }

  result.totalRows = parsed.data.length;
  const departmentsSet = new Set<string>();

  const findValue = (row: Record<string, string>, rawKeys: string[], aliases: string[]): string => {
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      const foundKey = rawKeys.find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanAlias ||
               k.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(cleanAlias)
      );
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return String(row[foundKey]).trim();
      }
    }
    return '';
  };

  const firstRow = parsed.data[0];
  const headerKeys = Object.keys(firstRow);

  parsed.data.forEach((row, idx) => {
    const rowNum = idx + 2;

    const company = findValue(row, headerKeys, ['Company', 'Comp']) || 'Hobby Lobby';
    const vendorNumber = findValue(row, headerKeys, ['Vendor Number', 'Vendor Numb', 'Vendor #', 'Vendor']) || meta.vendorNumber || 'UNKNOWN_VENDOR';
    const vendorName = findValue(row, headerKeys, ['Vendor Name', 'Vendor Desc', 'Vendor Name/Desc']) || 'HORIZON';
    const buyerNumber = findValue(row, headerKeys, ['Buyer Number', 'Buyer Numb', 'Buyer #', 'Dept Number', 'Dept #']) || '';
    const buyerName = findValue(row, headerKeys, ['Buyer Name', 'Buyer', 'Dept Name', 'Department']) || 'General / Craft';
    const itemNumber = findValue(row, headerKeys, ['Item Number', 'Item Numb', 'Item #', 'SKU']) || '';
    const itemDescription = findValue(row, headerKeys, ['Item Description', 'Item Descrip', 'Description', 'Item Desc']) || '';
    const vendorStockNumber = findValue(row, headerKeys, ['Vendor Stock Number', 'Vendor Stock', 'Stock #', 'Style']) || '';
    const size = findValue(row, headerKeys, ['Size']) || '';
    const color = findValue(row, headerKeys, ['Color', 'Colour']) || '';

    if (!itemNumber && !vendorStockNumber && !itemDescription) {
      result.errorRows++;
      result.errors.push({
        row: rowNum,
        error: 'Row is missing mandatory product identifiers (Item Number / SKU / Description)',
        sampleData: Object.values(row).slice(0, 6).join(' | '),
      });
      return;
    }

    const deptTag = buyerNumber
      ? (buyerName ? `Dept ${buyerNumber} - ${buyerName}` : `Dept ${buyerNumber}`)
      : (buyerName || 'General');

    departmentsSet.add(deptTag);

    const monthlySalesLY: Record<string, number> = {};
    const monthlySalesCY: Record<string, number> = {};

    MONTH_KEYS.forEach((m) => {
      const lyVal = findValue(row, headerKeys, [`LY ${m} Sales`, `LY ${m} Sal`, `LY_${m}_Sales`, `LY${m}`]);
      const cyVal = findValue(row, headerKeys, [`CY ${m} Sales`, `CY ${m} Sal`, `CY_${m}_Sales`, `CY${m}`]);
      monthlySalesLY[m] = cleanNumber(lyVal);
      monthlySalesCY[m] = cleanNumber(cyVal);
    });

    const sellDownRaw = findValue(row, headerKeys, ['Sell Down', 'SellDown', 'SD']);
    const sellDown = cleanNumber(sellDownRaw);
    const onHand = Math.round(cleanNumber(findValue(row, headerKeys, ['On Hand', 'OnHand', 'OH'])));
    const onOrder = Math.round(cleanNumber(findValue(row, headerKeys, ['On Order', 'OnOrder', 'OO'])));
    const firstCost = cleanNumber(findValue(row, headerKeys, ['First Cost', 'FirstCost', 'Cost']));
    const prepriceRaw = findValue(row, headerKeys, ['Preprice', 'Pre Price']);
    const preprice = prepriceRaw.toUpperCase() === 'Y' || prepriceRaw === '1' ? 1 : cleanNumber(prepriceRaw);
    const retailPrice = cleanNumber(findValue(row, headerKeys, ['Retail Price', 'RetailPrice', 'Retail', 'Price']));
    const sales2Yr = cleanNumber(findValue(row, headerKeys, ['2 YR Sales', '2YR Sales', '2 Year Sales']));
    const salesLY = cleanNumber(findValue(row, headerKeys, ['LY Sales', 'LYSales', 'Last Year Sales']));
    const sales12M = cleanNumber(findValue(row, headerKeys, ['12 Month Sales', '12 Month Sal', '12M Sales', '12MSales']));

    const parsedRow: HobbyLobbyParsedRow = {
      company,
      vendorNumber,
      vendorName,
      buyerNumber,
      buyerName,
      department: deptTag,
      itemNumber: itemNumber || vendorStockNumber || `ITEM_${rowNum}`,
      itemDescription: itemDescription || 'Product description not provided',
      vendorStockNumber,
      size,
      color,
      sellDown,
      onHand,
      onOrder,
      firstCost,
      preprice,
      retailPrice,
      sales2Yr,
      salesLY,
      sales12M,
      monthlySalesLY,
      monthlySalesCY,
      reportingYear: effectiveYear,
      reportingMonth: effectiveMonth,
    };

    result.data.push(parsedRow);
    result.validRows++;
  });

  result.detectedDepartments = Array.from(departmentsSet);
  result.success = result.validRows > 0;
  return result;
}
