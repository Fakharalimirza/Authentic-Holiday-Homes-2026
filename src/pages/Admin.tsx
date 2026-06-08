import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { db, storage } from '../lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { 
  Search, 
  PlusCircle, 
  LayoutDashboard, 
  Building2, 
  CalendarRange, 
  Wrench, 
  LifeBuoy, 
  FolderKey, 
  CreditCard, 
  MessageSquare, 
  Users, 
  UserPlus, 
  History, 
  Database, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  Activity,
  ArrowUpRight,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Check,
  Key,
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  Info,
  Mail,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Property } from '../types';
import { logActivity } from '../lib/auditLogger';

// Importing Admin Modular Components
import AccessDenied from './admin/AccessDenied';
import AdminStats from './admin/AdminStats';
import BookingsTable from './admin/BookingsTable';
import DeleteConfirmationModal from './admin/DeleteConfirmationModal';
import PropertiesTable from './admin/PropertiesTable';
import PropertyFormModal from './admin/PropertyFormModal';
import { PropertyForm, getInitialForm } from './admin/types';
import BookingConsole from './admin/bookings/BookingConsole';
import SettingsPanel from './admin/SettingsPanel';
import UsersTable from './admin/UsersTable';
import TurnoversTable from './admin/TurnoversTable';
import TicketsConsole from './admin/TicketsConsole';
import PaymentsConsole from './admin/PaymentsConsole';
import StaffChat from './admin/StaffChat';
import DocumentsConsole from './admin/DocumentsConsole';
import InvitationsConsole from './admin/InvitationsConsole';
import AuditLogsConsole from './admin/AuditLogsConsole';
import DatabaseConsole from './admin/DatabaseConsole';
import LandlordsConsole from './admin/LandlordsConsole';
import BuildingsConsole from './admin/BuildingsConsole';
import UnitsConsole from './admin/UnitsConsole';
import TemplatesConsole from './admin/TemplatesConsole';
import PortalLeadsConsole from './admin/PortalLeadsConsole';

export default function Admin() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t, lang } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Quick state for simple local-time dynamic greeting
  const [timeOfDay, setTimeOfDay] = useState<string>('day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  const getTabsList = () => {
    const list: { id: string; label: string; icon: any; category: string }[] = [];
    const isDeveloper = user?.email?.toLowerCase() === 'fakharalimirza@gmail.com';
    const role = isDeveloper ? 'super_admin' : (profile?.role || 'guest');
    
    // Dashboard overview
    list.push({ id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, category: 'Main Console' });

    // Properties tab
    if (['super_admin', 'admin', 'agent', 'landlord', 'host'].includes(role)) {
      list.push({ id: 'properties', label: 'Listings', icon: Building2, category: 'Main Console' });
    }
    
    // Bookings tab
    if (['super_admin', 'admin', 'agent', 'host'].includes(role)) {
      list.push({ id: 'bookings', label: 'Reservations Console', icon: CalendarRange, category: 'Main Console' });
    }
    
    // Turnovers / Maintenance tab
    if (['super_admin', 'admin', 'maintenance', 'host'].includes(role)) {
      list.push({ id: 'maintenance', label: 'Turnovers & Cleaning', icon: Wrench, category: 'Main Console' });
    }
    
    // Support Tickets tab - visible to guests, landlords, admins, etc.
    list.push({ id: 'support', label: 'Support Desk', icon: LifeBuoy, category: 'Communications' });

    // Secure Document Vault - visible to administrative & landlord roles
    if (['super_admin', 'admin', 'agent', 'host', 'landlord'].includes(role)) {
      list.push({ id: 'documents', label: 'Secure Documents', icon: FolderKey, category: 'Workspace & File Storage' });
    }

    // Payments tab - visible to guests, landlords, admins, etc.
    list.push({ id: 'payments', label: 'Payments Ledger', icon: CreditCard, category: 'Workspace & File Storage' });

    // Staff Chat tab - visible to actual workspace staff roles
    if (['super_admin', 'admin', 'agent', 'maintenance', 'host'].includes(role)) {
      list.push({ id: 'staff_chat', label: 'Internal Staff Chat', icon: MessageSquare, category: 'Communications' });
    }
    
    // Portal Leads Console tab
    if (['super_admin', 'admin', 'agent', 'host'].includes(role)) {
      list.push({ id: 'portal_leads', label: 'Portal Leads Console', icon: Globe, category: 'Communications' });
    }
    
    // Users tab
    if (['super_admin', 'admin', 'host'].includes(role)) {
      list.push({ id: 'landlords', label: 'Landlords & Owners', icon: Users, category: 'Real Estate Administration' });
      list.push({ id: 'buildings', label: 'Buildings & Properties', icon: Building2, category: 'Real Estate Administration' });
      list.push({ id: 'units', label: 'Units Inventory', icon: Key, category: 'Real Estate Administration' });
      list.push({ id: 'users', label: 'Member Roles (RBAC)', icon: Users, category: 'Access Administration' });
    }
    
    // Global Settings tab
    if (['super_admin', 'admin', 'host'].includes(role)) {
      list.push({ id: 'invitations', label: 'Invitations Roster', icon: UserPlus, category: 'Access Administration' });
      list.push({ id: 'audit_logs', label: 'Staff Audit Trail', icon: History, category: 'System Maintenance' });
      list.push({ id: 'database', label: 'cPanel DB Service', icon: Database, category: 'System Maintenance' });
      list.push({ id: 'email_templates', label: 'Email Templates', icon: Mail, category: 'System Maintenance' });
      list.push({ id: 'settings', label: 'Global Settings', icon: Settings, category: 'System Maintenance' });
    }
    
    return list;
  };

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const qTab = searchParams.get('tab');
    return qTab || 'overview';
  });

  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    const newParams: Record<string, string> = { tab: tabId };
    const chatUser = searchParams.get('chatUser');
    if (chatUser && tabId === 'staff_chat') {
      newParams.chatUser = chatUser;
    }
    const ticketId = searchParams.get('ticketId');
    if (ticketId && tabId === 'support') {
      newParams.ticketId = ticketId;
    }
    setSearchParams(newParams);
    setIsMobileMenuOpen(false); // Close slider on tap
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const tabsList = getTabsList();
      if (tabsList.some(t => t.id === tab)) {
        setActiveTabState(tab);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const tabsList = getTabsList();
    if (tabsList.length > 0 && !tabsList.find(t => t.id === activeTab)) {
      setActiveTabState(tabsList[0].id);
    }
  }, [profile?.role]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllAsAdmin, setShowAllAsAdmin] = useState(true);

  // Stats numerical state
  const [stats, setStats] = useState({ totalRevenue: 0, pendingBookings: 0, activeProperties: 0 });

  // Modals visibility state
  // stats and modals states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialFormToEdit, setInitialFormToEdit] = useState<PropertyForm | null>(null);

  // Bulk properties states
  const [showBulkProperties, setShowBulkProperties] = useState(false);
  const [bulkPropertiesCsv, setBulkPropertiesCsv] = useState('');
  const [bulkPropertiesPreview, setBulkPropertiesPreview] = useState<any[]>([]);
  const [bulkPropertiesError, setBulkPropertiesError] = useState('');
  const [bulkPropertiesSuccess, setBulkPropertiesSuccess] = useState('');
  const [isDragOverPropertiesCsv, setIsDragOverPropertiesCsv] = useState(false);
  const [isBulkImportingProperties, setIsBulkImportingProperties] = useState(false);
  const propertiesFileInputRef = React.useRef<HTMLInputElement>(null);

  // Deletion operation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [consoleSuccess, setConsoleSuccess] = useState('');
  const [consoleError, setConsoleError] = useState('');

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
      const isSystemAdmin = ['super_admin', 'admin', 'host'].includes(profile?.role || '') || user.email?.toLowerCase() === 'fakharalimirza@gmail.com';
      let q;
      if (isSystemAdmin && showAllAsAdmin) {
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
      console.error("Admin: Error fetching dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, profile?.role, showAllAsAdmin]);

  const handleAddNew = () => {
    setEditingId(null);
    setInitialFormToEdit(null);
    setIsModalOpen(true);
  };

  const handleCreateListingFromUnit = (unit: any, buildingName: string, buildingAddress: string) => {
    const initialForm: PropertyForm = {
      ...getInitialForm(),
      title: `${buildingName} - Unit ${unit.unitNumber}`,
      category: unit.unitType || 'Apartment',
      description: unit.description || `Premium holiday home residence unit located at ${buildingName}. Fully equipped for comfortable, state-of-the-art living.`,
      price: unit.price || 0,
      unitNumber: unit.unitNumber,
      buildingName: buildingName,
      referenceNo: `AHH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      address: buildingAddress || '',
      bedrooms: unit.bedrooms || 1,
      bathrooms: unit.bathrooms || 1,
      size: unit.size || 0,
      furnishing: unit.furnishing === 'Semi-Furnished' ? 'Furnished' : (unit.furnishing as any),
      landlordId: unit.landlordId || '',
      buildingId: unit.buildingId || '',
      isAvailable: true,
      maxGuests: unit.guestCapacity || 2,
    };
    setEditingId(null);
    setInitialFormToEdit(initialForm);
    setActiveTab('properties');
    setIsModalOpen(true);
  };

  const handleEdit = (p: Property) => {
    setEditingId(p.id);
    setInitialFormToEdit({
      title: p.title || '',
      category: p.category || 'Apartment',
      description: p.description || '',
      price: p.price || 0,
      unitNumber: p.unitNumber || '',
      buildingName: p.buildingName || '',
      referenceNo: p.referenceNo || `AHH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      purpose: p.purpose || 'For Rent',
      furnishing: p.furnishing || 'Furnished',
      size: p.size || 0,
      address: p.location?.address || '',
      lat: p.location?.lat || 25.2048,
      lng: p.location?.lng || 55.2708,
      maxGuests: p.maxGuests || 2,
      bedrooms: p.bedrooms || 1,
      bathrooms: p.bathrooms || 1,
      amenities: {
        features: p.amenities?.features || [],
        building: p.amenities?.building || [],
        healthFitness: p.amenities?.healthFitness || [],
        recreationFamily: p.amenities?.recreationFamily || [],
        cleaningMaintenance: p.amenities?.cleaningMaintenance || [],
        businessSecurity: p.amenities?.businessSecurity || [],
        technology: p.amenities?.technology || [],
        miscellaneous: p.amenities?.miscellaneous || [],
      },
      imageFiles: [],
      imageUrls: p.images || { avif: [], webp: [], png: [] },
      rating: p.rating || 5.0,
      isAvailable: p.isAvailable ?? true
    });
    setIsModalOpen(true);
  };

  const handleDuplicate = (p: Property) => {
    setEditingId(null);
    setInitialFormToEdit({
      title: p.title ? `${p.title} (Copy)` : 'New Copy',
      category: p.category || 'Apartment',
      description: p.description || '',
      price: p.price || 0,
      unitNumber: '',
      buildingName: p.buildingName || '',
      referenceNo: `AHH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      purpose: p.purpose || 'For Rent',
      furnishing: p.furnishing || 'Furnished',
      size: p.size || 0,
      address: p.location?.address || '',
      lat: p.location?.lat || 25.2048,
      lng: p.location?.lng || 55.2708,
      maxGuests: p.maxGuests || 2,
      bedrooms: p.bedrooms || 1,
      bathrooms: p.bathrooms || 1,
      amenities: {
        features: p.amenities?.features || [],
        building: p.amenities?.building || [],
        healthFitness: p.amenities?.healthFitness || [],
        recreationFamily: p.amenities?.recreationFamily || [],
        cleaningMaintenance: p.amenities?.cleaningMaintenance || [],
        businessSecurity: p.amenities?.businessSecurity || [],
        technology: p.amenities?.technology || [],
        miscellaneous: p.amenities?.miscellaneous || [],
      },
      imageFiles: [],
      imageUrls: p.images || { avif: [], webp: [], png: [] },
      rating: p.rating || 5.0,
      isAvailable: true
    });
    setIsModalOpen(true);
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      const prop = properties.find(p => p.id === id);
      await updateDoc(doc(db, 'properties', id), { isAvailable: !current });
      logActivity('TOGGLE_AVAILABILITY', `Toggled listing of "${prop?.title || 'Property'}" (ID: ${id}) to ${!current ? 'ACTIVE / AVAILABLE' : 'BOOKED / UNAVAILABLE'}`, profile);
      setProperties(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !current } : p));
      await fetchData();
    } catch (err) {
      console.error("Admin: Error toggling availability:", err);
      alert("Failed to update availability: " + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    console.log("Admin: Deleting property starting:", id);
    const prop = properties.find(p => p.id === id);
    setConsoleSuccess('');
    setConsoleError('');
    setDeletingId(id);
    try {
      const propertyToDelete = properties.find(p => p.id === id);
      
      if (propertyToDelete?.images) {
        console.log("Admin: Deleting associated images from storage...");
        const allUrls = [
          ...(propertyToDelete.images.avif || []),
          ...(propertyToDelete.images.webp || []),
          ...(propertyToDelete.images.png || [])
        ];

        // Best effort image deletion
        await Promise.allSettled(
          allUrls.map(async (url) => {
            try {
              if (url.includes('firebasestorage.googleapis.com')) {
                const imageRef = ref(storage, url);
                await deleteObject(imageRef);
              }
            } catch (err) {
              console.warn("Admin: Could not delete old file from storage:", url, err);
            }
          })
        );
      }

      console.log("Admin: Deleting property from Firestore:", id);
      await deleteDoc(doc(db, 'properties', id));
      logActivity('DELETE_PROPERTY', `Permanently deleted listing of: "${prop?.title || 'Unknown'}" (ID: ${id}) and wiped remote images`, profile);
      
      setConsoleSuccess(`Property "${prop?.title || 'Property'}" and its details were deleted successfully metrics-wide.`);
      setProperties(prev => prev.filter(p => p.id !== id));
      await fetchData();
    } catch (err) {
      console.error("Admin: Error deleting property:", err);
      setConsoleError("Failed to delete property: " + (err as Error).message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      logActivity('UPDATE_BOOKING', `Updated booking ID [${id}] status to: [${status.toUpperCase()}]`, profile);
      await fetchData();
    } catch (err) {
      console.error("Admin: Error updating booking status:", err);
      alert("Failed to update booking: " + (err as Error).message);
    }
  };

  // --- PROPERTIES CSV / TEXT BULK IMPORTER & EXPORTER UTILS ---
  const loadPropertiesSampleCsv = () => {
    const headers = [
      "Title",
      "Category",
      "Description",
      "Price",
      "Unit Number",
      "Building Name",
      "Reference No",
      "Purpose",
      "Furnishing",
      "Size SqFt",
      "Max Guests",
      "Bedrooms",
      "Bathrooms",
      "Address",
      "Lat",
      "Lng"
    ].join(",");
    const sampleRecord = [
      "Elegance Residences Marina Suite",
      "Apartment",
      "High-floor premium luxury penthouse apartment with direct Marina bay and Sea views.",
      "1200",
      "4005",
      "Marina Sky Heights Tower",
      `AHH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      "For Rent",
      "Furnished",
      "1850",
      "6",
      "3",
      "3.5",
      "Al Marsa Street, Dubai Marina East",
      "25.2048",
      "55.2708"
    ].map(v => `"${v}"`).join(",");
    setBulkPropertiesCsv(headers + "\n" + sampleRecord);
    setBulkPropertiesError('');
    setBulkPropertiesSuccess('Sample holiday home listing template loaded.');
  };

  const parseAndPreviewPropertiesCsv = (text: string) => {
    setBulkPropertiesError('');
    setBulkPropertiesPreview([]);
    if (!text.trim()) return;

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setBulkPropertiesError("CSV must contain a header row followed by at least 1 record row.");
      return;
    }

    const parseCsvLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      return values;
    };

    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    const tempPreview: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      if (cells.length === 0 || (cells.length === 1 && cells[0] === "")) continue;

      const record: any = {
        amenities: {
          features: ["Air Conditioning", "Wi-Fi", "Fully Equipped Kitchen", "Balcony"],
          building: ["Elevator", "24 Hours Security", "Parking Space"]
        },
        images: {
          avif: [],
          webp: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600&auto=format&fit=crop"],
          png: []
        }
      };

      headers.forEach((h, index) => {
        const val = cells[index] || '';
        if (h === "title" || h.includes("title")) record.title = val;
        else if (h === "category" || h.includes("type")) record.category = val;
        else if (h === "description" || h.includes("desc")) record.description = val;
        else if (h === "price" || h.includes("rate")) record.price = Number(val) || 0;
        else if (h.includes("unit number") || h === "unit") record.unitNumber = val;
        else if (h.includes("building name") || h === "building") record.buildingName = val;
        else if (h.includes("ref") || h.includes("reference")) record.referenceNo = val;
        else if (h === "purpose") record.purpose = val === "For Sale" ? "For Sale" : "For Rent";
        else if (h === "furnishing") record.furnishing = val === "Unfurnished" ? "Unfurnished" : "Furnished";
        else if (h.includes("size") || h.includes("sqft")) record.size = Number(val) || 0;
        else if (h.includes("guest") || h.includes("capacity")) record.maxGuests = Number(val) || 2;
        else if (h.includes("bedroom") || h === "beds") record.bedrooms = Number(val) || 1;
        else if (h.includes("bathroom") || h === "baths") record.bathrooms = Number(val) || 1;
        else if (h === "address" || h.includes("location")) record.address = val;
        else if (h === "lat") record.lat = Number(val) || 25.2048;
        else if (h === "lng") record.lng = Number(val) || 55.2708;
      });

      if (!record.title) {
        setBulkPropertiesError(`Row ${i} is missing high-priority 'Title' field.`);
        return;
      }
      if (!record.price) {
        setBulkPropertiesError(`Row ${i} is missing required 'Price' field.`);
        return;
      }
      if (!record.referenceNo) {
        record.referenceNo = `AHH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      }
      if (!record.category) record.category = "Apartment";
      if (!record.purpose) record.purpose = "For Rent";
      if (!record.furnishing) record.furnishing = "Furnished";

      tempPreview.push(record);
    }

    setBulkPropertiesPreview(tempPreview);
  };

  const handlePropertiesCsvFileLoad = (file: File) => {
    if (!file) return;
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv' || file.name.endsWith('.txt');
    if (!isCsv) {
      setBulkPropertiesError("Invalid file type. Please upload a valid CSV file (.csv) or text file (.txt).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setBulkPropertiesCsv(text);
        setBulkPropertiesSuccess(`Loaded file "${file.name}"! Correct fields mapped.`);
        parseAndPreviewPropertiesCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImportProperties = async () => {
    if (bulkPropertiesPreview.length === 0) return;
    setIsBulkImportingProperties(true);
    setBulkPropertiesSuccess('');
    setBulkPropertiesError('');
    let importedCount = 0;

    try {
      for (const item of bulkPropertiesPreview) {
        const propertyData: any = {
          title: item.title,
          category: item.category,
          description: item.description || "State-of-the-art managed holiday home unit. Elegantly designed.",
          price: Number(item.price),
          unitNumber: item.unitNumber || '',
          buildingName: item.buildingName || '',
          referenceNo: item.referenceNo,
          purpose: item.purpose,
          furnishing: item.furnishing,
          size: Number(item.size || 0),
          maxGuests: Number(item.maxGuests || 2),
          bedrooms: Number(item.bedrooms || 1),
          bathrooms: Number(item.bathrooms || 1),
          amenities: item.amenities,
          location: {
            address: item.address || 'Dubai Marina, Dubai',
            lat: Number(item.lat || 25.2048),
            lng: Number(item.lng || 55.2708)
          },
          images: item.images,
          rating: 5.0,
          isAvailable: true,
          minimumNights: 30,
          hostId: user?.uid || 'super_admin_host',
          reviewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'properties'), propertyData);
        importedCount++;
      }

      setBulkPropertiesSuccess(`Successfully imported and synched ${importedCount} property listings into database memory!`);
      setBulkPropertiesPreview([]);
      setBulkPropertiesCsv('');
      await fetchData();
      setTimeout(() => setShowBulkProperties(false), 2000);
    } catch (err: any) {
      setBulkPropertiesError(`Error inserting batch properties: ${err.message}`);
    } finally {
      setIsBulkImportingProperties(false);
    }
  };

  const escapeCsvVal = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportPropertiesCSV = () => {
    const listToExport = filteredProperties.length > 0 ? filteredProperties : properties;
    const headers = [
      "Property ID",
      "Title",
      "Category",
      "Price",
      "Unit Number",
      "Building Name",
      "Reference No",
      "Purpose",
      "Furnishing",
      "Size SqFt",
      "Max Guests",
      "Bedrooms",
      "Bathrooms",
      "Address",
      "Latitude",
      "Longitude",
      "AvailabilityStatus"
    ];
    const csvRows = [headers.join(',')];

    listToExport.forEach(p => {
      const row = [
        escapeCsvVal(p.id),
        escapeCsvVal(p.title),
        escapeCsvVal(p.category),
        escapeCsvVal(p.price),
        escapeCsvVal(p.unitNumber),
        escapeCsvVal(p.buildingName),
        escapeCsvVal(p.referenceNo),
        escapeCsvVal(p.purpose),
        escapeCsvVal(p.furnishing),
        escapeCsvVal(p.size),
        escapeCsvVal(p.maxGuests),
        escapeCsvVal(p.bedrooms),
        escapeCsvVal(p.bathrooms),
        escapeCsvVal(p.location?.address),
        escapeCsvVal(p.location?.lat),
        escapeCsvVal(p.location?.lng),
        escapeCsvVal(p.isAvailable ? "Available" : "Booked")
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `properties_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPropertiesPDF = () => {
    const listToExport = filteredProperties.length > 0 ? filteredProperties : properties;
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape A4

    // Header Background
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 297, 24, 'F');

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("AUTHENTIC HOLIDAY HOMES — PROPERTIES INVENTORY REPORT", 15, 15);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${new Date().toLocaleString()} | Total items: ${listToExport.length}`, 220, 15);

    doc.setTextColor(24, 24, 27);
    const yStart = 35;
    const cols = [
      { name: "Reference No", x: 15 },
      { name: "Listing Title", x: 45 },
      { name: "Category", x: 110 },
      { name: "Building Name", x: 135 },
      { name: "Price / Night", x: 185 },
      { name: "Bed / Bath", x: 215 },
      { name: "Address", x: 235 }
    ];

    // Table Header Accent
    doc.setFillColor(244, 244, 245);
    doc.rect(12, yStart - 5, 273, 8, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    cols.forEach(col => {
      doc.text(col.name, col.x, yStart);
    });

    let currentY = yStart + 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    listToExport.forEach((p, idx) => {
      if (currentY > 192) {
        doc.addPage();

        // Repeating Header
        doc.setFillColor(24, 24, 27);
        doc.rect(0, 0, 297, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("AUTHENTIC HOLIDAY HOMES — PROPERTIES INVENTORY REPORT (CONTINUED)", 15, 11);

        doc.setFillColor(244, 244, 245);
        doc.rect(12, 28, 273, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(24, 24, 27);
        cols.forEach(col => {
          doc.text(col.name, col.x, 33);
        });

        currentY = 41;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }

      // Alternating row highlights
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(12, currentY - 4.5, 273, 7, 'F');
      }

      const stripSubtitle = (str: string, max: number): string => {
        if (!str) return '—';
        if (str.length <= max) return str;
        return str.substring(0, max - 2) + "..";
      };

      doc.setTextColor(40, 40, 40);
      doc.text(p.referenceNo || 'AHH-PENDING', 15, currentY);
      doc.text(stripSubtitle(p.title || '', 32), 45, currentY);
      doc.text(p.category || 'Apartment', 110, currentY);
      doc.text(stripSubtitle(p.buildingName || '', 24), 135, currentY);
      doc.text(`AED ${p.price}`, 185, currentY);
      doc.text(`${p.bedrooms || 0} Beds / ${p.bathrooms || 0} Baths`, 215, currentY);
      doc.text(stripSubtitle(p.location?.address || '', 28), 235, currentY);

      // Horizontal border line
      doc.setDrawColor(240, 240, 240);
      doc.line(12, currentY + 3, 285, currentY + 3);

      currentY += 7.5;
    });

    doc.save(`properties_inventory_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const isDeveloperUser = user?.email?.toLowerCase() === 'fakharalimirza@gmail.com';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-zinc-500 font-mono tracking-wider uppercase">
            Verifying secure credentials...
          </p>
        </div>
      </div>
    );
  }

  // Double check: if user is logged in with the super administrator email, grant access immediately
  const effectiveRole = isDeveloperUser ? 'super_admin' : (profile?.role || 'guest');
  const allowedRoles = ['host', 'super_admin', 'admin', 'agent', 'maintenance', 'landlord'];

  if (!isDeveloperUser && (!profile || !allowedRoles.includes(effectiveRole))) {
    return <AccessDenied />;
  }

  const tabsList = getTabsList();

  // Group tabs by category
  const categories = Array.from(new Set(tabsList.map(t => t.category)));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row font-sans selection:bg-brand/10">
      
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-md">
            <Building2 className="text-white dark:text-zinc-900" size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white uppercase">AHH Portal</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{effectiveRole.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:scale-105 active:scale-95 transition-all"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* MOBILE ACCORDION DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 md:hidden bg-zinc-950/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-[280px] h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside Menu */}
              <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-black text-lg">
                  A
                </div>
                <div>
                  <h2 className="font-black text-sm text-zinc-900 dark:text-white">Authentic Homes</h2>
                  <p className="text-[9px] text-brand uppercase font-bold tracking-widest">Admin Workspace</p>
                </div>
              </div>

              {/* Categorized Tab Links for Mobile */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {categories.map((cat) => (
                  <div key={cat} className="space-y-1.5">
                    <p className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-2">
                      {cat}
                    </p>
                    <div className="space-y-0.5">
                      {tabsList
                        .filter(t => t.category === cat)
                        .map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <Icon size={16} className={isActive ? 'text-brand' : 'text-zinc-400'} />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer user profile block in drawer */}
              <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center font-bold text-xs text-brand uppercase">
                    {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-black text-zinc-900 dark:text-white truncate">
                      {profile?.displayName || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP PERMANENT SIDEBAR CONTAINER */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 88 : 280 }}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        className="hidden md:flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0 overflow-hidden shrink-0 z-30"
      >
        {/* Brand visual header area */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center shrink-0 shadow-lg text-white dark:text-zinc-950 font-black text-lg">
              A
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white uppercase leading-none block">
                  Authentic Homes
                </h1>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand mt-1 block">
                  Operations Suite
                </span>
              </motion.div>
            )}
          </div>
          
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg border border-zinc-150 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Categorized Tab Navigation for Desktop */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-7 no-scrollbar">
          {categories.map((cat) => (
            <div key={cat} className="space-y-2">
              {!isSidebarCollapsed ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-2"
                >
                  {cat}
                </motion.p>
              ) : (
                <div className="h-px bg-zinc-105 dark:bg-zinc-800 mx-2" />
              )}

              <div className="space-y-1">
                {tabsList
                  .filter(t => t.category === cat)
                  .map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full group flex items-center rounded-xl transition-all duration-200 relative ${
                          isActive
                            ? 'bg-zinc-905 dark:bg-zinc-100 text-zinc-950 dark:text-zinc-950 font-extrabold shadow-sm py-2.5 px-3.5'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-800 dark:hover:text-white py-2 px-3'
                        }`}
                        title={isSidebarCollapsed ? tab.label : undefined}
                      >
                        <Icon 
                          size={18} 
                          className={`shrink-0 transition-all ${
                            isActive ? 'text-brand' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                          } ${isSidebarCollapsed ? 'mx-auto' : ''}`} 
                        />
                        {!isSidebarCollapsed && (
                          <span className="text-xs ml-3 leading-none truncate">
                            {tab.label}
                          </span>
                        )}
                        {isActive && !isSidebarCollapsed && (
                          <motion.div
                            layoutId="activeGlow"
                            className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-brand rounded-l-md"
                          />
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Admin Footer Profile Badge */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center font-black text-brand uppercase text-sm cursor-help shrink-0" title={`User ID: ${user.uid}`}>
              {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate flex-1"
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                    {profile?.displayName || 'Administrator'}
                  </p>
                  <Shield size={10} className="text-brand shrink-0" />
                </div>
                <p className="text-[10px] text-zinc-450 truncate uppercase font-bold tracking-wider leading-none mt-1">
                  {effectiveRole.replace('_', ' ')}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MAIN BODY WRAPPER PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP STATUS CONTROL BAR */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10">
          <div>
            <span className="text-[10px] font-black text-brand uppercase tracking-widest">AHH Management System</span>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Viewing Console <ArrowRight size={12} className="text-zinc-400" /> <span className="font-black text-zinc-950 dark:text-white capitalize">{tabsList.find(t => t.id === activeTab)?.label}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Super Admin mode switch */}
            {user.email?.toLowerCase() === 'fakharalimirza@gmail.com' && (activeTab === 'properties' || activeTab === 'overview') && (
              <button 
                type="button"
                onClick={() => {
                  setShowAllAsAdmin(!showAllAsAdmin);
                  fetchData();
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all border ${
                  showAllAsAdmin 
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100' 
                    : 'bg-white text-zinc-650 border-zinc-250 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                }`}
              >
                {showAllAsAdmin ? 'Admin View: All' : 'Host View: Mine Only'}
              </button>
            )}

            {/* Quick date-time dashboard stamp */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-zinc-150 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 flex items-center gap-1.5">
              <Clock size={12} className="text-zinc-400" />
              <span>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Quick Action additions button */}
            {['properties', 'bookings'].includes(activeTab) && (
              <button 
                type="button"
                onClick={handleAddNew}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:scale-105 transition-transform active:scale-95 shadow-md shadow-brand/10 hover:bg-brand-hover"
              >
                <PlusCircle size={14} /> Add Property
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE MIDDLE BODY PANEL */}
        <main className="flex-1 overflow-y-auto outline-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, cubicBezier: [0.16, 1, 0.3, 1] }}
              className="p-4 md:p-8"
            >
              
              {/* TAB 1: DASHBOARD OVERVIEW ENGINE (REDESIGNED) */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Executive Greeting Visual Hero */}
                  <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 md:p-8 text-white shadow-xl dark:border dark:border-zinc-800">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-brand/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-zinc-800/20 rounded-full blur-[80px]" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-extrabold uppercase tracking-widest text-brand">
                            Live system
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2 font-display">
                          {timeOfDay === 'morning' ? 'Good Morning' : timeOfDay === 'afternoon' ? 'Good Afternoon' : 'Good Evening'},{' '}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-brand">
                            {profile?.displayName || user?.email?.split('@')[0]}
                          </span>
                        </h3>
                        <p className="text-zinc-400 text-xs md:text-sm max-w-lg leading-relaxed">
                          Welcome to your consolidated holiday home management portal. You are connected with administrative role{' '}
                          <span className="text-white font-heavy underline decoration-brand underline-offset-4 font-bold">
                            {effectiveRole.toUpperCase()}
                          </span>
                          . All service modules are reporting online status.
                        </p>
                      </div>

                      {/* Quick access widget link to list house */}
                      <div className="shrink-0">
                        <button
                          onClick={handleAddNew}
                          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand text-white font-bold hover:scale-105 hover:bg-brand-hover active:scale-95 transition-all text-sm shadow-xl shadow-brand/30 ring-1 ring-white/10"
                        >
                          <PlusCircle size={18} /> Listed Property Units +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Standard Numerical Metric Stat Counters */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-black uppercase text-zinc-400 tracking-widest">Executive Ledger Indicators</p>
                      <span className="text-xs text-brand font-bold flex items-center gap-1">Real-time <Activity size={10} className="animate-spin" /></span>
                    </div>
                    <AdminStats stats={stats} />
                  </div>

                  {/* Dashboard Core Row Controls Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT 2 COLS: Quick Console Navigation Grid */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase text-zinc-900 dark:text-zinc-400 tracking-wider">Operational Quick Actions</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Box 1: Properties */}
                        <div 
                          onClick={() => setActiveTab('properties')}
                          className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-brand/30 cursor-pointer transition-all flex flex-col justify-between group h-36"
                        >
                          <div className="flex items-start justify-between">
                            <span className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-200 group-hover:scale-110 transition-transform">
                              <Building2 size={20} />
                            </span>
                            <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-brand transition-colors" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">Properties & Portfolio</p>
                            <p className="text-[11px] text-zinc-400 mt-1">Manage active holiday home listings in Dubai</p>
                          </div>
                        </div>

                        {/* Box 2: Reservations */}
                        <div 
                          onClick={() => setActiveTab('bookings')}
                          className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-brand/30 cursor-pointer transition-all flex flex-col justify-between group h-36"
                        >
                          <div className="flex items-start justify-between">
                            <span className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-200 group-hover:scale-110 transition-transform">
                              <CalendarRange size={20} />
                            </span>
                            <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-brand transition-colors" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">Reservations Controller</p>
                            <p className="text-[11px] text-zinc-400 mt-1">Review check-in, check-out and client details</p>
                          </div>
                        </div>

                        {/* Box 3: Support */}
                        <div 
                          onClick={() => setActiveTab('support')}
                          className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-brand/30 cursor-pointer transition-all flex flex-col justify-between group h-36"
                        >
                          <div className="flex items-start justify-between">
                            <span className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-200 group-hover:scale-110 transition-transform">
                              <LifeBuoy size={20} />
                            </span>
                            <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-brand transition-colors" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">Guest Support Desk</p>
                            <p className="text-[11px] text-zinc-400 mt-1">Help check guest request tickets & assistance logs</p>
                          </div>
                        </div>

                        {/* Box 4: Database Status */}
                        <div 
                          onClick={() => setActiveTab('database')}
                          className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-brand/30 cursor-pointer transition-all flex flex-col justify-between group h-36"
                        >
                          <div className="flex items-start justify-between">
                            <span className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-200 group-hover:scale-110 transition-transform">
                              <Database size={20} />
                            </span>
                            <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-brand transition-colors" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">cPanel Remote Database</p>
                            <p className="text-[11px] text-zinc-400 mt-1">Monitor phpMyAdmin mysql database port syncs</p>
                          </div>
                        </div>
                      </div>

                      {/* Brief Info Banner */}
                      <div className="p-5 bg-brand/5 border border-brand/10 rounded-2xl flex items-start gap-4">
                        <Sparkles className="text-brand shrink-0" size={18} />
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-250 select-none">Secure Vault Architecture Option</p>
                          <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                            Files and receipts uploaded via management consoles utilize VPS FTP directories internally when active, hosting files under authenticated VPS storage. Firestore is queried for reactive state.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT 1 COL: Server Status Indicators */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-black uppercase text-zinc-900 dark:text-zinc-400 tracking-wider">Conserved System Status</h4>

                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-6 rounded-3xl space-y-5 shadow-sm">
                        
                        {/* Service account */}
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/5 text-red-500 flex items-center justify-center">
                              <Shield size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">Firebase Auth & DB</p>
                              <p className="text-[9px] text-zinc-450 truncate max-w-44 font-mono">gen-lang-client-0638117875</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>

                        {/* VPS sync */}
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 text-amber-500 flex items-center justify-center">
                              <Database size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">MySQL Database</p>
                              <p className="text-[9px] text-zinc-450 truncate max-w-44 font-mono">jadetude_authenti_portal_new</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            Synced
                          </span>
                        </div>

                        {/* Storage Bucket */}
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-500/5 text-teal-500 flex items-center justify-center">
                              <FolderKey size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">FTP S3 Buckets</p>
                              <p className="text-[9px] text-zinc-450 truncate max-w-44 font-mono">ftp.jad-etude.pro</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-sky-500 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full">
                            Secure
                          </span>
                        </div>

                        {/* Mail Server */}
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 flex items-center justify-center">
                              <MessageSquare size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">Mailer Services</p>
                              <p className="text-[9px] text-zinc-450 truncate max-w-44 font-mono">mail.authenticholidayhomes.ae</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            SSL SSL/TLS
                          </span>
                        </div>

                      </div>

                      {/* Brief Developer Quick Indicator */}
                      <div className="bg-zinc-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-md">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-brand/20 rounded-full blur-2xl" />
                        <p className="text-[9px] text-brand uppercase tracking-widest font-extrabold mb-1">Developer Notice</p>
                        <h5 className="font-bold text-xs text-zinc-105 mb-2 leading-snug">Credentials stored in Root `.env`</h5>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                          Connected properties and integrations are loaded dynamically. No secrets are stored permanently on server instances, supporting safe local ZIP deployments at port 3000.
                        </p>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: PROPERTIES & UNITS */}
              {activeTab === 'properties' && (
                <div className="space-y-6">
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

                  {/* Local contextual Search controls & toggles to match properties view filter constraints */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="relative w-full md:w-[480px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Filter list by title reference, building name key..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    {user.email?.toLowerCase() === 'fakharalimirza@gmail.com' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Administrative Filtering:</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowAllAsAdmin(!showAllAsAdmin);
                            fetchData();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                            showAllAsAdmin 
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' 
                              : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {showAllAsAdmin ? 'Showing All Properties' : 'Showing Only My Listings'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bulk Properties Operator Trigger Bar */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-805 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium font-sans">
                      <Database className="w-4 h-4 text-brand shrink-0" />
                      <span>Configure, import or bulk download full properties registries.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBulkProperties(!showBulkProperties)}
                      className="px-4 py-2 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-105 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
                      Bulk Operations
                    </button>
                  </div>

                  {/* Bulk Properties Operations Panel */}
                  {showBulkProperties && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div>
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                            Bulk Management (Properties & Listings)
                          </h3>
                          <p className="text-[11px] text-zinc-450">
                            Bulk upload new Holiday Houses / listings or export filtered data to CSV or printable landscape PDF layouts.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button; button"
                            onClick={handleExportPropertiesCSV}
                            className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[11px] font-bold text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-500" /> Export CSV Listings
                          </button>
                          <button
                            type="button"
                            onClick={handleExportPropertiesPDF}
                            className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[11px] font-bold text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-red-500" /> Export PDF Registry
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Drag and Drop Zone */}
                        <div className="space-y-4">
                          <input
                            type="file"
                            ref={propertiesFileInputRef}
                            className="hidden"
                            accept=".csv,text/csv,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePropertiesCsvFileLoad(file);
                            }}
                          />

                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragOverPropertiesCsv(true);
                            }}
                            onDragLeave={() => setIsDragOverPropertiesCsv(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragOverPropertiesCsv(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) handlePropertiesCsvFileLoad(file);
                            }}
                            onClick={() => propertiesFileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                              isDragOverPropertiesCsv
                                ? 'border-zinc-900 dark:border-white'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/40'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-750 dark:text-zinc-200">
                              <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                                Drag & drop your listing CSV file here, or <span className="text-brand hover:underline">browse local files</span>
                              </p>
                              <p className="text-[10px] text-zinc-450 dark:text-zinc-500">
                                Imports titles, pricing, size, guests cap, bedroom numbers, and locations.
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
                              <span>Paste Raw CSV Listings values:</span>
                              <button
                                type="button"
                                onClick={loadPropertiesSampleCsv}
                                className="text-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-1 normal-case"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Load Properties Sample
                              </button>
                            </div>

                            <textarea
                              value={bulkPropertiesCsv}
                              onChange={(e) => {
                                setBulkPropertiesCsv(e.target.value);
                                parseAndPreviewPropertiesCsv(e.target.value);
                              }}
                              placeholder="Title,Category,Description,Price,Unit Number,Building Name,Reference No,Purpose,Furnishing,Size SqFt,Max Guests,Bedrooms,Bathrooms,Address,Lat,Lng"
                              rows={4}
                              className="w-full px-3.5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:ring-1 focus:ring-zinc-400 transition-all resize-y"
                            />
                          </div>
                        </div>

                        {/* Live Parsing preview and action */}
                        <div className="space-y-4">
                          <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-455">Parsed Listing Preview</h4>

                          {bulkPropertiesError && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-1.5 border border-red-100 dark:border-red-900/30">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span>{bulkPropertiesError}</span>
                            </div>
                          )}

                          {bulkPropertiesSuccess && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/40">
                              <Check className="w-4 h-4 text-emerald-500" />
                              <span>{bulkPropertiesSuccess}</span>
                            </div>
                          )}

                          {bulkPropertiesPreview.length > 0 ? (
                            <div className="space-y-3">
                              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-extrabold uppercase animate-fade-in">
                                      <th className="p-2.5">Title</th>
                                      <th className="p-2.5">Category</th>
                                      <th className="p-2.5">Price</th>
                                      <th className="p-2.5">Beds/Baths</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bulkPropertiesPreview.map((item, idx) => (
                                      <tr key={idx} className="border-b border-zinc-155/50 dark:border-zinc-800/50 text-zinc-750 dark:text-zinc-300">
                                        <td className="p-2.5 font-bold truncate max-w-[120px]">{item.title}</td>
                                        <td className="p-2.5">{item.category}</td>
                                        <td className="p-2.5">AED {item.price}</td>
                                        <td className="p-2.5">{item.bedrooms} Bed / {item.bathrooms} Bath</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2.5 px-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
                                <span className="text-xs text-zinc-500 font-bold">
                                  Parsed {bulkPropertiesPreview.length} properties ready for database syncing.
                                </span>
                                <button
                                  type="button"
                                  disabled={isBulkImportingProperties}
                                  onClick={handleConfirmImportProperties}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  {isBulkImportingProperties ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Committing...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5" /> Sync Holiday Houses
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
                              <Info className="w-6 h-6 text-zinc-350" />
                              <span>No parsed properties preview available. Drag & drop a spreadsheet or use the sample loaded.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <PropertyFormModal 
                    isOpen={isModalOpen}
                    onClose={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                      setInitialFormToEdit(null);
                    }}
                    editingId={editingId}
                    initialFormToEdit={initialFormToEdit}
                    onSaved={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                      setInitialFormToEdit(null);
                      fetchData();
                    }}
                    user={user}
                  />

                  <PropertiesTable 
                    loading={loading}
                    properties={filteredProperties}
                    toggleAvailability={toggleAvailability}
                    handleEdit={handleEdit}
                    handleDuplicate={handleDuplicate}
                    setConfirmDeleteId={setConfirmDeleteId}
                    deletingId={deletingId}
                  />
                </div>
              )}

              {/* TAB 3: RESERVATIONS CONSOLE */}
              {activeTab === 'bookings' && (
                <BookingConsole 
                  properties={properties} 
                  onRefreshStats={fetchData}
                />
              )}

              {/* TAB 4: TURNOVERS & CLEANING */}
              {activeTab === 'maintenance' && (
                <TurnoversTable currentRole={profile?.role} />
              )}

              {/* TAB 5: SUPPORT TICKETS SUPPORT */}
              {activeTab === 'support' && (
                <TicketsConsole 
                  userUid={user.uid} 
                  userRole={profile?.role} 
                  userName={profile?.displayName} 
                  propertiesList={properties} 
                />
              )}

              {/* TAB 6: SECURE DOCUMENT VAULT */}
              {activeTab === 'documents' && (
                <DocumentsConsole />
              )}

              {/* TAB 7: PAYMENTS LEDGER */}
              {activeTab === 'payments' && (
                <PaymentsConsole 
                  userUid={user.uid} 
                  userRole={profile?.role} 
                  userName={profile?.displayName} 
                  userNameEmail={user?.email || undefined}
                  propertiesList={properties} 
                />
              )}

              {/* TAB 8: STAFF INTERNAL CHAT */}
              {activeTab === 'staff_chat' && (
                <StaffChat />
              )}

              {/* TAB 9: MEMBER ROLES */}
              {activeTab === 'users' && (
                <UsersTable currentRole={profile?.role} />
              )}

              {/* TAB 10: INVITATIONS roster */}
              {activeTab === 'invitations' && (
                <InvitationsConsole />
              )}

              {/* TAB 11: AUDIT TRAILS */}
              {activeTab === 'audit_logs' && (
                <AuditLogsConsole />
              )}

              {/* TAB 12: CPANEL REMOTE DATABASE */}
              {activeTab === 'database' && (
                <DatabaseConsole />
              )}

              {/* TAB 12.5: EMAIL TEMPLATES CONSOLE */}
              {activeTab === 'email_templates' && (
                <TemplatesConsole />
              )}

              {/* TAB 13: GLOBAL SETTINGS PANEL */}
              {activeTab === 'settings' && (
                <SettingsPanel />
              )}

              {/* TAB 13.5: PORTAL LEADS PULLED LOGS */}
              {activeTab === 'portal_leads' && (
                <PortalLeadsConsole />
              )}

              {/* TAB 14: LANDLORDS CONSOLE */}
              {activeTab === 'landlords' && (
                <LandlordsConsole />
              )}

              {/* TAB 15: BUILDINGS CONSOLE */}
              {activeTab === 'buildings' && (
                <BuildingsConsole />
              )}

              {/* TAB 16: UNITS CONSOLE */}
              {activeTab === 'units' && (
                <UnitsConsole onCreateListing={handleCreateListingFromUnit} />
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* MODAL 2: Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
        }}
        title={properties.find(p => p.id === confirmDeleteId)?.title || "this property"}
        isDeleting={deletingId === confirmDeleteId}
      />

    </div>
  );
}
