export interface Property {
  id: string;
  title: string;
  category: string;
  description?: string;
  price: number;
  priceMonthly?: number;
  unitNumber?: string;
  buildingName?: string;
  referenceNo: string;
  purpose: 'For Rent' | 'For Sale';
  furnishing?: 'Furnished' | 'Unfurnished';
  size?: number; // in sqft
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  isAvailable?: boolean;
  minimumNights?: number;
  rating?: number;
  reviewCount?: number;
  hostId?: string;
  status?: 'live' | 'draft' | string;
  createdAt?: any;
  updatedAt?: any;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  images: {
    avif?: string[];
    webp?: string[];
    png?: string[];
  };
  amenities: {
    features?: string[];
    building?: string[];
    healthFitness?: string[];
    recreationFamily?: string[];
    cleaningMaintenance?: string[];
    businessSecurity?: string[];
    technology?: string[];
    miscellaneous?: string[];
  };
}
