import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Key, 
  Loader2, 
  AlertCircle, 
  Check, 
  FileSpreadsheet, 
  FileDown, 
  Upload 
} from 'lucide-react';
import { UnitItem, BuildingItem, LandlordItem } from '../types';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';

// Import newly refactored subcomponents
import UnitsFilterBar from './UnitsFilterBar';
import UnitsGridView from './UnitsGridView';
import UnitsListView from './UnitsListView';
import UnitFormModal from './UnitFormModal';
import BulkImportModal from './BulkImportModal';
import UnitDetailsModal from './UnitDetailsModal';

interface UnitsConsoleProps {
  onCreateListing?: (unit: UnitItem, buildingName: string, buildingAddress: string) => void;
}

export default function UnitsConsole({ onCreateListing }: UnitsConsoleProps) {
  const { settings, formatPrice } = useGlobalSettings();

  const [units, setUnits] = useState<UnitItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [landlords, setLandlords] = useState<LandlordItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form & modals states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewingUnitDetails, setViewingUnitDetails] = useState<UnitItem | null>(null);

  // Soft delete modal state
  const [unitToDelete, setUnitToDelete] = useState<UnitItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success / Error alerts
  const [consoleSuccess, setConsoleSuccess] = useState('');
  const [consoleError, setConsoleError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unitsRes, buildingsRes, landlordsRes] = await Promise.all([
        fetch('/api/admin/units'),
        fetch('/api/admin/buildings'),
        fetch('/api/admin/landlords')
      ]);

      const [unitsData, buildingsData, landlordsData] = await Promise.all([
        unitsRes.json(),
        buildingsRes.json(),
        landlordsRes.json()
      ]);

      if (unitsData.success) {
        setUnits(unitsData.units || []);
      }
      if (buildingsData.success) {
        setBuildings(buildingsData.buildings || []);
      }
      if (landlordsData.success) {
        setLandlords(landlordsData.landlords || []);
      }
    } catch (err: any) {
      console.error(err);
      setConsoleError("Failed to fetch inventory records: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBuildingName = (buildingId: string) => {
    const bld = buildings.find(b => b.id === buildingId);
    return bld ? bld.name : 'Unknown Building';
  };

  const getLandlordName = (landlordId?: string | null) => {
    if (!landlordId) return 'No landlord assigned';
    const land = landlords.find(l => l.id === landlordId);
    return land ? land.fullName : 'Unknown Owner';
  };

  const getLandlordEmail = (landlordId?: string | null) => {
    if (!landlordId) return '';
    const land = landlords.find(l => l.id === landlordId);
    return land ? land.email : '';
  };

  // Filtered unit inventory index
  const filteredUnits = units.filter(unit => {
    const bname = getBuildingName(unit.buildingId).toLowerCase();
    const lname = getLandlordName(unit.landlordId).toLowerCase();
    const lemail = getLandlordEmail(unit.landlordId).toLowerCase();
    const unum = unit.unitNumber.toLowerCase();
    const utype = (unit.unitType || '').toLowerCase();
    
    const matchesSearch = bname.includes(searchQuery.toLowerCase()) || 
                          lname.includes(searchQuery.toLowerCase()) || 
                          lemail.includes(searchQuery.toLowerCase()) || 
                          unum.includes(searchQuery.toLowerCase()) ||
                          utype.includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && unit.status.toUpperCase() === statusFilter;
  });

  // Soft Delete Handler
  const handleDeleteConfirm = async () => {
    if (!unitToDelete) return;

    setIsDeleting(true);
    setConsoleError('');
    setConsoleSuccess('');

    try {
      const res = await fetch(`/api/admin/units/${unitToDelete.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete from database registry.");
      }

      setConsoleSuccess(`Unit "${unitToDelete.unitNumber}" soft-deleted successfully.`);
      setUnitToDelete(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setConsoleError("Error during delete execution: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // EXPORT CODES
  const handleExportCsv = () => {
    if (units.length === 0) {
      alert("No registered units to export.");
      return;
    }

    const headers = [
      "Unit ID", "Unit Number", "Building Name", "Landlord Name", "Landlord Email",
      "Unit Type", "Status", "Monthly Rent (AED)", "Bedrooms", "Bathrooms",
      "Size (SqFt)", "Furnishing", "Internet Provider", "Internet Account",
      "DEWA Premises Number", "Management Commission %", "Guest Capacity", "Description", "Notes"
    ];

    const rows = units.map(u => [
      u.id,
      u.unitNumber,
      getBuildingName(u.buildingId),
      getLandlordName(u.landlordId),
      getLandlordEmail(u.landlordId),
      u.unitType || 'Apartment',
      u.status,
      u.price,
      u.bedrooms,
      u.bathrooms,
      u.size,
      u.furnishing,
      u.internetProvider || '',
      u.internetAccountNumber || '',
      u.dewaPremisesNumber || '',
      u.mgmtCommission !== undefined ? u.mgmtCommission : '',
      u.guestCapacity || '',
      (u.description || '').replace(/"/g, '""'),
      (u.notes || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AHH_Units_Inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    if (units.length === 0) {
      alert("No data available to print.");
      return;
    }

    const brandColor = settings.customBrandColor || '#D91F28';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = filteredUnits.map(u => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${u.unitNumber}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${getBuildingName(u.buildingId)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${getLandlordName(u.landlordId)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${u.unitType || 'Apartment'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${u.status}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; text-align: right;">${u.price > 0 ? 'AED ' + u.price.toLocaleString() : '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${u.bedrooms}B / ${u.bathrooms}Ba</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${u.size > 0 ? u.size.toLocaleString() + ' SqFt' : '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${u.guestCapacity || '2'}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Resident Units Directory Report - AHH</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #222; margin: 40px; line-height: 1.5; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .logo-placeholder { font-size: 24px; font-weight: 900; color: ${brandColor}; tracking: -0.5px; }
            .meta-info { text-align: right; font-size: 11px; color: #666; }
            h1 { font-size: 20px; font-weight: 800; border-bottom: 2px solid ${brandColor}; padding-bottom: 10px; margin-top: 0; }
            .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .card { background-color: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 12px; text-align: center; }
            .card-number { font-size: 18px; font-weight: bold; color: ${brandColor}; margin-top: 5px; }
            .card-label { font-size: 10px; text-transform: uppercase; color: #777; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f5f5f5; padding: 10px; font-weight: bold; text-align: left; border-bottom: 2px solid #ddd; color: #444; }
            tr:nth-child(even) th { background-color: #fafafa; }
            .footer-info { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 15px; font-size: 10px; color: #777; text-align: center; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="logo-placeholder">${settings.companyName || 'AUTHENTIC HOLIDAY HOMES'}</div>
                <div style="font-size: 10px; color: #555; margin-top: 3px;">TRN No: ${settings.trn || '100234567890003'} | License: ${settings.licenseNumber || '1501234'}</div>
              </td>
              <td class="meta-info">
                <strong>Generated On:</strong> ${new Date().toLocaleDateString()}<br/>
                <strong>Status Filter:</strong> ${statusFilter}<br/>
                <strong>Total Compiled Units:</strong> ${filteredUnits.length}
              </td>
            </tr>
          </table>

          <h1>Resident Units Portfolio Directory</h1>

          <div class="summary-cards">
            <div class="card">
              <div class="card-label">Total Units</div>
              <div class="card-number">${filteredUnits.length}</div>
            </div>
            <div class="card">
              <div class="card-label">Vacant</div>
              <div class="card-number" style="color: #10b981;">${filteredUnits.filter(u => u.status === 'Vacant').length}</div>
            </div>
            <div class="card">
              <div class="card-label">Occupied</div>
              <div class="card-number" style="color: #2563eb;">${filteredUnits.filter(u => u.status === 'Occupied').length}</div>
            </div>
            <div class="card">
              <div class="card-label">Under Maintenance</div>
              <div class="card-number" style="color: #d97706;">${filteredUnits.filter(u => u.status === 'Maintenance').length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Unit No</th>
                <th>Building Name</th>
                <th>Landlord Owner</th>
                <th>Unit Type</th>
                <th>Status</th>
                <th style="text-align: right;">Monthly Base Rent</th>
                <th style="text-align: center;">Config</th>
                <th style="text-align: right;">Area</th>
                <th style="text-align: center;">Max Guests</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer-info">
            Generated directly from the Admin Central System by ${settings.companyName}. Restricted internal administration log report. Not for public sharing.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleOpenAdd = () => {
    setEditingUnit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (unit: UnitItem) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-101 dark:border-zinc-805 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Key id="icon-units-header" className="w-5 h-5 text-emerald-450 dark:text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                Units Inventory Directory
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Register units, track maintenance, utility accounts, document permits, and draft listings for Airbnb travelers.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            id="btn-export-csv"
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-250 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Download full inventory Excel/CSV standard data"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            Export CSV
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            id="btn-export-pdf"
            className="px-3 py-2 bg-zinc-105 hover:bg-zinc-205 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-250 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Create styled PDF compilation"
          >
            <FileDown className="w-4 h-4 text-rose-600 dark:text-rose-500" />
            Print Report
          </button>

          {/* Bulk Import */}
          <button
            id="btn-open-bulk-import"
            onClick={() => setIsImportOpen(true)}
            className="px-3 py-2 bg-zinc-105 hover:bg-zinc-205 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-250 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Upload CSV records"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-500" />
            Bulk Import
          </button>

          {/* Create Unit Profile */}
          <button
            id="btn-register-unit"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Unit
          </button>
        </div>
      </div>

      {/* Console Alerts */}
      {consoleError && (
        <div id="units-console-error" className="p-4 bg-red-50 dark:bg-red-955/20 text-red-750 dark:text-red-400 text-xs rounded-2xl flex items-center gap-3 border border-red-105 dark:border-red-900/40 font-sans shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <div className="flex-1 font-medium">{consoleError}</div>
          <button onClick={() => setConsoleError('')} className="text-red-400 hover:text-red-650 font-bold px-2">✕</button>
        </div>
      )}

      {consoleSuccess && (
        <div id="units-console-success" className="p-4 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-755 dark:text-emerald-450 text-xs rounded-2xl flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/30 font-sans shadow-xs">
          <Check className="w-4 h-4 shrink-0 text-emerald-500" />
          <div className="flex-1 font-medium">{consoleSuccess}</div>
          <button onClick={() => setConsoleSuccess('')} className="text-emerald-400 hover:text-emerald-650 font-bold px-2">✕</button>
        </div>
      )}

      {/* Status filter bar */}
      <UnitsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        loading={loading}
        onRefresh={fetchData}
      />

      {/* Main Units Board */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-101 dark:border-zinc-800 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500 animate-infinite" />
          <p className="text-xs text-zinc-400">Loading units directory matrix...</p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-101 dark:border-zinc-800 p-12 text-center">
          <Key className="w-8 h-8 mx-auto text-zinc-350 dark:text-zinc-650 mb-3" />
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No matching units in dashboard index</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 max-w-sm mx-auto mt-1">
            Associate registered properties and landlords with individual residential units to start streaming high-value booking channels.
          </p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <UnitsGridView
            units={filteredUnits}
            buildings={buildings}
            landlords={landlords}
            onCreateListing={onCreateListing}
            onViewDetails={setViewingUnitDetails}
            onEdit={handleOpenEdit}
            onDelete={setUnitToDelete}
          />
        ) : (
          <UnitsListView
            units={filteredUnits}
            buildings={buildings}
            landlords={landlords}
            onViewDetails={setViewingUnitDetails}
            onEdit={handleOpenEdit}
            onDelete={setUnitToDelete}
          />
        )
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <UnitFormModal
          editingUnit={editingUnit}
          buildings={buildings}
          landlords={landlords}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUnit(null);
          }}
          onRefresh={fetchData}
          onConsoleSuccess={setConsoleSuccess}
          onConsoleError={setConsoleError}
        />
      )}

      {/* BULK CSV IMPORT MODAL */}
      {isImportOpen && (
        <BulkImportModal
          buildings={buildings}
          landlords={landlords}
          onClose={() => setIsImportOpen(false)}
          onRefresh={fetchData}
          onConsoleSuccess={setConsoleSuccess}
          onConsoleError={setConsoleError}
        />
      )}

      {/* UNIT PREVIEW DETAIL MODAL */}
      {viewingUnitDetails && (
        <UnitDetailsModal
          unit={viewingUnitDetails}
          buildings={buildings}
          landlords={landlords}
          onClose={() => setViewingUnitDetails(null)}
        />
      )}

      {/* DELETE CONFIRMATION INTERSTITIAL */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 space-y-6">
            <div className="flex items-start gap-3.5 col">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-955/10 flex items-center justify-center shrink-0 border border-red-105 dark:border-red-900/40">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-5s font-sans">
                  Delete Unit profile?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
                  Are you sure you want to delete unit <strong className="font-semibold text-zinc-800 dark:text-zinc-250">"{unitToDelete.unitNumber}"</strong>?
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Existing active bookings and rental parameters associated with this unit configuration will remain referenced, but record indices will be soft-deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-end">
              <button
                type="button"
                id="btn-cancel-unit-deletion"
                onClick={() => setUnitToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-350 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-805 transition-all cursor-pointer font-sans"
              >
                No, Keep Profile
              </button>
              <button
                type="button"
                id="btn-confirm-unit-deletion"
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
                    Trash
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
