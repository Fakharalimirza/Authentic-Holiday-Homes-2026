import React from 'react';
import { Key, Building2, Users, BedDouble, Bath, Maximize2, Percent, FileText, Eye, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { UnitItem, BuildingItem, LandlordItem } from '../types';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';

interface UnitsGridViewProps {
  units: UnitItem[];
  buildings: BuildingItem[];
  landlords: LandlordItem[];
  onCreateListing?: (unit: UnitItem, buildingName: string, buildingAddress: string) => void;
  onViewDetails: (unit: UnitItem) => void;
  onEdit: (unit: UnitItem) => void;
  onDelete: (unit: UnitItem) => void;
}

export default function UnitsGridView({
  units,
  buildings,
  landlords,
  onCreateListing,
  onViewDetails,
  onEdit,
  onDelete
}: UnitsGridViewProps) {
  const { formatPrice } = useGlobalSettings();

  const getBuildingName = (buildingId: string) => {
    const bld = buildings.find(b => b.id === buildingId);
    return bld ? bld.name : 'Unknown Building';
  };

  const getBuildingAddress = (buildingId: string) => {
    const bld = buildings.find(b => b.id === buildingId);
    return bld ? bld.address || '' : '';
  };

  const getLandlordName = (landlordId?: string | null) => {
    if (!landlordId) return 'No landlord assigned';
    const land = landlords.find(l => l.id === landlordId);
    return land ? land.fullName : 'Unknown Owner';
  };

  const getLandlordEmail = (landlordId?: string | null) => {
    if (!landlordId) return '';
    const land = landlords.find(l => l.id === landlordId);
    return land ? land.email : '';
  };

  const getSecureDocViewUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.includes('/api/admin/view-document')) return url;
    const token = localStorage.getItem('ahh_token') || '';
    return `${window.location.origin}/api/admin/view-document?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {units.map((unit) => {
        const buildingName = getBuildingName(unit.buildingId);
        const buildingAddress = getBuildingAddress(unit.buildingId);
        const landlordName = getLandlordName(unit.landlordId);

        const statusStyle = {
          Vacant: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30',
          Occupied: 'bg-blue-50 text-blue-700 border-blue-101 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30',
          Maintenance: 'bg-amber-50 text-amber-700 border-amber-101 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30',
          Blocked: 'bg-zinc-100 text-zinc-650 border-zinc-201 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/30'
        }[unit.status] || 'bg-zinc-50 text-zinc-600';

        return (
          <div 
            key={unit.id}
            id={`unit-card-${unit.id}`}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-805 p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4 font-sans"
          >
            <div>
              {/* Status pills + unit action flags */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${statusStyle}`}>
                    {unit.status}
                  </span>
                  {unit.unitType && (
                    <span className="bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-400 px-2 py-0.5 text-[9px] font-bold rounded-md border border-zinc-100 dark:border-zinc-800">
                      {unit.unitType}
                    </span>
                  )}
                </div>

                {/* Create listing shortcut */}
                {onCreateListing && (
                  <button
                    onClick={() => onCreateListing(unit, buildingName, buildingAddress)}
                    className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                    title="Draft Booking Listing with stored data metrics"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Create Listing
                  </button>
                )}
              </div>

              {/* Detail headers */}
              <div className="mt-3 flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-105 dark:bg-zinc-955 flex items-center justify-center text-zinc-650 border border-zinc-200/50 dark:border-zinc-800">
                  <Key className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-sm leading-tight">
                    Unit {unit.unitNumber}
                  </h3>
                  <p className="text-[10px] text-zinc-405 dark:text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                    <Building2 className="w-3 h-3 shrink-0" />
                    {buildingName}
                  </p>
                  <p className="text-[10px] text-zinc-550 dark:text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                    <Users className="w-3 h-3 shrink-0" />
                    Owner: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{landlordName}</span>
                  </p>
                </div>
              </div>

              {/* BENTO GRID OF ATTRIBUTES */}
              <div className="mt-4 grid grid-cols-2 gap-2 bg-zinc-50/70 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-850 text-[10px] font-medium text-zinc-550 dark:text-zinc-400">
                <div className="flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5" />
                  <span>{unit.bathrooms} {unit.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{unit.size?.toLocaleString() || '0'} SqFt</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cap: {unit.guestCapacity || 2} Guests</span>
                </div>
              </div>

              {/* Utility Records */}
              <div className="mt-3 p-2 bg-zinc-105/20 dark:bg-zinc-950/10 rounded-xl border border-zinc-100 dark:border-zinc-800/80 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-bold uppercase text-[8px]">DEWA Premises Code:</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-300">{unit.dewaPremisesNumber || 'Not Logged'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-bold uppercase text-[8px]">Internet Provider:</span>
                  <span className="text-zinc-850 dark:text-zinc-300">{unit.internetProvider || 'Unassigned'}</span>
                </div>
              </div>

              {/* Rent Fee & Commission Details */}
              <div className="mt-3.5 space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Base Rate:</span>
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">
                    {unit.price > 0 ? formatPrice(unit.price) + ' / mo' : 'Not Configured'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-zinc-450 dark:text-zinc-400">
                  <span className="flex items-center gap-0.5 font-semibold text-zinc-400 uppercase text-[9px]">Management Comm:</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-150">{unit.mgmtCommission !== undefined ? unit.mgmtCommission : 15}%</span>
                </div>

                {unit.permitNumber && (
                   <div className="pt-1.5 flex items-center justify-between text-[10px] border-t border-dashed border-zinc-100 dark:border-zinc-800">
                     <span className="text-zinc-400 font-semibold uppercase text-[8px]">DTCM Permit code:</span>
                     <span className="font-mono bg-zinc-100 dark:bg-zinc-950 px-1 rounded text-zinc-700 dark:text-zinc-450">{unit.permitNumber}</span>
                   </div>
                )}
              </div>
            </div>

            {/* Edit / Trash Actions */}
            <div className="flex xl:flex-row flex-col xl:items-center justify-between gap-2.5 pt-2 border-t border-zinc-105 dark:border-zinc-800/60 text-[10.5px]">
              <div className="flex flex-wrap gap-1.5 max-w-[170px]">
                {unit.titleDeedUrl ? (
                  <a 
                    href={getSecureDocViewUrl(unit.titleDeedUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-705 dark:text-zinc-250 border border-zinc-200 dark:border-zinc-750 rounded-md font-bold uppercase text-[8px] transition-all"
                    title="View Stored Title Deed File"
                  >
                    <FileText className="w-2.5 h-2.5" /> Deed
                  </a>
                ) : null}
                {unit.permitDocUrl ? (
                  <a 
                    href={getSecureDocViewUrl(unit.permitDocUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-755 dark:text-zinc-250 border border-zinc-200 dark:border-zinc-750 rounded-md font-bold uppercase text-[8px] transition-all"
                    title="View DTCM Permit File"
                  >
                    <FileText className="w-2.5 h-2.5" /> Permit
                  </a>
                ) : null}
                {!unit.titleDeedUrl && !unit.permitDocUrl && (
                  <span className="text-[10px] text-zinc-400 italic">No attachments</span>
                )}
              </div>
              
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => onViewDetails(unit)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-350 rounded-lg transition-all cursor-pointer"
                  title="View Full Unit Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(unit)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-755 dark:hover:text-zinc-200 rounded-lg transition-all cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(unit)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                  title="Delete profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
