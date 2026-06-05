import React, { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { Link } from 'react-router-dom';
import { MapPin, X } from 'lucide-react';
import CurrencySymbol from './CurrencySymbol';
import { Property } from '../types';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = (import.meta as any).env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

const hasValidKey =
  Boolean(API_KEY) &&
  API_KEY !== 'YOUR_API_KEY' &&
  API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

interface PropertiesMapProps {
  properties: Property[];
  height?: string;
  defaultZoom?: number;
}

function hasValidLocation(property: Property) {
  return (
    property.location &&
    typeof property.location.lat === 'number' &&
    typeof property.location.lng === 'number' &&
    Number.isFinite(property.location.lat) &&
    Number.isFinite(property.location.lng)
  );
}

export default function PropertiesMap({
  properties,
  height = '450px',
  defaultZoom = 11,
}: PropertiesMapProps) {
  const { settings } = useGlobalSettings();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const brandColor = settings?.customBrandColor || '#D91F28';
  
  const darkenColor = (hex: string, percent: number) => {
    try {
      const cleanHex = hex.replace('#', '');
      let num = parseInt(cleanHex, 16);
      let amt = Math.round(2.55 * percent);
      let R = (num >> 16) + amt;
      let G = (num >> 8 & 0x00ff) + amt;
      let B = (num & 0x0000ff) + amt;
      
      R = Math.max(0, Math.min(255, R));
      G = Math.max(0, Math.min(255, G));
      B = Math.max(0, Math.min(255, B));
      
      return '#' + (0x1000000 + R * 0x10000 + G * 0x105 + B).toString(16).slice(1);
    } catch (e) {
      return hex;
    }
  };

  const selectedColor = darkenColor(brandColor, -20);

  const defaultCenter = { lat: 25.1972, lng: 55.2744 };

  const validProperties = properties.filter(hasValidLocation);

  const initialCenter =
    validProperties.length > 0
      ? {
          lat: validProperties[0].location.lat,
          lng: validProperties[0].location.lng,
        }
      : defaultCenter;

  if (!hasValidKey) {
    return (
      <div
        style={{ height }}
        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] flex items-center justify-center p-8 text-center"
      >
        <div className="max-w-md font-sans">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <MapPin size={24} />
          </div>

          <h3 className="text-lg font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-2">
            Location Discovery Offline
          </h3>

          <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
            Please add <strong>VITE_GOOGLE_MAPS_API_KEY</strong> in your
            environment variables to activate interactive map pins for all
            holiday homes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full rounded-[2.5rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative font-sans"
    >
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={initialCenter}
          defaultZoom={defaultZoom}
          mapId={MAP_ID}
          style={{ width: '100%', height: '100%' }}
          disableDefaultUI={false}
          clickableIcons={false}
        >
          {validProperties.map((property) => {
            const position = {
              lat: property.location.lat,
              lng: property.location.lng,
            };

            const isSelected = selectedProperty?.id === property.id;

            return (
              <AdvancedMarker
                key={property.id}
                position={position}
                title={property.title}
                onClick={() => setSelectedProperty(property)}
              >
                <Pin
                  background={isSelected ? selectedColor : brandColor}
                  glyphColor="#fff"
                  borderColor={isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)'}
                  scale={isSelected ? 1.35 : 1.05}
                />
              </AdvancedMarker>
            );
          })}

          {selectedProperty && hasValidLocation(selectedProperty) && (
            <InfoWindow
              position={{
                lat: selectedProperty.location.lat,
                lng: selectedProperty.location.lng,
              }}
              onCloseClick={() => setSelectedProperty(null)}
              headerDisabled={true}
            >
              <div className="p-1 max-w-[240px] font-sans text-zinc-900 rounded-lg bg-white relative">
                {/* Elegant Close Button Override */}
                <button
                  type="button"
                  onClick={() => setSelectedProperty(null)}
                  className="absolute top-2.5 left-2.5 bg-zinc-950/80 hover:bg-zinc-900 text-white p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer z-20 shadow-md border border-white/10"
                  aria-label="Close details popup"
                  title="Close Details"
                >
                  <X size={10} />
                </button>

                <div className="relative aspect-video rounded-lg overflow-hidden mb-2 shadow-sm bg-zinc-100">
                  <img
                    src={
                      selectedProperty.images?.webp?.[0] ||
                      selectedProperty.images?.png?.[0] ||
                      selectedProperty.images?.avif?.[0] ||
                      'https://via.placeholder.com/320x180?text=Authentic+Property'
                    }
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute top-2 right-2 bg-zinc-950/80 px-2 py-0.5 rounded-md text-[9px] font-black text-brand tracking-widest uppercase">
                    {selectedProperty.category}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-xs text-zinc-900 line-clamp-1 uppercase tracking-tight">
                    {selectedProperty.title}
                  </h4>

                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <MapPin size={10} className="text-zinc-400 shrink-0" />
                    <span className="truncate">
                      {selectedProperty.location.address || 'Dubai, UAE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-1.5 mt-2">
                    <div className="flex items-center gap-0.5 font-black text-xs text-zinc-900">
                      <CurrencySymbol size="0.75em" className="text-brand shrink-0" />
                      <span>{selectedProperty.price}</span>

                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                        {selectedProperty.purpose === 'For Rent' ? 'Mo' : 'Sale'}
                      </span>
                    </div>

                    <Link
                      to={`/property/${selectedProperty.id}`}
                      className="text-[9px] bg-brand hover:bg-brand-hover text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition-all"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}