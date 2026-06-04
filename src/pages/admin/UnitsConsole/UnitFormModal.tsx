import React, { useState, useEffect, useRef } from 'react';
import { X, Key, Upload, CheckCircle2, Globe2, FileText, Sparkles, Percent } from 'lucide-react';
import { UnitItem, BuildingItem, LandlordItem } from '../types';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface UnitFormModalProps {
  editingUnit: UnitItem | null;
  buildings: BuildingItem[];
  landlords: LandlordItem[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onConsoleSuccess: (msg: string) => void;
  onConsoleError: (msg: string) => void;
}

export default function UnitFormModal({
  editingUnit,
  buildings,
  landlords,
  onClose,
  onRefresh,
  onConsoleSuccess,
  onConsoleError
}: UnitFormModalProps) {
  const { settings } = useGlobalSettings();
  const { user, profile } = useAuth();

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

  const [landlordSearch, setLandlordSearch] = useState('');
  const [landlordDropdownOpen, setLandlordDropdownOpen] = useState(false);
  const landlordDropdownRef = useRef<HTMLDivElement>(null);
  const deedInputRef = useRef<HTMLInputElement>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);

  const [uploadDeedProgress, setUploadDeedProgress] = useState<number | null>(null);
  const [uploadPermitProgress, setUploadPermitProgress] = useState<number | null>(null);
  const [titleDeedName, setTitleDeedName] = useState('');
  const [permitDocName, setPermitDocName] = useState('');

  // Initial Form Field Population
  useEffect(() => {
    if (editingUnit) {
      setUnitForm({
        unitNumber: editingUnit.unitNumber,
        buildingId: editingUnit.buildingId,
        landlordId: editingUnit.landlordId || '',
        status: editingUnit.status,
        price: editingUnit.price,
        bedrooms: editingUnit.bedrooms || 1,
        bathrooms: editingUnit.bathrooms || 1,
        size: editingUnit.size || 0,
        furnishing: editingUnit.furnishing,
        notes: editingUnit.notes || '',
        unitType: editingUnit.unitType || 'Apartment',
        internetProvider: editingUnit.internetProvider || '',
        internetAccountNumber: editingUnit.internetAccountNumber || '',
        dewaPremisesNumber: editingUnit.dewaPremisesNumber || '',
        mgmtCommission: editingUnit.mgmtCommission !== undefined ? editingUnit.mgmtCommission : 15,
        guestCapacity: editingUnit.guestCapacity || 2,
        description: editingUnit.description || '',
        titleDeedUrl: editingUnit.titleDeedUrl || '',
        permitNumber: editingUnit.permitNumber || '',
        permitDocUrl: editingUnit.permitDocUrl || ''
      });
      const linkedLandlord = landlords.find(l => l.id === editingUnit.landlordId);
      setLandlordSearch(linkedLandlord ? `${linkedLandlord.fullName} (${linkedLandlord.email})` : '');
      setTitleDeedName(editingUnit.titleDeedUrl ? 'Stored_Title_Deed.pdf' : '');
      setPermitDocName(editingUnit.permitDocUrl ? 'Stored_Permit_Doc.pdf' : '');
      setUploadDeedProgress(editingUnit.titleDeedUrl ? 100 : null);
      setUploadPermitProgress(editingUnit.permitDocUrl ? 100 : null);
    } else {
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
      setTitleDeedName('');
      setPermitDocName('');
      setUploadDeedProgress(null);
      setUploadPermitProgress(null);
    }
  }, [editingUnit, buildings, landlords, settings]);

  // Landlord outside clicks handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (landlordDropdownRef.current && !landlordDropdownRef.current.contains(event.target as Node)) {
        setLandlordDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLandlords = landlords.filter(l => 
    l.fullName.toLowerCase().includes(landlordSearch.toLowerCase()) || 
    l.email.toLowerCase().includes(landlordSearch.toLowerCase())
  );

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
      formData.append('buildingName', bldName);
      formData.append('unitNumber', unitForm.unitNumber || 'Temp');

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
      
      setUnitForm(prev => ({ ...prev, [field]: resData.url }));

      // Add secure document index record in Firebase Firestore
      await addDoc(collection(db, 'secured_documents'), {
        category: 'properties',
        identifier: finalIdentifier,
        docType: docType,
        fileName: resData.fileName,
        originalName: resData.originalName,
        title: resData.originalName || file.name,
        url: resData.url,
        storageType: resData.storageType,
        uploadedBy: user?.uid || 'system',
        uploadedByName: profile?.displayName || user?.email || 'Administrator',
        uploadedAt: serverTimestamp()
      });

      setProg(100);
      onConsoleSuccess(`"${file.name}" uploaded successfully and indexed in Secure Document Vault!`);
    } catch (err: any) {
      console.error(err);
      setProg(null);
      setName('');
      onConsoleError(`Failed to upload file of unit: ${err.message}`);
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

  const ensureDocumentInVault = async (url: string, docType: 'title_deed' | 'dtcm_permit', finalIdentifier: string, defaultName: string) => {
    if (!url) return;
    try {
      const res = await fetch('/api/db/secured_documents');
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        const exists = docs.some((d: any) => d.url === url || d.url?.toLowerCase() === url.toLowerCase());
        if (exists) return;
      }

      const fileName = url.substring(url.lastIndexOf('/') + 1) || defaultName;
      await addDoc(collection(db, 'secured_documents'), {
        category: 'properties',
        identifier: finalIdentifier,
        docType: docType,
        fileName: fileName,
        originalName: defaultName,
        title: defaultName,
        url: url,
        storageType: 'vps',
        uploadedBy: user?.uid || 'system',
        uploadedByName: profile?.displayName || user?.email || 'Administrator',
        uploadedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error auto-indexing documents to secure vault:", err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onConsoleSuccess('');
    onConsoleError('');

    if (!unitForm.unitNumber.trim()) {
      onConsoleError("Please specify a valid Unit Number");
      return;
    }
    if (!unitForm.buildingId) {
      onConsoleError("Please associate this unit with a registered Building profile");
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

      const currentBuilding = buildings.find(b => b.id === unitForm.buildingId);
      const bldName = currentBuilding ? currentBuilding.name : 'Unknown';
      const finalIdentifier = `Unit ${unitForm.unitNumber || 'Temp'} - ${bldName}`;
      
      if (unitForm.titleDeedUrl) {
        await ensureDocumentInVault(unitForm.titleDeedUrl, 'title_deed', finalIdentifier, 'Upload_Title_Deed_Residence.pdf');
      }
      if (unitForm.permitDocUrl) {
        await ensureDocumentInVault(unitForm.permitDocUrl, 'dtcm_permit', finalIdentifier, 'Upload_Tourism_Permit_Residence.pdf');
      }

      onConsoleSuccess(`Success: Unit "${unitForm.unitNumber}" successfully persisted to directory.`);
      onClose();
      await onRefresh();
    } catch (err: any) {
      console.error(err);
      onConsoleError("Error saving unit: " + err.message);
    }
  };

  return (
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
            type="button"
            onClick={onClose}
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
                  <div className="text-xs text-red-505 py-2 italic font-semibold">
                    No buildings registered! Please create a building profile first in Buildings tab.
                  </div>
                ) : (
                  <select
                    value={unitForm.buildingId}
                    required
                    onChange={(e) => setUnitForm({ ...unitForm, buildingId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-905 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-400 transition-all cursor-pointer"
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
                    id="landlord-search-input"
                    placeholder="Search landlord by name or email..."
                    value={landlordSearch}
                    onChange={(e) => {
                      setLandlordSearch(e.target.value);
                      setLandlordDropdownOpen(true);
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
                      className="absolute right-2.5 top-2.5 text-zinc-405 hover:text-zinc-700"
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
                          className="w-full px-4 py-2 text-left text-xs text-zinc-800 dark:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-zinc-805 font-sans transition-all flex flex-col"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-550 outline-none focus:ring-1 focus:ring-zinc-400 transition-all cursor-pointer"
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
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 transition-all font-sans"
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
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-905 dark:text-zinc-100 outline-none focus:ring-1 transition-all font-sans"
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
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 transition-all font-sans"
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
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-905 dark:text-zinc-100 outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-50 outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-550"
                >
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
                    className="w-full px-3.5 py-2.5 pr-8 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-zinc-400 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: UTILITIES CONFIG */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 dark:border-zinc-805/80 pb-1 flex items-center gap-1.5">
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-905 dark:text-zinc-50 outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none text-zinc-905 dark:text-zinc-100"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none text-zinc-905 dark:text-zinc-105"
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
                    className="w-full pl-12 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-905 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: UNIT DOCUMENTS & OFFICIAL DTCM PERMIT */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 dark:border-zinc-800/80 pb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-500" /> Unit Documents & Regulatory Verification
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title Deed Document Upload */}
              <div className="bg-zinc-50/50 dark:bg-zinc-955 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-550 dark:text-zinc-300">Unit Title Deed</span>
                  <span className="text-[8px] bg-rose-50 dark:bg-zinc-900 text-rose-600 px-1.5 rounded font-black">Official Requirement</span>
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
                      <div className="bg-zinc-900 dark:bg-white h-full transition-all" style={{ width: `${uploadDeedProgress}%` }}></div>
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
              <div className="bg-zinc-50/50 dark:bg-zinc-955 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-550 dark:text-zinc-300">Unit Tourism Permit</span>
                  <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 px-1.5 rounded font-black">DTCM Dubai</span>
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
                      <div className="bg-zinc-900 dark:bg-white h-full transition-all" style={{ width: `${uploadPermitProgress}%` }}></div>
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
              onClick={onClose}
              className="px-4 py-2 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-950 font-semibold text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={buildings.length === 0}
              id="btn-unit-form-submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {editingUnit ? 'Save Changes' : 'Register Unit'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
