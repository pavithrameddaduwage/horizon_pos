import { NextRequest, NextResponse } from 'next/server';
import { posDataStore } from '@/lib/services/pos-ingestion-service';
import { RetailerCode, FiveBelowFamily } from '@/lib/types/pos';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let fileContent = '';
    let fileName = 'uploaded_file.csv';
    let retailerOverride: RetailerCode | undefined = undefined;
    let familyOverride: FiveBelowFamily | undefined = undefined;
    let departmentOverride: string | undefined = undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }
      fileName = file.name;
      fileContent = await file.text();

      const r = formData.get('retailer') as string | null;
      if (r && ['HOBBY_LOBBY', 'FIVE_BELOW', 'KOHLS', 'MIS'].includes(r)) {
        retailerOverride = r as RetailerCode;
      }
      const fam = formData.get('family') as string | null;
      if (fam && ['BOOKS', 'PARTY_GAG', 'CREATE', 'STATIONARY', 'TOY'].includes(fam)) {
        familyOverride = fam as FiveBelowFamily;
      }
      const dept = formData.get('department') as string | null;
      if (dept) {
        departmentOverride = dept;
      }
    } else {
      const body = await req.json();
      fileContent = body.fileContent;
      fileName = body.fileName || 'pos_data.csv';
      retailerOverride = body.retailer;
      familyOverride = body.family;
      departmentOverride = body.department;
    }

    if (!fileContent || fileContent.trim() === '') {
      return NextResponse.json({ error: 'File content is empty' }, { status: 400 });
    }

    const { batch, parseResult } = posDataStore.processUpload({
      fileContent,
      fileName,
      retailerOverride,
      familyOverride,
      departmentOverride,
      uploadedBy: 'web_portal_user',
    });

    return NextResponse.json({
      success: parseResult.success,
      batch,
      parseResult: {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
        detectedFamily: parseResult.detectedFamily,
        detectedDepartments: parseResult.detectedDepartments,
        errors: parseResult.errors.slice(0, 15), // Preview first 15 errors
      },
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing file' },
      { status: 500 }
    );
  }
}
