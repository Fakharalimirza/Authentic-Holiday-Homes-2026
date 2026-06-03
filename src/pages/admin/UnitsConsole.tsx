import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Building2, 
  Users, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  Check, 
  ExternalLink, 
  BedDouble, 
  Bath, 
  Maximize2, 
  Sofa, 
  Key,
  FileText,
  FileSpreadsheet,
  FileDown,
  Upload,
  CheckCircle2,
  X,
  Sparkles,
  ShieldAlert,
  Info,
  Calendar,
  Percent,
  Tv,
  Globe2,
  LayoutGrid,
  List
} from 'lucide-react';
import { UnitItem, BuildingItem, LandlordItem } from './types';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface UnitsConsoleProps {
  onCreateListing?: (unit: UnitItem, buildingName: string, buildingAddress: string) => void;
}

export default function UnitsConsole({ onCreateListing }: UnitsConsoleProps) {
  const { settings, formatPrice } = useGlobalSettings();
  const { user, profile } = useAuth();
  
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [landlords, setLandlords] = useState<LandlordItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  
  // Landlord Search dropdown inside form
  const [landlordSearch, setLandlordSearch] = useState('');
  const [landlordDropdownOpen, setLandlordDropdownOpen] = useState(false);
  const landlordDropdownRef = useRef<HTMLDivElement>(null);
  const deedInputRef = useRef<HTMLInputElement>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);

  // Custom delete confirmation modal state
  const [unitToDelete, setUnitToDelete] = useState<UnitItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success / Error alerts
  const [consoleSuccess, setConsoleSuccess] = useState('');
  const [consoleError, setConsoleError] = useState('');

  // Built-in File Upload Simulated States
  const [uploadDeedProgress, setUploadDeedProgress] = useState<number | null>(null);
  const [uploadPermitProgress, setUploadPermitProgress] = useState<number | null>(null);
  const [titleDeedName, setTitleDeedName] = useState('');
  const [permitDocName, setPermitDocName] = useState('');

  // Bulk Import modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isDragOverCsv, setIsDragOverCsv] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    buildingId: '',
    landlordId: '',
    status: 'Vacant' as 'Vacant' | 'Occupied' | 'Maintenance' | 'Blocked',
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    size: 0,
    furnishing: 'Furnished' as 'Furnished' | 'Unfurnished' | 'Semi-Furnished',
    notes: '',
    unitType: 'Apartment',
    internetProvider: '',
    internetAccountNumber: '',
    dewaPremisesNumber: '',
    mgmtCommission: 15,
    guestCapacity: 2,
    description: '',
    titleDeedUrl: '',
    permitNumber: '',
    permitDocUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Set up click outside logic for searchable landlord dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (landlordDropdownRef.current && !landlordDropdownRef.current.contains(event.target as Node)) {
        setLandlordDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleOpenAdd = () => {
    const defaultBuildingId = buildings[0]?.id || '';
    const defaultLandlordId = landlords[0]?.id || '';
    const defaultLandlord = landlords.find(l => l.id === defaultLandlordId);

    setUnitForm({
      unitNumber: '',
      buildingId: defaultBuildingId,
      landlordId: defaultLandlordId,
      status: 'Vacant',
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      size: 0,
      furnishing: 'Furnished',
      notes: '',
      unitType: settings.availableCategories?.[0] || 'Apartment',
      internetProvider: settings.availableInternetProviders?.[0]?.name || 'du',
      internetAccountNumber: '',
      dewaPremisesNumber: '',
      mgmtCommission: 15,
      guestCapacity: 2,
      description: '',
      titleDeedUrl: '',
      permitNumber: '',
      permitDocUrl: ''
    });

    setLandlordSearch(defaultLandlord ? `${defaultLandlord.fullName} (${defaultLandlord.email})` : '');
    setEditingUnit(null);
    setTitleDeedName('');
    setPermitDocName('');
    setUploadDeedProgress(null);
    setUploadPermitProgress(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (unit: UnitItem) => {
    setUnitForm({
      unitNumber: unit.unitNumber,
      buildingId: unit.buildingId,
      landlordId: unit.landlordId || '',
      status: unit.status,
      price: unit.price,
      bedrooms: unit.bedrooms || 1,
      bathrooms: unit.bathrooms || 1,
      size: unit.size || 0,
      furnishing: unit.furnishing,
      notes: unit.notes || '',
      unitType: unit.unitType || 'Apartment',
      internetProvider: unit.internetProvider || '',
      internetAccountNumber: unit.internetAccountNumber || '',
      dewaPremisesNumber: unit.dewaPremisesNumber || '',
      mgmtCommission: unit.mgmtCommission !== undefined ? unit.mgmtCommission : 15,
      guestCapacity: unit.guestCapacity || 2,
      description: unit.description || '',
      titleDeedUrl: unit.titleDeedUrl || '',
      permitNumber: unit.permitNumber || '',
      permitDocUrl: unit.permitDocUrl || ''
    });

    const lName = getLandlordName(unit.landlordId);
    const linkedLandlord = landlords.find(l => l.id === unit.landlordId);
    setLandlordSearch(linkedLandlord ? `${linkedLandlord.fullName} (${linkedLandlord.email})` : (unit.landlordId ? lName : ''));

    setEditingUnit(unit);
    setTitleDeedName(unit.titleDeedUrl ? 'Stored_Title_Deed.pdf' : '');
    setPermitDocName(unit.permitDocUrl ? 'Stored_Permit_Doc.pdf' : '');
    setUploadDeedProgress(unit.titleDeedUrl ? 100 : null);
    setUploadPermitProgress(unit.permitDocUrl ? 100 : null);
    setIsFormOpen(true);
  };

  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'titleDeedUrl' | 'permitDocUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isDeed = field === 'titleDeedUrl';
    const setProg = isDeed ? setUploadDeedProgress : setUploadPermitProgress;
    const setName = isDeed ? setTitleDeedName : setPermitDocName;

    // Get building name
    const currentBuilding = buildings.find(b => b.id === unitForm.buildingId);
    const bldName = currentBuilding ? currentBuilding.name : 'Unknown';
    const finalIdentifier = `Unit ${unitForm.unitNumber || 'Temp'} - ${bldName}`;
    const docType = isDeed ? 'title_deed' : 'dtcm_permit';

    setProg(15);
    setName(file.name);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('category', 'properties');
      formData.append('identifier', finalIdentifier);
      formData.append('docType', docType);

      setProg(45);
      const response = await fetch('/api/admin/upload-document', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      setProg(75);
      const resData = await response.json();
      
      // Update form state with the real uploaded URL
      setUnitForm(prev => ({ ...prev, [field]: resData.url }));

      // Add record metadata pointer in Firebase Firestore so it shows in Secure Document Vault
      await addDoc(collection(db, 'secured_documents'), {
        category: 'properties',
        identifier: finalIdentifier,
        docType: docType,
        fileName: resData.fileName,
        originalName: resData.originalName,
        url: resData.url,
        storageType: resData.storageType,
        uploadedBy: user?.uid || 'system',
        uploadedByName: profile?.displayName || user?.email || 'Administrator',
        uploadedAt: serverTimestamp()
      });

      setProg(100);
      setConsoleSuccess(`"${file.name}" uploaded successfully and indexed in Secure Document Vault!`);
    } catch (err: any) {
      console.error(err);
      setProg(null);
      setName('');
      setConsoleError(`Failed to upload file of unit: ${err.message}`);
    }
  };

  const removeSimulatedFile = (field: 'titleDeedUrl' | 'permitDocUrl') => {
    const isDeed = field === 'titleDeedUrl';
    const setProg = isDeed ? setUploadDeedProgress : setUploadPermitProgress;
    const setName = isDeed ? setTitleDeedName : setPermitDocName;

    setProg(null);
    setName('');
    setUnitForm(prev => ({ ...prev, [field]: '' }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsoleSuccess('');
    setConsoleError('');

    if (!unitForm.unitNumber.trim()) {
      setConsoleError("Please specify a valid Unit Number");
      return;
    }
    if (!unitForm.buildingId) {
      setConsoleError("Please associate this unit with a registered Building profile");
      return;
    }

    const id = editingUnit ? editingUnit.id : `unit-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...unitForm })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save unit record.");
      }

      setConsoleSuccess(`Success: Unit "${unitForm.unitNumber}" successfully persisted to directory.`);
      setIsFormOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setConsoleError("Error saving unit: " + err.message);
    }
  };

  const handleDeleteTrigger = (unit: UnitItem) => {
    setConsoleSuccess('');
    setConsoleError('');
    setUnitToDelete(unit);
  };

  const handleDeleteConfirm = async () => {
    if (!unitToDelete) return;
    setConsoleSuccess('');
    setConsoleError('');
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/units/${unitToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete storage element.");
      }
      setConsoleSuccess(`Unit "${unitToDelete.unitNumber}" soft-deleted successfully.`);
      setUnitToDelete(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setConsoleError("Database deletion error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getBuildingName = (buildingId: string) => {
    const bld = buildings.find(b => b.id === buildingId);
    return bld ? bld.name : 'Unknown Building';
  };

  const getBuildingAddress = (buildingId: string) => {
    const bld = buildings.find(b => b.id === buildingId);
    return bld ? bld.address || '' : '';
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

  // COMBINED FILTER INDEX
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

  // CSV BULK IMPORT CODES
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

  const handleImportCsv = (e: React.FormEvent) => {
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

    setImportSuccess(`Success! Inserted ${succeeded} modern resident unit logs into the active schema registry.`);
    setImportPreview([]);
    setImportCsvText('');
    await fetchData();
  };

  const loadSampleCsv = () => {
    setImportCsvText(
      "Unit Number,Building Name,Landlord Email/Name,Category,Price,Bedrooms,Bathrooms,Area SqFt,Commission %,Guests Capacity\n" +
      "509-A,Boulevard Vista,Fakharalimirza@gmail.com,Apartment,12000,2,2,1150,15,4\n" +
      "PT-302,Marina Tower,John Doe,Studio,8500,1,1,680,20,2\n" +
      "P-Home,Palm Jumeirah Resort,Sarah Con,Villa,45000,4,5,4200,12,8"
    );
  };

  // Filter landlords based on searching inputs
  const filteredLandlords = landlords.filter(l => 
    l.fullName.toLowerCase().includes(landlordSearch.toLowerCase()) || 
    l.email.toLowerCase().includes(landlordSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-101 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-950/20">
              <Key className="w-5 h-5 text-emerald-450 dark:text-emerald-500" />
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
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-250 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Download full inventory Excel/CSV standard data"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            Export CSV
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-250 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Create styled PDF compilation"
          >
            <FileDown className="w-4 h-4 text-red-600 dark:text-red-500" />
            Print Report
          </button>

          {/* Bulk Import */}
          <button
            onClick={() => { setIsImportOpen(true); setImportPreview([]); setImportError(''); setImportSuccess(''); }}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-250 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            title="Upload CSV records"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-500" />
            Bulk Import
          </button>

          {/* Create Unit Profile */}
          <button
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
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-2xl flex items-center gap-3 border border-red-105 dark:border-red-900/30 font-sans shadow-xs">
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
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search units by unit number, building name, landlord details, or unit type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-0 text-xs rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'VACANT', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED'].map(statusOption => (
            <button
              key={statusOption}
              onClick={() => setStatusFilter(statusOption)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${
                statusFilter === statusOption
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-550 dark:text-zinc-450'
              }`}
            >
              {statusOption}
            </button>
          ))}

          <button
            onClick={fetchData}
            className="p-2 bg-zinc-50 hover:bg-zinc-105 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-500 rounded-xl transition-all cursor-pointer"
            title="Refresh List"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-950 ml-1">
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
      </div>

      {/* Main Units Board */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <p className="text-xs text-zinc-400">Loading units directory matrix...</p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <Key className="w-8 h-8 mx-auto text-zinc-350 dark:text-zinc-650 mb-3 animate-pulse" />
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No matching units in dashboard index</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto mt-1">
            Associate registered properties and landlords with individual residential units to start streaming high-value booking channels.
          </p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => {
            const buildingName = getBuildingName(unit.buildingId);
            const buildingAddress = getBuildingAddress(unit.buildingId);
            const landlordName = getLandlordName(unit.landlordId);
            const landlordEmail = getLandlordEmail(unit.landlordId);

            const statusStyle = {
              Vacant: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
              Occupied: 'bg-blue-50 text-blue-700 border-blue-101 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
              Maintenance: 'bg-amber-50 text-amber-700 border-amber-101 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
              Blocked: 'bg-zinc-100 text-zinc-650 border-zinc-201 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/30'
            }[unit.status] || 'bg-zinc-50 text-zinc-600';

            return (
              <div 
                key={unit.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-805 p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Status pills + unit action flags */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${statusStyle}`}>
                        {unit.status}
                      </span>
                      {unit.unitType && (
                        <span className="bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-400 px-2 py-0.5 text-[9px] font-bold rounded-md border border-zinc-100 dark:border-zinc-800">
                          {unit.unitType}
                        </span>
                      )}
                    </div>

                    {/* Create listing shortcut */}
                    {onCreateListing && (
                      <button
                        onClick={() => onCreateListing(unit, buildingName, buildingAddress)}
                        className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                        title="Draft Booking Listing with stored data metrics"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        Create Listing
                      </button>
                    )}
                  </div>

                  {/* Detail headers */}
                  <div className="mt-3 flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-955 flex items-center justify-center text-zinc-650 border border-zinc-200/50 dark:border-zinc-800">
                      <Key className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-sm leading-tight">
                        Unit {unit.unitNumber}
                      </h3>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        {buildingName}
                      </p>
                      <p className="text-[10px] text-zinc-550 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 shrink-0" />
                        Owner: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{landlordName}</span>
                      </p>
                    </div>
                  </div>

                  {/* BENTO GRID OF ATTRIBUTES */}
                  <div className="mt-4 grid grid-cols-2 gap-2 bg-zinc-50/70 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-850 text-[10px] font-medium text-zinc-550 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5" />
                      <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5" />
                      <span>{unit.bathrooms} {unit.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{unit.size?.toLocaleString() || '0'} SqFt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cap: {unit.guestCapacity || 2} Guests</span>
                    </div>
                  </div>

                  {/* Utility Records */}
                  <div className="mt-3 p-2 bg-emerald-50/20 dark:bg-zinc-950/10 rounded-xl border border-zinc-100 dark:border-zinc-800/80 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-bold uppercase text-[8px]">DEWA Premises Code:</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-300">{unit.dewaPremisesNumber || 'Not Logged'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-bold uppercase text-[8px]">Internet Provider:</span>
                      <span className="text-zinc-800 dark:text-zinc-300">{unit.internetProvider || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Rent Fee & Commission Details */}
                  <div className="mt-3.5 space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Base Rate:</span>
                      <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">
                        {unit.price > 0 ? formatPrice(unit.price) + ' / mo' : 'Not Configured'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-450 dark:text-zinc-400">
                      <span className="flex items-center gap-0.5 font-semibold text-zinc-400 uppercase text-[9px]"><Percent className="w-3 h-3 text-emerald-500" /> Management Comm:</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-100">{unit.mgmtCommission !== undefined ? unit.mgmtCommission : 15}%</span>
                    </div>

                    {unit.permitNumber && (
                      <div className="pt-1.5 flex items-center justify-between text-[10px] border-t border-dashed border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-400 font-semibold uppercase text-[8px]">DTCM Permit code:</span>
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-950 px-1 rounded text-zinc-700 dark:text-zinc-450">{unit.permitNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit / Trash Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-105 dark:border-zinc-800/60 text-[10.5px]">
                  <span className="text-[10px] text-zinc-400 italic">
                    {unit.titleDeedUrl ? '✓ Title Deed Attached' : 'No upload attachments'}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(unit)}
                      className="p-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-950 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg transition-all cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(unit)}
                      className="p-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-950 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-105 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Unit / Suite</th>
                  <th className="p-4">Building</th>
                  <th className="p-4">Landlord</th>
                  <th className="p-4 font-sans">Config / Specs</th>
                  <th className="p-4 font-sans justify-center">Price / mo</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 flex-1">
                {filteredUnits.map((unit) => {
                  const buildingName = getBuildingName(unit.buildingId);
                  const landlordName = getLandlordName(unit.landlordId);
                  const landlordEmail = getLandlordEmail(unit.landlordId);

                  const statusStyle = {
                    Vacant: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400',
                    Occupied: 'bg-blue-50 text-blue-700 border-blue-101 dark:bg-blue-950/20 dark:text-blue-400',
                    Maintenance: 'bg-amber-50 text-amber-700 border-amber-101 dark:bg-amber-950/20 dark:text-amber-400',
                    Blocked: 'bg-zinc-100 text-zinc-650 border-zinc-201 dark:bg-zinc-800/40 dark:text-zinc-400'
                  }[unit.status] || 'bg-zinc-50 text-zinc-600';

                  return (
                    <tr key={unit.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 text-zinc-700 dark:text-zinc-300">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-100 dark:border-zinc-850">
                            <Key className="w-4 h-4 text-zinc-550" />
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">Unit {unit.unitNumber}</span>
                        </div>
                      </td>
                      <td className="p-4 truncate max-w-[150px]">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{buildingName || 'Unassigned Building'}</span>
                        </div>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="font-bold text-zinc-850 dark:text-zinc-200 truncate max-w-[150px]">{landlordName || 'Individual landlord'}</span>
                        </div>
                        {landlordEmail && (
                          <p className="text-[10px] text-zinc-404 pl-4">{landlordEmail}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3 text-[11px] text-zinc-655 dark:text-zinc-400 font-sans">
                          <span className="flex items-center gap-0.5"><BedDouble className="w-3.5 h-3.5 text-zinc-400" /> {unit.bedrooms} BR</span>
                          <span className="flex items-center gap-0.5"><Bath className="w-3.5 h-3.5 text-zinc-400" /> {unit.bathrooms} BA</span>
                          <span>{unit.size?.toLocaleString()} sqft</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                        {unit.price > 0 ? formatPrice(unit.price) : 'Not Configured'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${statusStyle}`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(unit)}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-350 rounded-lg transition-all cursor-pointer"
                            title="Edit Unit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(unit)}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-red-500 hover:text-red-750 rounded-lg transition-all cursor-pointer"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-4 h-4" />
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
      ))}

      {/* CREATE & EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-805 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal sticky head */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
                  {editingUnit ? `Edit Portfolio Residence Unit - #${unitForm.unitNumber}` : 'Register New Resident Unit'}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Link real estate units with landlord accounts, log utility accounts, and record official permit details.
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-100 p-1.5 rounded-lg text-lg transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* SECTION 1: APARTMENT CORE info */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 dark:border-zinc-800/80 pb-1">Apartment Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Building */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block">
                      Select Building *
                    </label>
                    {buildings.length === 0 ? (
                      <div className="text-xs text-red-500 py-2 italic font-semibold">
                        No buildings registered! Please create a building profile first in Buildings tab.
                      </div>
                    ) : (
                      <select
                        value={unitForm.buildingId}
                        required
                        onChange={(e) => setUnitForm({ ...unitForm, buildingId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all cursor-pointer"
                      >
                        {buildings.map(bld => (
                          <option key={bld.id} value={bld.id}>{bld.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Searchable Landlord Select Dropdown */}
                  <div className="space-y-1.5 relative" ref={landlordDropdownRef}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block">
                      Select Landlord *
                    </label>
                    
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search landlord by name or email..."
                        value={landlordSearch}
                        onChange={(e) => {
                          setLandlordSearch(e.target.value);
                          setLandlordDropdownOpen(true);
                          // Clear selected if text cleared
                          if (!e.target.value) {
                            setUnitForm(prev => ({ ...prev, landlordId: '' }));
                          }
                        }}
                        onFocus={() => setLandlordDropdownOpen(true)}
                        className="w-full px-3.5 py-2.5 pr-8 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
                      />
                      {landlordSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setLandlordSearch('');
                            setUnitForm(prev => ({ ...prev, landlordId: '' }));
                            setLandlordDropdownOpen(false);
                          }}
                          className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown Floating Panel */}
                    {landlordDropdownOpen && landlords.length > 0 && (
                      <div className="absolute z-60 left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                        {filteredLandlords.length === 0 ? (
                          <div className="p-3 text-xs text-zinc-400 italic">No landowners matching search query...</div>
                        ) : (
                          filteredLandlords.map(land => (
                            <button
                              key={land.id}
                              type="button"
                              onClick={() => {
                                setUnitForm(prev => ({ ...prev, landlordId: land.id }));
                                setLandlordSearch(`${land.fullName} (${land.email})`);
                                setLandlordDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-xs text-zinc-800 dark:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-sans transition-all flex flex-col"
                            >
                              <span className="font-bold">{land.fullName}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{land.email}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Unit Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block">
                      Unit Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={unitForm.unitNumber}
                      onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                      placeholder="e.g. 504B, Penthouse 1"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
                    />
                  </div>

                  {/* Unit Type (Derived from Variables step) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block">
                      Unit Type (Category Option)
                    </label>
                    <select
                      value={unitForm.unitType}
                      onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all cursor-pointer"
                    >
                      {(settings.availableCategories || ['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Holiday Home']).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-Bento details configuration */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Bedrooms */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 block">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={unitForm.bedrooms}
                      onChange={(e) => setUnitForm({ ...unitForm, bedrooms: Number(e.target.value || 0) })}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
                    />
                  </div>

                  {/* Bathrooms */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 block">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={unitForm.bathrooms}
                      onChange={(e) => setUnitForm({ ...unitForm, bathrooms: Number(e.target.value || 1) })}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
                    />
                  </div>

                  {/* Guest Capacity */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-455 block">
                      Guest Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={unitForm.guestCapacity}
                      onChange={(e) => setUnitForm({ ...unitForm, guestCapacity: Number(e.target.value || 1) })}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
                    />
                  </div>

                  {/* Area SqFt */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-455 block">
                      Apartment Area (SqFt)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={unitForm.size === 0 ? '' : unitForm.size}
                      onChange={(e) => setUnitForm({ ...unitForm, size: Number(e.target.value || 0) })}
                      placeholder="e.g. 1200"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block">
                      Unit Status
                    </label>
                    <select
                      value={unitForm.status}
                      onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1"
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>

                  {/* Furnishing */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block">
                      Furnishing Style
                    </label>
                    <select
                      value={unitForm.furnishing}
                      onChange={(e) => setUnitForm({ ...unitForm, furnishing: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50"
                    >
                      <option value="Furnished">FurnishedOption</option>
                      {(settings.availableFurnishing || ['Furnished', 'Unfurnished', 'Semi-Furnished']).map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>

                  {/* Management Commission */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block">
                      Management Commission %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 15"
                        value={unitForm.mgmtCommission}
                        onChange={(e) => setUnitForm({ ...unitForm, mgmtCommission: Number(e.target.value || 0) })}
                        className="w-full px-3.5 py-2.5 pr-8 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50"
                      />
                      <span className="absolute right-3.5 top-3 text-xs text-zinc-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: UTILITIES CONFIG */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 dark:border-zinc-800/80 pb-1 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-blue-500" /> Utility & Premises Setup
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select Internet Provider */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                      Select Provider
                    </label>
                    <select
                      value={unitForm.internetProvider}
                      onChange={(e) => setUnitForm({ ...unitForm, internetProvider: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none"
                    >
                      <option value="">Choose Telecom... </option>
                      {(settings.availableInternetProviders || [{ name: 'du' }, { name: 'Etisalat' }]).map(prov => (
                        <option key={prov.name} value={prov.name}>{prov.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Internet Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                      Internet Account Number
                    </label>
                    <input
                      type="text"
                      value={unitForm.internetAccountNumber}
                      onChange={(e) => setUnitForm({ ...unitForm, internetAccountNumber: e.target.value })}
                      placeholder="e.g. 1.00234567"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none text-zinc-900 dark:text-zinc-50"
                    />
                  </div>

                  {/* DEWA Premises */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                      DEWA Premises Number
                    </label>
                    <input
                      type="text"
                      value={unitForm.dewaPremisesNumber}
                      onChange={(e) => setUnitForm({ ...unitForm, dewaPremisesNumber: e.target.value })}
                      placeholder="e.g. 235123456"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none text-zinc-900 dark:text-zinc-50"
                    />
                  </div>
                </div>

                {/* Monthly valuation rent price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                      Monthly Rent Estimation (AED Base Rate)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs text-zinc-400 font-bold">AED</span>
                      <input
                        type="number"
                        placeholder="e.g. 15000"
                        value={unitForm.price === 0 ? '' : unitForm.price}
                        onChange={(e) => setUnitForm({ ...unitForm, price: Number(e.target.value || 0) })}
                        className="w-full pl-12 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                      Description (For Create Listing Bridge)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Elegant studio with stunning views of the Dubai Skyline."
                      value={unitForm.description}
                      onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: UNIT DOCUMENTS & OFFICAL DTCM PERMIT */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 dark:border-zinc-800/80 pb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-500" /> Unit Documents & Regulatory Verification
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title Deed Document Upload */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-550 dark:text-zinc-300">Unit Title Deed</span>
                      <span className="text-[8px] bg-red-50 text-red-600 px-1.5 rounded font-black">Official Requirement</span>
                    </div>

                    <input 
                      type="file" 
                      ref={deedInputRef}
                      className="hidden"
                      accept=".pdf,image/*"
                      onChange={(e) => handleRealFileUpload(e, 'titleDeedUrl')}
                    />

                    {uploadDeedProgress === null ? (
                      <button
                        type="button"
                        onClick={() => deedInputRef.current?.click()}
                        className="w-full py-6 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group bg-white dark:bg-zinc-900"
                      >
                        <Upload className="w-5 h-5 text-zinc-400 group-hover:text-zinc-650" />
                        <span className="text-[11px] font-bold text-zinc-500">Upload Title Deed document</span>
                        <span className="text-[9px] text-zinc-400">PDF standard accepted</span>
                      </button>
                    ) : uploadDeedProgress < 100 ? (
                      <div className="py-4 space-y-2">
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>Uploading metadata...</span>
                          <span>{uploadDeedProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-zinc-900 dark:bg-white h-full transitions-all" style={{ width: `${uploadDeedProgress}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <div className="text-xs">
                            <p className="font-semibold text-zinc-800 dark:text-zinc-100 truncate max-w-[150px]">{titleDeedName}</p>
                            <p className="text-[9px] text-zinc-400">File attached successfully</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSimulatedFile('titleDeedUrl')}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-450 hover:text-red-500 transition-all font-sans"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DTCM permit code & Document Upload */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-550 dark:text-zinc-300">Unit Tourism Permit</span>
                      <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 rounded font-black">DTCM Dubai</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest block">Unit Permit Number / Reference</label>
                      <input
                        type="text"
                        value={unitForm.permitNumber}
                        onChange={(e) => setUnitForm({ ...unitForm, permitNumber: e.target.value })}
                        placeholder="e.g. 50123512 / DTCM-S-12"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                      />
                    </div>

                    <input 
                      type="file" 
                      ref={permitInputRef}
                      className="hidden"
                      accept=".pdf,image/*"
                      onChange={(e) => handleRealFileUpload(e, 'permitDocUrl')}
                    />

                    {uploadPermitProgress === null ? (
                      <button
                        type="button"
                        onClick={() => permitInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group bg-white dark:bg-zinc-900"
                      >
                        <Upload className="w-4 h-4 text-zinc-400 group-hover:text-zinc-650" />
                        <span className="text-[10px] font-bold text-zinc-500">Upload permit validation doc</span>
                      </button>
                    ) : uploadPermitProgress < 100 ? (
                      <div className="py-2.5 space-y-2">
                        <div className="flex justify-between text-[9px] text-zinc-500">
                          <span>Registering license...</span>
                          <span>{uploadPermitProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-zinc-900 dark:bg-white h-full transitions-all" style={{ width: `${uploadPermitProgress}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <div className="text-[11px]">
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">{permitDocName}</p>
                            <p className="text-[9px] text-zinc-400">Permit attached</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSimulatedFile('permitDocUrl')}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-450 hover:text-red-500 transition-all font-sans"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Private Notes block */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                  Private Administration Notes
                </label>
                <textarea
                  value={unitForm.notes}
                  onChange={(e) => setUnitForm({ ...unitForm, notes: e.target.value })}
                  placeholder="Private internal details, maintenance schedules, key lockbox codes, tenant profiles..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-sans resize-none"
                />
              </div>

              {/* Sticky form footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-950 font-semibold text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={buildings.length === 0}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-855 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingUnit ? 'Save Changes' : 'Register Unit'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-500" />
                  Bulk CSV Import Manager
                </h3>
                <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-0.5">
                  Import entire residential unit list instantly. We auto-resolve matching landlords & buildings.
                </p>
              </div>
              <button 
                onClick={() => setIsImportOpen(false)}
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
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-110">
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
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
                    <FileSpreadsheet className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                      Drag & drop your CSV file here, or <span className="text-blue-600 hover:underline">browse files</span>
                    </p>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500">
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
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-400">
                    <span>Paste Raw CSV Values manually:</span>
                    <button
                      type="button"
                      onClick={loadSampleCsv}
                      className="text-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-1 normal-case"
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
                    <Info className="w-3.5 h-3.5 text-zinc-550 shrink-0 mt-0.5" />
                    <span>
                      Guidelines: The first line must designate column header variables. Valid properties include <strong>Unit Number</strong>, <strong>Building</strong>, <strong>Landlord</strong>, <strong>Category</strong>, <strong>Price</strong>, <strong>Bedrooms</strong>, <strong>Size</strong>, <strong>Commission</strong>, and <strong>Guests</strong>.
                    </span>
                  </p>
                </div>
              </div>

              {importPreview.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-zinc-10); border-dashed">
                  <h4 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Parsed CSV Preview ({importPreview.length} units detected):</h4>
                  
                  <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-xl">
                    <table className="w-full text-[10.5px] border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                          <th className="p-2 text-left">Unit Number</th>
                          <th className="p-2 text-left">Matched Building</th>
                          <th className="p-2 text-left">Landlord Owner</th>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-right">Rent price</th>
                          <th className="p-2 text-center">Beds</th>
                          <th className="p-2 text-right">SqFt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50/50">
                            <td className="p-2 font-bold">{row.unitNumber}</td>
                            <td className="p-2 text-zinc-550">{row.buildingName}</td>
                            <td className="p-2 text-zinc-550 truncate max-w-[120px]">{row.landlordName}</td>
                            <td className="p-2 font-mono text-zinc-400">{row.unitType}</td>
                            <td className="p-2 text-right font-semibold">AED {row.price.toLocaleString()}</td>
                            <td className="p-2 text-center">{row.bedrooms}B</td>
                            <td className="p-2 text-right">{row.size.toLocaleString()} SqFt</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Import Footer Actions */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-950/40">
              <span className="text-[10px] text-zinc-405 font-bold">Automatic Validation Engine Active</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={importPreview.length > 0 ? () => setImportPreview([]) : () => setIsImportOpen(false)}
                  className="px-4 py-2 text-zinc-650 hover:bg-zinc-100 text-xs font-semibold rounded-xl border border-zinc-200 transition-all cursor-pointer"
                >
                  {importPreview.length > 0 ? 'Clear Preview' : 'Close'}
                </button>
                {importPreview.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleImportCsv}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Analyze CSV Values
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Write {importPreview.length} Units to Database
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-955/10 flex items-center justify-center shrink-0 border border-red-105 dark:border-red-900/40">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
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
                onClick={() => setUnitToDelete(null)}
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
                    Yes, Delete Unit
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
