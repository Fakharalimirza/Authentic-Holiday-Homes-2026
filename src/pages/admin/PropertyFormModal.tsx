import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Check, ChevronLeft, ChevronRight, Trash2, Plus, FileText, MapPin, Coins, Sparkles } from 'lucide-react';
import { doc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PropertyForm, AMENITY_CATEGORIES, getInitialForm } from './types';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { logActivity } from '../../lib/auditLogger';

const MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = (import.meta as any).env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

const hasMapsKey =
  Boolean(MAPS_API_KEY) &&
  MAPS_API_KEY !== 'YOUR_API_KEY' &&
  MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

function AdminMapPicker({ form, setForm }: { form: any; setForm: React.Dispatch<React.SetStateAction<any>> }) {
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
      <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-center mt-2">
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
          className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-905 dark:hover:text-white transition-colors"
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
                  <Pin background="#d97706" glyphColor="#fff" borderColor="#fff" />
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
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 h-9 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all shadow-sm"
              >
                {isResolvingPlusCode ? 'Applying...' : 'Apply Code'}
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowRawCoords(!showRawCoords)}
                className="text-[9px] font-bold text-zinc-405 hover:text-zinc-650 dark:hover:text-zinc-300 underline transition-all"
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

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  initialFormToEdit: PropertyForm | null;
  onSaved: () => void;
  user: any;
}

export default function PropertyFormModal({
  isOpen,
  onClose,
  editingId,
  initialFormToEdit,
  onSaved,
  user
}: PropertyFormModalProps) {
  const { settings } = useGlobalSettings();
  const [form, setForm] = useState<PropertyForm>(getInitialForm());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingStates, setUploadingStates] = useState<{ [key: string]: 'uploading' | 'completed' | 'error' }>({});
  
  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState('');

  // Landlords & Buildings select lists
  const [landlords, setLandlords] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);

  // Fetch relational entities on load
  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const lRes = await fetch('/api/admin/landlords');
        if (lRes.ok) {
          const lData = await lRes.json();
          setLandlords(lData.landlords || []);
        }
        const bRes = await fetch('/api/admin/buildings');
        if (bRes.ok) {
          const bData = await bRes.json();
          setBuildings(bData.buildings || []);
        }
      } catch (err) {
        console.error("Failed to load select listings relational records:", err);
      }
    };
    if (isOpen) {
      fetchRelations();
    }
  }, [isOpen]);

  const handleBuildingSelect = (buildingId: string) => {
    const selectedBld = buildings.find(b => b.id === buildingId);
    if (selectedBld) {
      // Auto resolve coordinates from Google Map URL or fallback
      let bldLat = form.lat;
      let bldLng = form.lng;
      if (selectedBld.googleMapUrl) {
        const coordsMatch = selectedBld.googleMapUrl.match(/@?(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordsMatch) {
          bldLat = Number(coordsMatch[1]);
          bldLng = Number(coordsMatch[2]);
        }
      }
      setForm(prev => ({
        ...prev,
        buildingId: selectedBld.id,
        buildingName: selectedBld.name,
        address: selectedBld.address || prev.address,
        lat: bldLat,
        lng: bldLng
      }));
    } else {
      setForm(prev => ({
        ...prev,
        buildingId: '',
        buildingName: ''
      }));
    }
  };

  const steps = [
    { id: 1, name: 'Basic Info', label: 'Listing Details', icon: FileText },
    { id: 2, name: 'Space & Images', label: 'Pricing & Media', icon: Coins },
    { id: 3, name: 'Amenities', label: 'Comfort & Extras', icon: Sparkles }
  ];

  const validateStep = (step: number): boolean => {
    setValidationError('');
    if (step === 1) {
      if (!form.title || !form.title.trim()) {
        setValidationError('Please enter a listing title.');
        return false;
      }
      if (!form.unitNumber || !form.unitNumber.trim()) {
        setValidationError('Please enter the unit number in step 1.');
        return false;
      }
      if (!form.buildingName || !form.buildingName.trim()) {
        setValidationError('Please select or specify a building.');
        return false;
      }
      if (!form.address || !form.address.trim()) {
        setValidationError('Please specify the property address.');
        return false;
      }
      if (!form.description || !form.description.trim()) {
        setValidationError('Please enter a property description.');
        return false;
      }
    } else if (step === 2) {
      if (!form.price || Number(form.price) <= 0) {
        setValidationError('Please enter a valid price greater than 0.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setValidationError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // When modal is opened/closed or form state is initialized
  useEffect(() => {
    if (isOpen) {
      if (initialFormToEdit) {
        setForm(initialFormToEdit);
      } else {
        setForm(getInitialForm());
      }
      setUploadingStates({});
      setCurrentStep(1);
      setValidationError('');
    }
  }, [isOpen, initialFormToEdit]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (!form.unitNumber || !form.buildingName) {
      alert("Please enter Unit Number and Building Name first so we can organize your images.");
      return;
    }

    // Add to local state first to show placeholders
    setForm(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...files] }));

    // Start uploads immediately for each file
    for (const file of files) {
      const fileId = `${file.name}-${file.size}-${Date.now()}`;
      setUploadingStates(prev => ({ ...prev, [fileId]: 'uploading' }));

      const formData = new FormData();
      formData.append('images', file);
      formData.append('unitNumber', form.unitNumber);
      formData.append('buildingName', form.buildingName);

      try {
        const response = await fetch('/api/admin/upload-property-images', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        const imageSet = data.images[0]; // Since we sent one file

        // Update form with returned URLs
        setForm(prev => {
          const avif = [...prev.imageUrls.avif];
          const webp = [...prev.imageUrls.webp];
          const png = [...prev.imageUrls.png];

          imageSet.forEach((img: any) => {
            if (img.format === 'avif') avif.push(img.url);
            if (img.format === 'webp') webp.push(img.url);
            if (img.format === 'png') png.push(img.url);
          });

          return {
            ...prev,
            imageUrls: { avif, webp, png }
          };
        });

        setUploadingStates(prev => ({ ...prev, [fileId]: 'completed' }));
      } catch (err) {
        console.error('Individual upload error:', err);
        setUploadingStates(prev => ({ ...prev, [fileId]: 'error' }));
      }
    }
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= form.imageUrls.webp.length) return;

    setForm(prev => {
      const newAvif = [...prev.imageUrls.avif];
      const newWebp = [...prev.imageUrls.webp];
      const newPng = [...prev.imageUrls.png];

      // Swap elements for avif
      if (newAvif[index] !== undefined && newAvif[targetIndex] !== undefined) {
        const tempAvif = newAvif[index];
        newAvif[index] = newAvif[targetIndex];
        newAvif[targetIndex] = tempAvif;
      }

      // Swap elements for webp
      if (newWebp[index] !== undefined && newWebp[targetIndex] !== undefined) {
        const tempWebp = newWebp[index];
        newWebp[index] = newWebp[targetIndex];
        newWebp[targetIndex] = tempWebp;
      }

      // Swap elements for png
      if (newPng[index] !== undefined && newPng[targetIndex] !== undefined) {
        const tempPng = newPng[index];
        newPng[index] = newPng[targetIndex];
        newPng[targetIndex] = tempPng;
      }

      return {
        ...prev,
        imageUrls: {
          avif: newAvif,
          webp: newWebp,
          png: newPng
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUploading(true);

    try {
      const propertyData: any = {
        title: form.title,
        category: form.category,
        description: form.description,
        price: Number(form.price),
        unitNumber: form.unitNumber,
        buildingName: form.buildingName,
        referenceNo: form.referenceNo,
        purpose: form.purpose,
        furnishing: form.furnishing,
        size: Number(form.size),
        maxGuests: Number(form.maxGuests),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        amenities: form.amenities,
        location: {
          address: form.address,
          lat: Number(form.lat),
          lng: Number(form.lng)
        },
        images: form.imageUrls,
        rating: Number(form.rating || 5.0),
        isAvailable: form.isAvailable ?? true,
        minimumNights: Number(form.minimumNights || 30),
        landlordId: form.landlordId || '',
        buildingId: form.buildingId || '',
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        console.log("Admin: Updating property", editingId, propertyData);
        await updateDoc(doc(db, 'properties', editingId), propertyData);
        logActivity('UPDATE_PROPERTY', `Updated listing: "${propertyData.title}" in ${propertyData.location} (ID: ${editingId})`, { uid: user.uid, email: user.email, role: 'host' });
        alert("Property updated successfully!");
      } else {
        propertyData.hostId = user.uid;
        propertyData.reviewCount = 0;
        propertyData.createdAt = serverTimestamp();
        console.log("Admin: Adding new property", propertyData);
        await addDoc(collection(db, 'properties'), propertyData);
        logActivity('CREATE_PROPERTY', `Created new property listing: "${propertyData.title}" in ${propertyData.location}`, { uid: user.uid, email: user.email, role: 'host' });
        alert("Property published successfully!");
      }

      onSaved();
    } catch (err) {
      console.error("Admin: Error saving property:", err);
      alert("Error saving property: " + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="relative w-full bg-white dark:bg-zinc-900 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-200 dark:border-zinc-805 shadow-xl overflow-hidden flex flex-col z-10"
          >
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
               <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                 {editingId ? 'Edit Property' : 'Add New Property'}
               </h2>
               <button 
                 type="button"
                 onClick={onClose} 
                 className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-550 dark:text-zinc-400"
               >
                 <X size={20} />
               </button>
            </div>

            {/* Step Wizard Header */}
            <div className="px-8 py-4 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between overflow-x-auto no-scrollbar font-sans gap-4">
              {steps.map((s, index) => {
                const IconComponent = s.icon;
                const isCompleted = currentStep > s.id;
                const isActive = currentStep === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (s.id < currentStep) {
                          setCurrentStep(s.id);
                        } else if (s.id > currentStep) {
                          let valid = true;
                          for (let check = currentStep; check < s.id; check++) {
                            if (!validateStep(check)) {
                              valid = false;
                              break;
                            }
                          }
                          if (valid) {
                            setCurrentStep(s.id);
                          }
                        }
                      }}
                      className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCompleted 
                          ? 'bg-green-500 text-white shadow-md' 
                          : isActive 
                            ? 'bg-brand text-white shadow-lg ring-4 ring-brand/10 dark:ring-brand/35 scale-105' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-750'
                      }`}>
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : <IconComponent size={14} />}
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-brand' : isCompleted ? 'text-green-500' : 'text-zinc-400'}`}>
                          Step {s.id}
                        </p>
                        <p className={`text-xs font-bold leading-tight ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {s.name}
                        </p>
                      </div>
                    </button>
                    {index < steps.length - 1 && (
                      <div className={`h-[2px] flex-1 max-w-[40px] rounded transition-colors ${currentStep > s.id ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 no-scrollbar pb-28 relative">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div 
                    key="step-1"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-0.5">Basic Property Information</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Start by setting up the title, category, and physical placement of your property listing.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Listing Title</label>
                        <input 
                          type="text" 
                          required
                          value={form.title}
                          onChange={e => setForm({...form, title: e.target.value})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white" 
                          placeholder="Burj Khalifa Penthouse"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-455 dark:text-zinc-400">Property Type</label>
                        <select 
                          value={form.category}
                          onChange={e => setForm({...form, category: e.target.value})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer text-zinc-900 dark:text-white"
                        >
                          {(settings?.availableCategories || ['Apartment', 'Villa', 'Penthouse', 'Studio', 'Loft']).map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Purpose</label>
                        <select 
                          value={form.purpose}
                          onChange={e => setForm({...form, purpose: e.target.value as any})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white"
                        >
                          <option value="For Rent">For Rent</option>
                          <option value="For Sale">For Sale</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Furnishing</label>
                        <select 
                          value={form.furnishing}
                          onChange={e => setForm({...form, furnishing: e.target.value as any})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white"
                        >
                          {(settings?.availableFurnishing || ['Furnished', 'Unfurnished']).map((furn) => (
                            <option key={furn} value={furn}>{furn}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Owner / Associated Landlord</label>
                      <select 
                        value={form.landlordId || ''}
                        onChange={e => setForm({...form, landlordId: e.target.value})}
                        className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer text-zinc-900 dark:text-white"
                      >
                        <option value="">-- No select (Individual listing / Self-managed) --</option>
                        {landlords.map((land) => (
                          <option key={land.id} value={land.id}>
                            {land.fullName} ({land.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Unit Number</label>
                        <input 
                          type="text" 
                          required
                          value={form.unitNumber}
                          onChange={e => setForm({...form, unitNumber: e.target.value})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs" 
                          placeholder="e.g. 101"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Building Name (Dropdown Select)</label>
                        <select
                          value={form.buildingId || ''}
                          onChange={e => handleBuildingSelect(e.target.value)}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer text-zinc-900 dark:text-white text-xs font-bold"
                        >
                          <option value="">-- Custom Building / Manual Entry --</option>
                          {buildings.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.city || 'Dubai'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* MANUAL NAME AND MANUAL ADDRESS INPUT (shown if they choose '-- Custom Building --') */}
                    {!form.buildingId && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
                      >
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Manual Building Name</label>
                          <input 
                            type="text" 
                            required
                            value={form.buildingName}
                            onChange={e => setForm({...form, buildingName: e.target.value})}
                            className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white text-xs" 
                            placeholder="e.g. Binghatti Avenue"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Detailed Address (Dubai)</label>
                          <input 
                            type="text" 
                            required
                            value={form.address}
                            onChange={e => setForm({...form, address: e.target.value})}
                            className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white text-xs" 
                            placeholder="e.g. Palm Jumeirah, Villa 45"
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Description</label>
                      <textarea 
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                        rows={6}
                        className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white" 
                        placeholder="Tell guests about your property..."
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div 
                    key="step-2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-0.5">Space, Pricing & Media</h3>
                      <p className="text-xs text-zinc-550 dark:text-zinc-400">Provide pricing, general layout details, capacity settings, and upload listing images.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Price (Dirham)</label>
                        <input 
                          type="number" 
                          value={form.price || ''}
                          onChange={e => setForm({...form, price: Number(e.target.value)})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Size (sqft)</label>
                        <input 
                          type="number" 
                          value={form.size || ''}
                          onChange={e => setForm({...form, size: Number(e.target.value)})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Min Stay Nights</label>
                        <input 
                          type="number" 
                          value={form.minimumNights || ''}
                          onChange={e => setForm({...form, minimumNights: Number(e.target.value)})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Beds</label>
                        <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: Number(e.target.value)})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white font-sans" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Baths</label>
                        <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: Number(e.target.value)})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white font-sans" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Guests</label>
                        <input type="number" value={form.maxGuests} onChange={e => setForm({...form, maxGuests: Number(e.target.value)})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white font-sans" />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400 font-sans">Property Images</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 group-hover:border-brand rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 group-hover:text-brand transition-colors">
                            <Upload size={24} />
                          </div>
                          <div className="text-center font-sans">
                            <p className="font-bold text-sm text-zinc-805 dark:text-zinc-200">Click or Drag images here</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">Max 10 images • High Resolution Preferred</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Image Preview Grid */}
                      {(form.imageFiles.length > 0 || form.imageUrls.webp?.length > 0) && (
                        <div className="grid grid-cols-4 gap-3">
                          {form.imageUrls.webp?.map((url, i) => (
                            <div key={url || i} className="aspect-square relative rounded-xl overflow-hidden group border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-850">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono font-bold rounded z-10">
                                #{i + 1}
                              </div>

                              <div className="absolute top-1 right-1 p-1 bg-green-500 text-white rounded-full shadow-lg z-10">
                                <Check size={10} />
                              </div>

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                                <button 
                                  type="button"
                                  disabled={i === 0}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    moveImage(i, 'left');
                                  }}
                                  className="p-1 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white transition-all shadow"
                                  title="Move Left"
                                >
                                  <ChevronLeft size={16} />
                                </button>

                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setForm(prev => ({
                                      ...prev,
                                      imageUrls: {
                                        avif: prev.imageUrls.avif.filter((_, idx) => idx !== i),
                                        webp: prev.imageUrls.webp.filter((_, idx) => idx !== i),
                                        png: prev.imageUrls.png.filter((_, idx) => idx !== i)
                                      }
                                    }));
                                  }}
                                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow"
                                  title="Remove Image"
                                >
                                  <Trash2 size={14} />
                                </button>

                                <button 
                                  type="button"
                                  disabled={i === form.imageUrls.webp.length - 1}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    moveImage(i, 'right');
                                  }}
                                  className="p-1 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white transition-all shadow"
                                  title="Move Right"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {form.imageFiles.map((file, i) => {
                            const isStillUploading = Object.entries(uploadingStates).some(([key, val]) => key.startsWith(file.name) && val === 'uploading');
                            const isError = Object.entries(uploadingStates).some(([key, val]) => key.startsWith(file.name) && val === 'error');
                            const isDone = Object.entries(uploadingStates).some(([key, val]) => key.startsWith(file.name) && val === 'completed');

                            if (isDone) return null;

                            return (
                              <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-805 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-700 p-2 font-sans">
                                <p className="text-[8px] font-bold text-zinc-500 truncate w-full text-center">{file.name}</p>
                                {isStillUploading && <Loader2 size={16} className="animate-spin text-brand mt-1" />}
                                {isError && <X size={16} className="text-red-500 mt-1" />}
                                <button 
                                  type="button"
                                  onClick={() => setForm(prev => ({ ...prev, imageFiles: prev.imageFiles.filter((_, idx) => idx !== i) }))}
                                  className="absolute top-1 right-1 p-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 rounded-full"
                                >
                                  <X size={8} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div 
                    key="step-3"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-0.5">Amenities & Comfort</h3>
                      <p className="text-xs text-zinc-550 dark:text-zinc-400">Select specialized premium options, luxury features, and shared community benefits.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white font-sans">Manage Comfort Options</h3>
                        <div className="flex gap-2.5 items-center bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-sm font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              const newAmenities: any = {};
                              Object.entries(AMENITY_CATEGORIES).forEach(([cId, cItems]) => {
                                newAmenities[cId] = [...cItems];
                              });
                              setForm(prev => ({
                                ...prev,
                                amenities: newAmenities
                              }));
                            }}
                            className="text-[9px] font-black uppercase tracking-widest text-brand hover:text-brand-hover hover:underline transition-colors animate-pulse"
                          >
                            Select All
                          </button>
                          <span className="text-[10px] text-zinc-305 dark:text-zinc-750">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newAmenities: any = {};
                              Object.keys(AMENITY_CATEGORIES).forEach(cId => {
                                newAmenities[cId] = [];
                              });
                              setForm(prev => ({
                                ...prev,
                                amenities: newAmenities
                              }));
                            }}
                            className="text-[9px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-455 hover:text-zinc-650 dark:hover:text-zinc-205 hover:underline transition-colors"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6 max-h-[340px] overflow-y-auto px-1 no-scrollbar text-zinc-900 dark:text-white pb-4">
                        {Object.entries({
                          ...AMENITY_CATEGORIES,
                          customAmenities: settings?.availableAmenities || []
                        }).map(([catId, items]) => (
                          <div key={catId} className="space-y-2">
                            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                {catId.replace(/([A-Z])/g, ' $1')}
                              </h4>
                              <div className="flex gap-1.5 items-center font-sans">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm(prev => ({
                                      ...prev,
                                      amenities: {
                                        ...prev.amenities,
                                        [catId]: [...items]
                                      }
                                    }));
                                  }}
                                  className="text-[8px] font-black uppercase tracking-widest text-brand hover:text-brand-hover hover:underline"
                                >
                                  Select All
                                </button>
                                <span className="text-[8px] text-zinc-300 dark:text-zinc-700 font-mono">/</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm(prev => ({
                                      ...prev,
                                      amenities: {
                                        ...prev.amenities,
                                        [catId]: []
                                      }
                                    }));
                                  }}
                                  className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-300 hover:underline"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 font-sans">
                              {items.map(item => (
                                <button 
                                  key={item}
                                  type="button"
                                  onClick={() => {
                                    const current = (form.amenities as any)[catId] || [];
                                    const updated = current.includes(item) 
                                      ? current.filter((i: string) => i !== item)
                                      : [...current, item];
                                    setForm({
                                      ...form,
                                      amenities: { ...form.amenities, [catId]: updated }
                                    });
                                  }}
                                  className={`flex items-center gap-1.5 p-2 px-2.5 rounded-lg border text-[9px] font-bold uppercase tracking-tight transition-all text-left ${
                                    ((form.amenities as any)[catId] || []).includes(item)
                                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow'
                                      : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-555 hover:border-zinc-350 dark:hover:border-zinc-650'
                                  }`}
                                >
                                  {((form.amenities as any)[catId] || []).includes(item) ? <Check size={10} strokeWidth={4} className="shrink-0" /> : <Plus size={10} className="shrink-0 text-zinc-400" />}
                                  <span className="truncate">{item}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Validation Error Message */}
              {validationError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl text-[11px] font-bold flex items-center gap-2 mt-4"
                >
                  <span>⚠️</span> {validationError}
                </motion.div>
              )}

              {/* Step Navigation Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-8 pt-4 bg-gradient-to-t from-white dark:from-zinc-900 via-white/95 dark:via-zinc-900/95 to-transparent border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between gap-4 font-sans">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-6 py-3.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-950 disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft size={14} /> Back
                </button>

                <div className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                  Step {currentStep} of 3
                </div>

                {currentStep < 3 ? (
                  <button
                    key="btn-next"
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button 
                    key="btn-submit"
                    disabled={isUploading || Object.values(uploadingStates).some(s => s === 'uploading')}
                    type="submit"
                    className="px-8 py-3.5 bg-brand text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all hover:bg-brand-hover flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isUploading ? <><Loader2 className="animate-spin" size={14} /> {editingId ? 'Updating...' : 'Publishing...'}</> : 
                     Object.values(uploadingStates).some(s => s === 'uploading') ? <><Loader2 className="animate-spin" size={14} /> Uploading Images...</> :
                     (editingId ? 'Update Listing' : 'Publish Property')}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
