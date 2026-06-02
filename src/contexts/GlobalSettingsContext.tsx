import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface CompanyContact {
  name: string;
  contact: string;
}

export interface AppSettings {
  companyName: string;
  trn: string;
  licenseNumber: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  
  currencyOfChoice: string;
  currencySymbol: string;
  timezoneValue: string;
  dateFormat: string;
  
  availableCategories: string[];
  availableAreas: string[];
  availableAmenities: string[];
  availableFurnishing: string[];

  availableGasCompanies?: CompanyContact[];
  availableCoolingCompanies?: CompanyContact[];
  availableInternetProviders?: CompanyContact[];
  
  customBrandColor: string;
  customFontFamily: string;
  
  letterheadTitle: string;
  letterheadSlogan: string;
  letterheadWatermark: string;
  letterheadSelectedTemplate: 'modern' | 'minimalist' | 'classic';
  letterheadLogoUrl: string;
  letterheadImageUrl: string;
  letterheadPageSize: 'A4' | 'Letter' | 'Legal';
  letterheadMarginTop: number;
  letterheadMarginBottom: number;
  letterheadMarginLeft: number;
  letterheadMarginRight: number;

  // Popup Event & Greeting Announcement parameters
  popupEnabled?: boolean;
  popupTitle?: string;
  popupMessage?: string;
  popupTheme?: 'gold' | 'red' | 'navy' | 'emerald' | 'minimal' | 'celebration';
  popupActionText?: string;
  popupActionUrl?: string;
  popupShowOnEveryVisit?: boolean;
  popupContentType?: 'text' | 'image' | 'both';
  popupImageUrl?: string;

  // Social Media Links
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialLinkedin?: string;
  socialYoutube?: string;
  socialTiktok?: string;
  socialSnapchat?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Authentic Holiday Homes LLC',
  trn: '100234567890003',
  licenseNumber: '1501234',
  address: 'Boulevard Plaza Tower 1, Downtown Dubai, UAE',
  phone: '+971 4 123 4567',
  email: 'support@authentichomes.ae',
  website: 'www.authentichomes.ae',
  
  currencyOfChoice: 'AED',
  currencySymbol: 'AED',
  timezoneValue: 'Asia/Dubai',
  dateFormat: 'YYYY-MM-DD',
  
  availableCategories: ['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Holiday Home'],
  availableAreas: ['Dubai Marina', 'Downtown Dubai', 'Palm Jumeirah', 'Business Bay', 'JBR', 'Al Barsha'],
  availableAmenities: [
    'Wi-Fi', 'Swimming Pool', 'Gym or Health Club', 'Kitchen', 'Free Parking', 
    'Air Conditioning', 'CCTV Security', 'Balcony or Terrace', 'Elevator', 
    'Dishwasher', 'Kids Play Area', 'Lobby in Building', 'Reception/Waiting Room'
  ],
  availableFurnishing: ['Furnished', 'Unfurnished', 'Semi-Furnished'],
  
  availableGasCompanies: [
    { name: 'Lootah Gas', contact: '800 566824' },
    { name: 'Emirates Gas (EMGAS)', contact: '800 36427' },
    { name: 'Sera Gas', contact: '04 333 1245' }
  ],
  availableCoolingCompanies: [
    { name: 'Empower', contact: '800 3676937' },
    { name: 'Emicool', contact: '04 885 5555' },
    { name: 'Tabreed', contact: '800 8227333' }
  ],
  availableInternetProviders: [
    { name: 'du', contact: '800 155' },
    { name: 'Etisalat (e&)', contact: '101' },
    { name: 'Virgin Mobile', contact: '800 123' }
  ],
  
  customBrandColor: '#D91F28',
  customFontFamily: 'sans',
  
  letterheadTitle: 'AUTHENTIC HOLIDAY HOMES',
  letterheadSlogan: 'Redefining Luxury & Emirati Hospitality',
  letterheadWatermark: 'AHH PROPERTIES',
  letterheadSelectedTemplate: 'modern',
  letterheadLogoUrl: '',
  letterheadImageUrl: '',
  letterheadPageSize: 'A4',
  letterheadMarginTop: 20,
  letterheadMarginBottom: 20,
  letterheadMarginLeft: 20,
  letterheadMarginRight: 20,

  // Live marketing & event alert popups
  popupEnabled: false,
  popupTitle: 'Special Announcement',
  popupMessage: 'Celebrate Ramadan with AHH! Book directly with us for a minimum of 3 months to receive waiver of agency fees on selected premium Downtown apartments.',
  popupTheme: 'gold',
  popupActionText: 'View Elite Catalog',
  popupActionUrl: '/properties',
  popupShowOnEveryVisit: false,
  popupContentType: 'both',
  popupImageUrl: '',

  // Defaults for Social Media Links (can be customized by admin)
  socialFacebook: 'https://facebook.com/authenticholidayhomes',
  socialInstagram: 'https://instagram.com/authenticholidayhomes',
  socialTwitter: '',
  socialLinkedin: 'https://linkedin.com/company/authentic-holiday-homes',
  socialYoutube: 'https://youtube.com/@authenticholidayhomes',
  socialTiktok: '',
  socialSnapchat: ''
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface GlobalSettingsContextProps {
  settings: AppSettings;
  loading: boolean;
  saveSettings: (newSettings: AppSettings) => Promise<void>;
  formatDate: (dateInput: Date | string) => string;
  formatPrice: (amount: number) => string;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextProps | undefined>(undefined);

export function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => {
    const cached = localStorage.getItem('ahh_global_settings');
    if (cached) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  // Fetch settings from Firestore
  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as AppSettings;
          const merged = { ...DEFAULT_SETTINGS, ...data };
          setSettings(merged);
          localStorage.setItem('ahh_global_settings', JSON.stringify(merged));
        } else {
          // If settings document doesn't exist yet, we can create it in background
          // but only if logged in as admin to avoid write gaps
          const isAdmin = user?.email?.toLowerCase() === 'fakharalimirza@gmail.com';
          if (isAdmin) {
            await setDoc(docRef, DEFAULT_SETTINGS);
          }
        }
      } catch (err) {
        console.warn("GlobalSettingsContext: Error fetching global settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user]);

  // Inject Custom Brand Accent Color and Font style node dynamically in real-time
  useEffect(() => {
    if (settings.customBrandColor) {
      const styleId = 'dynamic-brand-styles';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      const brandColor = settings.customBrandColor;
      
      // Calculate a slightly darker tone for hover states
      const darkenColor = (hex: string, percent: number) => {
        let num = parseInt(hex.replace("#", ""), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) + amt,
          G = (num >> 8 & 0x00FF) + amt,
          B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
      };
      
      const hoverColor = darkenColor(brandColor, -15);
      
      styleEl.innerHTML = `
        :root {
          --color-brand: ${brandColor} !important;
          --color-brand-hover: ${hoverColor} !important;
          --color-brand-rgb: ${hexToRgb(brandColor)} !important;
        }
        .text-brand { color: ${brandColor} !important; }
        .bg-brand { background-color: ${brandColor} !important; }
        .border-brand { border-color: ${brandColor} !important; }
        .hover\\:bg-brand-hover:hover { background-color: ${hoverColor} !important; }
      `;
    }
  }, [settings.customBrandColor]);

  // Transform hex color code to RGB format so it fits style configurations
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '217, 31, 40';
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      const docRef = doc(db, 'settings', 'global');
      await setDoc(docRef, newSettings);
      setSettings(newSettings);
      localStorage.setItem('ahh_global_settings', JSON.stringify(newSettings));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'MMM DD, YYYY':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${day}, ${year}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  };

  const formatPrice = (amount: number) => {
    const symbol = settings.currencySymbol || 'AED';
    const currencyCode = settings.currencyOfChoice || 'AED';
    const formattedAmount = Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    // In Arabic format, we can put standard letters
    return `${symbol} ${formattedAmount}`;
  };

  return (
    <GlobalSettingsContext.Provider value={{ settings, loading, saveSettings, formatDate, formatPrice }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
}
