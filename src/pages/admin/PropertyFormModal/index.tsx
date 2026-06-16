import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronLeft, Loader2 } from 'lucide-react';
import { doc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { PropertyForm, getInitialForm } from '../types';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';
import { logActivity } from '../../../lib/auditLogger';

// Subcomponents
import AdminMapPicker from './AdminMapPicker';
import PropertyFormStep1 from './PropertyFormStep1';
import PropertyFormStep2 from './PropertyFormStep2';
import PropertyFormStep3 from './PropertyFormStep3';

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

  // Landlords & Buildings lists
  const [landlords, setLandlords] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);

  // Fetch relations when modal opens
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

  const validateStep = (step: number): boolean => {
    setValidationError('');
    if (step === 1) {
      if (!form.title || !form.title.trim()) {
        setValidationError('Please enter a listing title.');
        return false;
      }
      if (!form.unitNumber || !form.unitNumber.trim()) {
        setValidationError('Please enter the unit number.');
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
      if (!form.imageUrls.webp || form.imageUrls.webp.length === 0) {
        setValidationError('Please upload at least 1 image for the property.');
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

    setForm(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...files] }));

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

      if (newAvif[index] !== undefined && newAvif[targetIndex] !== undefined) {
        const tempAvif = newAvif[index];
        newAvif[index] = newAvif[targetIndex];
        newAvif[targetIndex] = tempAvif;
      }

      if (newWebp[index] !== undefined && newWebp[targetIndex] !== undefined) {
        const tempWebp = newWebp[index];
        newWebp[index] = newWebp[targetIndex];
        newWebp[targetIndex] = tempWebp;
      }

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
        priceMonthly: Number(form.priceMonthly || 0),
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
        status: form.status || 'live',
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'properties', editingId), propertyData);
        logActivity('UPDATE_PROPERTY', `Updated listing: "${propertyData.title}" (ID: ${editingId})`, { uid: user.uid, email: user.email, role: 'host' });
        alert("Property updated successfully!");
      } else {
        propertyData.hostId = user.uid;
        propertyData.reviewCount = 0;
        propertyData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'properties'), propertyData);
        logActivity('CREATE_PROPERTY', `Created new property listing: "${propertyData.title}"`, { uid: user.uid, email: user.email, role: 'host' });
        alert("Property published successfully!");
      }

      onSaved();
    } catch (err: any) {
      console.error("Admin: Error saving property:", err);
      alert("Error saving property: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          className="relative w-full bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-805 shadow-xl overflow-hidden flex flex-col z-10"
        >
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
             <h2 className="text-sm font-black uppercase tracking-widest text-zinc-905 dark:text-white">
               {editingId ? 'Edit Property Listing' : 'Publish New Property'}
             </h2>
             <button 
               type="button"
               onClick={onClose} 
               className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 cursor-pointer"
             >
               <X size={16} />
             </button>
          </div>

          {/* Wizard Header Bar */}
          <div className="px-8 py-4 bg-zinc-50/50 dark:bg-zinc-955/20 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between overflow-x-auto no-scrollbar font-sans gap-4">
            {[
              { id: 1, name: 'Basic Information' },
              { id: 2, name: 'Spaces & Media' },
              { id: 3, name: 'Amenities Mappings' }
            ].map((s, index) => {
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
                        if (valid) setCurrentStep(s.id);
                      }
                    }}
                    className="flex items-center gap-2.5 shrink-0 group focus:outline-none cursor-pointer"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white shadow-xs' 
                        : isActive 
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border border-zinc-900 dark:border-white' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}>
                      {isCompleted ? <Check size={12} strokeWidth={3} /> : s.id}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-zinc-900 dark:text-white font-extrabold' : 'text-zinc-405'}`}>
                      {s.name}
                    </span>
                  </button>
                  {index < 2 && (
                    <div className={`h-[1px] flex-1 max-w-[40px] rounded transition-colors ${currentStep > s.id ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-805'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 no-scrollbar pb-28 relative">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <PropertyFormStep1
                    form={form}
                    setForm={setForm}
                    buildings={buildings}
                    landlords={landlords}
                    availableCategories={settings?.availableCategories || ['Apartment', 'Villa', 'Penthouse', 'Studio', 'Loft']}
                    availableFurnishing={settings?.availableFurnishing || ['Furnished', 'Unfurnished']}
                    handleBuildingSelect={handleBuildingSelect}
                  />
                  <AdminMapPicker form={form} setForm={setForm} />
                </div>
              )}

              {currentStep === 2 && (
                <PropertyFormStep2
                  form={form}
                  setForm={setForm}
                  uploadingStates={uploadingStates}
                  handleFileChange={handleFileChange}
                  moveImage={moveImage}
                />
              )}

              {currentStep === 3 && (
                <PropertyFormStep3
                  form={form}
                  setForm={setForm}
                  availableAmenities={settings?.availableAmenities || []}
                />
              )}
            </AnimatePresence>

            {validationError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 dark:bg-amber-955/20 text-amber-705 dark:text-amber-400 rounded-2xl text-[11px] font-bold flex items-center gap-2 mt-4"
              >
                <span>⚠️</span> {validationError}
              </motion.div>
            )}

            {/* Navigation action buttons bar */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-4 bg-gradient-to-t from-white dark:from-zinc-900 via-white/95 dark:via-zinc-900/95 to-transparent border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between gap-4 font-sans">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-5 py-2.5 border border-zinc-255 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-950 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={12} /> Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-955 dark:hover:bg-zinc-900 text-zinc-505 dark:text-zinc-400 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                    {editingId ? 'Save Changes' : 'Publish Property'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
