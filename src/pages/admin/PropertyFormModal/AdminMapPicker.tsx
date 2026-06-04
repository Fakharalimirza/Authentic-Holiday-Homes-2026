import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = (import.meta as any).env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

const hasMapsKey =
  Boolean(MAPS_API_KEY) &&
  MAPS_API_KEY !== 'YOUR_API_KEY' &&
  MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

interface AdminMapPickerProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export default function AdminMapPicker({ form, setForm }: AdminMapPickerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [plusCode, setPlusCode] = useState('');
  const [isResolvingPlusCode, setIsResolvingPlusCode] = useState(false);
  const [showRawCoords, setShowRawCoords] = useState(false);

  // Auto reverse-geocode lat/lng to Google Plus Code
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google?.maps && form.lat && form.lng) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ location: { lat: form.lat, lng: form.lng } }, (results: any, status: string) => {
        if (status === 'OK' && results) {
          let foundPlusCode = '';
          for (const res of results) {
            if (res.plus_code) {
              foundPlusCode = res.plus_code.global_code || res.plus_code.compound_code || '';
              break;
            }
          }
          if (!foundPlusCode && results[0]?.plus_code) {
            foundPlusCode = results[0].plus_code.global_code || results[0].plus_code.compound_code || '';
          }
          if (foundPlusCode) {
            setPlusCode(foundPlusCode);
          }
        }
      });
    }
  }, [form.lat, form.lng]);

  const handleLocateAddress = () => {
    if (!form.address) {
      setSearchError('Please fill in the address first.');
      return;
    }
    setSearchError('');
    setIsSearching(true);
    
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: form.address }, (results: any, status: string) => {
        setIsSearching(false);
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          setForm((prev: any) => ({
            ...prev,
            lat,
            lng
          }));
        } else {
          setSearchError('Could not find location coordinates for this address. Try dragging the pin manually.');
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
          setForm((prev: any) => ({
            ...prev,
            lat: loc.lat(),
            lng: loc.lng()
          }));
        } else {
          setSearchError('Could not resolve this Plus Code. Verify it is valid (e.g., "8Q37+6R Dubai").');
        }
      });
    } else {
      setIsResolvingPlusCode(false);
      setSearchError('Google Maps API is not loaded.');
    }
  };

  if (!hasMapsKey) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4 text-center mt-2 font-sans">
        <p className="text-xs text-zinc-400">
          Map placement requires a valid <strong>VITE_GOOGLE_MAPS_API_KEY</strong>. Feel free to input manually.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3 font-sans">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block text-left">Latitude</span>
            <input 
              type="number" 
              step="any" 
              value={form.lat} 
              onChange={e => setForm((prev: any) => ({ ...prev, lat: Number(e.target.value) }))} 
              className="w-full text-xs p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block text-left">Longitude</span>
            <input 
              type="number" 
              step="any" 
              value={form.lng} 
              onChange={e => setForm((prev: any) => ({ ...prev, lng: Number(e.target.value) }))} 
              className="w-full text-xs p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3 font-sans">
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2.5 px-4 rounded-xl border border-zinc-150 dark:border-zinc-850 shadow-sm">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-black uppercase tracking-widest text-zinc-550 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          {showAdvanced ? 'Hide Map Picker' : '✏️ Set Location on Map (Advanced)'}
        </button>
        <button
          type="button"
          onClick={handleLocateAddress}
          disabled={isSearching}
          className="text-[10px] bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
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
          <div className="h-64 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative shadow-inner">
            <APIProvider apiKey={MAPS_API_KEY} version="weekly">
              <Map
                center={{ lat: form.lat, lng: form.lng }}
                defaultZoom={13}
                mapId={MAP_ID}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                disableDefaultUI={true}
                onClick={(e) => {
                  if (e.detail.latLng) {
                    setForm((prev: any) => ({
                      ...prev,
                      lat: e.detail.latLng!.lat,
                      lng: e.detail.latLng!.lng
                    }));
                  }
                }}
              >
                <AdvancedMarker 
                  position={{ lat: form.lat, lng: form.lng }}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      setForm((prev: any) => ({
                        ...prev,
                        lat: e.latLng!.lat(),
                        lng: e.latLng!.lng()
                      }));
                    }
                  }}
                >
                  <Pin background="#10b981" glyphColor="#fff" borderColor="#fff" />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          </div>
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
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-white font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleResolvePlusCode}
                disabled={isResolvingPlusCode}
                className="bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-4 h-9 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all shadow-sm cursor-pointer"
              >
                {isResolvingPlusCode ? 'Applying...' : 'Apply Code'}
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowRawCoords(!showRawCoords)}
                className="text-[9px] font-bold text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 underline transition-all cursor-pointer"
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
                    value={form.lat} 
                    onChange={e => setForm((prev: any) => ({ ...prev, lat: Number(e.target.value) }))} 
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block text-left">Longitude</span>
                  <input 
                    type="number" 
                    step="any" 
                    value={form.lng} 
                    onChange={e => setForm((prev: any) => ({ ...prev, lng: Number(e.target.value) }))} 
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
