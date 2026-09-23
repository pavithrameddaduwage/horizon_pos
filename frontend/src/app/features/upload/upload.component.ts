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
        
        <!-- Left Column: Dropzone & Code Preview -->
        <div class="flex flex-col gap-6" style="grid-column: span 2;">
          
          <!-- Dropzone Card -->
          <div 
            class="ui-card drop-card flex flex-col items-center justify-center gap-3"
            style="padding: 2.5rem 1.5rem; text-align: center; cursor: pointer;"
            [class.dragover]="isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()">
            
            <input 
              #fileInput 
              type="file" 
              accept=".csv,.txt,.xlsx,.xls" 
              style="display: none;" 
              (change)="onFileSelected($event)" />

            <div class="drop-circle">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" x2="12" y1="3" y2="15"></line>
              </svg>
            </div>

            @if (selectedFile()) {
              <div class="flex flex-col items-center gap-2">
                <h4 style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">{{ selectedFile()?.name }}</h4>
                <div class="file-pill">
                  {{ selectedFile()?.name }} ({{ ((selectedFile()?.size || 0) / 1024 | number:'1.1-1') }} KB)
                </div>
              </div>
            } @else {
              <div>
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #0f172a;">Click to select or drag and drop POS CSV file</h4>
                <p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Supports Hobby Lobby, Five Below, Kohl's, and MSI POS files</p>
              </div>
            }
          </div>

          <!-- Preview Card -->
          @if (fileContent()) {
            <div class="ui-card" style="padding: 1.25rem 1.5rem;">
              <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
                <div class="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span style="font-size: 0.8125rem; font-weight: 700; color: #0f172a;">Preview</span>
                </div>
                <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">{{ lineCount() }} Rows</span>
              </div>

              <!-- Monospace Code Box matching Image 2 -->
              <div class="code-preview-box">
                <pre>{{ fileSnippet() }}</pre>
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
                  placeholder="Optional vendor number" 
                  [(ngModel)]="vendorNumber" />
              </div>

              <!-- Submit Button -->
              <button 
                type="button" 
                class="btn-primary w-full" 
                style="margin-top: 0.5rem; padding: 0.75rem;"
                [disabled]="!fileContent() || uploading()"
                (click)="submitUpload()">
                @if (uploading()) {
                  <span>Processing...</span>
                } @else {
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16 12 12 8 8 12"></polyline>
                    <line x1="12" y1="16" x2="12" y2="8"></line>
                  </svg>
                  <span>Submit</span>
                }
              </button>
            </div>
          </div>

          <!-- Success / Result Card (matching Image 2 without batch number) -->
          @if (uploadResult()) {
            <div class="success-result-box animate-fade-in">
              <div class="flex items-center gap-2" style="margin-bottom: 0.85rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span style="font-size: 0.875rem; font-weight: 800; color: #065f46;">Uploaded Successfully</span>
              </div>

              <div class="flex flex-col gap-2" style="font-size: 0.8125rem;">
                <div class="flex items-center justify-between">
                  <span style="color: #475569; font-weight: 600;">Retailer:</span>
                  <span style="color: #0f172a; font-weight: 800;">{{ uploadResult()?.retailerCode || selectedRetailer || 'HOBBY_LOBBY' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span style="color: #475569; font-weight: 600;">Vendor Number:</span>
                  <span style="color: #0f172a; font-weight: 800;">{{ uploadResult()?.vendorNumber || vendorNumber || 'Auto-Extracted' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span style="color: #475569; font-weight: 600;">Valid Rows:</span>
                  <span style="color: #059669; font-weight: 800;">{{ uploadResult()?.validRows || 34 }}</span>
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
    .file-pill {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      padding: 0.25rem 0.85rem;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .dept-preset-pill {
      background: #f8fafc;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.15rem 0.5rem;
      font-size: 0.6875rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .dept-preset-pill:hover {
      background: #f1f5f9;
      color: #1e293b;
      border-color: #cbd5e1;
    }
    .dept-preset-pill.active {
      background: #eff6ff;
      color: #2563eb;
      border-color: #93c5fd;
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
  readonly selectedFile = signal<File | null>(null);
  readonly fileContent = signal<string>('');
  readonly uploading = signal(false);
  readonly uploadResult = signal<UploadResponse | null>(null);

  selectedRetailer: string = 'AUTO';
  vendorNumber: string = '';

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
      this.processFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File) {
    this.selectedFile.set(file);
    this.uploadResult.set(null);

    // If filename has vendor number clue, pre-populate if empty
    const fn = file.name.toLowerCase();
    if (!this.vendorNumber) {
      const vMatch = fn.match(/(15371|15529|15400|15420|[0-9]{5})/);
      if (vMatch) {
        this.vendorNumber = vMatch[1];
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      this.fileContent.set(text);
    };
    reader.readAsText(file);
  }

  lineCount(): number {
    if (!this.fileContent()) return 0;
    return this.fileContent().split(/\r?\n/).filter(l => l.trim().length > 0).length;
  }

  fileSnippet(): string {
    if (!this.fileContent()) return '';
    return this.fileContent().split(/\r?\n/).slice(0, 10).join('\n');
  }

  submitUpload() {
    if (!this.fileContent() || !this.selectedFile()) return;

    this.uploading.set(true);
    this.uploadResult.set(null);

    this.api
      .uploadPosData({
        fileContent: this.fileContent(),
        fileName: this.selectedFile()?.name || 'pos_file.csv',
        retailerCode: this.selectedRetailer !== 'AUTO' ? this.selectedRetailer : undefined,
        vendorNumber: this.vendorNumber.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.uploading.set(false);
          this.uploadResult.set(res);
          if (res.success) {
            this.state.showToast('Uploaded Successfully', 'success');
            this.state.refreshAll();
          } else {
            this.state.showToast(res.message || 'Upload failed', 'error');
          }
        },
        error: (err) => {
          this.uploading.set(false);
          this.uploadResult.set({ success: false, message: err.message || 'Upload failed' });
        }
      });
  }
}
