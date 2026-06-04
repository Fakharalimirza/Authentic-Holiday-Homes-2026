import React from 'react';
import { 
  Building2, 
  MapPin, 
  Eye, 
  Edit2, 
  Trash2, 
  Info, 
  Mail, 
  Map as MapIcon, 
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

interface BuildingsGridViewProps {
  buildings: BuildingItem[];
  onViewDetails: (bld: BuildingItem) => void;
  onEdit: (bld: BuildingItem) => void;
  onDelete: (bld: BuildingItem) => void;
}

export default function BuildingsGridView({
  buildings,
  onViewDetails,
  onEdit,
  onDelete
}: BuildingsGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 font-sans">
      {buildings.map((bld) => (
        <div 
          key={bld.id}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-101 dark:border-zinc-800 p-5 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            {/* Visual Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-650 dark:text-zinc-350 border border-zinc-100 dark:border-zinc-850">
                  <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-850 dark:text-zinc-100 text-sm max-w-[180px] truncate">
                    {bld.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-zinc-400" />
                    {bld.city || 'City Unspecified'}, {bld.country || 'UAE'}
                  </p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onViewDetails(bld)}
                  className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all cursor-pointer"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(bld)}
                  className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(bld)}
                  className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                  title="Delete profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <hr className="my-4 border-zinc-100 dark:border-zinc-800" />

            {/* Information listing block */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Mgmt: {bld.managementCompany || 'Individual Property'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{bld.managementEmail || 'No management email linked'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                <MapIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Makani: {bld.makaniNumber || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contacts or Floors info summary */}
          <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-xl px-3 py-2.5 mt-4 border border-zinc-100/50 dark:border-zinc-850 flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold select-none">
              Structural Height: {bld.floors} flr{bld.floors > 1 ? 's' : ''}
            </span>
            {bld.googleMapUrl ? (
              <a 
                href={bld.googleMapUrl} 
                target="_blank" 
                rel="noreferrer referrer"
                className="text-[10px] text-zinc-850 dark:text-zinc-300 underline font-medium flex items-center gap-1 hover:text-emerald-600 transition-colors"
                id={`link-maps-grid-${bld.id}`}
              >
                View Map Coordinates <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ) : (
              <span className="text-[9px] text-zinc-405 italic">No GPS coordinates</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
