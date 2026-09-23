import { Injectable, computed, signal, inject } from '@angular/core';
import { PosApiService } from './pos-api.service';
import { AnalyticsSummary, FiveBelowRow, HobbyLobbyRow, IngestionBatchRecord } from '../models/pos.model';

export type PortalTab = 'dashboard' | 'upload' | 'batches' | 'hobby_lobby' | 'five_below';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private readonly api = inject(PosApiService);

  // State Signals
  readonly activeTab = signal<PortalTab>('dashboard');
  readonly loading = signal<boolean>(false);
  readonly backendOnline = signal<boolean>(true);
  readonly lastRefreshed = signal<Date>(new Date());

  readonly summary = signal<AnalyticsSummary>({
    totalBatches: 0,
    totalProcessedRows: 0,
    totalRetailers: 4,
    totalOnHandUnits: 0,
    totalSalesRevenue: 0,
  });

  readonly batches = signal<IngestionBatchRecord[]>([]);
  readonly hlData = signal<HobbyLobbyRow[]>([]);
  readonly hlSummary = signal<{ totalOnHand: number; totalOnOrder: number; totalSales12M: number }>({
    totalOnHand: 0,
    totalOnOrder: 0,
    totalSales12M: 0,
  });
  readonly hlDepartments = signal<string[]>([]);
  readonly fbData = signal<FiveBelowRow[]>([]);

  readonly toast = signal<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filter signals for Hobby Lobby
  readonly hlSearch = signal<string>('');
  readonly hlSelectedDept = signal<string>('ALL');
  readonly hlSelectedVendor = signal<string>('ALL');

  // Filter signals for Five Below
  readonly fbSearch = signal<string>('');
  readonly fbSelectedFamily = signal<string>('ALL');

  // Computed Values
  readonly totalCompletedBatches = computed(() =>
    this.batches().filter((b) => b.status === 'COMPLETED').length
  );

  readonly recentBatches = computed(() => this.batches().slice(0, 5));

  readonly uniqueVendors = computed(() =>
    Array.from(new Set(this.hlData().map((r) => r.vendorNumber).filter(Boolean)))
  );

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toast.set({ message, type });
    setTimeout(() => {
      this.toast.set(null);
    }, 4500);
  }

  refreshAll() {
    this.loading.set(true);
    this.api.loadDashboardData().subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.batches.set(data.batches.items);
        this.hlData.set(data.hobbyLobby.items);
        this.hlSummary.set(data.hobbyLobby.summary);
        this.hlDepartments.set(data.hobbyLobby.departments);
        this.fbData.set(data.fiveBelow.items);
        this.backendOnline.set(data.health.status !== 'offline');
        this.lastRefreshed.set(new Date());
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error refreshing data:', err);
        this.backendOnline.set(false);
        this.loading.set(false);
      },
    });
  }

  fetchHobbyLobby() {
    this.api
      .getHobbyLobbyData({
        search: this.hlSearch(),
        department: this.hlSelectedDept(),
        vendorNumber: this.hlSelectedVendor(),
        limit: 100,
      })
      .subscribe((res) => {
        this.hlData.set(res.items);
        this.hlSummary.set(res.summary);
        if (res.departments.length) {
          this.hlDepartments.set(res.departments);
        }
      });
  }

  fetchFiveBelow() {
    this.api
      .getFiveBelowData({
        search: this.fbSearch(),
        family: this.fbSelectedFamily(),
        limit: 100,
      })
      .subscribe((res) => {
        this.fbData.set(res.items);
      });
  }
}
