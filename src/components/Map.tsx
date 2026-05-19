import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapProps {
  center: { lat: number; lng: number };
  zoom?: number;
}

export default function PropertyMap({ center, zoom = 15 }: MapProps) {
  if (!hasValidKey) {
    return (
      <div className="w-full h-96 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Maps API Key Required</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">Please add GOOGLE_MAPS_PLATFORM_KEY in Settings &gt; Secrets to see the property location on the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="AUTHENTIC_HOMES_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          disableDefaultUI={true}
        >
          <AdvancedMarker position={center}>
            <Pin background="#18181b" glyphColor="#fff" borderColor="#fff" />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
}
