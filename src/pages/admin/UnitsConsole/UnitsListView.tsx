import React from 'react';
import { Key, Building2, Users, BedDouble, Bath, FileText, Eye, Edit2, Trash2 } from 'lucide-react';
import { UnitItem, BuildingItem, LandlordItem } from '../types';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';

interface UnitsListViewProps {
  units: UnitItem[];
  buildings: BuildingItem[];
  landlords: LandlordItem[];
  onViewDetails: (unit: UnitItem) => void;
  onEdit: (unit: UnitItem) => void;
  onDelete: (unit: UnitItem) => void;
}

export default function UnitsListView({
  units,
  buildings,
  landlords,
  onViewDetails,
  onEdit,
  onDelete
}: UnitsListViewProps) {
  const { formatPrice } = useGlobalSettings();

  const getBuildingName = (buildingId: string) => {
    const bld = buildings.find(b => b.id === buildingId);
    return bld ? bld.name : 'Unknown Building';
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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto font-sans">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-extrabold uppercase tracking-widest text-[9px]">
              <th className="p-4">Unit / Suite</th>
              <th className="p-4">Building</th>
              <th className="p-4">Landlord</th>
              <th className="p-4 font-sans">Config / Specs</th>
              <th className="p-4 font-sans text-center">Price / mo</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 flex-1">
            {units.map((unit) => {
              const buildingName = getBuildingName(unit.buildingId);
              const landlordName = getLandlordName(unit.landlordId);
              const landlordEmail = getLandlordEmail(unit.landlordId);

              const statusStyle = {
                Vacant: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400',
                Occupied: 'bg-blue-50 text-blue-700 border-blue-101 dark:bg-blue-955/20 dark:text-blue-400',
                Maintenance: 'bg-amber-50 text-amber-700 border-amber-101 dark:bg-amber-955/20 dark:text-amber-400',
                Blocked: 'bg-zinc-100 text-zinc-650 border-zinc-201 dark:bg-zinc-805/40 dark:text-zinc-400'
              }[unit.status] || 'bg-zinc-50 text-zinc-600';

              return (
                <tr key={unit.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 text-zinc-700 dark:text-zinc-300">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-100 dark:border-zinc-850">
                        <Key className="w-4 h-4 text-zinc-550" />
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">Unit {unit.unitNumber}</span>
                    </div>
                  </td>
                  <td className="p-4 truncate max-w-[150px]">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-850 dark:text-zinc-200">{buildingName || 'Unassigned Building'}</span>
                    </div>
                  </td>
                  <td className="p-4 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-bold text-zinc-850 dark:text-zinc-200 truncate max-w-[150px]">{landlordName || 'Individual landlord'}</span>
                    </div>
                    {landlordEmail && (
                      <p className="text-[10px] text-zinc-400 pl-4">{landlordEmail}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-[11px] text-zinc-650 dark:text-zinc-400 font-sans">
                      <span className="flex items-center gap-0.5"><BedDouble className="w-3.5 h-3.5 text-zinc-400" /> {unit.bedrooms} BR</span>
                      <span className="flex items-center gap-0.5"><Bath className="w-3.5 h-3.5 text-zinc-400" /> {unit.bathrooms} BA</span>
                      <span>{unit.size?.toLocaleString()} sqft</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100 font-sans text-center">
                    {unit.price > 0 ? formatPrice(unit.price) : 'Not Configured'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${statusStyle}`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {unit.titleDeedUrl ? (
                        <a 
                          href={getSecureDocViewUrl(unit.titleDeedUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-zinc-50 dark:bg-zinc-805 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-750 transition-all"
                          title="View Title Deed Document"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                        </a>
                      ) : null}
                      {unit.permitDocUrl ? (
                        <a 
                          href={getSecureDocViewUrl(unit.permitDocUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-zinc-50 dark:bg-zinc-805 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-750 transition-all"
                          title="View DTCM Permit Document"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
                        </a>
                      ) : null}
                      
                      <button
                        onClick={() => onViewDetails(unit)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 rounded-lg transition-all cursor-pointer"
                        title="View Unit Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(unit)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-555 hover:text-zinc-750 dark:hover:text-zinc-200 rounded-lg transition-all cursor-pointer"
                        title="Edit Unit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(unit)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
