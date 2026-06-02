import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = (import.meta as any).env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

const hasValidKey =
  Boolean(API_KEY) &&
  API_KEY !== 'YOUR_API_KEY' &&
  API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

interface PropertyMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
}

export default function PropertyMap({ center, zoom = 15 }: PropertyMapProps) {
  const safeCenter = {
    lat: typeof center?.lat === 'number' && !isNaN(center.lat) ? center.lat : 25.2048,
    lng: typeof center?.lng === 'number' && !isNaN(center.lng) ? center.lng : 55.2708,
  };

  if (!hasValidKey) {
    return (
      <div className="w-full h-96 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">
            Maps API Key Required
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Please add VITE_GOOGLE_MAPS_API_KEY in your .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={safeCenter}
          defaultZoom={zoom}
          mapId={MAP_ID}
          style={{ width: '100%', height: '100%' }}
          disableDefaultUI={true}
        >
          <AdvancedMarker position={safeCenter}>
            <Pin background="#18181b" glyphColor="#fff" borderColor="#fff" />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
}