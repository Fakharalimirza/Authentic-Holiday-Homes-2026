export const AMENITY_CATEGORIES = {
  features: ['Furnished', 'Electricity Backup', 'Parking Spaces: 1', 'Centrally Air-Conditioned'],
  building: ['Balcony or Terrace', 'Lobby in Building', 'Service Elevators', 'Reception/Waiting Room'],
  healthFitness: ['Gym or Health Club', 'Swimming Pool'],
  recreationFamily: ['Kids Play Area', 'Lawn or Garden', 'Barbeque Area'],
  cleaningMaintenance: ['Waste Disposal', 'Maintenance Staff'],
  businessSecurity: ['Business Center', 'Security Staff', 'CCTV Security'],
  technology: ['Broadband Internet', 'Satellite/Cable TV'],
  miscellaneous: ['24 Hours Concierge', 'Pets Allowed', 'Freehold']
};

export interface PropertyForm {
  title: string;
  category: string;
  description: string;
  price: number;
  priceMonthly?: number;
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
    [key: string]: string[];
  };
  imageFiles: File[];
  imageUrls: {
    avif: string[];
    webp: string[];
    png: string[];
  };
  rating: number;
  isAvailable: boolean;
  minimumNights: number;
  landlordId?: string;
  buildingId?: string;
  status?: string;
}

export const getInitialForm = (): PropertyForm => ({
  title: '',
  category: 'Apartment',
  description: '',
  price: 0,
  priceMonthly: 0,
  unitNumber: '',
  buildingName: '',
  referenceNo: `AHH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
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
  isAvailable: true,
  minimumNights: 30,
  landlordId: '',
  buildingId: '',
  status: 'live'
});

export interface LandlordItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  identityNumber?: string;
  nationality?: string;
}

export interface BuildingItem {
  id: string;
  name: string;
  address?: string;
  city?: string;
  makaniNumber?: string;
}

export interface UnitItem {
  id: string;
  unitNumber: string;
  buildingId: string;
  landlordId?: string | null;
  status: 'Vacant' | 'Occupied' | 'Maintenance' | 'Blocked';
  price: number;
  bedrooms: number;
  bathrooms: number;
  size: number;
  furnishing: 'Furnished' | 'Unfurnished' | 'Semi-Furnished';
  notes: string;
  unitType?: string;
  internetProvider?: string;
  internetAccountNumber?: string;
  dewaPremisesNumber?: string;
  mgmtCommission?: number;
  guestCapacity?: number;
  description?: string;
  titleDeedUrl?: string;
  permitNumber?: string;
  permitDocUrl?: string;
  createdAt: string;
}

