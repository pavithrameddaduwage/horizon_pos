import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../core/services/state.service';

@Component({
  selector: 'app-hobby-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in flex flex-col gap-6">

      <!-- Header Banner -->
      <div class="glass-panel" style="padding: 1.5rem 2rem;">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <div class="hl-icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold">Hobby Lobby POS Explorer</h2>
                <span class="glass-pill text-xs font-mono text-amber">DEPT 120+</span>
              </div>
              <p class="text-xs text-secondary">Analyze sell-down rates, on-hand inventory, 12M revenue volume, and buyer distributions.</p>
            </div>
          </div>

          <button type="button" class="btn-primary" (click)="state.activeTab.set('upload')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            Upload Hobby Lobby CSV
          </button>
        </div>
      </div>



      <!-- Filter Controls Matrix -->
      <div class="glass-panel" style="padding: 1.25rem 1.5rem;">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <!-- Search SKU / Description -->
          <div>
            <label class="block text-xs font-semibold text-secondary uppercase tracking-wider" style="margin-bottom: 0.35rem;">
              Search Item # / Description / Stock #
            </label>
            <input 
              type="text" 
              class="input-glass" 
              placeholder="e.g. 52410, CANVAS, 9812..." 
              [ngModel]="state.hlSearch()"
              (ngModelChange)="onSearchChange($event)" />
          </div>

          <!-- Department Filter -->
          <div>
            <label class="block text-xs font-semibold text-secondary uppercase tracking-wider" style="margin-bottom: 0.35rem;">
              Department
            </label>
            <select 
              class="input-glass" 
              [ngModel]="state.hlSelectedDept()" 
              (ngModelChange)="onDeptChange($event)">
              <option value="ALL">All Departments</option>
              @for (dept of state.hlDepartments(); track dept) {
                <option [value]="dept">{{ dept }}</option>
              }
            </select>
          </div>

          <!-- Vendor Filter -->
          <div>
            <label class="block text-xs font-semibold text-secondary uppercase tracking-wider" style="margin-bottom: 0.35rem;">
              Vendor Number
            </label>
            <select 
              class="input-glass" 
              [ngModel]="state.hlSelectedVendor()" 
              (ngModelChange)="onVendorChange($event)">
              <option value="ALL">All Vendors</option>
              @for (v of state.uniqueVendors(); track v) {
                <option [value]="v">Vendor #{{ v }}</option>
              }
            </select>
          </div>

        </div>
      </div>

      <!-- Data Table -->
      <div class="glass-panel" style="padding: 1.5rem;">
        <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
          <span class="text-sm font-bold text-secondary">
            Showing {{ state.hlData().length }} records
          </span>
        </div>

        <div class="table-container">
          <table class="glass-table">
            <thead>
              <tr>
                <th>Item #</th>
                <th>Description</th>
                <th>Dept / Buyer</th>
                <th>Vendor #</th>
                <th>On Hand</th>
                <th>On Order</th>
                <th>Sell Down</th>
                <th>Retail Price</th>
                <th>12M Sales</th>
              </tr>
            </thead>
            <tbody>
              @for (row of state.hlData(); track row.id) {
                <tr>
                  <td class="font-mono text-xs font-bold text-indigo">{{ row.itemNumber }}</td>
                  <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis;">
                    <div class="font-semibold text-sm">{{ row.itemDescription }}</div>
                    <div class="text-xs text-muted font-mono">Stock #{{ row.vendorStockNumber || 'N/A' }}</div>
                  </td>
                  <td>
                    <span class="badge-neutral text-xs">{{ row.department || row.buyerName || 'Dept 120' }}</span>
                  </td>
                  <td class="font-mono text-xs text-muted">{{ row.vendorNumber }}</td>
                  <td class="font-bold text-cyan">{{ row.onHand | number }}</td>
                  <td class="text-muted">{{ row.onOrder | number }}</td>
                  <td>
                    <span class="font-mono text-xs" [class.text-emerald]="isHighSellDown(row.sellDown)" [class.text-amber]="!isHighSellDown(row.sellDown)">
                      {{ row.sellDown ? row.sellDown + '%' : '—' }}
                    </span>
                  </td>
                  <td class="font-mono text-xs">{{ row.retailPrice ? ('$' + row.retailPrice) : '—' }}</td>
                  <td class="font-mono text-xs font-bold text-emerald">
                    {{ row.sales12M ? ('$' + (row.sales12M | number:'1.2-2')) : '$0.00' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <span>No matching Hobby Lobby records found.</span>
                      <button type="button" class="btn-secondary" style="font-size: 0.8rem; margin-top: 0.5rem;" (click)="resetFilters()">
                        Reset Filters
                      </button>
                    </div>
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
    .hl-icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(245, 158, 11, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
  `]
})
export class HobbyLobbyComponent implements OnInit {
  readonly state = inject(StateService);

  ngOnInit() {
    this.state.fetchHobbyLobby();
  }

  onSearchChange(search: string) {
    this.state.hlSearch.set(search);
    this.state.fetchHobbyLobby();
  }

  onDeptChange(dept: string) {
    this.state.hlSelectedDept.set(dept);
    this.state.fetchHobbyLobby();
  }

  onVendorChange(vendor: string) {
    this.state.hlSelectedVendor.set(vendor);
    this.state.fetchHobbyLobby();
  }

  isHighSellDown(val: any): boolean {
    if (!val) return false;
    const num = typeof val === 'number' ? val : parseFloat(val);
    return !isNaN(num) && num > 50;
  }

  resetFilters() {
    this.state.hlSearch.set('');
    this.state.hlSelectedDept.set('ALL');
    this.state.hlSelectedVendor.set('ALL');
    this.state.fetchHobbyLobby();
  }
}
