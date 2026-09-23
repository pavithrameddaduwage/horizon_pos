import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, retry } from 'rxjs';
import {
  AnalyticsSummary,
  FiveBelowRow,
  HobbyLobbyRow,
  IngestionBatchRecord,
  UploadResponse,
} from '../models/pos.model';

@Injectable({
  providedIn: 'root',
})
export class PosApiService {
  private readonly http = inject(HttpClient);
  // Default to NestJS backend port 4000 or relative path
  private readonly baseUrl = 'http://localhost:4000/api/v1/pos';

  /**
   * Get KPI and Summary stats
   */
  getSummary(): Observable<AnalyticsSummary> {
    return this.http
      .get<{ success: boolean; summary: AnalyticsSummary }>(`${this.baseUrl}/analytics/summary`)
      .pipe(
        retry(1),
        map((res) => res.summary || {
          totalBatches: 0,
          totalProcessedRows: 0,
          totalRetailers: 4,
          totalOnHandUnits: 0,
          totalSalesRevenue: 0,
        }),
        catchError((err) => {
          console.error('Failed to fetch summary stats:', err);
          return of({
            totalBatches: 0,
            totalProcessedRows: 0,
            totalRetailers: 4,
            totalOnHandUnits: 0,
            totalSalesRevenue: 0,
          });
        }),
      );
  }

  /**
   * Get Ingestion Batches history
   */
  getBatches(page: number = 1, limit: number = 50): Observable<{ items: IngestionBatchRecord[]; total: number }> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http
      .get<{ success: boolean; items: IngestionBatchRecord[]; pagination: { total: number } }>(
        `${this.baseUrl}/batches`,
        { params },
      )
      .pipe(
        retry(1),
        map((res) => ({
          items: res.items || [],
          total: res.pagination?.total || 0,
        })),
        catchError((err) => {
          console.error('Failed to fetch batches:', err);
          return of({ items: [], total: 0 });
        }),
      );
  }

  /**
   * Get Hobby Lobby POS records with filtering & summary
   */
  getHobbyLobbyData(filters: {
    search?: string;
    department?: string;
    vendorNumber?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<{
    items: HobbyLobbyRow[];
    total: number;
    summary: { totalOnHand: number; totalOnOrder: number; totalSales12M: number };
    departments: string[];
  }> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.department && filters.department !== 'ALL') params = params.set('department', filters.department);
    if (filters.vendorNumber && filters.vendorNumber !== 'ALL') params = params.set('vendorNumber', filters.vendorNumber);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http
      .get<{
        success: boolean;
        items: HobbyLobbyRow[];
        pagination: { total: number };
        summary: { totalOnHand: number; totalOnOrder: number; totalSales12M: number };
        departments: string[];
      }>(`${this.baseUrl}/hobby-lobby`, { params })
      .pipe(
        retry(1),
        map((res) => ({
          items: res.items || [],
          total: res.pagination?.total || 0,
          summary: res.summary || { totalOnHand: 0, totalOnOrder: 0, totalSales12M: 0 },
          departments: res.departments || [],
        })),
        catchError((err) => {
          console.error('Failed to fetch Hobby Lobby data:', err);
          return of({
            items: [],
            total: 0,
            summary: { totalOnHand: 0, totalOnOrder: 0, totalSales12M: 0 },
            departments: [],
          });
        }),
      );
  }

  /**
   * Get Five Below POS records
   */
  getFiveBelowData(filters: { search?: string; family?: string; page?: number; limit?: number } = {}): Observable<{
    items: FiveBelowRow[];
    total: number;
  }> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.family && filters.family !== 'ALL') params = params.set('family', filters.family);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http
      .get<{ success: boolean; items: FiveBelowRow[]; pagination: { total: number } }>(
        `${this.baseUrl}/five-below`,
        { params },
      )
      .pipe(
        retry(1),
        map((res) => ({
          items: res.items || [],
          total: res.pagination?.total || 0,
        })),
        catchError((err) => {
          console.error('Failed to fetch Five Below data:', err);
          return of({ items: [], total: 0 });
        }),
      );
  }

  /**
   * Upload POS file / CSV content to backend
   */
  uploadPosData(payload: {
    fileContent: string;
    fileName: string;
    retailerCode?: string;
    departmentTag?: string;
    familyOverride?: string;
  }): Observable<UploadResponse> {
    return this.http.post<UploadResponse>(`${this.baseUrl}/upload`, payload).pipe(
      catchError((err) => {
        console.error('Upload failed:', err);
        return of({
          success: false,
          message: err.error?.message || err.message || 'Upload failed',
        });
      }),
    );
  }

  /**
   * Check backend health status
   */
  checkHealth(): Observable<{ status: string; uptime?: number }> {
    return this.http.get<{ status: string; uptime?: number }>('http://localhost:4000/health').pipe(
      catchError(() => of({ status: 'offline' })),
    );
  }

  /**
   * Atomic initial data load with forkJoin
   */
  loadDashboardData() {
    return forkJoin({
      summary: this.getSummary(),
      batches: this.getBatches(1, 10),
      hobbyLobby: this.getHobbyLobbyData({ limit: 10 }),
      fiveBelow: this.getFiveBelowData({ limit: 10 }),
      health: this.checkHealth(),
    });
  }
}
