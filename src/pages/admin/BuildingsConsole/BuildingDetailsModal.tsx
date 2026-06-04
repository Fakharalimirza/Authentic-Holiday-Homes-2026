import React from 'react';
import { 
  Building, 
  EyeOff, 
  Shield, 
  Wrench, 
  Flame, 
  Wind, 
  Globe, 
  ExternalLink 
} from 'lucide-react';

interface BuildingItem {
  id: string;
  name: string;
  managementCompany: string;
  managementEmail: string;
  address: string;
  googleMapUrl: string;
  floors: number;
  city: string;
  makaniNumber: string;
  country: string;
  securityCompanyName: string;
  securityCompanyContact: string;
  gasCompanyName: string;
  gasCompanyContact: string;
  coolingCompanyName?: string;
  coolingCompanyContact?: string;
  internetProviderName?: string;
  internetProviderContact?: string;
  createdAt?: string;
}

interface BuildingDetailsModalProps {
  building: BuildingItem;
  onClose: () => void;
}

export default function BuildingDetailsModal({ building, onClose }: BuildingDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-sans">
              <Building className="w-5 h-5 text-zinc-500" />
              {building.name} Specifications
            </h3>
            <button 
              onClick={onClose}
              className="p-1.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-50 rounded-full transition-all cursor-pointer font-sans"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1 no-scrollbar text-xs">
            {/* Physical Location */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-500 font-sans">Property Address & GPS</h4>
              <div className="grid grid-cols-2 gap-3 mt-1 text-zinc-700 dark:text-zinc-300">
                <div className="col-span-2">
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Street Address</span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{building.address || 'Street address missing'}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">City</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{building.city || 'Unspecified'}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Country</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{building.country || 'Unspecified'}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Makani Number</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{building.makaniNumber || 'None'}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Building Floors</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{building.floors} levels</p>
                </div>
              </div>
            </div>

            {/* Management Info */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-500 font-sans">Building Management</h4>
              <div className="grid grid-cols-2 gap-3 mt-1 text-zinc-700 dark:text-zinc-300">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Company name</span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{building.managementCompany || 'Independently Logged'}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Management Email</span>
                  <p className="font-medium break-all text-zinc-950 dark:text-zinc-100 underline decoration-zinc-300 font-sans">{building.managementEmail || 'None'}</p>
                </div>
              </div>
            </div>

            {/* Emergency Services */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-4">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-550 flex items-center gap-1 font-sans">
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                Emergency Contact Dispatch & Utilities
              </h4>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold flex items-center gap-1 font-sans">
                    <Wrench className="w-3.5 h-3.5 text-zinc-400" /> Security Provider
                  </span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{building.securityCompanyName || 'No Security Logged'}</p>
                  <p className="font-mono text-[11px] text-zinc-500">{building.securityCompanyContact || ''}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold flex items-center gap-1 font-sans">
                    <Flame className="w-3.5 h-3.5 text-zinc-400" /> Gas Network Agency
                  </span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{building.gasCompanyName || 'No Gas Agency Logged'}</p>
                  <p className="font-mono text-[11px] text-zinc-500">{building.gasCompanyContact || ''}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold flex items-center gap-1 font-sans">
                    <Wind className="w-3.5 h-3.5 text-zinc-400" /> Cooling Company
                  </span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{building.coolingCompanyName || 'No Cooling Logged'}</p>
                  <p className="font-mono text-[11px] text-zinc-500">{building.coolingCompanyContact || ''}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold flex items-center gap-1 font-sans">
                    <Globe className="w-3.5 h-3.5 text-zinc-400" /> Internet Provider
                  </span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{building.internetProviderName || 'No Internet Logged'}</p>
                  <p className="font-mono text-[11px] text-zinc-500">{building.internetProviderContact || ''}</p>
                </div>
              </div>
            </div>

            {/* Maps Coordinates Section Link */}
            {building.googleMapUrl && (
              <div className="flex items-center justify-between p-3 bg-zinc-900 text-white rounded-2xl">
                <span className="font-semibold text-[10px] uppercase tracking-wider font-sans">GEO LOCATION MAP</span>
                <a 
                  href={building.googleMapUrl} 
                  target="_blank" 
                  rel="noreferrer referrer"
                  className="px-3.5 py-1.5 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl font-bold uppercase text-[9px] flex items-center gap-1.5 font-sans"
                >
                  Open in Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
