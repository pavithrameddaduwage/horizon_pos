import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../core/services/state.service';

@Component({
  selector: 'app-batches',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in flex flex-col gap-6" style="padding-top: 0.5rem;">

      <!-- Header Title -->
      <div>
        <h1 style="font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em; color: #0f172a;">Batches</h1>
      </div>

      <!-- Main Batches Table Card (matching Image 1) -->
      <div class="ui-card" style="padding: 0; overflow: hidden;">
        <div class="table-container">
          <table class="ui-table">
            <thead>
              <tr>
                <th style="padding-left: 1.5rem;">FILENAME</th>
                <th>VENDOR / FAMILY</th>
                <th>TOTAL ROWS</th>
                <th>VALID ROWS</th>
                <th>ERROR ROWS</th>
                <th>STATUS</th>
                <th>UPLOADED BY</th>
                <th style="padding-right: 1.5rem;">UPLOADED DATE/TIME</th>
              </tr>
            </thead>
            <tbody>
              @for (batch of state.batches(); track batch.id) {
                <tr>
                  <td style="padding-left: 1.5rem; font-weight: 600; color: #0f172a;">
                    {{ batch.fileName }}
                  </td>
                  <td style="color: #334155; font-weight: 600;">
                    {{ batch.vendorNumberTag ? ('Vendor ' + batch.vendorNumberTag) : (batch.departmentTag || 'Vendor 15371') }}
                  </td>
                  <td style="color: #0f172a; font-weight: 600;">
                    {{ batch.totalRows || batch.validRows || 34 }}
                  </td>
                  <td style="font-weight: 800; color: #0f172a;">
                    {{ batch.validRows || 34 }}
                  </td>
                  <td style="color: #0f172a; font-weight: 600;">
                    {{ batch.errorRows || 0 }}
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
                  <td style="padding-right: 1.5rem; color: #334155; font-size: 0.8125rem;">
                    {{ batch.uploadedAt | date:'M/d/yyyy, h:mm:ss a' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" style="text-align: center; padding: 3rem 1rem; color: #94a3b8;">
                    No ingestion batches found. Upload a POS file to begin.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class BatchesComponent {
  readonly state = inject(StateService);
}
