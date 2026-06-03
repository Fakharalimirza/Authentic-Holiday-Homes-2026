import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, Search, Edit2, Trash2, Landmark, Mail, Phone, 
  MapPin, Globe, CreditCard, Shield, FileText, Upload, 
  Check, Loader2, AlertCircle, Eye, EyeOff, User, Download, ExternalLink, HelpCircle,
  LayoutGrid, List
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface Landlord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  identityNumber: string;
  identityDocumentUrl: string | null;
  nationality: string;
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  swiftCode: string;
  iban: string;
  bankBranch: string;
  createdAt?: string;
}

export default function LandlordsConsole() {
  const { user } = useAuth();
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal & form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<Landlord | null>(null);
  const [landlordToDelete, setLandlordToDelete] = useState<Landlord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [consoleSuccess, setConsoleSuccess] = useState('');
  const [consoleError, setConsoleError] = useState('');

  // Form fields
  const [formFields, setFormFields] = useState({
    fullName: '',
    email: '',
    phone: '',
    identityNumber: '',
    identityDocumentUrl: '',
    nationality: '',
    bankName: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    swiftCode: '',
    iban: '',
    bankBranch: ''
  });

  const fetchLandlords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/landlords');
      if (!res.ok) throw new Error("Failed to fetch landlords");
      const data = await res.json();
      setLandlords(data.landlords || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Could not load landlords. Verify DB/network adapter is functioning.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandlords();
  }, []);

  const handleOpenAdd = () => {
    setSelectedLandlord(null);
    setFormFields({
      fullName: '',
      email: '',
      phone: '',
      identityNumber: '',
      identityDocumentUrl: '',
      nationality: '',
      bankName: '',
      bankAccountHolder: '',
      bankAccountNumber: '',
      swiftCode: '',
      iban: '',
      bankBranch: ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setFormFields({
      fullName: landlord.fullName || '',
      email: landlord.email || '',
      phone: landlord.phone || '',
      identityNumber: landlord.identityNumber || '',
      identityDocumentUrl: landlord.identityDocumentUrl || '',
      nationality: landlord.nationality || '',
      bankName: landlord.bankName || '',
      bankAccountHolder: landlord.bankAccountHolder || '',
      bankAccountNumber: landlord.bankAccountNumber || '',
      swiftCode: landlord.swiftCode || '',
      iban: landlord.iban || '',
      bankBranch: landlord.bankBranch || ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowFormModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check if landlord name has been filled so upload directory is named nicely
    if (!formFields.fullName.trim()) {
      alert("Please enter the Landlord Full Name first to map files securely.");
      return;
    }

    setUploadingDoc(true);
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', 'landlord_documents');
    formData.append('identifier', formFields.fullName.trim());
    formData.append('docType', 'identity_document');

    try {
      const res = await fetch('/api/admin/upload-document', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed. Verify VPS / storage system availability.");
      const data = await res.json();
      setFormFields(prev => ({ ...prev, identityDocumentUrl: data.url }));
      setSuccessMsg(`"${file.name}" uploaded successfully!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to upload identity document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.fullName.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }
    if (!formFields.email.trim()) {
      setErrorMsg("Email address is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const landlordId = selectedLandlord ? selectedLandlord.id : `landlord_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    try {
      const res = await fetch('/api/admin/landlords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: landlordId,
          ...formFields
        })
      });

      if (!res.ok) throw new Error("Failed to persist landlord profile.");
      
      setSuccessMsg(selectedLandlord ? "Landlord details updated successfully!" : "Landlord registered successfully!");
      await fetchLandlords();
      setTimeout(() => setShowFormModal(false), 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not save landlord profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (landlord: Landlord) => {
    setConsoleSuccess('');
    setConsoleError('');
    setLandlordToDelete(landlord);
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

      // Safe parse cells checking quotes
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

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
            title="Bulk Import registered owners"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            Bulk Import
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
            title="Download records as .csv spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            Export CSV
          </button>
          
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
            title="Generate custom PDF report"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            Export PDF
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Owner
          </button>
        </div>
      </div>

      {/* Console Alerts */}
      {consoleError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-900/30 font-sans shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <div className="flex-1 font-medium">{consoleError}</div>
          <button onClick={() => setConsoleError('')} className="text-red-400 hover:text-red-650 font-bold px-2">✕</button>
        </div>
      )}

      {consoleSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-2xl flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/30 font-sans shadow-xs">
          <Check className="w-4 h-4 shrink-0 text-emerald-500" />
          <div className="flex-1 font-medium">{consoleSuccess}</div>
          <button onClick={() => setConsoleSuccess('')} className="text-emerald-400 hover:text-emerald-650 font-bold px-2">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search landlord by name, email, or telephone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-0 text-xs rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all"
          />
        </div>
        <button
          onClick={fetchLandlords}
          className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-500 rounded-xl transition-all"
          title="Refresh List"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-zinc-900 shadow-xs text-zinc-900 dark:text-white'
                : 'text-zinc-400 hover:text-zinc-650'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-zinc-900 shadow-xs text-zinc-900 dark:text-white'
                : 'text-zinc-400 hover:text-zinc-650'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <p className="text-xs text-zinc-400">Querying registered landlord directory...</p>
        </div>
      ) : filteredLandlords.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <Landmark className="w-8 h-8 mx-auto text-zinc-350 dark:text-zinc-600 mb-2" />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No landlords matched your parameters</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
            Expand your search criteria or register a new owner to get started managing your units with structured relationships.
          </p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLandlords.map((land) => (
              <div 
                key={land.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Visual Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-650 dark:text-zinc-350 border border-zinc-100 dark:border-zinc-850">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-850 dark:text-zinc-100 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                          {land.fullName}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                          {land.nationality || 'Nationality Unspecified'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowDetailModal(land)}
                        className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all"
                        title="View Payout Info"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(land)}
                        className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(land)}
                        className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-red-500 hover:text-red-700 rounded-lg transition-all"
                        title="Delete profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <hr className="my-4 border-zinc-100 dark:border-zinc-800" />

                  {/* Info block */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{land.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{land.phone || 'Phone not available'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                      <Shield className="w-3.5 h-3.5" />
                      <span>ID: {land.identityNumber || 'No identity document ID listed'}</span>
                    </div>
                  </div>
                </div>

                {/* Bank summary footer line */}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-xl px-3 py-2.5 mt-4 border border-zinc-100/50 dark:border-zinc-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-555" />
                    <span className="font-semibold text-zinc-750 dark:text-zinc-300 text-[11px] truncate max-w-[140px]">
                      {land.bankName || 'No linked bank accounts'}
                    </span>
                  </div>
                  {land.identityDocumentUrl ? (
                    <a 
                      href={land.identityDocumentUrl} 
                      target="_blank" 
                      rel="noreferrer referrer"
                      className="text-[10px] text-zinc-800 dark:text-zinc-300 underline font-medium flex items-center gap-1 hover:text-brand"
                    >
                      View E-ID <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-zinc-400 italic">No Identity Doc</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-105 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Owner Name</th>
                    <th className="p-4">Contact Channels</th>
                    <th className="p-4">Nationality</th>
                    <th className="p-4">Identity Number</th>
                    <th className="p-4">Payout Method</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredLandlords.map((land) => (
                    <tr key={land.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 text-zinc-700 dark:text-zinc-300">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-550 border border-zinc-100 dark:border-zinc-850">
                            <User className="w-4 h-4 text-zinc-500" />
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">{land.fullName}</span>
                        </div>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <p className="flex items-center gap-1.5 text-zinc-850 dark:text-zinc-200">
                          <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{land.email}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-zinc-450 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{land.phone || 'Unavailable'}</span>
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                          {land.nationality || 'Unspecified'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-zinc-500">
                        {land.identityNumber || 'Unspecified'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                          <div className="text-[11px]">
                            <p className="font-bold text-zinc-800 dark:text-zinc-200">{land.bankName || 'No linked bank accounts'}</p>
                            {land.bankAccountNumber && <p className="text-[9px] text-zinc-400 font-mono">No. {land.bankAccountNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setShowDetailModal(land)}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(land)}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(land)}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-red-500 hover:text-red-700 rounded-lg transition-all"
                            title="Delete profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                  Landlord Credentials Summary
                </h3>
                <button 
                  onClick={() => setShowDetailModal(null)}
                  className="p-1.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-50 rounded-full transition-all"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1 no-scrollbar text-xs">
                {/* Profile Box */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-500">Personal & Compliance Info</h4>
                  <div className="grid grid-cols-2 gap-3 mt-1 text-zinc-700 dark:text-zinc-300">
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Full Name</span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{showDetailModal.fullName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Nationality</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.nationality || 'Unspecified'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-400 block text-[10px] uppercase">Email</span>
                      <p className="font-medium break-all text-zinc-900 dark:text-zinc-100">{showDetailModal.email}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Phone</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.phone || 'Unavailable'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Identity Number</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.identityNumber || 'Unspecified'}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Box */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5" />
                    Payout & Banking Credentials
                  </h4>
                  {showDetailModal.bankName ? (
                    <div className="grid grid-cols-2 gap-3 mt-1 text-zinc-700 dark:text-zinc-300">
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase">Bank Name</span>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{showDetailModal.bankName}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase">Account Holder</span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.bankAccountHolder || 'Unspecified'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-400 block text-[10px] uppercase">IBAN</span>
                        <p className="font-mono text-zinc-900 dark:text-zinc-100 select-all font-semibold break-all">{showDetailModal.iban || 'Unspecified'}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase">Account Number</span>
                        <p className="font-sans text-zinc-900 dark:text-zinc-100 select-all">{showDetailModal.bankAccountNumber || 'Unspecified'}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase">Swift Code</span>
                        <p className="font-mono text-zinc-900 dark:text-zinc-100 select-all">{showDetailModal.swiftCode || 'Unspecified'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-400 block text-[10px] uppercase">Branch Name</span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.bankBranch || 'Unspecified'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No bank registry details have been logged for this landlord.</p>
                  )}
                </div>

                {/* Secure Documents Viewer Link */}
                {showDetailModal.identityDocumentUrl && (
                  <div className="flex items-center justify-between p-3 bg-zinc-900 text-white rounded-2xl">
                    <span className="font-semibold text-[10px] uppercase tracking-wider">EMIRATES ID FILE</span>
                    <a 
                      href={showDetailModal.identityDocumentUrl} 
                      target="_blank" 
                      rel="noreferrer referrer"
                      className="px-3.5 py-1.5 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl font-bold uppercase text-[9px] flex items-center gap-1.5"
                    >
                      View Documents <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATION / EDIT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-850 dark:text-zinc-50">
                  {selectedLandlord ? 'Modify Landlord Profile' : 'Register New Landlord / Owner'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-250 rounded-xl"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[460px] overflow-y-auto pr-1 no-scrollbar text-xs">
                {/* Visual Section 1: Personal Info */}
                <div className="space-y-3">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1">Personal Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formFields.fullName}
                        onChange={(e) => setFormFields(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. Abdullah Mirza"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formFields.email}
                        onChange={(e) => setFormFields(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="name@owner.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formFields.phone}
                        onChange={(e) => setFormFields(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="+971 50 123 4567"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={formFields.nationality}
                        onChange={(e) => setFormFields(prev => ({ ...prev, nationality: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. UAE national, British..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Identity/Passport Number</label>
                      <input
                        type="text"
                        value={formFields.identityNumber}
                        onChange={(e) => setFormFields(prev => ({ ...prev, identityNumber: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="784-1990-1234567-1 (Emirates ID)"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center justify-between">
                        <span>Identity Document (E-ID/Passport)</span>
                        {uploadingDoc && <Loader2 className="w-3" />}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={formFields.identityDocumentUrl}
                          placeholder="No file uploaded yet"
                          className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-950 text-zinc-500 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none"
                        />
                        <label className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold uppercase text-[9px] flex items-center justify-center cursor-pointer transition-all">
                          <Upload className="w-3 h-3 mr-1" />
                          Upload
                          <input 
                            type="file" 
                            accept=".pdf,.png,.jpg,.jpeg,.zip"
                            onChange={handleFileUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Section 2: Bank Payout Info */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-zinc-100 dark:border-zinc-850 pb-1">Bank Payout Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={formFields.bankName}
                        onChange={(e) => setFormFields(prev => ({ ...prev, bankName: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. Emirates NBD"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={formFields.bankAccountHolder}
                        onChange={(e) => setFormFields(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="Exact name registered at bank"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Bank Account number</label>
                      <input
                        type="text"
                        value={formFields.bankAccountNumber}
                        onChange={(e) => setFormFields(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="Account Number string"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">IBAN Number</label>
                      <input
                        type="text"
                        value={formFields.iban}
                        onChange={(e) => setFormFields(prev => ({ ...prev, iban: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="AE45 0090 0000 1234 5678 901"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">SWIFT / BIC Code</label>
                      <input
                        type="text"
                        value={formFields.swiftCode}
                        onChange={(e) => setFormFields(prev => ({ ...prev, swiftCode: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. EBILAEADXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Bank Branch</label>
                      <input
                        type="text"
                        value={formFields.bankBranch}
                        onChange={(e) => setFormFields(prev => ({ ...prev, bankBranch: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="Downtown Branch"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button bar */}
                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-150 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 rounded-xl font-semibold text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-350 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || uploadingDoc}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {selectedLandlord ? 'Save Profiles' : 'Finalize Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-zinc-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-850 dark:text-zinc-50">
                    Bulk Landlords Import
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="p-1 px-2.5 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-50 text-xs rounded-xl transition-all"
                >
                  ✕ Close
                </button>
              </div>

              {/* Status alerts */}
              {importError && (
                <div className="p-3 bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{importSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left side: Upload or Paste Input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
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
                      <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Choose .CSV file</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5">UTF-8 comma-separated format</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase font-bold text-zinc-500">
                        Option B: Paste raw CSV/TSV Text
                      </label>
                      <button
                        onClick={() => {
                          const demo = "FullName,Email,Phone,Nationality,IdentityNumber,BankName,AccountHolder,AccountNumber,IBAN,SwiftCode,BankBranch\nJohnathan Smith,johnathan@landmark.com,+97150000001,British,784-1990-1111111-1,Emirates NBD,Johnathan Smith,10101111111,AE450090000010101111111,EBILAEADXXX,Downtown Branch\nFatima Al Hashimi,fatima@emirates.ae,+97150000002,UAE,784-1995-2222222-2,ADCB,Fatima Al Hashimi,20202222222,AE450020000020202222222,ADCBXXXX,Yas Island Branch";
                          handleImportTextChange(demo);
                        }}
                        className="text-[9px] text-zinc-700 hover:underline bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-150 dark:border-zinc-850 font-bold"
                      >
                        Load Template Text
                      </button>
                    </div>
                    <textarea
                      rows={7}
                      value={importText}
                      onChange={(e) => handleImportTextChange(e.target.value)}
                      placeholder="FullName,Email,Phone,Nationality,IdentityNumber,BankName,AccountHolder,AccountNumber,IBAN,SwiftCode,BankBranch&#10;Abdullah Mirza,abdullah@mirza.com,+971501111111,Emirati,784111,Emirates NBD,Abdullah Mirza,100010,AE45,EBIL,Main Branch"
                      className="w-full p-3 font-mono text-[10px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
                    />
                  </div>
                </div>

                {/* Right side: Live preview and mapping feedback */}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-400 border-b border-zinc-150 dark:border-zinc-850 pb-1 flex items-center justify-between">
                      <span>Import Preview</span>
                      <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded text-[9px] font-bold">
                        {parsedItems.length} records parsed
                      </span>
                    </h4>

                    {parsedItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 h-48">
                        <HelpCircle className="w-8 h-8 mb-2 text-zinc-350" />
                        <p className="text-[11px] font-semibold">Ready to parse payload</p>
                        <p className="text-[9px] text-zinc-450 mt-1 max-w-[200px]">
                          Upload a spreadsheet document or copy list values into the input panel to see data mapped to fields.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto mt-2 pr-1 space-y-2 no-scrollbar text-[10px]">
                        {parsedItems.map((item, idx) => (
                          <div 
                            key={idx}
                            className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-2 rounded-lg relative"
                          >
                            <span className="absolute right-2 top-2 text-[9px] font-bold text-zinc-400">#{idx + 1}</span>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-100 truncate max-w-[200px]">{item.fullName}</p>
                            <p className="text-zinc-450 truncate max-w-[200px]">{item.email || "No Email"}</p>
                            {item.bankName ? (
                              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-zinc-50 dark:border-zinc-950 text-[9px] text-zinc-700 dark:text-zinc-350">
                                <CreditCard className="w-3 h-3 text-emerald-500" />
                                <span className="font-medium">{item.bankName} • {item.iban ? substringToFit(item.iban, 12) : 'No IBAN'}</span>
                              </div>
                            ) : (
                              <p className="text-[8.5px] text-zinc-400 italic mt-0.5">No bank payout info mapped</p>
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
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Importing profiles...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Confirm & Save Registry ({parsedItems.length} rows)
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-zinc-400 text-center mt-1.5 leading-relaxed">
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
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0 border border-red-105 dark:border-red-900/30">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                  Delete Landlord?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
                  Are you sure you want to delete landlord <strong className="font-semibold text-zinc-800 dark:text-zinc-200">"{landlordToDelete.fullName}"</strong>?
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Properties associated with this owner will be preserved, but their registered payout details, identity logs, and contact credentials will be soft-deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-end">
              <button
                type="button"
                onClick={() => setLandlordToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-350 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-805 transition-all cursor-pointer"
              >
                No, Keep Profile
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
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
