import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Plus, Upload, Download, FileText, Loader2, AlertCircle, Check, Trash2, HelpCircle, Landmark, User, CreditCard
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { LandlordItem } from '../types';

// Import newly refactored subcomponents
import LandlordsFilterBar from './LandlordsFilterBar';
import LandlordDetailsModal from './LandlordDetailsModal';
import LandlordsGridView from './LandlordsGridView';
import LandlordsListView from './LandlordsListView';
import LandlordFormModal from './LandlordFormModal';
import Pagination from '../../../components/Pagination';

export default function LandlordsConsole() {
  const { user, profile } = useAuth();
  const [landlords, setLandlords] = useState<LandlordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 9 : 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, searchQuery]);

  // Modal & form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState<LandlordItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<LandlordItem | null>(null);
  const [landlordToDelete, setLandlordToDelete] = useState<LandlordItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Import operations
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [consoleSuccess, setConsoleSuccess] = useState('');
  const [consoleError, setConsoleError] = useState('');

  const getSecureDocViewUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.includes('/api/admin/view-document')) return url;
    const token = localStorage.getItem('ahh_token') || '';
    return `${window.location.origin}/api/admin/view-document?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`;
  };

  const fetchLandlords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/landlords');
      if (!res.ok) throw new Error("Failed to fetch landlords");
      const data = await res.json();
      setLandlords(data.landlords || []);
    } catch (err: any) {
      console.error(err);
      setConsoleError("Could not load landlords. Verify DB/network adapter is functioning.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandlords();
  }, []);

  const handleOpenAdd = () => {
    setSelectedLandlord(null);
    setConsoleSuccess('');
    setConsoleError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (land: LandlordItem) => {
    setSelectedLandlord(land);
    setConsoleSuccess('');
    setConsoleError('');
    setShowFormModal(true);
  };

  const handleDelete = (land: LandlordItem) => {
    setConsoleSuccess('');
    setConsoleError('');
    setLandlordToDelete(land);
  };

  const handleDeleteConfirm = async () => {
    if (!landlordToDelete) return;

    setConsoleSuccess('');
    setConsoleError('');
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/landlords/${landlordToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Deletion request failed.");
      }
      setConsoleSuccess(`Landlord "${landlordToDelete.fullName}" soft-deleted successfully.`);
      setLandlordToDelete(null);
      await fetchLandlords();
    } catch (err: any) {
      console.error(err);
      setConsoleError("Encountered an issue deleting landlord: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- PROGRAMMATIC EXPORTS (CSV / PDF) ---
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
    const listToExport = filteredLandlords.length > 0 ? filteredLandlords : landlords;
    const headers = [
      "ID", "Full Name", "Email", "Phone", "Nationality", "Identity Number",
      "Bank Name", "Account Holder Name", "Account Number", "IBAN", "SWIFT Code", "Bank Branch"
    ];
    
    const csvRows = [headers.join(',')];
    
    listToExport.forEach(land => {
      const row = [
        escapeCsvValue(land.id),
        escapeCsvValue(land.fullName),
        escapeCsvValue(land.email),
        escapeCsvValue(land.phone),
        escapeCsvValue(land.nationality),
        escapeCsvValue(land.identityNumber),
        escapeCsvValue(land.bankName),
        escapeCsvValue(land.bankAccountHolder),
        escapeCsvValue(land.bankAccountNumber),
        escapeCsvValue(land.iban),
        escapeCsvValue(land.swiftCode),
        escapeCsvValue(land.bankBranch)
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `landlords_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const listToExport = filteredLandlords.length > 0 ? filteredLandlords : landlords;
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    
    // Header Background
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 297, 24, 'F');
    
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("AUTHENTIC HOLIDAY HOMES — LANDLORDS REGISTRY REPORT", 15, 15);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${new Date().toLocaleString()} | Total items: ${listToExport.length}`, 220, 15);
    
    doc.setTextColor(24, 24, 27);
    const yStart = 35;
    const cols = [
      { name: "Full Name", x: 15 },
      { name: "Email", x: 62 },
      { name: "Phone", x: 115 },
      { name: "Nationality", x: 150 },
      { name: "ID / Passport", x: 175 },
      { name: "Bank Name", x: 215 },
      { name: "IBAN", x: 242 }
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
    
    listToExport.forEach((land, idx) => {
      if (currentY > 192) {
        doc.addPage();
        
        // Repeating Header
        doc.setFillColor(24, 24, 27);
        doc.rect(0, 0, 297, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("AUTHENTIC HOLIDAY HOMES — LANDLORDS REGISTRY REPORT (CONTINUED)", 15, 11);
        
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
      
      // Alternating row highlights
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(12, currentY - 4.5, 273, 7, 'F');
      }
      
      doc.setTextColor(40, 40, 40);
      doc.text(substringToFit(land.fullName || '', 22), 15, currentY);
      doc.text(substringToFit(land.email || '', 26), 62, currentY);
      doc.text(substringToFit(land.phone || '', 18), 115, currentY);
      doc.text(substringToFit(land.nationality || '', 12), 150, currentY);
      doc.text(substringToFit(land.identityNumber || '', 18), 175, currentY);
      doc.text(substringToFit(land.bankName || '', 14), 215, currentY);
      doc.text(substringToFit(land.iban || '', 24), 242, currentY);
      
      // Horizontal border line
      doc.setDrawColor(240, 240, 240);
      doc.line(12, currentY + 3, 285, currentY + 3);
      
      currentY += 7.5;
    });
    
    doc.save(`landlords_payout_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- CSV / TEXT IMPORTER LOGIC ---
  const handleImportTextChange = (text: string) => {
    setImportText(text);
    setImportError('');
    setImportSuccess('');

    if (!text.trim()) {
      setParsedItems([]);
      return;
    }

    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setImportError("Input must contain at least a header line and one data row.");
        setParsedItems([]);
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

      const rawHeaders = parseCsvLine(lines[0]);
      const normalizedHeaders = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      // Check required headers
      const hasFullName = normalizedHeaders.some(h => h === 'fullname' || h === 'name' || h === 'landlordname');

      if (!hasFullName) {
        setImportError("CSV/Text headers must include 'FullName' or 'Name' so records can be mapped correctly.");
        setParsedItems([]);
        return;
      }

      const results: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length === 0 || (values.length === 1 && !values[0])) continue;

        const record: any = {};
        normalizedHeaders.forEach((header, index) => {
          const val = values[index] || '';
          if (header === 'fullname' || header === 'name' || header === 'landlordname') {
            record.fullName = val;
          } else if (header === 'email' || header === 'emailaddress' || header === 'mail') {
            record.email = val;
          } else if (header === 'phone' || header === 'phonenumber' || header === 'telephone' || header === 'tel') {
            record.phone = val;
          } else if (header === 'nationality' || header === 'nation') {
            record.nationality = val;
          } else if (header === 'identitynumber' || header === 'passport' || header === 'idnumber' || header === 'emiratesid') {
            record.identityNumber = val;
          } else if (header === 'bankname' || header === 'bank') {
            record.bankName = val;
          } else if (header === 'accountholder' || header === 'bankaccountholder' || header === 'holdername') {
            record.bankAccountHolder = val;
          } else if (header === 'accountnumber' || header === 'bankaccountnumber' || header === 'accnum') {
            record.bankAccountNumber = val;
          } else if (header === 'swiftcode' || header === 'swift' || header === 'bic') {
            record.swiftCode = val;
          } else if (header === 'iban') {
            record.iban = val;
          } else if (header === 'bankbranch' || header === 'branch') {
            record.bankBranch = val;
          }
        });

        if (record.fullName) {
          results.push(record);
        }
      }

      setParsedItems(results);
      if (results.length === 0) {
        setImportError("Could not extract any records with a valid Full Name. Ensure headers and data are separated correctly.");
      }
    } catch (e: any) {
      setImportError(`Parsing issue: ${e.message}`);
      setParsedItems([]);
    }
  };

  const handleFileUploadImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        handleImportTextChange(text);
      }
    };
    reader.readAsText(file);
  };

  const handleCommitBulkImport = async () => {
    if (parsedItems.length === 0) return;
    setIsImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const res = await fetch('/api/admin/landlords/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlords: parsedItems })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Bulk submission rejected by server.");
      }

      const data = await res.json();
      setImportSuccess(`Successfully imported ${data.count} landlord records into the database!`);
      setImportText('');
      setParsedItems([]);
      await fetchLandlords();
      setTimeout(() => setShowBulkImportModal(false), 2000);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Failed to commit bulk import profiles.");
    } finally {
      setIsImporting(false);
    }
  };

  const filteredLandlords = landlords.filter(land => 
    land.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    land.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (land.phone && land.phone.includes(searchQuery))
  );

  const totalPages = Math.ceil(filteredLandlords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLandlords = filteredLandlords.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-zinc-500" />
            Landlords & Owners
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage owners, document compliance records, nationality data, and linked bank payout credentials.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setImportText('');
              setParsedItems([]);
              setImportError('');
              setImportSuccess('');
              setShowBulkImportModal(true);
            }}
            id="btn-open-landlord-import"
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Bulk Import registered owners"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            Bulk Import
          </button>
          
          <button
            onClick={handleExportCSV}
            id="btn-export-landlord-csv"
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Download records as .csv spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            Export CSV
          </button>
          
          <button
            onClick={handleExportPDF}
            id="btn-export-landlord-pdf"
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Generate custom PDF report"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            Export PDF
          </button>

          <button
            onClick={handleOpenAdd}
            id="btn-add-landlord-profile"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Owner
          </button>
        </div>
      </div>

      {/* Console Alerts */}
      {consoleError && (
        <div className="p-4 bg-red-50 dark:bg-red-955/20 text-red-755 dark:text-red-405 text-xs rounded-2xl flex items-center gap-3 border border-red-105 font-sans shadow-xs">
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

      {/* Filter and Search Bar */}
      <LandlordsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        onRefresh={fetchLandlords}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Grid/List Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-805 space-y-2 font-sans">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500 animate-infinite" />
          <p className="text-xs text-zinc-400">Querying registered landlord directory...</p>
        </div>
      ) : filteredLandlords.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-805 p-12 text-center font-sans">
          <Landmark className="w-8 h-8 mx-auto text-zinc-350 dark:text-zinc-650 mb-2" />
          <h2 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">No landlords matched your parameters</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 font-sans">
            Expand your search criteria or register a new owner to get started managing your units with structured relationships.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {viewMode === 'grid' ? (
            <LandlordsGridView
              landlords={paginatedLandlords}
              onViewDetails={setShowDetailModal}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              getSecureDocViewUrl={getSecureDocViewUrl}
            />
          ) : (
            <LandlordsListView
              landlords={paginatedLandlords}
              onViewDetails={setShowDetailModal}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              getSecureDocViewUrl={getSecureDocViewUrl}
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredLandlords.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* DETAILS VIEW MODAL */}
      {showDetailModal && (
        <LandlordDetailsModal
          landlord={showDetailModal}
          onClose={() => setShowDetailModal(null)}
          getSecureDocViewUrl={getSecureDocViewUrl}
        />
      )}

      {/* FORM FILL MODAL */}
      {showFormModal && (
        <LandlordFormModal
          selectedLandlord={selectedLandlord}
          onClose={() => {
            setShowFormModal(false);
            setSelectedLandlord(null);
          }}
          onRefresh={fetchLandlords}
          getSecureDocViewUrl={getSecureDocViewUrl}
        />
      )}

      {/* BULK IMPORT MODAL */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-zinc-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-850 dark:text-zinc-50 font-sans">
                    Bulk Landlords Import
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="p-1 px-2.5 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-50 text-xs rounded-xl transition-all cursor-pointer font-sans"
                >
                  ✕ Close
                </button>
              </div>

              {/* Status alerts */}
              {importError && (
                <div className="p-3 bg-red-50 dark:bg-red-955/20 text-red-750 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 border border-red-105">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-705 dark:text-emerald-450 text-xs rounded-xl flex items-center gap-2 border border-emerald-100">
                  <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{importSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left side: Upload or Paste Input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">
                      Option A: Upload local CSV document
                    </label>
                    <div className="border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 text-center cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-all relative">
                      <input 
                        type="file" 
                        accept=".csv"
                        onChange={handleFileUploadImport}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-6 h-6 mx-auto text-zinc-400 mb-1.5" />
                      <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 font-sans">Choose .CSV file</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5 font-sans">UTF-8 comma-separated format</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 font-sans">
                        Option B: Paste raw CSV/TSV Text
                      </label>
                      <button
                        onClick={() => {
                          const demo = "FullName,Email,Phone,Nationality,IdentityNumber,BankName,AccountHolder,AccountNumber,IBAN,SwiftCode,BankBranch\nJohnathan Smith,johnathan@landmark.com,+97150000001,British,784-1990-1111111-1,Emirates NBD,Johnathan Smith,10101111111,AE450090000010101111111,EBILAEADXXX,Downtown Branch\nFatima Al Hashimi,fatima@emirates.ae,+97150000002,UAE,784-1995-2222222-2,ADCB,Fatima Al Hashimi,20202222222,AE450020000020202222222,ADCBXXXX,Yas Island Branch";
                          handleImportTextChange(demo);
                        }}
                        className="text-[9px] text-zinc-750 hover:underline bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-150 dark:border-zinc-850 font-bold font-sans cursor-pointer"
                      >
                        Load Template Text
                      </button>
                    </div>
                    <textarea
                      rows={7}
                      value={importText}
                      onChange={(e) => handleImportTextChange(e.target.value)}
                      placeholder="FullName,Email,Phone,Nationality,IdentityNumber,BankName,AccountHolder,AccountNumber,IBAN,SwiftCode,BankBranch"
                      className="w-full p-3 font-mono text-[10px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Right side: Live preview and mapping feedback */}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl p-4 space-y-3 flex flex-col justify-between font-sans">
                  <div>
                    <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-400 border-b border-zinc-150 dark:border-zinc-850 pb-1 flex items-center justify-between font-sans">
                      <span>Import Preview</span>
                      <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded text-[9px] font-bold">
                        {parsedItems.length} records parsed
                      </span>
                    </h4>

                    {parsedItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 h-48">
                        <HelpCircle className="w-8 h-8 mb-2 text-zinc-350" />
                        <p className="text-[11px] font-semibold font-sans">Ready to parse payload</p>
                        <p className="text-[9px] text-zinc-450 mt-1 max-w-[200px] font-sans">
                          Upload a spreadsheet document or copy list values into the input panel to see data mapped to fields.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto mt-2 pr-1 space-y-2 no-scrollbar text-[10px]">
                        {parsedItems.map((item, idx) => (
                          <div 
                            key={idx}
                            className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-2 rounded-lg relative"
                          >
                            <span className="absolute right-2 top-2 text-[9px] font-bold text-zinc-450">#{idx + 1}</span>
                            <p className="font-semibold text-zinc-850 dark:text-zinc-100 truncate max-w-[200px] font-sans">{item.fullName}</p>
                            <p className="text-zinc-450 truncate max-w-[200px] font-sans">{item.email || "No Email"}</p>
                            {item.bankName ? (
                              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-zinc-50 dark:border-zinc-950 text-[9px] text-zinc-700 dark:text-zinc-350 font-sans">
                                <CreditCard className="w-3 h-3 text-emerald-500" />
                                <span className="font-medium">{item.bankName} • {item.iban ? substringToFit(item.iban, 12) : 'No IBAN'}</span>
                              </div>
                            ) : (
                              <p className="text-[8.5px] text-zinc-400 italic mt-0.5 font-sans">No bank payout info mapped</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850">
                    <button
                      type="button"
                      disabled={parsedItems.length === 0 || isImporting}
                      onClick={handleCommitBulkImport}
                      className="w-full py-2 bg-emerald-650 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer font-sans"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          Importing profiles...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Confirm & Save Registry ({parsedItems.length} rows)
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-zinc-400 text-center mt-1.5 leading-relaxed font-sans">
                      Saving profiles generates customized landlord accounts. Ensure payment information or identity details are logged accurately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {landlordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-955/10 flex items-center justify-center shrink-0 border border-red-105 dark:border-red-900/40">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-450" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans">
                  Delete Landlord?
                </h3>
                <p className="text-xs text-zinc-505 leading-relaxed dark:text-zinc-400 font-sans">
                  Are you sure you want to delete landlord <strong className="font-semibold text-zinc-850 dark:text-zinc-200">"{landlordToDelete.fullName}"</strong>?
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Properties associated with this owner will be preserved, but their registered payout details, identity logs, and contact credentials will be soft-deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-end">
              <button
                type="button"
                onClick={() => setLandlordToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-zinc-51 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-350 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-805 transition-all cursor-pointer font-sans"
              >
                No, Keep Profile
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                id="btn-confirm-landlord-delete"
                className="px-4 py-2 bg-red-655 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer font-sans"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Delete Landlord
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
