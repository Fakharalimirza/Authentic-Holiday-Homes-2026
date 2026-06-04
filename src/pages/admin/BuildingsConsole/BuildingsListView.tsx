import React from 'react';
import { 
  Building2, 
  Eye, 
  Edit2, 
  Trash2, 
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

interface BuildingsListViewProps {
  buildings: BuildingItem[];
  onViewDetails: (bld: BuildingItem) => void;
  onEdit: (bld: BuildingItem) => void;
  onDelete: (bld: BuildingItem) => void;
}

export default function BuildingsListView({
  buildings,
  onViewDetails,
  onEdit,
  onDelete
}: BuildingsListViewProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-extrabold uppercase tracking-wider">
              <th className="p-3.5 pl-6">Building Name</th>
              <th className="p-3.5">Management Entity</th>
              <th className="p-3.5">City & Country</th>
              <th className="p-3.5">Makani ID</th>
              <th className="p-3.5">Floors</th>
              <th className="p-3.5">Map Pin</th>
              <th className="p-3.5 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((bld) => (
              <tr 
                key={bld.id} 
                className="border-b border-zinc-150/50 dark:border-zinc-800/50 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <td className="p-3.5 pl-6 font-semibold text-zinc-850 dark:text-zinc-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{bld.name}</span>
                  </div>
                </td>
                <td className="p-3.5 text-zinc-500 max-w-[180px] truncate">
                  {bld.managementCompany || 'Independently Configured'}
                </td>
                <td className="p-3.5 text-zinc-505">
                  {bld.city || 'Dubai'}, {bld.country || 'UAE'}
                </td>
                <td className="p-3.5 font-mono text-[11px] text-zinc-400">
                  {bld.makaniNumber || '-'}
                </td>
                <td className="p-3.5 font-medium">{bld.floors || 1} Floors</td>
                <td className="p-3.5">
                  {bld.googleMapUrl ? (
                    <a 
                      href={bld.googleMapUrl} 
                      target="_blank" 
                      rel="noreferrer referrer" 
                      className="text-emerald-600 hover:underline flex items-center gap-0.5"
                    >
                      GPS Map <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-zinc-400 italic">None</span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewDetails(bld)}
                      className="p-1 px-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300 font-semibold text-[11px] rounded-lg border border-zinc-150 dark:border-zinc-800 transition-all cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onEdit(bld)}
                      className="p-1 px-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300 font-semibold text-[11px] rounded-lg border border-zinc-150 dark:border-zinc-800 transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(bld)}
                      className="p-1 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-955/10 text-red-650 rounded-lg border border-red-104 dark:border-red-900/30 font-semibold text-[11px] transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
