import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, ShieldAlert, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { BuildingItem, LandlordItem } from '../types';

interface BulkImportModalProps {
  buildings: BuildingItem[];
  landlords: LandlordItem[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onConsoleSuccess: (msg: string) => void;
  onConsoleError: (msg: string) => void;
}

export default function BulkImportModal({
  buildings,
  landlords,
  onClose,
  onRefresh,
  onConsoleSuccess,
  onConsoleError
}: BulkImportModalProps) {
  const [importCsvText, setImportCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isDragOverCsv, setIsDragOverCsv] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const parseAndPreviewCsv = (text: string) => {
    setImportError('');
    if (!text.trim()) {
      setImportError("CSV content is empty.");
      return;
    }

    const lines = text.split('\n');
    if (lines.length < 2) {
      setImportError("CSV must contain a header row followed by at least 1 record row.");
      return;
    }

    const header = lines[0].toLowerCase().split(',');
    const results = [];

    // Simple robust index mapping
    const unitNoIdx = header.findIndex(h => h.includes('unit') && h.includes('number') || h.includes('unit_no') || h.includes('unitno') || h.includes('num') || h === 'unit');
    const buildingIdx = header.findIndex(h => h.includes('building') || h.includes('property') || h.includes('bld'));
    const landlordIdx = header.findIndex(h => h.includes('landlord') || h.includes('owner') || h.includes('email') || h.includes('client'));
    const typeIdx = header.findIndex(h => h.includes('type') || h.includes('category'));
    const priceIdx = header.findIndex(h => h.includes('price') || h.includes('rent') || h.includes('rate') || h.includes('monthly'));
    const bedIdx = header.findIndex(h => h.includes('bed') || h.includes('room'));
    const bathIdx = header.findIndex(h => h.includes('bath'));
    const sizeIdx = header.findIndex(h => h.includes('size') || h.includes('area') || h.includes('sqft'));
    const commissionIdx = header.findIndex(h => h.includes('commission') || h.includes('mgmt') || h.includes('percentage') || h === 'commission');
    const capacityIdx = header.findIndex(h => h.includes('capacity') || h.includes('guest') || h.includes('guests') || h === 'capacity');

    if (unitNoIdx === -1) {
      setImportError("Unable to locate a column header matching 'Unit Number' or 'Unit'.");
      return;
    }
    if (buildingIdx === -1) {
      setImportError("Unable to locate a column header matching 'Building' / 'Property'.");
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Smart split supporting quotes inside CSV strings
      const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      if (parts.length === 0) continue;

      const cleanParts = parts.map(p => p.replace(/^"|"$/g, '').trim());

      const unitNo = cleanParts[unitNoIdx];
      const bldInput = cleanParts[buildingIdx] || '';
      const landInput = cleanParts[landlordIdx] || '';

      if (!unitNo) continue;

      // Resolve building ID
      let resolvedBuilding = buildings.find(b => b.name.toLowerCase().includes(bldInput.toLowerCase()) || b.id.toLowerCase() === bldInput.toLowerCase());
      if (!resolvedBuilding && buildings.length > 0) {
        resolvedBuilding = buildings[0]; // fallback to first building
      }

      // Resolve landlord ID
      let resolvedLandlord = landlords.find(l => l.fullName.toLowerCase().includes(landInput.toLowerCase()) || l.email.toLowerCase().includes(landInput.toLowerCase()) || l.id.toLowerCase() === landInput.toLowerCase());

      const dataRow = {
        unitNumber: unitNo,
        buildingId: resolvedBuilding?.id || '',
        buildingName: resolvedBuilding?.name || 'Default Building',
        landlordId: resolvedLandlord?.id || '',
        landlordName: resolvedLandlord?.fullName || 'Unassigned',
        unitType: cleanParts[typeIdx] || 'Apartment',
        price: Number(cleanParts[priceIdx]) || 12000,
        bedrooms: Number(cleanParts[bedIdx]) || 1,
        bathrooms: Number(cleanParts[bathIdx]) || 1,
        size: Number(cleanParts[sizeIdx]) || 800,
        furnishing: 'Furnished',
        mgmtCommission: Number(cleanParts[commissionIdx]) || 15,
        guestCapacity: Number(cleanParts[capacityIdx]) || 2,
        notes: `Bulk Imported on ${new Date().toLocaleDateString()}`
      };

      results.push(dataRow);
    }

    if (results.length === 0) {
      setImportError("No valid rows parsed successfully. Check column headers and try again.");
    } else {
      setImportPreview(results);
    }
  };

  const handleImportCsvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess('');

    if (!importCsvText.trim()) {
      setImportError("Please paste raw CSV values or select a CSV source template.");
      return;
    }

    parseAndPreviewCsv(importCsvText);
  };

  const handleCsvFileLoad = (file: File) => {
    if (!file) return;
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv' || file.name.endsWith('.txt');
    if (!isCsv) {
      setImportError("Invalid file type. Please upload a valid CSV file (.csv) or tab-delimited text (.txt).");
      return;
    }

    setImportError('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setImportCsvText(text);
        setImportSuccess(`Successfully loaded offline file "${file.name}"! Correct indexes matched.`);
        parseAndPreviewCsv(text);
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read the selected CSV file.");
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setImportError('');
    setImportSuccess('');
    let succeeded = 0;
    
    for (const data of importPreview) {
      try {
        const id = `unit-bulk-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const unitPayload = {
          unitNumber: data.unitNumber,
          buildingId: data.buildingId,
          landlordId: data.landlordId || null,
          status: 'Vacant',
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          size: data.size,
          furnishing: data.furnishing,
          unitType: data.unitType,
          mgmtCommission: data.mgmtCommission,
          guestCapacity: data.guestCapacity,
          notes: data.notes
        };

        const res = await fetch('/api/admin/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...unitPayload })
        });
        if (res.ok) succeeded++;
      } catch (err) {
        console.error("Bulk Item Import Exception: ", err);
      }
    }

    onConsoleSuccess(`Success! Inserted ${succeeded} modern resident unit logs into the active schema registry.`);
    setImportPreview([]);
    setImportCsvText('');
    await onRefresh();
    onClose();
  };

  const loadSampleCsv = () => {
    setImportCsvText(
      "Unit Number,Building Name,Landlord Email/Name,Category,Price,Bedrooms,Bathrooms,Area SqFt,Commission %,Guests Capacity\n" +
      "509-A,Boulevard Vista,Fakharalimirza@gmail.com,Apartment,12000,2,2,1150,15,4\n" +
      "PT-302,Marina Tower,John Doe,Studio,8500,1,1,680,20,2\n" +
      "P-Home,Palm Jumeirah Resort,Sarah Con,Villa,45000,4,5,4200,12,8"
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/65 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-500" />
              Bulk CSV Import Manager
            </h3>
            <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-0.5">
              Import entire residential unit list instantly. We auto-resolve matching landlords & buildings.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650 p-1 rounded transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {importError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-semibold">{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-bold">{importSuccess}</span>
            </div>
          )}

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
                  ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-405 bg-zinc-50/50 dark:bg-zinc-900/40'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
                <FileSpreadsheet className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-zinc-800 dark:text-zinc-205">
                  Drag & drop your CSV file here, or <span className="text-emerald-600 dark:text-emerald-450 hover:underline">browse files</span>
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  We support fully offline standard UTF-8 .csv files
                </p>
              </div>
            </div>

            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-150 dark:border-zinc-800"></div>
              </div>
              <span className="relative px-3 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Or pasted manual input
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <span>Paste Raw CSV Values manually:</span>
                <button
                  type="button"
                  id="btn-load-sample-csv"
                  onClick={loadSampleCsv}
                  className="text-emerald-600 dark:text-emerald-450 hover:text-emerald-700 cursor-pointer flex items-center gap-1 normal-case"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Loading Mock CSV Template
                </button>
              </div>

              <textarea
                value={importCsvText}
                onChange={(e) => {
                  setImportCsvText(e.target.value);
                  parseAndPreviewCsv(e.target.value);
                }}
                placeholder="Unit Number,Building Name,Landlord Email/Name,Category,Price,Bedrooms,Bathrooms,Area SqFt,Commission %,Guests Capacity"
                rows={4}
                className="w-full px-3.5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:ring-1 focus:ring-zinc-400 transition-all resize-y"
              />
              
              <p className="text-[10px] text-zinc-400 leading-normal flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  Guidelines: The first line must designate column header variables. Valid properties include <strong>Unit Number</strong>, <strong>Building</strong>, <strong>Landlord</strong>, <strong>Category</strong>, <strong>Price</strong>, <strong>Bedrooms</strong>, <strong>Size</strong>, <strong>Commission</strong>, and <strong>Guests</strong>.
                </span>
              </p>
            </div>
          </div>

          {importPreview.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mt-4 bg-zinc-50 dark:bg-zinc-905">
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Parsed Row Preview ({importPreview.length} units detected):</span>
              </div>
              <div className="max-h-56 overflow-y-auto text-[11px]">
                <table className="w-full border-collapse">
                  <thead className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 sticky top-0 text-left">
                    <tr>
                      <th className="p-2 border-b border-zinc-200 dark:border-zinc-800 font-bold">Unit</th>
                      <th className="p-2 border-b border-zinc-200 dark:border-zinc-800 font-bold">Building Name</th>
                      <th className="p-2 border-b border-zinc-200 dark:border-zinc-800 font-bold">Landowner Entity</th>
                      <th className="p-2 border-b border-zinc-200 dark:border-zinc-800 font-bold">Monthly Price</th>
                      <th className="p-2 border-b border-zinc-200 dark:border-zinc-800 font-bold">BR / BA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-150 dark:border-zinc-800/40 text-zinc-700 dark:text-zinc-305">
                        <td className="p-2 font-bold">{item.unitNumber}</td>
                        <td className="p-2 truncate max-w-[120px]">{item.buildingName}</td>
                        <td className="p-2 truncate max-w-[125px]">{item.landlordName}</td>
                        <td className="p-2 font-mono font-bold text-emerald-600">AED {item.price.toLocaleString()}</td>
                        <td className="p-2">{item.bedrooms}B / {item.bathrooms}Ba</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 font-semibold text-xs rounded-xl transform-all cursor-pointer text-zinc-600 dark:text-zinc-405"
          >
            Go Back
          </button>
          <button
            type="button"
            id="btn-confirm-csv-import"
            disabled={importPreview.length === 0}
            onClick={handleConfirmImport}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer ${
              importPreview.length > 0
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02]'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
          >
            Confirm Insert Bulk
          </button>
        </div>
      </div>
    </div>
  );
}
