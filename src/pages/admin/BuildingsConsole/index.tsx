import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';
import { 
  Building, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  AlertCircle, 
  Check, 
  Trash2, 
  Sparkles, 
  Info,
  Building2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { BuildingItem } from '../types';

// Import newly refactored subcomponents
import BuildingsFilterBar from './BuildingsFilterBar';
import BuildingDetailsModal from './BuildingDetailsModal';
import BuildingsGridView from './BuildingsGridView';
import BuildingsListView from './BuildingsListView';
import BuildingFormModal from './BuildingFormModal';

export default function BuildingsConsole() {
  const { user } = useAuth();
  const { settings } = useGlobalSettings();
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modals & Detail panels
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<BuildingItem | null>(null);

  const [buildingToDelete, setBuildingToDelete] = useState<BuildingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Success / Error alerts
  const [consoleSuccess, setConsoleSuccess] = useState('');
  const [consoleError, setConsoleError] = useState('');

  // Bulk import and export states
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isDragOverCsv, setIsDragOverCsv] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/buildings');
      if (!res.ok) throw new Error("Failed to fetch buildings");
      const data = await res.json();
      setBuildings(data.buildings || []);
    } catch (err: any) {
      console.error(err);
      setConsoleError("Could not fetch buildings. Database sync issues detected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleOpenAdd = () => {
    setSelectedBuilding(null);
    setConsoleSuccess('');
    setConsoleError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (bld: BuildingItem) => {
    setSelectedBuilding(bld);
    setConsoleSuccess('');
    setConsoleError('');
    setShowFormModal(true);
  };

  const handleDelete = (bld: BuildingItem) => {
    setConsoleSuccess('');
    setConsoleError('');
    setBuildingToDelete(bld);
  };

  const handleDeleteConfirm = async () => {
    if (!buildingToDelete) return;

    setConsoleSuccess('');
    setConsoleError('');
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/buildings/${buildingToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Database deletion block error.");
      }
      setConsoleSuccess(`Building "${buildingToDelete.name}" soft-deleted successfully.`);
      setBuildingToDelete(null);
      await fetchBuildings();
    } catch (err: any) {
      console.error(err);
      setConsoleError("Encountered problem processing request: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- CSV / TEXT BULK IMPORTER & EXPORTER UTILS ---
  const loadSampleCsv = () => {
    const headers = [
      "Building Name",
      "Management Company",
      "Management Email",
      "Address",
      "City",
      "Country",
      "Floors",
      "Makani Number",
      "Google Map URL",
      "Security Company Name",
      "Security Company Contact",
      "Gas Company Name",
      "Gas Company Contact"
    ].join(",");
    const sampleRecord = [
      "Marina Sky Heights Tower",
      "Emaar Properties PJSC",
      "marina.heights@emaar.ae",
      "Al Marsa Street, Marina West",
      "Dubai",
      "United Arab Emirates",
      "45",
      "18954 90280",
      "https://maps.google.com/?q=@25.2048,55.2708",
      "First Security Group",
      "+971 4 411 9000",
      "Lootah Gas Network",
      "800-LOOTAH"
    ].map(v => `"${v}"`).join(",");
    setImportCsvText(headers + "\n" + sampleRecord);
    setImportError('');
    setImportSuccess('Sample building template loaded. Click Import to Parse.');
  };

  const parseAndPreviewCsv = (text: string) => {
    setImportError('');
    setImportPreview([]);
    if (!text.trim()) {
      return;
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setImportError("CSV must contain a header row followed by at least 1 record row.");
      return;
    }

    const parseCsvLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      return values;
    };

    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    const tempPreview: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      if (cells.length === 0 || (cells.length === 1 && cells[0] === "")) continue;

      const record: any = {};
      headers.forEach((h, index) => {
        const val = cells[index] || '';
        if (h.includes("building name") || h === "name") record.name = val;
        else if (h.includes("management company") || h.includes("mgmt company") || h.includes("company")) record.managementCompany = val;
        else if (h.includes("email") || h.includes("mgmt email") || h.includes("management email")) record.managementEmail = val;
        else if (h.includes("address") || h.includes("street")) record.address = val;
        else if (h === "city") record.city = val;
        else if (h === "country") record.country = val;
        else if (h.includes("floor")) record.floors = Number(val) || 1;
        else if (h.includes("makani")) record.makaniNumber = val;
        else if (h.includes("map") || h.includes("coords") || h.includes("coordinate")) record.googleMapUrl = val;
        else if (h.includes("security company") || h.includes("security name")) record.securityCompanyName = val;
        else if (h.includes("security contact") || h.includes("security phone")) record.securityCompanyContact = val;
        else if (h.includes("gas company") || h.includes("gas name")) record.gasCompanyName = val;
        else if (h.includes("gas contact") || h.includes("gas phone")) record.gasCompanyContact = val;
        else if (h.includes("cooling company")) record.coolingCompanyName = val;
        else if (h.includes("cooling contact")) record.coolingCompanyContact = val;
        else if (h.includes("internet company") || h.includes("internet provider")) record.internetProviderName = val;
        else if (h.includes("internet contact")) record.internetProviderContact = val;
      });

      if (!record.name) {
        setImportError(`Row ${i} is missing high-priority 'Building Name' field.`);
        return;
      }
      if (!record.city) record.city = "Dubai";
      if (!record.country) record.country = "United Arab Emirates";
      if (record.floors === undefined) record.floors = 1;

      tempPreview.push(record);
    }

    setImportPreview(tempPreview);
  };

  const handleCsvFileLoad = (file: File) => {
    if (!file) return;
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv' || file.name.endsWith('.txt');
    if (!isCsv) {
      setImportError("Invalid file type. Please upload a valid CSV file (.csv) or text file (.txt).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setImportCsvText(text);
        setImportSuccess(`Loaded file "${file.name}"! Correct fields mapped.`);
        parseAndPreviewCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (importPreview.length === 0) return;
    setIsBulkImporting(true);
    setImportSuccess('');
    setImportError('');
    let importedCount = 0;

    try {
      for (const item of importPreview) {
        const generatedId = `building_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const res = await fetch('/api/admin/buildings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: generatedId,
            ...item
          })
        });
        if (res.ok) {
          importedCount++;
        }
      }

      setImportSuccess(`Successfully imported and synched ${importedCount} building profiles into structural memory!`);
      setImportPreview([]);
      setImportCsvText('');
      await fetchBuildings();
      setTimeout(() => setShowBulkImport(false), 2000);
    } catch (err: any) {
      setImportError(`Error uploading imported cells: ${err.message}`);
    } finally {
      setIsBulkImporting(false);
    }
  };

  const escapeCsvValue = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const substringToFit = (str: string, maxLen: number): string => {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 2) + "..";
  };

  const handleExportCSV = () => {
    const listToExport = filteredBuildings.length > 0 ? filteredBuildings : buildings;
    const headers = [
      "Building ID",
      "Building Name",
      "Management Company",
      "Management Email",
      "Address",
      "City",
      "Country",
      "Floors",
      "Makani Number",
      "Google Map URL",
      "Security Company Name",
      "Security Company Contact",
      "Gas Company Name",
      "Gas Company Contact",
      "Cooling Company Name",
      "Cooling Company Contact",
      "Internet Provider Name",
      "Internet Provider Contact"
    ];
    const csvRows = [headers.join(',')];

    listToExport.forEach(bld => {
      const row = [
        escapeCsvValue(bld.id),
        escapeCsvValue(bld.name),
        escapeCsvValue(bld.managementCompany),
        escapeCsvValue(bld.managementEmail),
        escapeCsvValue(bld.address),
        escapeCsvValue(bld.city),
        escapeCsvValue(bld.country),
        escapeCsvValue(bld.floors),
        escapeCsvValue(bld.makaniNumber),
        escapeCsvValue(bld.googleMapUrl),
        escapeCsvValue(bld.securityCompanyName),
        escapeCsvValue(bld.securityCompanyContact),
        escapeCsvValue(bld.gasCompanyName),
        escapeCsvValue(bld.gasCompanyContact),
        escapeCsvValue(bld.coolingCompanyName),
        escapeCsvValue(bld.coolingCompanyContact),
        escapeCsvValue(bld.internetProviderName),
        escapeCsvValue(bld.internetProviderContact)
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `buildings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const listToExport = filteredBuildings.length > 0 ? filteredBuildings : buildings;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Header Background
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 297, 24, 'F');

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("AUTHENTIC HOLIDAY HOMES — BUILDINGS REGISTRY REPORT", 15, 15);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${new Date().toLocaleString()} | Total items: ${listToExport.length}`, 220, 15);

    doc.setTextColor(24, 24, 27);
    const yStart = 35;
    const cols = [
      { name: "Building Name", x: 15 },
      { name: "Management Company", x: 65 },
      { name: "City / Country", x: 110 },
      { name: "Address", x: 145 },
      { name: "Makani", x: 195 },
      { name: "Floors", x: 220 },
      { name: "Emergency Security", x: 235 }
    ];

    // Table Header Accent
    doc.setFillColor(244, 244, 245);
    doc.rect(12, yStart - 5, 273, 8, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    cols.forEach(col => {
      doc.text(col.name, col.x, yStart);
    });

    let currentY = yStart + 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    listToExport.forEach((bld, idx) => {
      if (currentY > 192) {
        doc.addPage();

        // Repeating Header
        doc.setFillColor(24, 24, 27);
        doc.rect(0, 0, 297, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("AUTHENTIC HOLIDAY HOMES — BUILDINGS REGISTRY REPORT (CONTINUED)", 15, 11);

        doc.setFillColor(244, 244, 245);
        doc.rect(12, 28, 273, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(24, 24, 27);
        cols.forEach(col => {
          doc.text(col.name, col.x, 33);
        });

        currentY = 41;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(12, currentY - 4.5, 273, 7, 'F');
      }

      doc.setTextColor(40, 40, 40);
      doc.text(substringToFit(bld.name || '', 24), 15, currentY);
      doc.text(substringToFit(bld.managementCompany || 'Independently Logged', 22), 65, currentY);
      doc.text(substringToFit(`${bld.city || 'Dubai'}, ${bld.country || 'UAE'}`, 18), 110, currentY);
      doc.text(substringToFit(bld.address || '', 26), 145, currentY);
      doc.text(substringToFit(bld.makaniNumber || 'NoneSpecified', 12), 195, currentY);
      doc.text(String(bld.floors || 1), 220, currentY);
      doc.text(substringToFit(bld.securityCompanyName || 'No Security', 22), 235, currentY);

      doc.setDrawColor(240, 240, 240);
      doc.line(12, currentY + 3, 285, currentY + 3);

      currentY += 7.5;
    });

    doc.save(`buildings_registry_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredBuildings = buildings.filter(bld => 
    bld.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bld.managementCompany && bld.managementCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (bld.city && bld.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-650 dark:text-emerald-500" />
            Buildings & Properties
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure buildings profile details, geo directions, emergency contacts (security & gas providers), and management info.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            id="btn-open-bulk-import-bld"
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
            Bulk Operations
          </button>
          <button
            onClick={handleOpenAdd}
            id="btn-register-bld"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Building Profile
          </button>
        </div>
      </div>

      {/* Bulk Operations Panel */}
      {showBulkImport && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500 animate-pulse" />
                Bulk Management (Buildings Inventory)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Bulk upload from spreadsheets or export fully updated data as CSV or formatted PDF.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                id="btn-export-bld-csv"
                className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[11px] font-bold text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" /> Export .CSV
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                id="btn-export-bld-pdf"
                className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[11px] font-bold text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-red-500" /> Export PDF Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drag and Drop Zone */}
            <div className="space-y-4">
              <input
                type="file"
                ref={csvFileInputRef}
                className="hidden"
                accept=".csv,text/csv,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvFileLoad(file);
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverCsv(true);
                }}
                onDragLeave={() => setIsDragOverCsv(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOverCsv(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleCsvFileLoad(file);
                }}
                onClick={() => csvFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragOverCsv
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                    Drag & drop your CSV file here, or <span className="text-blue-600 hover:underline">browse files</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans">
                    Supports fully offline standard UTF-8 .csv files
                  </p>
                </div>
              </div>

              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-150 dark:border-zinc-800"></div>
                </div>
                <span className="relative px-3 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
                  Or pasted manual input
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-550 dark:text-zinc-400">
                  <span>Paste Raw CSV Values manually:</span>
                  <button
                    type="button"
                    onClick={loadSampleCsv}
                    className="text-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-1 normal-case font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Load Template
                  </button>
                </div>

                <textarea
                  value={importCsvText}
                  onChange={(e) => {
                    setImportCsvText(e.target.value);
                    parseAndPreviewCsv(e.target.value);
                  }}
                  placeholder="Building Name,Management Company,Management Email,Address,City,Country,Floors,Makani Number"
                  rows={4}
                  className="w-full px-3.5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-mono outline-none focus:ring-1 focus:ring-zinc-450 transition-all resize-y text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Live Parsing preview and action */}
            <div className="space-y-4">
              <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-450 font-sans">Parsing Preview Table</h4>

              {importError && (
                <div className="p-3 bg-red-50 dark:bg-red-955/20 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-center gap-1.5 border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-650 dark:text-emerald-450 text-xs rounded-xl flex items-center gap-1.5 border border-emerald-100">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{importSuccess}</span>
                </div>
              )}

              {importPreview.length > 0 ? (
                <div className="space-y-3">
                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-extrabold uppercase">
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Management</th>
                          <th className="p-2.5">City</th>
                          <th className="p-2.5">Floors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((item, idx) => (
                          <tr key={idx} className="border-b border-zinc-150/50 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-350">
                            <td className="p-2.5 font-bold">{item.name}</td>
                            <td className="p-2.5">{item.managementCompany || 'Independently'}</td>
                            <td className="p-2.5">{item.city}</td>
                            <td className="p-2.5">{item.floors}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2.5 px-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold">
                      Parsed {importPreview.length} structures ready for processing.
                    </span>
                    <button
                      type="button"
                      disabled={isBulkImporting}
                      onClick={handleConfirmImport}
                      className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {isBulkImporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Inserting...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Process & Commit Records
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <Info className="w-6 h-6 text-zinc-350" />
                  <span className="font-sans">No parsed preview available. Upload or load template to review columns.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Console Alerts */}
      {consoleError && (
        <div className="p-4 bg-red-50 dark:bg-red-955/20 text-red-750 dark:text-red-400 text-xs rounded-2xl flex items-center gap-3 border border-red-105 font-sans shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <div className="flex-1 font-medium">{consoleError}</div>
          <button onClick={() => setConsoleError('')} className="text-red-400 hover:text-red-650 font-bold px-2">✕</button>
        </div>
      )}

      {consoleSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-755 dark:text-emerald-450 text-xs rounded-2xl flex items-center gap-3 border border-emerald-100 font-sans shadow-xs">
          <Check className="w-4 h-4 shrink-0 text-emerald-500" />
          <div className="flex-1 font-medium">{consoleSuccess}</div>
          <button onClick={() => setConsoleSuccess('')} className="text-emerald-450 hover:text-emerald-650 font-bold px-2">✕</button>
        </div>
      )}

      {/* Filter bar */}
      <BuildingsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        onRefresh={fetchBuildings}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-101 dark:border-zinc-800 space-y-2 font-sans">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500 animate-infinite" />
          <p className="text-xs text-zinc-400">Loading building metrics...</p>
        </div>
      ) : filteredBuildings.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-101 dark:border-zinc-800 p-12 text-center font-sans">
          <Building2 className="w-8 h-8 mx-auto text-zinc-350 dark:text-zinc-650 mb-2" />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No buildings registered yet</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 font-sans">
            Buildings collect metadata coordinates and structural info. Add your first building to group your listings nicely.
          </p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <BuildingsGridView
            buildings={filteredBuildings}
            onViewDetails={setShowDetailModal}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        ) : (
          <BuildingsListView
            buildings={filteredBuildings}
            onViewDetails={setShowDetailModal}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        )
      )}

      {/* FORM MODAL */}
      {showFormModal && (
        <BuildingFormModal
          selectedBuilding={selectedBuilding}
          onClose={() => {
            setShowFormModal(false);
            setSelectedBuilding(null);
          }}
          onRefresh={fetchBuildings}
          onConsoleSuccess={setConsoleSuccess}
          onConsoleError={setConsoleError}
        />
      )}

      {/* DETAIL SPECTATOR MODAL */}
      {showDetailModal && (
        <BuildingDetailsModal
          building={showDetailModal}
          onClose={() => setShowDetailModal(null)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {buildingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-955/10 flex items-center justify-center shrink-0 border border-red-105 dark:border-red-900/40">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans">
                  Delete Building Profile?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
                  Are you sure you want to delete building <strong className="font-semibold text-zinc-800 dark:text-zinc-250">"{buildingToDelete.name}"</strong>?
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Existing units under this building profile will preserve their references, but new properties won't be able to link to this building, and address metadata will be soft-deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-end">
              <button
                type="button"
                onClick={() => setBuildingToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-350 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-805 transition-all cursor-pointer font-sans"
              >
                No, Keep Profile
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                id="btn-confirm-bld-deletion"
                className="px-4 py-2 bg-red-650 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    Yes, Delete Building
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
