import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, Shield, UploadCloud, Search, Trash2, Eye, 
  Plus, Lock, Folder, Check, AlertCircle, Loader2, Landmark, 
  Briefcase, Wrench, Users, User, ExternalLink, RefreshCw, Copy
} from 'lucide-react';

interface SecuredDoc {
  id: string;
  category: string; // landlords, properties, guests_tenants, staff, company
  identifier: string; // landlord name, property info, guest/booking, staff name, etc.
  docType: string; // emirates_id, passport, title_deed, dtcm_permit, contract, trade_license, others
  fileName: string;
  originalName: string;
  url: string;
  storageType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: any;
}

interface HolidayHome {
  id: string;
  title?: string;
  unitNumber?: string;
  buildingName?: string;
}

export default function DocumentsConsole() {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<SecuredDoc[]>([]);
  const [properties, setProperties] = useState<HolidayHome[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab/Filter states
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Upload panel state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [clipboardMessage, setClipboardMessage] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState<string>('landlords');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [customIdentifier, setCustomIdentifier] = useState<string>('');
  const [docType, setDocType] = useState<string>('emirates_id');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Subscribe to secure documents and properties collections
  useEffect(() => {
    setLoading(true);
    // Listen to secured_documents
    const unsubDocs = onSnapshot(collection(db, 'secured_documents'), (snapshot) => {
      const docsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SecuredDoc[];
      // Sort in reverse chronological order
      docsList.sort((a, b) => {
        const timeA = a.uploadedAt?.seconds || 0;
        const timeB = b.uploadedAt?.seconds || 0;
        return timeB - timeA;
      });
      setDocuments(docsList);
      setLoading(false);
    }, (error) => {
      console.error("DocumentsConsole: Error fetching documents:", error);
      setLoading(false);
    });

    // Listen to properties
    const unsubProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const propsList = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        unitNumber: doc.data().unitNumber,
        buildingName: doc.data().buildingName
      })) as HolidayHome[];
      setProperties(propsList);
    }, (error) => {
      console.error("DocumentsConsole: Error fetching properties list:", error);
    });

    return () => {
      unsubDocs();
      unsubProps();
    };
  }, []);

  // Update document type default selection when category changes
  useEffect(() => {
    if (category === 'landlords') {
      setDocType('emirates_id');
    } else if (category === 'properties') {
      setDocType('title_deed');
    } else if (category === 'guests_tenants') {
      setDocType('passport');
    } else if (category === 'staff') {
      setDocType('passport');
    } else if (category === 'company') {
      setDocType('trade_license');
    }
  }, [category]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setClipboardMessage(url);
    setTimeout(() => {
      setClipboardMessage(null);
    }, 2005);
  };

  const handleDeleteDoc = async (docObj: SecuredDoc) => {
    if (!window.confirm(`Are you sure you want to delete "${docObj.originalName}"? This turns off accessibility securely.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'secured_documents', docObj.id));
      alert("Document deleted and Firestore registry cleared successfully!");
    } catch (err: any) {
      console.error("Error removing secure document reference:", err);
      alert("Failed to delete document entry: " + err.message);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload first");
      return;
    }

    // Determine the entity identifier
    let finalIdentifier = '';
    if (category === 'properties') {
      if (selectedProperty) {
        const prop = properties.find(p => p.id === selectedProperty);
        finalIdentifier = prop ? `Unit ${prop.unitNumber} - ${prop.buildingName}` : selectedProperty;
      } else if (customIdentifier) {
        finalIdentifier = customIdentifier;
      } else {
        setErrorMessage("Please select a property or specify building/unit details");
        return;
      }
    } else {
      if (!customIdentifier.trim()) {
        setErrorMessage("Please provide a name/ID identifier for the record");
        return;
      }
      finalIdentifier = customIdentifier.trim();
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('category', category);
      formData.append('identifier', finalIdentifier);
      formData.append('docType', docType);

      console.log("Submitting API secure file payload...");
      const response = await fetch('/api/admin/upload-document', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const resData = await response.json();
      console.log("Secure file stored! Recording log in DB...", resData);

      // Add record metadata pointer in Firebase Firestore
      await addDoc(collection(db, 'secured_documents'), {
        category,
        identifier: finalIdentifier,
        docType,
        fileName: resData.fileName,
        originalName: resData.originalName,
        url: resData.url,
        storageType: resData.storageType,
        uploadedBy: user?.uid || 'system',
        uploadedByName: profile?.displayName || user?.email || 'Administrator',
        uploadedAt: serverTimestamp()
      });

      setSuccessMessage(`"${selectedFile.name}" organized and mapped securely!`);
      
      // Reset form variables
      setSelectedFile(null);
      setCustomIdentifier('');
      setSelectedProperty('');
      
      // Auto close form after delay
      setTimeout(() => {
        setShowUploadForm(false);
        setSuccessMessage('');
      }, 2500);

    } catch (err: any) {
      console.error("Secure upload failure:", err);
      setErrorMessage(err.message || "Failed to finalize file synchronization.");
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'landlords':
        return { label: 'Landlords Docs', icon: <Landmark size={15} className="text-emerald-500" />, badge: 'bg-emerald-105 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' };
      case 'properties':
        return { label: 'Property & Units', icon: <Briefcase size={15} className="text-blue-550" />, badge: 'bg-blue-105 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400' };
      case 'guests_tenants':
        return { label: 'Guests & Tenants', icon: <Users size={15} className="text-amber-500" />, badge: 'bg-amber-105 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' };
      case 'staff':
        return { label: 'Staff Records', icon: <Wrench size={15} className="text-purple-555" />, badge: 'bg-purple-105 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400' };
      case 'company':
        return { label: 'Company Corporate', icon: <FileText size={15} className="text-rose-500" />, badge: 'bg-rose-105 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' };
      default:
        return { label: 'General / Others', icon: <Folder size={15} className="text-zinc-500" />, badge: 'bg-zinc-105 text-zinc-800 dark:bg-zinc-805 dark:text-zinc-400' };
    }
  };

  const getDocTypeLabel = (dt: string) => {
    return dt.replace(/_/g, " ").toUpperCase();
  };

  // Filtering code block
  const filteredDocs = documents.filter(docObj => {
    const matchCategory = activeTab === 'all' || docObj.category === activeTab;
    const matchSearch = 
      docObj.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docObj.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docObj.docType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
            <Lock className="text-brand shrink-0" size={19} /> Secure Document Vault
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Unguessable URL mapping for high security. Files are hosted in {process.env.VPS_FTP_HOST ? 'your Dedicated VPS storage' : 'Firebase Encryption Buckets'}.
          </p>
        </div>

        <button
          onClick={() => {
            setShowUploadForm(!showUploadForm);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand text-white text-xs font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-brand-hover shadow-md"
        >
          {showUploadForm ? 'Cancel Upload' : <><Plus size={14} /> Upload Document</>}
        </button>
      </div>

      {/* Slide down upload builder form */}
      {showUploadForm && (
        <form onSubmit={handleDocUpload} className="bg-zinc-50 dark:bg-zinc-905 border border-zinc-200 dark:border-zinc-805 rounded-2xl p-6 space-y-4 shadow-inner">
          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
            <UploadCloud size={16} className="text-brand" /> Document Archiver
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Document Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white "
              >
                <option value="landlords">1 - Landlord Documents</option>
                <option value="properties">2 - Property / Unit Documents</option>
                <option value="guests_tenants">3 - Tenants & Guests Documents</option>
                <option value="staff">4 - Workforce & Staff Documents</option>
                <option value="company">5 - Company Corporate Documents</option>
              </select>
            </div>

            {/* Conditional property or custom text identifier setup */}
            {category === 'properties' ? (
              <div className="space-y-1.5 col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Select Listed Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => {
                      setSelectedProperty(e.target.value);
                      if (e.target.value) setCustomIdentifier('');
                    }}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="">-- Or type details manually below --</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        Unit {p.unitNumber || 'N/A'} - {p.buildingName || 'Unknown Title'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Manual Property Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g., Unit 12 - Marina Gate"
                    value={customIdentifier}
                    disabled={!!selectedProperty}
                    onChange={(e) => setCustomIdentifier(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-1 focus:ring-brand focus:border-transparent outline-none disabled:opacity-55"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">
                  {category === 'landlords' && "Landlord Name / Account ID"}
                  {category === 'guests_tenants' && "Guest / Tenant Name (or booking ref)"}
                  {category === 'staff' && "Staff Member Name / ID"}
                  {category === 'company' && "Company Document Description / Department"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    category === 'landlords' ? "e.g., Johnathan Smith" :
                    category === 'guests_tenants' ? "e.g., Guest Jane Cooper (Res AHH-381)" :
                    category === 'staff' ? "e.g., Ahmed Omar - Property Inspector" :
                    "e.g., Trade License Verification Dubai Economy (DED)"
                  }
                  value={customIdentifier}
                  onChange={(e) => setCustomIdentifier(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-1 focus:ring-brand focus:border-transparent outline-none"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document types */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Sub Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white"
              >
                {category === 'landlords' && (
                  <>
                    <option value="emirates_id">Emirates ID card</option>
                    <option value="passport">Landlord Passport Copy</option>
                    <option value="contract">Property Management Agreement</option>
                    <option value="others">Other verification doc</option>
                  </>
                )}
                {category === 'properties' && (
                  <>
                    <option value="title_deed">Property Title Deed</option>
                    <option value="dtcm_permit">DTCM Holiday Home Permit</option>
                    <option value="contract">Lease Agreement / DEWA accounts</option>
                    <option value="pictures">Marketing / Professional Units Pictures</option>
                    <option value="others">Other structural papers</option>
                  </>
                )}
                {category === 'guests_tenants' && (
                  <>
                    <option value="passport">Guest Passport Copy</option>
                    <option value="emirates_id">Emirates ID card (Tenant/UAE occupant)</option>
                    <option value="contract">Short-term Occupant Agreement</option>
                    <option value="others">Misc receipts/permits</option>
                  </>
                )}
                {category === 'staff' && (
                  <>
                    <option value="passport">Staff Passport Copy</option>
                    <option value="emirates_id">Staff Emirates ID card</option>
                    <option value="contract">Employment offer / Contract</option>
                    <option value="others">Certification / Insurance documents</option>
                  </>
                )}
                {category === 'company' && (
                  <>
                    <option value="trade_license">DED Trade License (Dubai Tourism approved)</option>
                    <option value="contract">Corporate bank details / Board resolutions</option>
                    <option value="others">Tax certificate (VAT registration, etc)</option>
                  </>
                )}
              </select>
            </div>

            {/* Custom file input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Select File Attachment</label>
              <input 
                type="file" 
                required
                onChange={handleFileChange}
                className="w-full text-xs text-zinc-550 dark:text-zinc-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-xs file:font-bold file:uppercase file:tracking-wider
                  file:bg-brand file:text-white
                  hover:file:bg-brand-hover"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2 font-mono">
              <AlertCircle size={15} /> {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-205 text-emerald-600 rounded-xl text-xs flex items-center gap-2 font-sans">
              <Check size={15} /> {successMessage}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Storing Securely...
                </>
              ) : (
                'Finalize Archive Sync'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Category selector row */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-100 dark:border-zinc-805 pb-3">
        {[
          { id: 'all', label: 'All Document Vault', icon: <Folder size={14} /> },
          { id: 'landlords', label: '1 - Landlords', icon: <Landmark size={14} /> },
          { id: 'properties', label: '2 - Units / Properties', icon: <Briefcase size={14} /> },
          { id: 'guests_tenants', label: '3 - Guests / Tenants', icon: <Users size={14} /> },
          { id: 'staff', label: '4 - Staff Workforce', icon: <Wrench size={14} /> },
          { id: 'company', label: '5 - Company Corporate', icon: <FileText size={14} /> }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
              activeTab === btn.id 
                ? 'bg-brand text-white border-brand font-black shadow-sm' 
                : 'bg-white dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-805'
            }`}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* Roster Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input 
          type="text" 
          placeholder="Filter document list by owner name, unit ref number, document type (e.g. emirates_id)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-900 dark:text-white focus:ring-1 focus:ring-brand focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Files List Display Table */}
      {loading ? (
        <div className="py-12 text-center animate-pulse text-zinc-400 text-xs font-mono">
          <Loader2 size={16} className="animate-spin inline mr-2" /> Retrieving secure vault records...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-905 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <Folder size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-350">No Document References Found</h4>
          <p className="text-xs text-zinc-500 mt-1">Upload a landlord passport, unit Title Deed, or guest files to index them privately.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-905">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Archived Category</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Belongs To / Entity</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Document Type</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Filename (Original)</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Uploader & Date</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((docObj) => {
                  const catDetails = getCategoryDetails(docObj.category);
                  const isCopied = clipboardMessage === docObj.url;

                  return (
                    <tr key={docObj.id} className="border-b border-zinc-100 dark:border-zinc-805 hover:bg-zinc-50/50 dark:hover:bg-zinc-805/30 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${catDetails.badge}`}>
                          {catDetails.icon}
                          {catDetails.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-black text-zinc-900 dark:text-white tracking-tight">{docObj.identifier}</div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">ID: {docObj.id.substring(0, 8)}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md border border-zinc-200 dark:border-zinc-700">
                          {getDocTypeLabel(docObj.docType)}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate">
                        <div className="text-xs text-zinc-700 dark:text-zinc-300 transition-colors select-all font-sans font-medium" title={docObj.originalName}>
                          {docObj.originalName}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-405 truncate dark:text-zinc-500 mt-0.5">Obfuscated: {docObj.fileName}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-black">{docObj.uploadedByName}</div>
                        <div className="text-[10px] text-zinc-405 dark:text-zinc-500">
                          {docObj.uploadedAt?.seconds ? new Date(docObj.uploadedAt.seconds * 1000).toLocaleDateString("en-AE", {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Archiving...'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyLink(docObj.url)}
                            className={`p-2 rounded-lg border transition-all ${
                              isCopied 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-brand'
                            }`}
                            title={isCopied ? 'Link Copied!' : 'Copy Obfuscated URL Link'}
                          >
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                          
                          <a
                            href={docObj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:text-blue-500 hover:border-blue-200 transition-all"
                            title="View Secure Document"
                          >
                            <ExternalLink size={13} />
                          </a>

                          <button
                            onClick={() => handleDeleteDoc(docObj)}
                            className="p-2 bg-zinc-50 dark:bg-zinc-805 text-zinc-550 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-250 transition-all"
                            title="Delete Secure Copy"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
