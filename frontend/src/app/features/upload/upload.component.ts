import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosApiService } from '../../core/services/pos-api.service';
import { StateService } from '../../core/services/state.service';
import { UploadResponse } from '../../core/models/pos.model';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in flex flex-col gap-6" style="padding-top: 0.5rem;">

      <!-- Title -->
      <div>
        <h1 style="font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em; color: #0f172a;">Upload</h1>
      </div>

      <!-- Top 4 Retailer Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Hobby Lobby -->
        <div 
          class="ui-card flex items-center gap-3" 
          [style.border-color]="selectedRetailer === 'HOBBY_LOBBY' ? '#2563eb' : '#e2e8f0'"
          [style.box-shadow]="selectedRetailer === 'HOBBY_LOBBY' ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none'"
          style="padding: 1.25rem; cursor: pointer;" 
          (click)="setRetailer('HOBBY_LOBBY')">
          <div class="retailer-mini-icon" style="background: #eff6ff; color: #2563eb;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div>
            <h3 style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">Hobby Lobby</h3>
          </div>
        </div>

        <!-- Five Below -->
        <div 
          class="ui-card flex items-center gap-3" 
          [style.border-color]="selectedRetailer === 'FIVE_BELOW' ? '#059669' : '#e2e8f0'"
          [style.box-shadow]="selectedRetailer === 'FIVE_BELOW' ? '0 0 0 2px rgba(5,150,105,0.2)' : 'none'"
          style="padding: 1.25rem; cursor: pointer;" 
          (click)="setRetailer('FIVE_BELOW')">
          <div class="retailer-mini-icon" style="background: #ecfdf5; color: #059669;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div>
            <h3 style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">Five Below</h3>
          </div>
        </div>

        <!-- Kohl's -->
        <div 
          class="ui-card flex items-center gap-3" 
          [style.border-color]="selectedRetailer === 'KOHLS' ? '#d97706' : '#e2e8f0'"
          [style.box-shadow]="selectedRetailer === 'KOHLS' ? '0 0 0 2px rgba(217,119,6,0.2)' : 'none'"
          style="padding: 1.25rem; cursor: pointer;" 
          (click)="setRetailer('KOHLS')">
          <div class="retailer-mini-icon" style="background: #fffbeb; color: #d97706;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
          <div>
            <h3 style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">Kohl's</h3>
          </div>
        </div>

        <!-- MSI POS -->
        <div 
          class="ui-card flex items-center gap-3" 
          [style.border-color]="selectedRetailer === 'MSI' ? '#7c3aed' : '#e2e8f0'"
          [style.box-shadow]="selectedRetailer === 'MSI' ? '0 0 0 2px rgba(124,58,237,0.2)' : 'none'"
          style="padding: 1.25rem; cursor: pointer;" 
          (click)="setRetailer('MSI')">
          <div class="retailer-mini-icon" style="background: #f5f3ff; color: #7c3aed;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <div>
            <h3 style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">MSI POS</h3>
          </div>
        </div>

      </div>

      <!-- Main Upload Workspace Grid (Left 2/3, Right 1/3) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Column: Dropzone, Multi-File Queue & Code Preview -->
        <div class="flex flex-col gap-6" style="grid-column: span 2;">
          
          <!-- Dropzone Card (Supports multiple files) -->
          <div 
            class="ui-card drop-card flex flex-col items-center justify-center gap-3"
            [style.padding]="fileQueue().length > 0 ? '1.25rem 1.5rem' : '2.5rem 1.5rem'"
            style="text-align: center; cursor: pointer; transition: all 0.2s ease;"
            [class.dragover]="isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()">
            
            <input 
              #fileInput 
              type="file" 
              multiple
              accept=".csv,.txt,.xlsx,.xls" 
              style="display: none;" 
              (change)="onFileSelected($event)" />

            <div class="drop-circle" [style.width.px]="fileQueue().length > 0 ? 38 : 48" [style.height.px]="fileQueue().length > 0 ? 38 : 48">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" x2="12" y1="3" y2="15"></line>
              </svg>
            </div>

            <div>
              <h4 style="font-size: 0.9rem; font-weight: 700; color: #0f172a;">Click to select or drag and drop single or multiple POS CSV files</h4>
              <p style="font-size: 0.75rem; color: #64748b; margin-top: 3px;">Supports batch uploads for historical & multi-month files (~20KB each)</p>
            </div>
          </div>

          <!-- Multi-File Queue Card (When files are added) -->
          @if (fileQueue().length > 0) {
            <div class="ui-card" style="padding: 1.25rem 1.5rem;">
              <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
                <div class="flex items-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span style="font-size: 0.875rem; font-weight: 800; color: #0f172a;">
                    Upload Queue ({{ fileQueue().length }} {{ fileQueue().length === 1 ? 'file' : 'files' }})
                  </span>
                </div>

                @if (!uploading()) {
                  <button 
                    type="button" 
                    style="background: none; border: none; font-size: 0.75rem; font-weight: 700; color: #dc2626; cursor: pointer;"
                    (click)="clearQueue()">
                    Clear All
                  </button>
                }
              </div>

              <!-- Queue List with inside scroll -->
              <div class="queue-scroll-container">
                @for (item of fileQueue(); track item.id; let idx = $index) {
                  <div class="queue-item-card flex items-center justify-between p-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="queue-item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                          <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                      </div>

                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="truncate" style="font-size: 0.8125rem; font-weight: 700; color: #0f172a; max-width: 260px;">
                            {{ item.name }}
                          </span>
                          <span style="font-size: 0.6875rem; color: #64748b; font-weight: 600;">
                            ({{ (item.size / 1024 | number:'1.1-1') }} KB)
                          </span>
                        </div>

                        <!-- Detected tags snippet -->
                        <div class="flex items-center gap-2" style="font-size: 0.6875rem; color: #475569; margin-top: 2px;">
                          @if (item.vendorNumber) {
                            <span>Vendor: <strong>{{ item.vendorNumber }}</strong></span>
                            <span>•</span>
                          }
                          @if (item.periodText) {
                            <span style="color: #2563eb; font-weight: 700;">{{ item.periodText }}</span>
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Right status / action -->
                    <div class="flex items-center gap-2 flex-shrink-0">
                      @if (item.status === 'READY') {
                        <span class="status-pill status-ready">Ready</span>
                        @if (!uploading()) {
                          <button type="button" class="remove-btn" (click)="removeItem(idx)">✕</button>
                        }
                      } @else if (item.status === 'UPLOADING') {
                        <span class="status-pill status-uploading">Uploading...</span>
                      } @else if (item.status === 'SUCCESS') {
                        <span class="status-pill status-success">✓ {{ item.result?.validRows || 0 }} rows</span>
                      } @else if (item.status === 'ERROR') {
                        <span class="status-pill status-error" [title]="item.errorMessage || 'Upload failed'">✕ Failed</span>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Upload Progress bar if uploading multiple -->
              @if (uploading() && fileQueue().length > 1) {
                <div style="margin-top: 1rem;">
                  <div class="flex items-center justify-between" style="font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                    <span>Uploading {{ uploadProgress().current }} of {{ uploadProgress().total }} files...</span>
                    <span>{{ uploadProgress().percentage }}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-bar" [style.width.%]="uploadProgress().percentage"></div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Single File Preview Card (If 1 file in queue) -->
          @if (fileQueue().length === 1 && fileQueue()[0].content) {
            <div class="ui-card" style="padding: 1.25rem 1.5rem;">
              <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
                <div class="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span style="font-size: 0.8125rem; font-weight: 700; color: #0f172a;">Preview</span>
                </div>
                <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">
                  {{ lineCount(fileQueue()[0].content) }} Rows
                </span>
              </div>

              <div class="code-preview-box">
                <pre>{{ fileSnippet(fileQueue()[0].content) }}</pre>
              </div>
            </div>
          }

        </div>

        <!-- Right Column: Upload Settings & Result Feedback -->
        <div class="flex flex-col gap-4">
          
          <!-- Upload Settings Card -->
          <div class="ui-card" style="padding: 1.5rem;">
            <div class="flex items-center gap-2" style="margin-bottom: 1.25rem;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <h3 style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">Upload Settings</h3>
            </div>

            <div class="flex flex-col gap-4">
              <!-- Retailer Selection -->
              <div>
                <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">
                  Retailer
                </label>
                <select class="input-control" [(ngModel)]="selectedRetailer">
                  <option value="AUTO">Auto-Detect</option>
                  <option value="HOBBY_LOBBY">Hobby Lobby</option>
                  <option value="FIVE_BELOW">Five Below</option>
                  <option value="KOHLS">Kohl's</option>
                  <option value="MSI">MSI POS</option>
                </select>
              </div>

              <!-- Vendor Number Input -->
              <div>
                <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">
                  Vendor Number
                </label>
                <input 
                  type="text" 
                  class="input-control" 
                  placeholder="Auto-extracted per file or override" 
                  [(ngModel)]="vendorNumber" />
              </div>

              <!-- Reporting Period (Year & Month) -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">
                    Reporting Year
                  </label>
                  <select class="input-control" [(ngModel)]="selectedYear">
                    <option value="AUTO">Auto-Detect</option>
                    @for (y of availableYears; track y) {
                      <option [value]="y">{{ y }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">
                    Reporting Month
                  </label>
                  <select class="input-control" [(ngModel)]="selectedMonth">
                    <option value="AUTO">Auto-Detect</option>
                    @for (m of availableMonths; track m.value) {
                      <option [value]="m.value">{{ m.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Detected Period Badge if single file -->
              @if (fileQueue().length === 1 && fileQueue()[0].periodText) {
                <div class="detected-badge flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Detected: {{ fileQueue()[0].periodText }}</span>
                </div>
              }

              <!-- Submit Button -->
              <button 
                type="button" 
                class="btn-primary w-full" 
                style="margin-top: 0.5rem; padding: 0.75rem;"
                [disabled]="fileQueue().length === 0 || uploading()"
                (click)="submitAllUploads()">
                @if (uploading()) {
                  <span>Uploading {{ uploadProgress().current }} / {{ uploadProgress().total }}...</span>
                } @else {
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16 12 12 8 8 12"></polyline>
                    <line x1="12" y1="16" x2="12" y2="8"></line>
                  </svg>
                  <span>
                    {{ fileQueue().length > 1 ? ('Upload All (' + fileQueue().length + ' Files)') : 'Submit' }}
                  </span>
                }
              </button>
            </div>
          </div>

          <!-- Overall Summary Box for Multiple Uploads -->
          @if (batchSummary()) {
            <div class="success-result-box animate-fade-in">
              <div class="flex items-center gap-2" style="margin-bottom: 0.85rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span style="font-size: 0.875rem; font-weight: 800; color: #065f46;">
                  {{ batchSummary()?.successfulFiles }} of {{ batchSummary()?.totalFiles }} Files Ingested
                </span>
              </div>

              <div class="flex flex-col gap-2" style="font-size: 0.8125rem;">
                <div class="flex items-center justify-between">
                  <span style="color: #475569; font-weight: 600;">Total Rows Ingested:</span>
                  <span style="color: #059669; font-weight: 800;">{{ batchSummary()?.totalValidRows || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span style="color: #475569; font-weight: 600;">Retailer:</span>
                  <span style="color: #0f172a; font-weight: 800;">{{ selectedRetailer !== 'AUTO' ? selectedRetailer : 'Auto-Detected' }}</span>
                </div>
              </div>
            </div>
          }

        </div>

      </div>

    </div>
  `,
  styles: [`
    .retailer-mini-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .drop-card {
      border: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .drop-circle {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .queue-scroll-container {
      max-height: 280px;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      padding-right: 0.35rem;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }
    .queue-scroll-container::-webkit-scrollbar {
      width: 6px;
    }
    .queue-scroll-container::-webkit-scrollbar-track {
      background: transparent;
    }
    .queue-scroll-container::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 9999px;
    }
    .queue-scroll-container::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8;
    }
    .queue-item-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
    .queue-item-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .status-pill {
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 800;
    }
    .status-ready {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }
    .status-uploading {
      background: #fef3c7;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    .status-success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .status-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
    .remove-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 0.8125rem;
      cursor: pointer;
      padding: 0.2rem 0.35rem;
      border-radius: 4px;
    }
    .remove-btn:hover {
      color: #ef4444;
      background: #fee2e2;
    }
    .progress-track {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: #2563eb;
      transition: width 0.3s ease;
    }
    .detected-badge {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .code-preview-box {
      background: #090d16;
      color: #f8fafc;
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      max-height: 220px;
      overflow-x: auto;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 0.725rem;
      line-height: 1.6;
    }
    .success-result-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 0.875rem;
      padding: 1.25rem 1.35rem;
    }
  `]
})
export class UploadComponent {
  private readonly api = inject(PosApiService);
  readonly state = inject(StateService);

  readonly isDragging = signal(false);
  readonly fileQueue = signal<Array<{
    id: string;
    file: File;
    name: string;
    size: number;
    content: string;
    vendorNumber?: string;
    year?: number;
    month?: number;
    periodText?: string;
    status: 'READY' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
    result?: UploadResponse;
    errorMessage?: string;
  }>>([]);

  readonly uploading = signal(false);
  readonly uploadProgress = signal({ current: 0, total: 0, percentage: 0 });
  readonly batchSummary = signal<{ totalFiles: number; successfulFiles: number; totalValidRows: number } | null>(null);

  selectedRetailer: string = 'AUTO';
  vendorNumber: string = '';
  selectedYear: string = 'AUTO';
  selectedMonth: string = 'AUTO';

  readonly availableYears = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
  readonly availableMonths = [
    { value: '1', name: 'January' },
    { value: '2', name: 'February' },
    { value: '3', name: 'March' },
    { value: '4', name: 'April' },
    { value: '5', name: 'May' },
    { value: '6', name: 'June' },
    { value: '7', name: 'July' },
    { value: '8', name: 'August' },
    { value: '9', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' },
  ];

  setRetailer(code: string) {
    this.selectedRetailer = code;
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFilesAdded(Array.from(input.files));
      input.value = ''; // Reset input to allow re-selecting same files
    }
  }

  private handleFilesAdded(files: File[]) {
    this.batchSummary.set(null);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    files.forEach((file) => {
      const fn = file.name.toLowerCase();

      // 1. Detect Vendor
      let vNum: string | undefined;
      const vMatch = fn.match(/(15371|15529|15400|15420|[0-9]{5})/);
      if (vMatch) vNum = vMatch[1];

      // 2. Detect Year & Month
      let foundMonth: number | undefined;
      let foundYear: number | undefined;

      monthNames.forEach((m, idx) => {
        if (fn.includes(m.toLowerCase())) foundMonth = idx + 1;
      });

      if (!foundMonth) {
        shortMonths.forEach((m, idx) => {
          const reg = new RegExp(`(^|[^a-z])${m}([^a-z]|$)`, 'i');
          if (reg.test(fn)) foundMonth = idx + 1;
        });
      }

      const yMatch = fn.match(/\b(20[1-3][0-9])\b/);
      if (yMatch) foundYear = parseInt(yMatch[1], 10);

      const periodText = foundMonth && foundYear
        ? `${monthNames[foundMonth - 1]} ${foundYear}`
        : (foundYear ? `${foundYear}` : '');

      const queueItem = {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        content: '',
        vendorNumber: vNum,
        year: foundYear,
        month: foundMonth,
        periodText,
        status: 'READY' as const,
      };

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        queueItem.content = (event.target?.result as string) || '';
      };
      reader.readAsText(file);

      this.fileQueue.update((q) => [...q, queueItem]);
    });
  }

  removeItem(index: number) {
    this.fileQueue.update((q) => q.filter((_, i) => i !== index));
  }

  clearQueue() {
    this.fileQueue.set([]);
    this.batchSummary.set(null);
  }

  lineCount(content?: string): number {
    if (!content) return 0;
    return content.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
  }

  fileSnippet(content?: string): string {
    if (!content) return '';
    return content.split(/\r?\n/).slice(0, 10).join('\n');
  }

  async submitAllUploads() {
    const queue = this.fileQueue();
    if (queue.length === 0 || this.uploading()) return;

    this.uploading.set(true);
    this.batchSummary.set(null);
    this.uploadProgress.set({ current: 0, total: queue.length, percentage: 0 });

    let successfulFiles = 0;
    let totalValidRows = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      
      // Update item to UPLOADING
      this.fileQueue.update((items) =>
        items.map((it, idx) => (idx === i ? { ...it, status: 'UPLOADING' } : it))
      );

      const fileContent = item.content || (await this.readFileAsync(item.file));
      const yearToUse = this.selectedYear !== 'AUTO' ? parseInt(this.selectedYear, 10) : item.year;
      const monthToUse = this.selectedMonth !== 'AUTO' ? parseInt(this.selectedMonth, 10) : item.month;
      const vendorToUse = this.vendorNumber.trim() || item.vendorNumber;

      try {
        const res = await new Promise<UploadResponse>((resolve, reject) => {
          this.api
            .uploadPosData({
              fileContent,
              fileName: item.name,
              retailerCode: this.selectedRetailer !== 'AUTO' ? this.selectedRetailer : undefined,
              vendorNumber: vendorToUse,
              reportingYear: yearToUse,
              reportingMonth: monthToUse,
            })
            .subscribe({
              next: (response) => resolve(response),
              error: (err) => reject(err),
            });
        });

        if (res.success) {
          successfulFiles++;
          totalValidRows += res.validRows || 0;
          this.fileQueue.update((items) =>
            items.map((it, idx) => (idx === i ? { ...it, status: 'SUCCESS', result: res } : it))
          );
        } else {
          this.fileQueue.update((items) =>
            items.map((it, idx) =>
              idx === i ? { ...it, status: 'ERROR', errorMessage: res.message || 'Validation failed' } : it
            )
          );
        }
      } catch (err: any) {
        this.fileQueue.update((items) =>
          items.map((it, idx) =>
            idx === i ? { ...it, status: 'ERROR', errorMessage: err.message || 'Upload error' } : it
          )
        );
      }

      // Update progress
      const current = i + 1;
      const percentage = Math.round((current / queue.length) * 100);
      this.uploadProgress.set({ current, total: queue.length, percentage });
    }

    this.uploading.set(false);
    this.batchSummary.set({
      totalFiles: queue.length,
      successfulFiles,
      totalValidRows,
    });

    if (successfulFiles > 0) {
      this.state.showToast(`Uploaded ${successfulFiles} files successfully (${totalValidRows} rows)`, 'success');
      this.state.refreshAll();
    } else {
      this.state.showToast('Upload finished with errors', 'error');
    }
  }

  private readFileAsync(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
}
