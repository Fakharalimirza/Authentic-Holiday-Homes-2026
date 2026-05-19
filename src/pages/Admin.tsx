import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import CurrencySymbol from '../components/CurrencySymbol';
import { Plus, Edit, Trash2, Home, BookOpen, X, Check, Search, Filter, Shield, Upload, Loader2, PlusCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Property } from '../types';
import { ref, deleteObject } from 'firebase/storage';

const AMENITY_CATEGORIES = {
  features: ['Furnished', 'Electricity Backup', 'Parking Spaces: 1', 'Centrally Air-Conditioned'],
  building: ['Balcony or Terrace', 'Lobby in Building', 'Service Elevators', 'Reception/Waiting Room'],
  healthFitness: ['Gym or Health Club', 'Swimming Pool'],
  recreationFamily: ['Kids Play Area', 'Lawn or Garden', 'Barbeque Area'],
  cleaningMaintenance: ['Waste Disposal', 'Maintenance Staff'],
  businessSecurity: ['Business Center', 'Security Staff', 'CCTV Security'],
  technology: ['Broadband Internet', 'Satellite/Cable TV'],
  miscellaneous: ['24 Hours Concierge', 'Pets Allowed', 'Freehold']
};

interface PropertyForm {
  title: string;
  category: string;
  description: string;
  price: number;
  unitNumber: string;
  buildingName: string;
  referenceNo: string;
  purpose: 'For Rent' | 'For Sale';
  furnishing: 'Furnished' | 'Unfurnished';
  size: number;
  address: string;
  lat: number;
  lng: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: {
    features: string[];
    building: string[];
    healthFitness: string[];
    recreationFamily: string[];
    cleaningMaintenance: string[];
    businessSecurity: string[];
    technology: string[];
    miscellaneous: string[];
  };
  imageFiles: File[];
  imageUrls: {
    avif: string[];
    webp: string[];
    png: string[];
  };
  rating: number;
  isAvailable: boolean;
}

export default function Admin() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t, lang } = useSettings();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'properties' | 'bookings'>('properties');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  const initialForm: PropertyForm = {
    title: '',
    category: 'Apartment',
    description: '',
    price: 0,
    unitNumber: '',
    buildingName: '',
    referenceNo: `AHH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    purpose: 'For Rent',
    furnishing: 'Furnished',
    size: 0,
    address: '',
    lat: 25.2048,
    lng: 55.2708,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: {
      features: [],
      building: [],
      healthFitness: [],
      recreationFamily: [],
      cleaningMaintenance: [],
      businessSecurity: [],
      technology: [],
      miscellaneous: []
    },
    imageFiles: [],
    imageUrls: { avif: [], webp: [], png: [] },
    rating: 5.0,
    isAvailable: true
  };

  const [form, setForm] = useState<PropertyForm>(initialForm);

  const [showAllAsAdmin, setShowAllAsAdmin] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingBookings: 0, activeProperties: 0 });
  const [uploadingStates, setUploadingStates] = useState<{ [key: string]: 'uploading' | 'completed' | 'error' }>({});

  const filteredProperties = (properties || []).filter(p => 
    (p.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (p.buildingName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (p.referenceNo?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const calculateStats = (props: Property[], booked: any[]) => {
    const active = props.filter(p => p.isAvailable).length;
    const pending = booked.filter(b => b.status === 'pending').length;
    const revenue = booked.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
    setStats({ totalRevenue: revenue, pendingBookings: pending, activeProperties: active });
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isAdminEmail = user.email?.toLowerCase() === 'fakharalimirza@gmail.com';
      let q;
      if (isAdminEmail && showAllAsAdmin) {
        q = query(collection(db, 'properties'));
      } else {
        q = query(collection(db, 'properties'), where('hostId', '==', user.uid));
      }
        
      const snapshot = await getDocs(q);
      const props = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Property[];
      setProperties(props);

      const bQuery = query(collection(db, 'bookings'), where('status', '!=', 'cancelled'));
      const bSnapshot = await getDocs(bQuery);
      const booked = bSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setBookings(booked);
      
      calculateStats(props, booked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

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

  const uploadImages = async (): Promise<{ avif: string[], webp: string[], png: string[] }> => {
    // Now just returns the already uploaded URLs
    return form.imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUploading(true);

    try {
      const imageUrls = await uploadImages();

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
        images: imageUrls,
        rating: Number(form.rating || 5.0),
        isAvailable: form.isAvailable ?? true,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        console.log("Admin: Updating property", editingId, propertyData);
        await updateDoc(doc(db, 'properties', editingId), propertyData);
        alert("Property updated successfully!");
      } else {
        propertyData.hostId = user.uid;
        propertyData.reviewCount = 0;
        propertyData.createdAt = serverTimestamp();
        console.log("Admin: Adding new property", propertyData);
        await addDoc(collection(db, 'properties'), propertyData);
        alert("Property published successfully!");
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setForm(initialForm);
      setUploadingStates({});
      fetchData();
    } catch (err) {
      console.error("Admin: Error saving property:", err);
      alert("Error saving property: " + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'properties', id), { isAvailable: !current });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !current } : p));
      await fetchData();
    } catch (err) {
      console.error("Error toggling availability:", err);
      alert("Failed to update availability: " + (err as Error).message);
    }
  };

  const handleDuplicate = (p: Property) => {
    setEditingId(null);
    setUploadingStates({});
    setForm({
      title: `${p.title} (Copy)`,
      category: p.category || 'Apartment',
      description: p.description || '',
      price: p.price,
      unitNumber: '',
      buildingName: p.buildingName || '',
      referenceNo: `AHH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      purpose: p.purpose || 'For Rent',
      furnishing: p.furnishing || 'Furnished',
      size: p.size || 0,
      address: p.location.address,
      lat: p.location.lat,
      lng: p.location.lng,
      maxGuests: p.maxGuests || 2,
      bedrooms: p.bedrooms || 1,
      bathrooms: p.bathrooms || 1,
      amenities: p.amenities || initialForm.amenities,
      imageFiles: [],
      imageUrls: p.images || initialForm.imageUrls,
      rating: p.rating || 5.0,
      isAvailable: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (p: Property) => {
    setEditingId(p.id);
    setUploadingStates({});
    setForm({
      title: p.title,
      category: p.category || 'Apartment',
      description: p.description || '',
      price: p.price,
      unitNumber: p.unitNumber || '',
      buildingName: p.buildingName || '',
      referenceNo: p.referenceNo || `AHH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      purpose: p.purpose || 'For Rent',
      furnishing: p.furnishing || 'Furnished',
      size: p.size || 0,
      address: p.location.address,
      lat: p.location.lat,
      lng: p.location.lng,
      maxGuests: p.maxGuests || 2,
      bedrooms: p.bedrooms || 1,
      bathrooms: p.bathrooms || 1,
      amenities: p.amenities || initialForm.amenities,
      imageFiles: [],
      imageUrls: p.images || initialForm.imageUrls,
      rating: p.rating || 5.0,
      isAvailable: p.isAvailable ?? true
    });
    setIsModalOpen(true);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    console.log("Admin: Deleting property starting:", id);
    setDeletingId(id);
    try {
      // 1. Get property data first to get image URLs
      const propertyToDelete = properties.find(p => p.id === id);
      
      if (propertyToDelete?.images) {
        console.log("Admin: Deleting associated images from storage...");
        const allUrls = [
          ...(propertyToDelete.images.avif || []),
          ...(propertyToDelete.images.webp || []),
          ...(propertyToDelete.images.png || [])
        ];

        // Delete all images in parallel (best effort)
        await Promise.allSettled(
          allUrls.map(async (url) => {
            try {
              // Only attempt to delete if it's a firebase storage URL
              if (url.includes('firebasestorage.googleapis.com')) {
                const imageRef = ref(storage, url);
                await deleteObject(imageRef);
              }
            } catch (err) {
              console.warn("Could not delete image from storage:", url, err);
            }
          })
        );
      }

      // 2. Delete from Firestore
      console.log("Admin: Deleting property from Firestore:", id);
      await deleteDoc(doc(db, 'properties', id));
      
      alert("Property and its data deleted successfully!");
      setProperties(prev => prev.filter(p => p.id !== id));
      await fetchData();
    } catch (err) {
      console.error("Error deleting property:", err);
      alert("Failed to delete property: " + (err as Error).message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'bookings', id), { status });
    fetchData();
  };

  if (authLoading) return <div className="p-20 text-center animate-pulse">Verifying credentials...</div>;

  if (profile?.role !== 'host') return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <Shield size={64} className="text-zinc-300 mb-4" />
      <h2 className="text-2xl font-bold">Access Restricted</h2>
      <p className="text-zinc-500 max-w-md">Only registered hosts can access the Authentic Management Portal. Would you like to apply to become a host?</p>
      <button className="mt-4 px-6 py-2 bg-brand text-white rounded-full hover:bg-brand-hover transition-colors">Contact Support</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex-1">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Management Portal</h1>
          <p className="text-zinc-500">Dubai Portfolio & Real-time Bookings</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-wrap items-center gap-4">
           {user.email?.toLowerCase() === 'fakharalimirza@gmail.com' && (
             <button 
              onClick={() => { setShowAllAsAdmin(!showAllAsAdmin); fetchData(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${showAllAsAdmin ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200'}`}
             >
               {showAllAsAdmin ? 'Showing All (Admin Mode)' : 'Showing Mine (Host Mode)'}
             </button>
           )}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search reference, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-brand"
            />
          </div>
          <button 
            onClick={() => { 
              setEditingId(null); 
              setForm({ ...initialForm, referenceNo: `AHH-${Math.random().toString(36).substr(2, 9).toUpperCase()}` }); 
              setUploadingStates({});
              setIsModalOpen(true); 
            }}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-brand text-white rounded-2xl font-bold hover:scale-105 transition-transform hover:bg-brand-hover shadow-lg shadow-brand/20"
          >
            <PlusCircle size={20} /> Add New
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Total Revenue</p>
          <p className="text-3xl font-black flex items-center gap-2"><CurrencySymbol size="0.8em" /> {stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Pending Approv.</p>
          <p className="text-3xl font-black">{stats.pendingBookings}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Active Units</p>
          <p className="text-3xl font-black">{stats.activeProperties}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={() => setActiveTab('properties')}
          className={`pb-4 px-2 font-bold transition-all relative ${activeTab === 'properties' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}
        >
          Properties
          {activeTab === 'properties' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`pb-4 px-2 font-bold transition-all relative ${activeTab === 'bookings' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}
        >
          Bookings
          {activeTab === 'bookings' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
        </button>
      </div>

      {activeTab === 'properties' ? (
        <div className="grid grid-cols-1 gap-4">
          {loading ? [1,2,3].map(i => <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />) : (
            filteredProperties.map(p => (
              <div key={p.id} className="flex flex-col md:flex-row items-center gap-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-hover hover:border-zinc-300 dark:hover:border-zinc-700">
                <img src={p.images?.webp?.[0] || 'https://via.placeholder.com/300x300?text=Listing'} className="w-full md:w-32 h-32 object-cover rounded-xl" alt="" />
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                    <h3 className="font-bold text-lg">{p.title}</h3>
                    <span className={`w-2 h-2 rounded-full ${p.isAvailable ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.4)]`} />
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">{p.category}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-brand/10 px-2 py-0.5 rounded text-brand">{p.referenceNo}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">{p.location?.address}</p>
                </div>
                <div className="text-center md:text-right px-4">
                   <p className="font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-center md:justify-end gap-1">
                     <CurrencySymbol size="1.1em" /> {p.price}
                   </p>
                   <button 
                    onClick={() => toggleAvailability(p.id, !!p.isAvailable)}
                    className={`text-[10px] uppercase font-bold mt-1 px-3 py-1 rounded-full border transition-all ${p.isAvailable ? 'text-green-500 border-green-200 bg-green-50 dark:bg-green-900/10' : 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/10'}`}
                   >
                     {p.isAvailable ? 'Available' : 'Booked'}
                   </button>
                </div>
                <div className="flex gap-2 p-4">
                   <button 
                    title="View Property"
                    onClick={() => window.open(`/property/${p.id}`, '_blank')}
                    className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"
                   >
                    <ArrowRight size={18} />
                   </button>
                   <button title="Edit" onClick={() => handleEdit(p)} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"><Edit size={18} /></button>
                   <button title="Duplicate" onClick={() => handleDuplicate(p)} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"><Plus size={18} /></button>
                   <button 
                      title="Delete" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDeleteId(p.id);
                      }} 
                      disabled={deletingId === p.id}
                      className="p-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {deletingId === p.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                </div>
              </div>
            ))
          )}
          {filteredProperties.length === 0 && !loading && (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
               <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">No units match your search</p>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-zinc-400 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Guest</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="bg-white dark:bg-zinc-900 group">
                  <td className="px-6 py-4 rounded-l-2xl font-bold">{b.propertyId}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{b.guestId.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-right font-bold text-zinc-600 flex items-center justify-end gap-1">
                    <CurrencySymbol size="1.1em" /> {b.totalPrice}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      b.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 
                      b.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 rounded-r-2xl">
                    <div className="flex gap-2">
                      <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg"><Check size={16}/></button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"><X size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <div className="text-center py-20 text-zinc-400 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 uppercase tracking-widest text-xs font-bold">No active bookings</div>}
        </div>
      )}

      {/* Property Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
                 <h2 className="text-2xl font-bold">{editingId ? 'Edit Property' : 'Add New Property'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"><X/></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8 no-scrollbar flex-1 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Listing Title</label>
                         <input 
                          required
                          type="text" 
                          value={form.title}
                          onChange={e => setForm({...form, title: e.target.value})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" 
                          placeholder="e.g. Burj Khalifa Penthouse"
                         />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Property Type</label>
                        <select 
                          value={form.category}
                          onChange={e => setForm({...form, category: e.target.value})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer"
                        >
                          <option value="Apartment">Apartment</option>
                          <option value="Villa">Villa</option>
                          <option value="Penthouse">Penthouse</option>
                          <option value="Studio">Studio</option>
                          <option value="Loft">Loft</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Unit Number</label>
                         <input 
                          required
                          type="text" 
                          value={form.unitNumber}
                          onChange={e => setForm({...form, unitNumber: e.target.value})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" 
                          placeholder="e.g. 101"
                         />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Building Name</label>
                        <input 
                          required
                          type="text" 
                          value={form.buildingName}
                          onChange={e => setForm({...form, buildingName: e.target.value})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" 
                          placeholder="e.g. Binghatti Avenue"
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Purpose</label>
                        <select 
                          value={form.purpose}
                          onChange={e => setForm({...form, purpose: e.target.value as any})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                        >
                          <option value="For Rent">For Rent</option>
                          <option value="For Sale">For Sale</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Furnishing</label>
                        <select 
                          value={form.furnishing}
                          onChange={e => setForm({...form, furnishing: e.target.value as any})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                        >
                          <option value="Furnished">Furnished</option>
                          <option value="Unfurnished">Unfurnished</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Description</label>
                       <textarea 
                        required
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                        rows={5}
                        className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" 
                        placeholder="Tell guests about your property..."
                       />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Property Images</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 group-hover:border-brand rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 group-hover:text-brand transition-colors">
                            <Upload size={32} />
                          </div>
                          <div className="text-center">
                            <p className="font-bold">Click or Drag images here</p>
                            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Max 10 images • High Resolution Preferred</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Image Preview Grid */}
                      {(form.imageFiles.length > 0 || form.imageUrls.webp?.length > 0) && (
                        <div className="grid grid-cols-4 gap-3">
                          {form.imageUrls.webp?.map((url, i) => (
                            <div key={i} className="aspect-square relative rounded-xl overflow-hidden group border border-zinc-200 dark:border-zinc-700">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <div className="absolute top-1 right-1 p-1 bg-green-500 text-white rounded-full shadow-lg z-20">
                                <Check size={10} />
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  setForm(prev => ({
                                    ...prev,
                                    imageUrls: {
                                      avif: prev.imageUrls.avif.filter((_, idx) => idx !== i),
                                      webp: prev.imageUrls.webp.filter((_, idx) => idx !== i),
                                      png: prev.imageUrls.png.filter((_, idx) => idx !== i)
                                    }
                                  }));
                                }}
                                className="absolute bottom-1 right-1 p-1 bg-zinc-900/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                          {form.imageFiles.map((file, i) => {
                            // Find out if this file is still uploading
                            const isStillUploading = Object.entries(uploadingStates).some(([key, val]) => key.startsWith(file.name) && val === 'uploading');
                            const isError = Object.entries(uploadingStates).some(([key, val]) => key.startsWith(file.name) && val === 'error');
                            const isDone = Object.entries(uploadingStates).some(([key, val]) => key.startsWith(file.name) && val === 'completed');

                            // If it's already done, we show it in the primary webp list above
                            if (isDone) return null;

                            return (
                              <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-700 p-2">
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
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-sans">Price (Dirham)</label>
                        <input 
                          required
                          type="number" 
                          value={form.price}
                          onChange={e => setForm({...form, price: Number(e.target.value)})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Size (sqft)</label>
                        <input 
                          type="number" 
                          value={form.size}
                          onChange={e => setForm({...form, size: Number(e.target.value)})}
                          className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Beds</label>
                        <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: Number(e.target.value)})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Baths</label>
                        <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: Number(e.target.value)})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Guests</label>
                        <input type="number" value={form.maxGuests} onChange={e => setForm({...form, maxGuests: Number(e.target.value)})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Detailed Address (Dubai)</label>
                       <input 
                        required
                        type="text" 
                        value={form.address}
                        onChange={e => setForm({...form, address: e.target.value})}
                        className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all" 
                        placeholder="e.g. Palm Jumeirah, Villa 45"
                       />
                    </div>

                    {/* Amenities Category Grid */}
                    <div className="space-y-6 pt-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Amenities & Features</h3>
                      <div className="space-y-8 max-h-[400px] overflow-y-auto px-1 no-scrollbar">
                        {Object.entries(AMENITY_CATEGORIES).map(([catId, items]) => (
                          <div key={catId} className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-1">{catId.replace(/([A-Z])/g, ' $1')}</h4>
                            <div className="grid grid-cols-2 gap-2">
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
                                  className={`flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all ${
                                    ((form.amenities as any)[catId] || []).includes(item)
                                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg shadow-zinc-900/10'
                                      : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300'
                                  }`}
                                >
                                  {((form.amenities as any)[catId] || []).includes(item) ? <Check size={12} strokeWidth={4} /> : <Plus size={12} />}
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 pt-4 bg-gradient-to-t from-white dark:from-zinc-900 via-white/90 dark:via-zinc-900/90 to-transparent">
                  <button 
                  disabled={isUploading || Object.values(uploadingStates).some(s => s === 'uploading')}
                  type="submit"
                  className="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all hover:bg-brand-hover flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isUploading ? <><Loader2 className="animate-spin" /> {editingId ? 'Updating...' : 'Publishing...'}</> : 
                     Object.values(uploadingStates).some(s => s === 'uploading') ? <><Loader2 className="animate-spin" /> Uploading Images...</> :
                     (editingId ? 'Update Listing' : 'Publish Property')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Delete</h3>
              <p className="text-zinc-500 mb-8 leading-relaxed">
                Are you sure you want to delete this property?<br />
                <span className="font-bold text-red-500 underline decoration-red-500/30"> This action cannot be undone.</span>
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

