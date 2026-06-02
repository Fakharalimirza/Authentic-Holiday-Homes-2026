import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import { 
  Building, Plus, Search, Edit2, Trash2, Mail, MapPin, 
  Map as MapIcon, Shield, Wrench, Phone, Info, Check, Loader2, AlertCircle, 
  Eye, EyeOff, Building2, Flame, Globe, ExternalLink, Wind
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = (import.meta as any).env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

const hasMapsKey =
  Boolean(MAPS_API_KEY) &&
  MAPS_API_KEY !== 'YOUR_API_KEY' &&
  MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

interface BuildingItem {
  id: string;
  name: string;
  managementCompany: string;
  managementEmail: string;
  address: string;
  googleMapUrl: string;
  floors: number;
  city: string;
  makaniNumber: string;
  country: string;
  securityCompanyName: string;
  securityCompanyContact: string;
  gasCompanyName: string;
  gasCompanyContact: string;
  coolingCompanyName?: string;
  coolingCompanyContact?: string;
  internetProviderName?: string;
  internetProviderContact?: string;
  createdAt?: string;
}

export default function BuildingsConsole() {
  const { user } = useAuth();
  const { settings } = useGlobalSettings();
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Detail panels
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<BuildingItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [buildingToDelete, setBuildingToDelete] = useState<BuildingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [consoleSuccess, setConsoleSuccess] = useState('');
  const [consoleError, setConsoleError] = useState('');

  // Map Picker & Geocoder states
  const [bldLat, setBldLat] = useState(25.2048);
  const [bldLng, setBldLng] = useState(55.2708);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [plusCode, setPlusCode] = useState('');
  const [isResolvingPlusCode, setIsResolvingPlusCode] = useState(false);
  const [showRawCoords, setShowRawCoords] = useState(false);

  const updateCoords = (lat: number, lng: number) => {
    setBldLat(lat);
    setBldLng(lng);
    setFormFields(prev => ({
      ...prev,
      googleMapUrl: `https://maps.google.com/?q=@${lat},${lng}`
    }));
  };

  const handleGoogleMapUrlChange = (val: string) => {
    setFormFields(prev => ({ ...prev, googleMapUrl: val }));
    const match = val.match(/@?(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      setBldLat(Number(match[1]));
      setBldLng(Number(match[2]));
    }
  };

  const handleLocateAddress = () => {
    if (!formFields.address) {
      setSearchError('Please fill in the physical address first.');
      return;
    }
    setSearchError('');
    setIsSearching(true);
    
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      const geocoder = new (window as any).google.maps.Geocoder();
      const query = `${formFields.address}, ${formFields.city || 'Dubai'}, ${formFields.country || 'United Arab Emirates'}`;
      geocoder.geocode({ address: query }, (results: any, status: string) => {
        setIsSearching(false);
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          updateCoords(loc.lat(), loc.lng());
        } else {
          setSearchError('Could not find coordinates for this address. Try dragging the pin on the map.');
        }
      });
    } else {
      setIsSearching(false);
      setSearchError('Google Maps failed to load. Please verify your API Key.');
    }
  };

  const handleResolvePlusCode = () => {
    if (!plusCode) {
      setSearchError('Please enter a Plus Code.');
      return;
    }
    setSearchError('');
    setIsResolvingPlusCode(true);

    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: plusCode }, (results: any, status: string) => {
        setIsResolvingPlusCode(false);
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          updateCoords(loc.lat(), loc.lng());
        } else {
          setSearchError('Could not resolve this Plus Code. Verify it is valid.');
        }
      });
    } else {
      setIsResolvingPlusCode(false);
      setSearchError('Google Maps API is not loaded.');
    }
  };

  // Form Fields
  const [formFields, setFormFields] = useState({
    name: '',
    managementCompany: '',
    managementEmail: '',
    address: '',
    googleMapUrl: '',
    floors: 1,
    city: '',
    makaniNumber: '',
    country: '',
    securityCompanyName: '',
    securityCompanyContact: '',
    gasCompanyName: '',
    gasCompanyContact: '',
    coolingCompanyName: '',
    coolingCompanyContact: '',
    internetProviderName: '',
    internetProviderContact: ''
  });

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/buildings');
      if (!res.ok) throw new Error("Failed to fetch buildings");
      const data = await res.json();
      setBuildings(data.buildings || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Could not fetch buildings. Database sync issues detected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleOpenAdd = () => {
    setSelectedBuilding(null);
    setFormFields({
      name: '',
      managementCompany: '',
      managementEmail: '',
      address: '',
      googleMapUrl: '',
      floors: 1,
      city: '',
      makaniNumber: '',
      country: '',
      securityCompanyName: '',
      securityCompanyContact: '',
      gasCompanyName: '',
      gasCompanyContact: '',
      coolingCompanyName: '',
      coolingCompanyContact: '',
      internetProviderName: '',
      internetProviderContact: ''
    });
    // Reset map states
    setBldLat(25.2048);
    setBldLng(55.2708);
    setPlusCode('');
    setSearchError('');
    setShowAdvanced(false);
    setErrorMsg('');
    setSuccessMsg('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (bld: BuildingItem) => {
    setSelectedBuilding(bld);
    setFormFields({
      name: bld.name || '',
      managementCompany: bld.managementCompany || '',
      managementEmail: bld.managementEmail || '',
      address: bld.address || '',
      googleMapUrl: bld.googleMapUrl || '',
      floors: bld.floors !== undefined ? Number(bld.floors) : 1,
      city: bld.city || '',
      makaniNumber: bld.makaniNumber || '',
      country: bld.country || '',
      securityCompanyName: bld.securityCompanyName || '',
      securityCompanyContact: bld.securityCompanyContact || '',
      gasCompanyName: bld.gasCompanyName || '',
      gasCompanyContact: bld.gasCompanyContact || '',
      coolingCompanyName: bld.coolingCompanyName || '',
      coolingCompanyContact: bld.coolingCompanyContact || '',
      internetProviderName: bld.internetProviderName || '',
      internetProviderContact: bld.internetProviderContact || ''
    });
    
    // Parse map coordinates if available
    let lat = 25.2048;
    let lng = 55.2708;
    if (bld.googleMapUrl) {
      const match = bld.googleMapUrl.match(/@?(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        lat = Number(match[1]);
        lng = Number(match[2]);
      }
    }
    setBldLat(lat);
    setBldLng(lng);
    setPlusCode('');
    setSearchError('');
    setShowAdvanced(false);

    setErrorMsg('');
    setSuccessMsg('');
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.name.trim()) {
      setErrorMsg("Building Name * is a required field.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const bldId = selectedBuilding ? selectedBuilding.id : `building_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    try {
      const res = await fetch('/api/admin/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bldId,
          ...formFields
        })
      });

      if (!res.ok) throw new Error("Failed code save event for buildings database entity.");
      
      setSuccessMsg(selectedBuilding ? "Building metrics updated successfully!" : "Building profile generated successfully!");
      await fetchBuildings();
      setTimeout(() => setShowFormModal(false), 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to persist building credentials.");
    } finally {
      setIsSubmitting(false);
    }
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

  const filteredBuildings = buildings.filter(bld => 
    bld.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bld.managementCompany && bld.managementCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (bld.city && bld.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Building className="w-5 h-5 text-zinc-500" />
            Buildings & Properties
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure buildings profile details, geo directions, emergency contacts (security & gas providers), and management info.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Building Profile
        </button>
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
            placeholder="Search buildings by name, company, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-0 text-xs rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all"
          />
        </div>
        <button
          onClick={fetchBuildings}
          className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-500 rounded-xl transition-all"
          title="Refresh List"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <p className="text-xs text-zinc-400">Loading building metrics...</p>
        </div>
      ) : filteredBuildings.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <Building2 className="w-8 h-8 mx-auto text-zinc-350 dark:text-zinc-600 mb-2" />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No buildings registered yet</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
            Buildings collect metadata coordinates and structural info. Add your first building to group your listings nicely.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBuildings.map((bld) => (
            <div 
              key={bld.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Visual Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-650 dark:text-zinc-350 border border-zinc-100 dark:border-zinc-850">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-850 dark:text-zinc-100 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                        {bld.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-zinc-400" />
                        {bld.city || 'City Unspecified'}, {bld.country || 'UAE'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowDetailModal(bld)}
                      className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(bld)}
                      className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bld)}
                      className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-red-500 hover:text-red-700 rounded-lg transition-all"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <hr className="my-4 border-zinc-100 dark:border-zinc-800" />

                {/* Information listing block */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                    <Info className="w-3.5 h-3.5" />
                    <span className="truncate">Mgmt: {bld.managementCompany || 'Individual Property'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{bld.managementEmail || 'No mgmt email linked'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Makani: {bld.makaniNumber || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts or Floors info summary */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-xl px-3 py-2.5 mt-4 border border-zinc-100/50 dark:border-zinc-850 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold select-none">
                  Structural Height: {bld.floors} flr{bld.floors > 1 ? 's' : ''}
                </span>
                {bld.googleMapUrl ? (
                  <a 
                    href={bld.googleMapUrl} 
                    target="_blank" 
                    rel="noreferrer referrer"
                    className="text-[10px] text-zinc-800 dark:text-zinc-300 underline font-medium flex items-center gap-1 hover:text-brand"
                  >
                    View Map Coordinates <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[10px] text-zinc-400 italic">No Coordinates Logged</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Building className="w-5 h-5 text-zinc-500" />
                  {showDetailModal.name} Specifications
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
                {/* Physical Location */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-500">Property Address & GPS</h4>
                  <div className="grid grid-cols-2 gap-3 mt-1 text-zinc-700 dark:text-zinc-300">
                    <div className="col-span-2">
                      <span className="text-zinc-400 block text-[10px] uppercase">Street Address</span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{showDetailModal.address || 'Street address missing'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">City</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.city || 'Unspecified'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Country</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.country || 'Unspecified'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Makani Number</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.makaniNumber || 'None'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Building Floors</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{showDetailModal.floors} levels</p>
                    </div>
                  </div>
                </div>

                {/* Management Info */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-500">Building Management</h4>
                  <div className="grid grid-cols-2 gap-3 mt-1 text-zinc-700 dark:text-zinc-300">
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Company name</span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{showDetailModal.managementCompany || 'Independently Logged'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Management Email</span>
                      <p className="font-medium break-all text-zinc-950 dark:text-zinc-100 underline decoration-zinc-300">{showDetailModal.managementEmail || 'None'}</p>
                    </div>
                  </div>
                </div>

                 {/* Emergency Services */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-4">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-550 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-zinc-500" />
                    Emergency Contact Dispatch & Utilities
                  </h4>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-zinc-400" /> Security Provider
                      </span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{showDetailModal.securityCompanyName || 'No Security Logged'}</p>
                      <p className="font-mono text-[11px] text-zinc-500">{showDetailModal.securityCompanyContact || ''}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-zinc-400" /> Gas Network Agency
                      </span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{showDetailModal.gasCompanyName || 'No Gas Agency Logged'}</p>
                      <p className="font-mono text-[11px] text-zinc-500">{showDetailModal.gasCompanyContact || ''}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5 text-zinc-400" /> Cooling Company
                      </span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{showDetailModal.coolingCompanyName || 'No Cooling Logged'}</p>
                      <p className="font-mono text-[11px] text-zinc-500">{showDetailModal.coolingCompanyContact || ''}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-zinc-400" /> Internet Provider
                      </span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{showDetailModal.internetProviderName || 'No Internet Logged'}</p>
                      <p className="font-mono text-[11px] text-zinc-500">{showDetailModal.internetProviderContact || ''}</p>
                    </div>
                  </div>
                </div>

                {/* Maps Coordinates Section Link */}
                {showDetailModal.googleMapUrl && (
                  <div className="flex items-center justify-between p-3 bg-zinc-900 text-white rounded-2xl">
                    <span className="font-semibold text-[10px] uppercase tracking-wider">GEO LOCATION MAP</span>
                    <a 
                      href={showDetailModal.googleMapUrl} 
                      target="_blank" 
                      rel="noreferrer referrer"
                      className="px-3.5 py-1.5 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl font-bold uppercase text-[9px] flex items-center gap-1.5"
                    >
                      Open in Maps <ExternalLink className="w-3 h-3" />
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
                  {selectedBuilding ? 'Modify Building Profile' : 'Configure New Building'}
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
                {/* Visual Section 1: Address & Building Info */}
                <div className="space-y-3">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1">Building Identity & Address</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Building Name *</label>
                      <input
                        type="text"
                        required
                        value={formFields.name}
                        onChange={(e) => setFormFields(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. Marina Height Tower"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Full Physical Address</label>
                      <input
                        type="text"
                        value={formFields.address}
                        onChange={(e) => setFormFields(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. Al Marsa St, Dubai Marina"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">City</label>
                      <input
                        type="text"
                        value={formFields.city}
                        onChange={(e) => setFormFields(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="Dubai"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Country</label>
                      <input
                        type="text"
                        value={formFields.country}
                        onChange={(e) => setFormFields(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="United Arab Emirates"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Google Maps Pin Link / Coords</label>
                      <input
                        type="text"
                        value={formFields.googleMapUrl}
                        onChange={(e) => handleGoogleMapUrlChange(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="https://maps.google.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Makani Number</label>
                      <input
                        type="text"
                        value={formFields.makaniNumber}
                        onChange={(e) => setFormFields(prev => ({ ...prev, makaniNumber: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="12345 67890"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Floors Number</label>
                      <input
                        type="number"
                        min="1"
                        value={formFields.floors}
                        onChange={(e) => setFormFields(prev => ({ ...prev, floors: Number(e.target.value) }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced geographic placement block */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1">Geographic Placement (Maps Indicator)</h4>
                  
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2.5 px-4 rounded-xl border border-zinc-150 dark:border-zinc-850 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      {showAdvanced ? 'Hide Map Picker' : '✏️ Set Location on Map (Advanced)'}
                    </button>
                    <button
                      type="button"
                      onClick={handleLocateAddress}
                      disabled={isSearching}
                      className="text-[10px] bg-brand hover:bg-brand-hover text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5"
                    >
                      {isSearching ? 'Locating...' : '🔍 Pin point from Address'}
                    </button>
                  </div>

                  {searchError && (
                    <span className="text-[10px] font-bold text-red-500 dark:text-red-400 block px-1">
                      {searchError}
                    </span>
                  )}

                  {showAdvanced && (
                    <div className="space-y-3">
                      {hasMapsKey ? (
                        <div className="h-64 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative shadow-inner">
                          <APIProvider apiKey={MAPS_API_KEY} version="weekly">
                            <Map
                              center={{ lat: bldLat, lng: bldLng }}
                              defaultZoom={15}
                              mapId={MAP_ID}
                              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                              style={{ width: '100%', height: '100%' }}
                              disableDefaultUI={true}
                              onClick={(e) => {
                                if (e.detail.latLng) {
                                  updateCoords(e.detail.latLng!.lat, e.detail.latLng!.lng);
                                }
                              }}
                            >
                              <AdvancedMarker 
                                position={{ lat: bldLat, lng: bldLng }}
                                draggable={true}
                                onDragEnd={(e) => {
                                  if (e.latLng) {
                                    updateCoords(e.latLng!.lat(), e.latLng!.lng());
                                  }
                                }}
                              >
                                <Pin background="#d97706" glyphColor="#fff" borderColor="#fff" />
                              </AdvancedMarker>
                            </Map>
                          </APIProvider>
                        </div>
                      ) : (
                        <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-center mt-2">
                          <p className="text-xs text-zinc-400">
                            Map placement requires a valid <strong>VITE_GOOGLE_MAPS_API_KEY</strong>. Please supply coordinates manually or verify settings.
                          </p>
                        </div>
                      )}

                      <p className="text-[10px] text-zinc-400 italic font-medium px-1">
                        Tip: Drag the marker or click anywhere on the map to place the location pin exactly where you want.
                      </p>

                      <div className="space-y-2">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1 space-y-1">
                            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block text-left">Google Plus Code</span>
                            <input 
                              type="text" 
                              value={plusCode} 
                              onChange={e => setPlusCode(e.target.value)} 
                              placeholder="e.g. 8Q37+6R Dubai, United Arab Emirates"
                              className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-white font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleResolvePlusCode}
                            disabled={isResolvingPlusCode}
                            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 h-9 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all shadow-sm"
                          >
                            {isResolvingPlusCode ? 'Applying...' : 'Apply Code'}
                          </button>
                        </div>

                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => setShowRawCoords(!showRawCoords)}
                            className="text-[9px] font-bold text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-300 underline transition-all"
                          >
                            {showRawCoords ? 'Hide Raw Coordinates' : 'Show Raw Coord (Lat/Lng)'}
                          </button>
                        </div>

                        {showRawCoords && (
                          <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-150 dark:border-zinc-850">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block text-left">Latitude</span>
                              <input 
                                type="number" 
                                step="any" 
                                value={bldLat} 
                                onChange={e => updateCoords(Number(e.target.value), bldLng)} 
                                className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-white font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block text-left">Longitude</span>
                              <input 
                                type="number" 
                                step="any" 
                                value={bldLng} 
                                onChange={e => updateCoords(bldLat, Number(e.target.value))} 
                                className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-white font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visual Section 2: Management Contacts */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1">Management Contact details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Management Company Name</label>
                      <input
                        type="text"
                        value={formFields.managementCompany}
                        onChange={(e) => setFormFields(prev => ({ ...prev, managementCompany: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. Emaar Properties"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Management Email</label>
                      <input
                        type="email"
                        value={formFields.managementEmail}
                        onChange={(e) => setFormFields(prev => ({ ...prev, managementEmail: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="management@emaar.ae"
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Section 3: Utility dispatchers */}
                <div className="space-y-4 pt-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1">Emergency Service Contacts & Utilities</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Security Company Name</label>
                      <input
                        type="text"
                        value={formFields.securityCompanyName}
                        onChange={(e) => setFormFields(prev => ({ ...prev, securityCompanyName: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. Arkan Security"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Security Contact Number</label>
                      <input
                        type="text"
                        value={formFields.securityCompanyContact}
                        onChange={(e) => setFormFields(prev => ({ ...prev, securityCompanyContact: e.target.value }))}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                        placeholder="e.g. +971 4 412 1111"
                      />
                    </div>

                    {/* GAS - with Dropdown Preset */}
                    <div className="col-span-1 sm:col-span-2 border-t border-zinc-100 dark:border-zinc-850 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Gas Company Preset</label>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              const item = (settings.availableGasCompanies || [])[Number(val)];
                              if (item) {
                                setFormFields(prev => ({
                                  ...prev,
                                  gasCompanyName: item.name,
                                  gasCompanyContact: item.contact
                                }));
                              }
                            }
                          }}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none"
                        >
                          <option value="">-- Choose preset --</option>
                          {(settings.availableGasCompanies || []).map((p, idx) => (
                            <option key={idx} value={idx}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Gas Company Name</label>
                        <input
                          type="text"
                          value={formFields.gasCompanyName}
                          onChange={(e) => setFormFields(prev => ({ ...prev, gasCompanyName: e.target.value }))}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                          placeholder="e.g. Lootah Gas"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Gas Company Contact</label>
                        <input
                          type="text"
                          value={formFields.gasCompanyContact}
                          onChange={(e) => setFormFields(prev => ({ ...prev, gasCompanyContact: e.target.value }))}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                          placeholder="e.g. 800 566824"
                        />
                      </div>
                    </div>

                    {/* COOLING - with Dropdown Preset */}
                    <div className="col-span-1 sm:col-span-2 border-t border-zinc-100 dark:border-zinc-850 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Cooling Company Preset</label>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              const item = (settings.availableCoolingCompanies || [])[Number(val)];
                              if (item) {
                                setFormFields(prev => ({
                                  ...prev,
                                  coolingCompanyName: item.name,
                                  coolingCompanyContact: item.contact
                                }));
                              }
                            }
                          }}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none"
                        >
                          <option value="">-- Choose preset --</option>
                          {(settings.availableCoolingCompanies || []).map((p, idx) => (
                            <option key={idx} value={idx}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Cooling Company Name</label>
                        <input
                          type="text"
                          value={formFields.coolingCompanyName}
                          onChange={(e) => setFormFields(prev => ({ ...prev, coolingCompanyName: e.target.value }))}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                          placeholder="e.g. Empower"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Cooling Company Contact</label>
                        <input
                          type="text"
                          value={formFields.coolingCompanyContact}
                          onChange={(e) => setFormFields(prev => ({ ...prev, coolingCompanyContact: e.target.value }))}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                          placeholder="e.g. +971 4 885 5555"
                        />
                      </div>
                    </div>

                    {/* INTERNET - with Dropdown Preset */}
                    <div className="col-span-1 sm:col-span-2 border-t border-zinc-100 dark:border-zinc-850 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Internet Provider Preset</label>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              const item = (settings.availableInternetProviders || [])[Number(val)];
                              if (item) {
                                setFormFields(prev => ({
                                  ...prev,
                                  internetProviderName: item.name,
                                  internetProviderContact: item.contact
                                }));
                              }
                            }
                          }}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none"
                        >
                          <option value="">-- Choose preset --</option>
                          {(settings.availableInternetProviders || []).map((p, idx) => (
                            <option key={idx} value={idx}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Internet Provider Name</label>
                        <input
                          type="text"
                          value={formFields.internetProviderName}
                          onChange={(e) => setFormFields(prev => ({ ...prev, internetProviderName: e.target.value }))}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                          placeholder="e.g. du, Etisalat"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Internet Contact Number</label>
                        <input
                          type="text"
                          value={formFields.internetProviderContact}
                          onChange={(e) => setFormFields(prev => ({ ...prev, internetProviderContact: e.target.value }))}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750"
                          placeholder="e.g. 101"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Action button bar */}
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
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {selectedBuilding ? 'Save Changes' : 'Register Building'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {buildingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0 border border-red-105 dark:border-red-900/30">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                  Delete Building Profile?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
                  Are you sure you want to delete building <strong className="font-semibold text-zinc-800 dark:text-zinc-200">"{buildingToDelete.name}"</strong>?
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Existing units under this building profile will preserve their references, but new properties won't be able to link to this building, and address metadata will be soft-deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-end">
              <button
                type="button"
                onClick={() => setBuildingToDelete(null)}
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
