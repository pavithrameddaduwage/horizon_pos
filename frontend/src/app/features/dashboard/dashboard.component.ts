import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../core/services/state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in flex flex-col gap-6" style="padding-top: 0.5rem;">

      <!-- Header with Title and Upload Button -->
      <div class="flex items-center justify-between">
        <h1 style="font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em; color: #0f172a;">POS Overview</h1>
        <button type="button" class="btn-primary" (click)="state.activeTab.set('upload')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" x2="12" y1="3" y2="15"></line>
          </svg>
          Upload POS Feed
        </button>
      </div>

      <!-- 4 Top Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Batches Ingested -->
        <div class="ui-card flex flex-col justify-between" style="padding: 1.35rem 1.5rem; min-height: 115px;">
          <div class="flex items-start justify-between">
            <span style="font-size: 0.8125rem; font-weight: 700; color: #334155;">Total Batches Ingested</span>
            <div class="icon-square" style="background: #eff6ff; color: #2563eb;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem;">
            {{ state.batches().length || 0 }}
          </div>
        </div>

        <!-- Total Records Validated -->
        <div class="ui-card flex flex-col justify-between" style="padding: 1.35rem 1.5rem; min-height: 115px;">
          <div class="flex items-start justify-between">
            <span style="font-size: 0.8125rem; font-weight: 700; color: #334155;">Total Records Validated</span>
            <div class="icon-square" style="background: #f5f3ff; color: #7c3aed;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem;">
            {{ totalValidRows() | number }}
          </div>
        </div>

        <!-- Hobby Lobby Records -->
        <div class="ui-card flex flex-col justify-between" style="padding: 1.35rem 1.5rem; min-height: 115px;">
          <div class="flex items-start justify-between">
            <span style="font-size: 0.8125rem; font-weight: 700; color: #334155;">Hobby Lobby Records</span>
            <div class="icon-square" style="background: #eff6ff; color: #0284c7;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem;">
            {{ state.hlData().length | number }}
          </div>
        </div>

        <!-- Five Below Records -->
        <div class="ui-card flex flex-col justify-between" style="padding: 1.35rem 1.5rem; min-height: 115px;">
          <div class="flex items-start justify-between">
            <span style="font-size: 0.8125rem; font-weight: 700; color: #334155;">Five Below Records</span>
            <div class="icon-square" style="background: #ecfdf5; color: #059669;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem;">
            {{ state.fbData().length | number }}
          </div>
        </div>

      </div>

      <!-- 4 Retailer Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Hobby Lobby -->
        <div class="ui-card ui-card-hover flex flex-col justify-between" style="padding: 1.5rem; cursor: pointer;" (click)="state.activeTab.set('hobby_lobby')">
          <div>
            <div class="flex items-start justify-between">
              <div class="retailer-icon-box" style="background: #2563eb; color: #ffffff;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </div>
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 1.25rem;">Hobby Lobby</h2>
          </div>
          <div class="flex items-center justify-between" style="margin-top: 1.5rem; font-size: 0.8125rem;">
            <span style="color: #64748b; font-weight: 600;">Batches</span>
            <span style="color: #0f172a; font-weight: 800;">{{ hlBatchCount() }}</span>
          </div>
        </div>

        <!-- Five Below -->
        <div class="ui-card ui-card-hover flex flex-col justify-between" style="padding: 1.5rem; cursor: pointer;" (click)="state.activeTab.set('five_below')">
          <div>
            <div class="flex items-start justify-between">
              <div class="retailer-icon-box" style="background: #059669; color: #ffffff;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </div>
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 1.25rem;">Five Below</h2>
          </div>
          <div class="flex items-center justify-between" style="margin-top: 1.5rem; font-size: 0.8125rem;">
            <span style="color: #64748b; font-weight: 600;">Batches</span>
            <span style="color: #0f172a; font-weight: 800;">{{ fbBatchCount() }}</span>
          </div>
        </div>

        <!-- Kohl's -->
        <div class="ui-card ui-card-hover flex flex-col justify-between" style="padding: 1.5rem; cursor: pointer;" (click)="state.activeTab.set('upload')">
          <div>
            <div class="flex items-start justify-between">
              <div class="retailer-icon-box" style="background: #d97706; color: #ffffff;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </div>
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 1.25rem;">Kohl's</h2>
          </div>
          <div class="flex items-center justify-between" style="margin-top: 1.5rem; font-size: 0.8125rem;">
            <span style="color: #64748b; font-weight: 600;">Batches</span>
            <span style="color: #0f172a; font-weight: 800;">0</span>
          </div>
        </div>

        <!-- MSI POS -->
        <div class="ui-card ui-card-hover flex flex-col justify-between" style="padding: 1.5rem; cursor: pointer;" (click)="state.activeTab.set('upload')">
          <div>
            <div class="flex items-start justify-between">
              <div class="retailer-icon-box" style="background: #7c3aed; color: #ffffff;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </div>
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 1.25rem;">MSI POS</h2>
          </div>
          <div class="flex items-center justify-between" style="margin-top: 1.5rem; font-size: 0.8125rem;">
            <span style="color: #64748b; font-weight: 600;">Batches</span>
            <span style="color: #0f172a; font-weight: 800;">0</span>
          </div>
        </div>

      </div>

      <!-- Bottom Recent Batches Card -->
      <div class="ui-card" style="padding: 1.5rem;">
        <div class="flex items-center justify-between" style="margin-bottom: 1.25rem;">
          <div class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h3 style="font-size: 1rem; font-weight: 800; color: #0f172a;">Recent Batches</h3>
          </div>
          <button type="button" style="background: none; border: none; font-size: 0.8125rem; font-weight: 700; color: #2563eb; cursor: pointer;" (click)="state.activeTab.set('batches')">
            View All &rarr;
          </button>
        </div>

        <div class="table-container">
          <table class="ui-table">
            <thead>
              <tr>
                <th>FILENAME</th>
                <th>VENDOR / FAMILY</th>
                <th>ROWS</th>
                <th>STATUS</th>
                <th>UPLOADED BY</th>
                <th>UPLOADED DATE/TIME</th>
              </tr>
            </thead>
            <tbody>
              @for (batch of state.recentBatches(); track batch.id) {
                <tr>
                  <td style="font-weight: 600; color: #0f172a;">
                    {{ batch.fileName }}
                  </td>
                  <td style="color: #334155; font-weight: 600;">
                    {{ batch.vendorNumberTag ? ('Vendor ' + batch.vendorNumberTag) : (batch.departmentTag || 'Vendor 15371') }}
                  </td>
                  <td style="font-weight: 800; color: #0f172a;">
                    {{ batch.validRows || batch.totalRows || 0 }}
                  </td>
                  <td>
                    @if (batch.status === 'COMPLETED') {
                      <span class="badge-completed">COMPLETED</span>
                    } @else if (batch.status === 'PROCESSING') {
                      <span class="badge-processing">PROCESSING</span>
                    } @else {
                      <span class="badge-failed">{{ batch.status }}</span>
                    }
                  </td>
                  <td style="color: #0f172a; font-weight: 600;">
                    {{ batch.uploadedBy || 'web_portal_user' }}
                  </td>
                  <td style="color: #334155; font-size: 0.8125rem;">
                    {{ batch.uploadedAt | date:'M/d/yyyy, h:mm:ss a' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: #94a3b8;">
                    No recent ingestion batches found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .icon-square {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .retailer-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class DashboardComponent {
  readonly state = inject(StateService);

  totalValidRows(): number {
    return this.state.batches().reduce((acc, b) => acc + (b.validRows || 0), 0) || this.state.hlData().length;
  }

  hlBatchCount(): number {
    return this.state.batches().filter(b => b.retailerCode === 'HOBBY_LOBBY').length || (this.state.hlData().length ? 1 : 0);
  }

  fbBatchCount(): number {
    return this.state.batches().filter(b => b.retailerCode === 'FIVE_BELOW').length || (this.state.fbData().length ? 1 : 0);
  }
}
