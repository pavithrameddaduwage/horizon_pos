import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../core/services/state.service';

@Component({
  selector: 'app-five-below',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in flex flex-col gap-6">

      <!-- Header Banner -->
      <div class="glass-panel" style="padding: 1.5rem 2rem;">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <div class="fb-icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-cyan">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold">Five Below POS Explorer</h2>
                <span class="glass-pill text-xs font-mono text-cyan">FAMILY / SKU</span>
              </div>
              <p class="text-xs text-secondary">Analyze week-to-date (WTD), year-to-date (YTD) sales, store inventory, and weeks-on-hand (WOH).</p>
            </div>
          </div>

          <button type="button" class="btn-primary" (click)="state.activeTab.set('upload')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            Upload Five Below CSV
          </button>
        </div>
      </div>

      <!-- Filter Matrix -->
      <div class="glass-panel" style="padding: 1.25rem 1.5rem;">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label class="block text-xs font-semibold text-secondary uppercase tracking-wider" style="margin-bottom: 0.35rem;">
              Search Item # / Description / Category
            </label>
            <input 
              type="text" 
              class="input-glass" 
              placeholder="e.g. SLIME, 40182, TOYS..." 
              [ngModel]="state.fbSearch()"
              (ngModelChange)="onSearchChange($event)" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-secondary uppercase tracking-wider" style="margin-bottom: 0.35rem;">
              Family
            </label>
            <select 
              class="input-glass" 
              [ngModel]="state.fbSelectedFamily()" 
              (ngModelChange)="onFamilyChange($event)">
              <option value="ALL">All Product Families</option>
              <option value="CRAFT">Craft & Activity</option>
              <option value="TOYS">Toys & Games</option>
              <option value="CANDY">Candy & Snacks</option>
              <option value="BEAUTY">Beauty & Wellness</option>
            </select>
          </div>

        </div>
      </div>

      <!-- Data Table -->
      <div class="glass-panel" style="padding: 1.5rem;">
        <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
          <span class="text-sm font-bold text-secondary">
            Showing {{ state.fbData().length }} records
          </span>
        </div>

        <div class="table-container">
          <table class="glass-table">
            <thead>
              <tr>
                <th>Item #</th>
                <th>Description</th>
                <th>Family / Category</th>
                <th>Sales (WTD)</th>
                <th>Sales $ (YTD)</th>
                <th>Store OH Units</th>
                <th>Inv OH Units</th>
                <th>WOH (LCW)</th>
              </tr>
            </thead>
            <tbody>
              @for (row of state.fbData(); track row.id) {
                <tr>
                  <td class="font-mono text-xs font-bold text-cyan">{{ row.sku || row.itemNumber || '—' }}</td>
                  <td style="max-width: 240px; overflow: hidden; text-overflow: ellipsis;">
                    <div class="font-semibold text-sm">{{ row.skuDesc || row.itemDescription }}</div>
                  </td>
                  <td>
                    <span class="badge-neutral text-xs">{{ row.reportFamily || row.family || row.department || 'FIVE_BELOW' }}</span>
                  </td>
                  <td class="font-bold text-indigo">{{ (row.salesUWTD ?? row.salesUWtd ?? 0) | number }}</td>
                  <td class="font-mono text-xs font-bold text-emerald">
                    {{ (row.salesDYTD ?? row.salesDYtd) ? ('$' + ((row.salesDYTD ?? row.salesDYtd) | number:'1.2-2')) : '$0.00' }}
                  </td>
                  <td class="text-secondary font-semibold">{{ (row.storeOHU ?? row.storeOhUnits ?? 0) | number }}</td>
                  <td class="text-cyan font-bold">{{ (row.invOHU ?? row.invOhU ?? 0) | number }}</td>
                  <td class="font-mono text-xs text-muted">{{ row.wohLCW || row.wohLcw || '—' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <span>No matching Five Below records found.</span>
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
    .fb-icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(6, 182, 212, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
  `]
})
export class FiveBelowComponent implements OnInit {
  readonly state = inject(StateService);

  ngOnInit() {
    this.state.fetchFiveBelow();
  }

  onSearchChange(search: string) {
    this.state.fbSearch.set(search);
    this.state.fetchFiveBelow();
  }

  onFamilyChange(family: string) {
    this.state.fbSelectedFamily.set(family);
    this.state.fetchFiveBelow();
  }
}
