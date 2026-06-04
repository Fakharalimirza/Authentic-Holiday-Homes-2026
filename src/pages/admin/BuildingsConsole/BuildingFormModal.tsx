import React, { useState, useEffect } from 'react';
import { 
  EyeOff, 
  AlertCircle, 
  Check, 
  Loader2, 
  Flame, 
  Wind, 
  Globe, 
  Wrench,
  Pin as PinIcon
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';

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

interface BuildingFormModalProps {
  selectedBuilding: BuildingItem | null;
  onClose: () => void;
  onRefresh: () => void;
  onConsoleSuccess: (msg: string) => void;
  onConsoleError: (msg: string) => void;
}

export default function BuildingFormModal({
  selectedBuilding,
  onClose,
  onRefresh,
  onConsoleSuccess,
  onConsoleError
}: BuildingFormModalProps) {
  const { settings } = useGlobalSettings();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Map settings
  const [bldLat, setBldLat] = useState(25.2048);
  const [bldLng, setBldLng] = useState(55.2708);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [plusCode, setPlusCode] = useState('');
  const [isResolvingPlusCode, setIsResolvingPlusCode] = useState(false);
  const [showRawCoords, setShowRawCoords] = useState(false);

  // Form states initialize
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

  useEffect(() => {
    if (selectedBuilding) {
      setFormFields({
        name: selectedBuilding.name || '',
        managementCompany: selectedBuilding.managementCompany || '',
        managementEmail: selectedBuilding.managementEmail || '',
        address: selectedBuilding.address || '',
        googleMapUrl: selectedBuilding.googleMapUrl || '',
        floors: selectedBuilding.floors !== undefined ? Number(selectedBuilding.floors) : 1,
        city: selectedBuilding.city || '',
        makaniNumber: selectedBuilding.makaniNumber || '',
        country: selectedBuilding.country || '',
        securityCompanyName: selectedBuilding.securityCompanyName || '',
        securityCompanyContact: selectedBuilding.securityCompanyContact || '',
        gasCompanyName: selectedBuilding.gasCompanyName || '',
        gasCompanyContact: selectedBuilding.gasCompanyContact || '',
        coolingCompanyName: selectedBuilding.coolingCompanyName || '',
        coolingCompanyContact: selectedBuilding.coolingCompanyContact || '',
        internetProviderName: selectedBuilding.internetProviderName || '',
        internetProviderContact: selectedBuilding.internetProviderContact || ''
      });
      
      // Coordinate parsings
      let lat = 25.2048;
      let lng = 55.2708;
      if (selectedBuilding.googleMapUrl) {
        const match = selectedBuilding.googleMapUrl.match(/@?(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          lat = Number(match[1]);
          lng = Number(match[2]);
        }
      }
      setBldLat(lat);
      setBldLng(lng);
    } else {
      setFormFields({
        name: '',
        managementCompany: '',
        managementEmail: '',
        address: '',
        googleMapUrl: '',
        floors: 1,
        city: 'Dubai',
        makaniNumber: '',
        country: 'United Arab Emirates',
        securityCompanyName: '',
        securityCompanyContact: '',
        gasCompanyName: '',
        gasCompanyContact: '',
        coolingCompanyName: '',
        coolingCompanyContact: '',
        internetProviderName: '',
        internetProviderContact: ''
      });
      setBldLat(25.2048);
      setBldLng(55.2708);
    }
    setPlusCode('');
    setSearchError('');
    setShowAdvanced(false);
    setErrorMsg('');
    setSuccessMsg('');
  }, [selectedBuilding]);

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
      
      const text = selectedBuilding ? "Building metrics updated successfully!" : "Building profile generated successfully!";
      setSuccessMsg(text);
      onConsoleSuccess(text);
      onRefresh();
      setTimeout(onClose, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to persist building credentials.");
      onConsoleError(err.message || "Failed to persist building credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-101 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-850 dark:text-zinc-50 font-sans">
              {selectedBuilding ? 'Modify Building Profile' : 'Configure New Building'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-250 rounded-xl cursor-pointer"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-955/20 text-red-750 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 border border-red-105">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-705 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2 border border-emerald-100">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[460px] overflow-y-auto pr-1 no-scrollbar text-xs">
            {/* Visual Section 1: Address & Building Info */}
            <div className="space-y-3">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1 font-sans">Building Identity & Address</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Building Name *</label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="e.g. Marina Height Tower"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Full Physical Address</label>
                  <input
                    type="text"
                    value={formFields.address}
                    onChange={(e) => setFormFields(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="e.g. Al Marsa St, Dubai Marina"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">City</label>
                  <input
                    type="text"
                    value={formFields.city}
                    onChange={(e) => setFormFields(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="Dubai"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Country</label>
                  <input
                    type="text"
                    value={formFields.country}
                    onChange={(e) => setFormFields(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="United Arab Emirates"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Google Maps Pin Link / Coords</label>
                  <input
                    type="text"
                    value={formFields.googleMapUrl}
                    onChange={(e) => handleGoogleMapUrlChange(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Makani Number</label>
                  <input
                    type="text"
                    value={formFields.makaniNumber}
                    onChange={(e) => setFormFields(prev => ({ ...prev, makaniNumber: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="12345 67890"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Floors Number</label>
                  <input
                    type="number"
                    min="1"
                    value={formFields.floors}
                    onChange={(e) => setFormFields(prev => ({ ...prev, floors: Number(e.target.value) }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Advanced geographic placement block */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1 font-sans">Geographic Placement (Maps Indicator)</h4>
              
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2.5 px-4 rounded-xl border border-zinc-150 dark:border-zinc-850 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showAdvanced ? 'Hide Map Picker' : '✏️ Set Location on Map (Advanced)'}
                </button>
                <button
                  type="button"
                  onClick={handleLocateAddress}
                  disabled={isSearching}
                  className="text-[10px] bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSearching ? 'Locating...' : 'Pin point from Address'}
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
                            <Pin background="#10b981" glyphColor="#fff" borderColor="#fff" />
                          </AdvancedMarker>
                        </Map>
                      </APIProvider>
                    </div>
                  ) : (
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-101 dark:border-zinc-800 rounded-2xl p-4 text-center mt-2">
                      <p className="text-xs text-zinc-400">
                        Map placement requires a valid <strong>VITE_GOOGLE_MAPS_API_KEY</strong>. Please supply coordinates manually or verify settings.
                      </p>
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-400 italic font-medium px-1 font-sans">
                    Tip: Drag the marker or click anywhere on the map to place the location pin exactly where you want.
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block text-left font-sans">Google Plus Code</span>
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
                        className="bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 h-9 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all shadow-sm cursor-pointer"
                      >
                        {isResolvingPlusCode ? 'Applying...' : 'Apply Code'}
                      </button>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowRawCoords(!showRawCoords)}
                        className="text-[9px] font-bold text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-300 underline transition-all cursor-pointer"
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
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1 font-sans">Management Contact details</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Management Company Name</label>
                  <input
                    type="text"
                    value={formFields.managementCompany}
                    onChange={(e) => setFormFields(prev => ({ ...prev, managementCompany: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="e.g. Emaar Properties"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Management Email</label>
                  <input
                    type="email"
                    value={formFields.managementEmail}
                    onChange={(e) => setFormFields(prev => ({ ...prev, managementEmail: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="management@emaar.ae"
                  />
                </div>
              </div>
            </div>

            {/* Visual Section 3: Utility dispatchers */}
            <div className="space-y-4 pt-2">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1 font-sans">Emergency Service Contacts & Utilities</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Security Company Name</label>
                  <input
                    type="text"
                    value={formFields.securityCompanyName}
                    onChange={(e) => setFormFields(prev => ({ ...prev, securityCompanyName: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="e.g. Arkan Security"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Security Contact Number</label>
                  <input
                    type="text"
                    value={formFields.securityCompanyContact}
                    onChange={(e) => setFormFields(prev => ({ ...prev, securityCompanyContact: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="e.g. +971 4 412 1111"
                  />
                </div>

                {/* GAS - with Dropdown Preset */}
                <div className="col-span-1 sm:col-span-2 border-t border-zinc-101 dark:border-zinc-850 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Gas Company Preset</label>
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
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 text-xs rounded-xl focus:outline-none text-zinc-950 dark:text-white"
                    >
                      <option value="">-- Choose preset --</option>
                      {(settings.availableGasCompanies || []).map((p, idx) => (
                        <option key={idx} value={idx}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Gas Company Name</label>
                    <input
                      type="text"
                      value={formFields.gasCompanyName}
                      onChange={(e) => setFormFields(prev => ({ ...prev, gasCompanyName: e.target.value }))}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                      placeholder="e.g. Lootah Gas"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Gas Company Contact</label>
                    <input
                      type="text"
                      value={formFields.gasCompanyContact}
                      onChange={(e) => setFormFields(prev => ({ ...prev, gasCompanyContact: e.target.value }))}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                      placeholder="e.g. 800 566824"
                    />
                  </div>
                </div>

                {/* COOLING - with Dropdown Preset */}
                <div className="col-span-1 sm:col-span-2 border-t border-zinc-101 dark:border-zinc-850 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Cooling Company Preset</label>
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
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 text-xs rounded-xl focus:outline-none text-zinc-950 dark:text-white"
                    >
                      <option value="">-- Choose preset --</option>
                      {(settings.availableCoolingCompanies || []).map((p, idx) => (
                        <option key={idx} value={idx}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Cooling Company Name</label>
                    <input
                      type="text"
                      value={formFields.coolingCompanyName}
                      onChange={(e) => setFormFields(prev => ({ ...prev, coolingCompanyName: e.target.value }))}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                      placeholder="e.g. Empower"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Cooling Company Contact</label>
                    <input
                      type="text"
                      value={formFields.coolingCompanyContact}
                      onChange={(e) => setFormFields(prev => ({ ...prev, coolingCompanyContact: e.target.value }))}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                      placeholder="e.g. +971 4 885 5555"
                    />
                  </div>
                </div>

                {/* INTERNET - with Dropdown Preset */}
                <div className="col-span-1 sm:col-span-2 border-t border-zinc-101 dark:border-zinc-850 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Internet Provider Preset</label>
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
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 text-xs rounded-xl focus:outline-none text-zinc-950 dark:text-white"
                    >
                      <option value="">-- Choose preset --</option>
                      {(settings.availableInternetProviders || []).map((p, idx) => (
                        <option key={idx} value={idx}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Internet Provider Name</label>
                    <input
                      type="text"
                      value={formFields.internetProviderName}
                      onChange={(e) => setFormFields(prev => ({ ...prev, internetProviderName: e.target.value }))}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                      placeholder="e.g. du, Etisalat"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Internet Contact Number</label>
                    <input
                      type="text"
                      value={formFields.internetProviderContact}
                      onChange={(e) => setFormFields(prev => ({ ...prev, internetProviderContact: e.target.value }))}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
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
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 rounded-xl font-semibold text-[10px] uppercase tracking-wider text-zinc-650 dark:text-zinc-350 transition-all cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white dark:text-zinc-900" />}
                {selectedBuilding ? 'Save Changes' : 'Register Building'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
