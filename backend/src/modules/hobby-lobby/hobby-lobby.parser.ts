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

export function extractHobbyLobbyMetadataFromFileName(fileName?: string, csvContentSnippet?: string): {
  month?: number;
  monthName?: string;
  year?: number;
  vendorNumber?: string;
} {
  const fn = (fileName || '').toLowerCase();
  const snippet = (csvContentSnippet || '').slice(0, 1500).toLowerCase();

  let detectedMonth: number | undefined;
  let detectedMonthName: string | undefined;
  let detectedYear: number | undefined;

  // 1. Check full month names in filename
  MONTH_NAMES.forEach((m, idx) => {
    if (fn.includes(m)) {
      detectedMonth = idx + 1;
      detectedMonthName = m.charAt(0).toUpperCase() + m.slice(1);
    }
  });

  // 2. Check 3-letter month abbreviations in filename (e.g., _jan_, -oct-, hl_nov_)
  if (!detectedMonth) {
    MONTH_KEYS.forEach((m, idx) => {
      const reg = new RegExp(`(^|[^a-z])${m}([^a-z]|$)`, 'i');
      if (reg.test(fn)) {
        detectedMonth = idx + 1;
        detectedMonthName = MONTH_NAMES[idx].charAt(0).toUpperCase() + MONTH_NAMES[idx].slice(1);
      }
    });
  }

  // 3. Check year pattern in filename (e.g. 2018-2035)
  const yearMatch = fn.match(/\b(20[1-3][0-9])\b/) || fn.match(/[_\-\.](20[1-3][0-9])[_\-\.]/);
  if (yearMatch) {
    detectedYear = parseInt(yearMatch[1], 10);
  }

  // 4. Check numeric format like 2023_08, 2023-08, 202308
  if (!detectedMonth && detectedYear) {
    const numMonthAfter = fn.match(new RegExp(`${detectedYear}[_\\-]?([0-1][0-9])`));
    if (numMonthAfter) {
      const mNum = parseInt(numMonthAfter[1], 10);
      if (mNum >= 1 && mNum <= 12) {
        detectedMonth = mNum;
        detectedMonthName = MONTH_NAMES[mNum - 1].charAt(0).toUpperCase() + MONTH_NAMES[mNum - 1].slice(1);
      }
    }
  }

  // 5. If not found in filename, inspect header / first lines snippet
  if (!detectedYear && snippet) {
    const snippetYear = snippet.match(/\b(20[1-3][0-9])\b/);
    if (snippetYear) {
      detectedYear = parseInt(snippetYear[1], 10);
    }
  }
  if (!detectedMonth && snippet) {
    MONTH_NAMES.forEach((m, idx) => {
      if (snippet.includes(m)) {
        detectedMonth = idx + 1;
        detectedMonthName = m.charAt(0).toUpperCase() + m.slice(1);
      }
    });
  }

  // Vendor Number extraction (e.g. vendor 15371, vendor_15529, 15371)
  const vendorMatch = fn.match(/vendor[\s_-]*([0-9]{4,7})/i) || fn.match(/\b(15[0-9]{3})\b/);
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
  // 12 LY Month columns
  lyJanSales?: number;
  lyFebSales?: number;
  lyMarSales?: number;
  lyAprSales?: number;
  lyMaySales?: number;
  lyJunSales?: number;
  lyJulSales?: number;
  lyAugSales?: number;
  lySepSales?: number;
  lyOctSales?: number;
  lyNovSales?: number;
  lyDecSales?: number;
  // 12 CY Month columns
  cyJanSales?: number;
  cyFebSales?: number;
  cyMarSales?: number;
  cyAprSales?: number;
  cyMaySales?: number;
  cyJunSales?: number;
  cyJulSales?: number;
  cyAugSales?: number;
  cySepSales?: number;
  cyOctSales?: number;
  cyNovSales?: number;
  cyDecSales?: number;
  reportingYear?: number;
  reportingMonth?: number;
}

export interface HobbyLobbyParseResult {
  success: boolean;
  retailer: 'HOBBY_LOBBY';
  detectedVendors: string[];
  detectedDepartments: string[];
  detectedYear?: number;
  detectedMonth?: number;
  totalRows: number;
  validRows: number;
  errorRows: number;
  data: HobbyLobbyParsedRow[];
  errors: Array<{ row: number; error: string; sampleData?: string }>;
}

export function parseHobbyLobbyCSV(
  csvContent: string,
  options?: {
    defaultYear?: number;
    defaultMonth?: number;
    fileName?: string;
    departmentOverride?: string;
    vendorOverride?: string;
    yearOverride?: number;
    monthOverride?: number;
  }
): HobbyLobbyParseResult {
  const meta = extractHobbyLobbyMetadataFromFileName(options?.fileName, csvContent);
  const effectiveYear = options?.yearOverride || meta.year || options?.defaultYear || new Date().getFullYear();
  const effectiveMonth = options?.monthOverride || meta.month || options?.defaultMonth || new Date().getMonth() + 1;

  const result: HobbyLobbyParseResult = {
    success: true,
    retailer: 'HOBBY_LOBBY',
    detectedVendors: [],
    detectedDepartments: [],
    detectedYear: effectiveYear,
    detectedMonth: effectiveMonth,
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
  const vendorsSet = new Set<string>();

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
    const rawVendor = findValue(row, headerKeys, ['Vendor Number', 'Vendor Numb', 'Vendor #', 'Vendor']) || meta.vendorNumber || '15371';
    const vendorNumber = options?.vendorOverride || rawVendor;
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

    vendorsSet.add(vendorNumber);

    const deptTag = options?.departmentOverride || (buyerNumber
      ? (buyerName ? `Dept ${buyerNumber} - ${buyerName}` : `Dept ${buyerNumber}`)
      : (buyerName || 'General'));

    departmentsSet.add(deptTag);

    // Extract all 12 LY month sales
    const lyJan = cleanNumber(findValue(row, headerKeys, ['LY Jan Sales', 'LY Jan Sal', 'LY_Jan_Sales', 'LYJan', 'LY Jan']));
    const lyFeb = cleanNumber(findValue(row, headerKeys, ['LY Feb Sales', 'LY Feb Sal', 'LY_Feb_Sales', 'LYFeb', 'LY Feb']));
    const lyMar = cleanNumber(findValue(row, headerKeys, ['LY Mar Sales', 'LY Mar Sal', 'LY_Mar_Sales', 'LYMar', 'LY Mar']));
    const lyApr = cleanNumber(findValue(row, headerKeys, ['LY Apr Sales', 'LY Apr Sal', 'LY_Apr_Sales', 'LYApr', 'LY Apr']));
    const lyMay = cleanNumber(findValue(row, headerKeys, ['LY May Sales', 'LY May Sal', 'LY_May_Sales', 'LYMay', 'LY May']));
    const lyJun = cleanNumber(findValue(row, headerKeys, ['LY Jun Sales', 'LY Jun Sal', 'LY_Jun_Sales', 'LYJun', 'LY Jun']));
    const lyJul = cleanNumber(findValue(row, headerKeys, ['LY Jul Sales', 'LY Jul Sal', 'LY_Jul_Sales', 'LYJul', 'LY Jul']));
    const lyAug = cleanNumber(findValue(row, headerKeys, ['LY Aug Sales', 'LY Aug Sal', 'LY_Aug_Sales', 'LYAug', 'LY Aug']));
    const lySep = cleanNumber(findValue(row, headerKeys, ['LY Sep Sales', 'LY Sep Sal', 'LY_Sep_Sales', 'LYSep', 'LY Sep']));
    const lyOct = cleanNumber(findValue(row, headerKeys, ['LY Oct Sales', 'LY Oct Sal', 'LY_Oct_Sales', 'LYOct', 'LY Oct']));
    const lyNov = cleanNumber(findValue(row, headerKeys, ['LY Nov Sales', 'LY Nov Sal', 'LY_Nov_Sales', 'LYNov', 'LY Nov']));
    const lyDec = cleanNumber(findValue(row, headerKeys, ['LY Dec Sales', 'LY Dec Sal', 'LY_Dec_Sales', 'LYDec', 'LY Dec']));

    // Extract all 12 CY month sales
    const cyJan = cleanNumber(findValue(row, headerKeys, ['CY Jan Sales', 'CY Jan Sal', 'CY_Jan_Sales', 'CYJan', 'CY Jan']));
    const cyFeb = cleanNumber(findValue(row, headerKeys, ['CY Feb Sales', 'CY Feb Sal', 'CY_Feb_Sales', 'CYFeb', 'CY Feb']));
    const cyMar = cleanNumber(findValue(row, headerKeys, ['CY Mar Sales', 'CY Mar Sal', 'CY_Mar_Sales', 'CYMar', 'CY Mar']));
    const cyApr = cleanNumber(findValue(row, headerKeys, ['CY Apr Sales', 'CY Apr Sal', 'CY_Apr_Sales', 'CYApr', 'CY Apr']));
    const cyMay = cleanNumber(findValue(row, headerKeys, ['CY May Sales', 'CY May Sal', 'CY_May_Sales', 'CYMay', 'CY May']));
    const cyJun = cleanNumber(findValue(row, headerKeys, ['CY Jun Sales', 'CY Jun Sal', 'CY_Jun_Sales', 'CYJun', 'CY Jun']));
    const cyJul = cleanNumber(findValue(row, headerKeys, ['CY Jul Sales', 'CY Jul Sal', 'CY_Jul_Sales', 'CYJul', 'CY Jul']));
    const cyAug = cleanNumber(findValue(row, headerKeys, ['CY Aug Sales', 'CY Aug Sal', 'CY_Aug_Sales', 'CYAug', 'CY Aug']));
    const cySep = cleanNumber(findValue(row, headerKeys, ['CY Sep Sales', 'CY Sep Sal', 'CY_Sep_Sales', 'CYSep', 'CY Sep']));
    const cyOct = cleanNumber(findValue(row, headerKeys, ['CY Oct Sales', 'CY Oct Sal', 'CY_Oct_Sales', 'CYOct', 'CY Oct']));
    const cyNov = cleanNumber(findValue(row, headerKeys, ['CY Nov Sales', 'CY Nov Sal', 'CY_Nov_Sales', 'CYNov', 'CY Nov']));
    const cyDec = cleanNumber(findValue(row, headerKeys, ['CY Dec Sales', 'CY Dec Sal', 'CY_Dec_Sales', 'CYDec', 'CY Dec']));

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
      lyJanSales: lyJan,
      lyFebSales: lyFeb,
      lyMarSales: lyMar,
      lyAprSales: lyApr,
      lyMaySales: lyMay,
      lyJunSales: lyJun,
      lyJulSales: lyJul,
      lyAugSales: lyAug,
      lySepSales: lySep,
      lyOctSales: lyOct,
      lyNovSales: lyNov,
      lyDecSales: lyDec,
      cyJanSales: cyJan,
      cyFebSales: cyFeb,
      cyMarSales: cyMar,
      cyAprSales: cyApr,
      cyMaySales: cyMay,
      cyJunSales: cyJun,
      cyJulSales: cyJul,
      cyAugSales: cyAug,
      cySepSales: cySep,
      cyOctSales: cyOct,
      cyNovSales: cyNov,
      cyDecSales: cyDec,
      reportingYear: effectiveYear,
      reportingMonth: effectiveMonth,
    };

    result.data.push(parsedRow);
    result.validRows++;
  });

  result.detectedVendors = Array.from(vendorsSet);
  result.detectedDepartments = Array.from(departmentsSet);
  result.success = result.validRows > 0;
  return result;
}
