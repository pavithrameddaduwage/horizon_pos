'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Building2,
  RefreshCw,
  Eye,
  Store,
  Tag,
  ShoppingBag,
  ArrowUpRight,
} from 'lucide-react';
import {
  IngestionBatchRecord,
  HobbyLobbyRow,
  FiveBelowRow,
} from '@/lib/types/pos';

export default function HorizonPOSPortal() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'batches' | 'hobby_lobby' | 'five_below'>('dashboard');
  
  // Data states
  const [batches, setBatches] = useState<IngestionBatchRecord[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [hlData, setHlData] = useState<HobbyLobbyRow[]>([]);
  const [fbData, setFbData] = useState<FiveBelowRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewContent, setFilePreviewContent] = useState<string>('');
  const [uploadRetailer, setUploadRetailer] = useState<string>('AUTO');
  const [uploadFamily, setUploadFamily] = useState<string>('AUTO');
  const [uploadDepartment, setUploadDepartment] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Filters
  const [hlBuyerFilter, setHlBuyerFilter] = useState('');
  const [hlSkuFilter, setHlSkuFilter] = useState('');
  const [fbFamilyFilter, setFbFamilyFilter] = useState<string>('ALL');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchesRes, kpiRes, hlRes, fbRes] = await Promise.all([
        fetch('/api/v1/pos/batches'),
        fetch('/api/v1/pos/analytics/summary'),
        fetch('/api/v1/pos/hobby-lobby'),
        fetch('/api/v1/pos/five-below'),
      ]);

      const batchesJson = await batchesRes.json();
      const kpiJson = await kpiRes.json();
      const hlJson = await hlRes.json();
      const fbJson = await fbRes.json();

      setBatches(batchesJson.batches || []);
      setKpis(kpiJson.kpis || null);
      setHlData(hlJson.data || []);
      setFbData(fbJson.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const text = await file.text();
      setFilePreviewContent(text);
      setUploadResult(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePreviewContent) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const payload: any = {
        fileContent: filePreviewContent,
        fileName: selectedFile?.name || 'pos_upload.csv',
      };
      if (uploadRetailer !== 'AUTO') payload.retailer = uploadRetailer;
      if (uploadFamily !== 'AUTO') payload.family = uploadFamily;
      if (uploadDepartment) payload.department = uploadDepartment;

      const res = await fetch('/api/v1/pos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setUploadResult(json);
      if (json.success) {
        fetchData();
      }
    } catch (err: any) {
      setUploadResult({ success: false, error: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  // Filtered Hobby Lobby Data
  const filteredHlData = hlData.filter((row) => {
    if (hlBuyerFilter && !row.buyerName.toLowerCase().includes(hlBuyerFilter.toLowerCase())) return false;
    if (hlSkuFilter && !row.itemNumber.toLowerCase().includes(hlSkuFilter.toLowerCase()) && !row.itemDescription.toLowerCase().includes(hlSkuFilter.toLowerCase())) return false;
    return true;
  });

  // Filtered Five Below Data
  const filteredFbData = fbData.filter((row) => {
    if (fbFamilyFilter !== 'ALL' && row.reportFamily !== fbFamilyFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-600 selection:text-white text-slate-900">
      {/* Floating Navigation Header */}
      <div className="sticky top-4 z-50 max-w-6xl w-full mx-auto px-4">
        <header className="nav-floating-dock rounded-2xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-black text-xl tracking-wider text-slate-950 flex items-center space-x-1">
              <span>HORIZON</span>
              <span className="text-blue-600 font-bold">POS</span>
            </span>
          </div>

          {/* Segmented Floating Pill Nav */}
          <nav className="flex items-center bg-slate-200/90 p-1 rounded-xl space-x-1 border border-slate-300">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-950 shadow-md shadow-slate-900/10'
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload</span>
            </button>
            <button
              onClick={() => setActiveTab('hobby_lobby')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'hobby_lobby'
                  ? 'bg-white text-blue-800 shadow-md shadow-slate-900/10'
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              Hobby Lobby
            </button>
            <button
              onClick={() => setActiveTab('five_below')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'five_below'
                  ? 'bg-white text-emerald-800 shadow-md shadow-slate-900/10'
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              Five Below
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'batches'
                  ? 'bg-white text-slate-950 shadow-md shadow-slate-900/10'
                  : 'text-slate-800 hover:text-black'
              }`}
            >
              Batches ({batches.length})
            </button>
          </nav>

          {/* Refresh Action */}
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 hover:text-blue-700 transition-colors border border-slate-300"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </header>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 mt-2">

        {/* ----------------- TAB: OVERVIEW DASHBOARD ----------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                POS Overview
              </h1>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-blue-600/30"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload POS Feed</span>
              </button>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="pos-card p-5 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border-blue-200">
                <div className="flex items-center justify-between text-slate-900 text-xs font-bold">
                  <span>Total Batches Ingested</span>
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-950 mt-2">
                  {kpis?.totalBatches || batches.length}
                </div>
              </div>

              <div className="pos-card p-5 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 border-indigo-200">
                <div className="flex items-center justify-between text-slate-900 text-xs font-bold">
                  <span>Total Records Validated</span>
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-950 mt-2">
                  {(kpis?.totalRowsIngested || 0).toLocaleString()}
                </div>
              </div>

              <div className="pos-card p-5 bg-gradient-to-br from-white via-slate-50 to-sky-50/40 border-sky-200">
                <div className="flex items-center justify-between text-slate-900 text-xs font-bold">
                  <span>Hobby Lobby Records</span>
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-950 mt-2">
                  {kpis?.retailerBreakdown?.HOBBY_LOBBY?.rows || 0}
                </div>
              </div>

              <div className="pos-card p-5 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border-emerald-200">
                <div className="flex items-center justify-between text-slate-900 text-xs font-bold">
                  <span>Five Below Records</span>
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <Store className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-950 mt-2">
                  {kpis?.retailerBreakdown?.FIVE_BELOW?.rows || 0}
                </div>
              </div>
            </div>

            {/* 4 Retailer Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveTab('hobby_lobby')}
                className="pos-card-interactive p-5 cursor-pointer bg-gradient-to-br from-white via-blue-50/30 to-blue-100/40 border-blue-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-blue-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-lg text-slate-950 mt-4 group-hover:text-blue-700 transition-colors">Hobby Lobby</h3>
                <div className="mt-4 pt-3 border-t border-slate-300 flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">Batches</span>
                  <span className="font-black text-slate-950">{kpis?.retailerBreakdown?.HOBBY_LOBBY?.batches || 0}</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('five_below')}
                className="pos-card-interactive p-5 cursor-pointer bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/40 border-emerald-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                    <Store className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-lg text-slate-950 mt-4 group-hover:text-emerald-700 transition-colors">Five Below</h3>
                <div className="mt-4 pt-3 border-t border-slate-300 flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">Batches</span>
                  <span className="font-black text-slate-950">{kpis?.retailerBreakdown?.FIVE_BELOW?.batches || 0}</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('batches')}
                className="pos-card-interactive p-5 cursor-pointer bg-gradient-to-br from-white via-amber-50/30 to-amber-100/40 border-amber-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-sm">
                    <Tag className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-amber-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-lg text-slate-950 mt-4 group-hover:text-amber-700 transition-colors">Kohl&apos;s</h3>
                <div className="mt-4 pt-3 border-t border-slate-300 flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">Batches</span>
                  <span className="font-black text-slate-950">{kpis?.retailerBreakdown?.KOHLS?.batches || 0}</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('batches')}
                className="pos-card-interactive p-5 cursor-pointer bg-gradient-to-br from-white via-purple-50/30 to-purple-100/40 border-purple-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-purple-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-lg text-slate-950 mt-4 group-hover:text-purple-700 transition-colors">MIS POS</h3>
                <div className="mt-4 pt-3 border-t border-slate-300 flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">Batches</span>
                  <span className="font-black text-slate-950">{kpis?.retailerBreakdown?.MIS?.batches || 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Batches Table */}
            <div className="pos-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base text-slate-950 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Recent Batches</span>
                </h2>
                <button
                  onClick={() => setActiveTab('batches')}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold"
                >
                  View All →
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
                <table className="w-full text-left pos-table">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Retailer</th>
                      <th>File Name</th>
                      <th>Family / Dept</th>
                      <th>Rows</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.slice(0, 5).map((b) => (
                      <tr key={b.id}>
                        <td className="font-mono text-xs text-blue-700 font-bold">{b.id.slice(0, 14)}...</td>
                        <td>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-950 border border-slate-300">
                            {b.retailerCode}
                          </span>
                        </td>
                        <td className="text-xs font-bold text-slate-950">{b.fileName}</td>
                        <td className="text-xs font-semibold text-slate-800">{b.reportFamily || b.departmentTag || '-'}</td>
                        <td className="text-xs font-black text-slate-950">{b.validRows}</td>
                        <td>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="text-xs font-medium text-slate-700">{new Date(b.createdAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: UPLOAD ----------------- */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Upload</h2>

            {/* Visual Retailer Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => { setUploadRetailer('HOBBY_LOBBY'); setUploadFamily('AUTO'); }}
                className={`pos-card p-4 text-left transition-all border-2 ${
                  uploadRetailer === 'HOBBY_LOBBY'
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 w-fit mb-2">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="font-bold text-sm text-slate-950">Hobby Lobby</div>
                <div className="text-[11px] text-slate-700 font-semibold mt-0.5">43-Col Monthly</div>
              </button>

              <button
                type="button"
                onClick={() => { setUploadRetailer('FIVE_BELOW'); }}
                className={`pos-card p-4 text-left transition-all border-2 ${
                  uploadRetailer === 'FIVE_BELOW'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 w-fit mb-2">
                  <Store className="h-4 w-4" />
                </div>
                <div className="font-bold text-sm text-slate-950">Five Below</div>
                <div className="text-[11px] text-slate-700 font-semibold mt-0.5">Weekly Families</div>
              </button>

              <button
                type="button"
                onClick={() => { setUploadRetailer('KOHLS'); setUploadFamily('AUTO'); }}
                className={`pos-card p-4 text-left transition-all border-2 ${
                  uploadRetailer === 'KOHLS'
                    ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 w-fit mb-2">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="font-bold text-sm text-slate-950">Kohl&apos;s</div>
                <div className="text-[11px] text-slate-700 font-semibold mt-0.5">EDI 852 / POS</div>
              </button>

              <button
                type="button"
                onClick={() => { setUploadRetailer('MIS'); setUploadFamily('AUTO'); }}
                className={`pos-card p-4 text-left transition-all border-2 ${
                  uploadRetailer === 'MIS'
                    ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 w-fit mb-2">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div className="font-bold text-sm text-slate-950">MIS POS</div>
                <div className="text-[11px] text-slate-700 font-semibold mt-0.5">Enterprise Feed</div>
              </button>
            </div>

            {/* Upload Form Grid */}
            <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Dropzone & Preview */}
              <div className="lg:col-span-2 space-y-4">
                {/* Dropzone */}
                <div className="pos-card p-8 border-2 border-dashed border-slate-400 hover:border-blue-600 transition-all text-center relative cursor-pointer group bg-white">
                  <input
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">
                        {selectedFile ? selectedFile.name : 'Select or drop file here'}
                      </p>
                    </div>
                    {selectedFile && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {filePreviewContent && (
                  <div className="pos-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-950 flex items-center space-x-1.5">
                        <Eye className="h-3.5 w-3.5 text-blue-700" />
                        <span>Preview</span>
                      </span>
                      <span className="text-[11px] text-slate-800 font-bold">
                        {filePreviewContent.split('\n').length} Rows
                      </span>
                    </div>
                    <pre className="bg-slate-950 text-slate-100 p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                      {filePreviewContent.split('\n').slice(0, 6).join('\n')}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Col: Configuration */}
              <div className="space-y-4">
                <div className="pos-card p-5 space-y-4 border-slate-300">
                  <h3 className="font-bold text-sm text-slate-950 flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <span>Upload Settings</span>
                  </h3>

                  <div>
                    <label className="text-xs font-bold text-slate-950 block mb-1">
                      Retailer
                    </label>
                    <select
                      value={uploadRetailer}
                      onChange={(e) => setUploadRetailer(e.target.value)}
                      className="w-full bg-white border border-slate-400 rounded-xl px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    >
                      <option value="AUTO">Auto-Detect</option>
                      <option value="HOBBY_LOBBY">Hobby Lobby</option>
                      <option value="FIVE_BELOW">Five Below</option>
                      <option value="KOHLS">Kohl&apos;s</option>
                      <option value="MIS">MIS</option>
                    </select>
                  </div>

                  {uploadRetailer === 'FIVE_BELOW' && (
                    <div>
                      <label className="text-xs font-bold text-slate-950 block mb-1">
                        Five Below Family
                      </label>
                      <select
                        value={uploadFamily}
                        onChange={(e) => setUploadFamily(e.target.value)}
                        className="w-full bg-white border border-slate-400 rounded-xl px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      >
                        <option value="AUTO">Auto-Detect</option>
                        <option value="BOOKS">Books</option>
                        <option value="PARTY_GAG">Party &amp; Gag</option>
                        <option value="CREATE">Create</option>
                        <option value="STATIONARY">Stationary</option>
                        <option value="TOY">Toys</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-950 block mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="Optional department tag"
                      value={uploadDepartment}
                      onChange={(e) => setUploadDepartment(e.target.value)}
                      className="w-full bg-white border border-slate-400 rounded-xl px-3 py-2 text-xs font-bold text-slate-950 placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!filePreviewContent || uploading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                </div>

                {uploadResult && (
                  <div className={`p-4 rounded-xl border ${
                    uploadResult.success ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {uploadResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-rose-700" />
                      )}
                      <span className={`text-xs font-bold ${uploadResult.success ? 'text-emerald-950' : 'text-rose-950'}`}>
                        {uploadResult.success ? 'Uploaded Successfully' : 'Upload Failed'}
                      </span>
                    </div>

                    {uploadResult.batch && (
                      <div className="mt-3 text-xs space-y-1 text-slate-950 font-semibold">
                        <div className="flex justify-between">
                          <span className="text-slate-800">Batch:</span>
                          <span className="font-mono text-blue-800 font-bold">{uploadResult.batch.id.slice(0, 16)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-800">Retailer:</span>
                          <span className="font-bold text-slate-950">{uploadResult.batch.retailerCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-800">Valid Rows:</span>
                          <span className="text-emerald-800 font-black">{uploadResult.batch.validRows}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ----------------- TAB: BATCH AUDIT LOG ----------------- */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Batches</h2>

            <div className="pos-card overflow-hidden">
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left pos-table">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Retailer</th>
                      <th>File Name</th>
                      <th>Family / Dept</th>
                      <th>Total Rows</th>
                      <th>Valid Rows</th>
                      <th>Error Rows</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id}>
                        <td className="font-mono text-xs text-blue-800 font-bold">{b.id}</td>
                        <td>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-950 border border-slate-300">
                            {b.retailerCode}
                          </span>
                        </td>
                        <td className="text-xs font-bold text-slate-950">{b.fileName}</td>
                        <td className="text-xs font-semibold text-slate-800">{b.reportFamily || b.departmentTag || '-'}</td>
                        <td className="text-xs font-bold text-slate-900">{b.totalRows}</td>
                        <td className="text-xs font-black text-emerald-800">{b.validRows}</td>
                        <td className="text-xs font-black text-rose-800">{b.errorRows}</td>
                        <td>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-amber-100 text-amber-950 border border-amber-300'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="text-xs font-bold text-slate-700">{new Date(b.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: HOBBY LOBBY POS ----------------- */}
        {activeTab === 'hobby_lobby' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Hobby Lobby</h2>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-700 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter by Buyer..."
                    value={hlBuyerFilter}
                    onChange={(e) => setHlBuyerFilter(e.target.value)}
                    className="bg-white border border-slate-400 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-950 placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-700 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter by SKU..."
                    value={hlSkuFilter}
                    onChange={(e) => setHlSkuFilter(e.target.value)}
                    className="bg-white border border-slate-400 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-950 placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Hobby Lobby Data Grid */}
            <div className="pos-card overflow-hidden">
              <div className="p-4 border-b border-slate-300 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-950">Records ({filteredHlData.length})</h3>
              </div>

              <div className="overflow-x-auto max-h-[550px] bg-white">
                <table className="w-full text-left pos-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Buyer</th>
                      <th>Vendor</th>
                      <th>Item / SKU</th>
                      <th>Description</th>
                      <th>Stock #</th>
                      <th>Size / Color</th>
                      <th>Sell Down</th>
                      <th>On Hand</th>
                      <th>On Order</th>
                      <th>Cost</th>
                      <th>Price</th>
                      <th>2 YR Sales</th>
                      <th>LY Sales</th>
                      <th>12M Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHlData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-xs text-slate-950 font-bold">{row.company}</td>
                        <td className="text-xs">
                          <span className="font-black text-blue-800">{row.buyerName}</span>
                          <span className="text-slate-700 ml-1 font-semibold">({row.buyerNumber})</span>
                        </td>
                        <td className="text-xs">
                          <span className="text-slate-900 font-bold">{row.vendorName}</span>
                          <span className="text-slate-700 ml-1 font-semibold">({row.vendorNumber})</span>
                        </td>
                        <td className="font-mono text-xs text-amber-800 font-black">{row.itemNumber}</td>
                        <td className="text-xs text-slate-900 font-semibold max-w-[180px] truncate">{row.itemDescription}</td>
                        <td className="font-mono text-xs text-slate-800 font-bold">{row.vendorStockNumber || '-'}</td>
                        <td className="text-xs text-slate-800 font-bold">{row.size} / {row.color}</td>
                        <td className="text-xs font-black text-emerald-800">{row.sellDown}%</td>
                        <td className="text-xs font-black text-slate-950">{row.onHand.toLocaleString()}</td>
                        <td className="text-xs text-slate-900 font-bold">{row.onOrder.toLocaleString()}</td>
                        <td className="text-xs text-slate-900 font-bold">${row.firstCost.toFixed(2)}</td>
                        <td className="text-xs font-black text-slate-950">${row.retailPrice.toFixed(2)}</td>
                        <td className="text-xs text-slate-900 font-bold">${row.sales2Yr.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                        <td className="text-xs text-slate-900 font-bold">${row.salesLY.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                        <td className="text-xs font-black text-emerald-800">${row.sales12M.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: FIVE BELOW POS ----------------- */}
        {activeTab === 'five_below' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Five Below</h2>

              {/* Family Filter Tabs */}
              <div className="flex items-center bg-slate-200/90 rounded-xl p-1 space-x-1 border border-slate-300">
                {['ALL', 'TOY', 'PARTY_GAG', 'BOOKS', 'CREATE', 'STATIONARY'].map((fam) => (
                  <button
                    key={fam}
                    onClick={() => setFbFamilyFilter(fam)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      fbFamilyFilter === fam ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-800 hover:text-black'
                    }`}
                  >
                    {fam.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Five Below Data Grid */}
            <div className="pos-card overflow-hidden">
              <div className="p-4 border-b border-slate-300 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-950">Records ({filteredFbData.length})</h3>
              </div>

              <div className="overflow-x-auto max-h-[550px] bg-white">
                <table className="w-full text-left pos-table">
                  <thead>
                    <tr>
                      <th>Family</th>
                      <th>Department</th>
                      <th>SKU &amp; Description</th>
                      <th>GTIN</th>
                      <th>Price</th>
                      <th>Cost</th>
                      <th>Sales WTD</th>
                      <th>Sales LCW</th>
                      <th>Sell-Thru</th>
                      <th>Inv OH</th>
                      <th>Store OH</th>
                      <th>DC OH</th>
                      <th>WOH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFbData.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                            {row.reportFamily}
                          </span>
                        </td>
                        <td className="text-xs font-bold text-slate-950">{row.department}</td>
                        <td className="text-xs">
                          <span className="font-mono text-amber-800 font-black">{row.sku}</span>
                          <span className="text-slate-800 block text-[11px] font-bold truncate max-w-[160px]">{row.skuDesc || row.styleDesc}</span>
                        </td>
                        <td className="font-mono text-xs text-slate-800 font-bold">{row.gtin || '-'}</td>
                        <td className="text-xs font-black text-slate-950">${(row.currUnitRetailPrice || 0).toFixed(2)}</td>
                        <td className="text-xs text-slate-900 font-bold">${(row.itemCost || 0).toFixed(2)}</td>
                        <td className="text-xs text-slate-900 font-mono font-bold">
                          {row.salesUWTD}u
                        </td>
                        <td className="text-xs text-slate-950 font-mono font-black">
                          {row.salesULCW}u
                        </td>
                        <td className="text-xs font-black text-emerald-800">
                          {row.storeSellThruLCW ? `${row.storeSellThruLCW}%` : '-'}
                        </td>
                        <td className="text-xs font-black text-slate-950">{row.invOHU?.toLocaleString()}</td>
                        <td className="text-xs text-slate-900 font-bold">{row.storeOHU?.toLocaleString()}</td>
                        <td className="text-xs font-mono text-blue-800 font-bold">
                          {row.dc3OHU ? `DC3:${row.dc3OHU} | DC4:${row.dc4OHU}` : `${row.dcOHU || 0}`}
                        </td>
                        <td className="text-xs font-black text-amber-800">{row.wohLCW || '-'} wks</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
