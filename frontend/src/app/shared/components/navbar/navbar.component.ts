import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService, PortalTab } from '../../../core/services/state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="container" style="padding-top: 1.25rem; padding-bottom: 0.75rem;">
      <div class="ui-card flex items-center justify-between" style="padding: 0.85rem 1.5rem; border-radius: 1.125rem;">
        
        <!-- Brand Logo -->
        <div class="flex items-center gap-2" style="cursor: pointer;" (click)="setTab('dashboard')">
          <span style="font-size: 1.35rem; font-weight: 900; letter-spacing: -0.03em; color: #0f172a;">HORIZON</span>
          <span style="font-size: 1.35rem; font-weight: 900; letter-spacing: -0.03em; color: #2563eb;">POS</span>
        </div>

        <!-- Navigation Tabs -->
        <nav class="nav-pill-group">
          <button 
            type="button"
            class="nav-pill-btn" 
            [class.active]="state.activeTab() === 'dashboard'"
            (click)="setTab('dashboard')">
            Overview
          </button>

          <button 
            type="button"
            class="nav-pill-btn" 
            [class.active-primary]="state.activeTab() === 'upload'"
            (click)="setTab('upload')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            Upload
          </button>



          <button 
            type="button"
            class="nav-pill-btn" 
            [class.active]="state.activeTab() === 'batches'"
            (click)="setTab('batches')">
            Batches ({{ state.batches().length }})
          </button>
        </nav>

        <!-- Right Action Button -->
        <div class="flex items-center gap-2">
          <button 
            type="button"
            class="refresh-btn flex items-center justify-center" 
            [disabled]="state.loading()"
            (click)="refreshData()"
            title="Refresh">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [class.animate-spin]="state.loading()">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
        </div>

      </div>
    </header>
  `,
  styles: [`
    .refresh-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .refresh-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class NavbarComponent {
  readonly state = inject(StateService);

  setTab(tab: PortalTab) {
    this.state.activeTab.set(tab);
  }

  refreshData() {
    this.state.refreshAll();
    this.state.showToast('Data refreshed successfully', 'success');
  }
}
