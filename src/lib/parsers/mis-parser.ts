// Parser for MIS Enterprise POS Data Feeds

import { MisRow, ParseResult } from '../types/pos';
import Papa from 'papaparse';

function cleanNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).trim().replace(/[$,\s]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function parseMisCSV(csvContent: string): ParseResult<MisRow> {
  const result: ParseResult<MisRow> = {
    success: true,
    retailer: 'MIS',
    detectedDepartments: [],
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    data: [],
    errors: [],
    schemaMatchPercentage: 100,
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
    const storeId = row['Store ID'] || row['Store'] || 'STR-01';
    const registerId = row['Register ID'] || row['Terminal ID'] || row['POS'] || 'REG-01';
    const receiptNumber = row['Receipt Number'] || row['Transaction ID'] || row['Ticket #'] || `REC-${rowNum}`;
    const sku = row['SKU'] || row['Barcode'] || row['Item ID'] || `SKU_${rowNum}`;
    const department = row['Department'] || row['Category'] || 'General Merchandise';

    if (department) deptSet.add(department);

    const quantity = Math.round(cleanNumber(row['Quantity'] || row['Qty'] || 1));
    const unitPrice = cleanNumber(row['Unit Price'] || row['Price']);
    const discountAmount = cleanNumber(row['Discount'] || row['Discount Amount']);
    const taxAmount = cleanNumber(row['Tax'] || row['Tax Amount']);
    const totalAmount = cleanNumber(row['Total'] || row['Net Total']) || (quantity * unitPrice - discountAmount + taxAmount);

    const parsedRow: MisRow = {
      storeId,
      registerId,
      cashierId: row['Cashier ID'] || row['Operator'],
      shiftId: row['Shift ID'] || row['Shift'],
      receiptNumber,
      lineNumber: Math.round(cleanNumber(row['Line #'] || row['Line Item'] || 1)),
      sku,
      description: row['Description'] || row['Item Name'],
      department,
      quantity,
      unitPrice,
      discountAmount,
      taxAmount,
      totalAmount,
      tenderType: row['Tender Type'] || row['Payment Method'] || 'CARD',
      transactionTime: row['Timestamp'] || row['Transaction Date'] || new Date().toISOString(),
    };

    result.data.push(parsedRow);
    result.validRows++;
  });

  result.detectedDepartments = Array.from(deptSet);
  result.success = result.validRows > 0;
  return result;
}
