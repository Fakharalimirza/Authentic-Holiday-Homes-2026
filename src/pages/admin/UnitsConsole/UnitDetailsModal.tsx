import React from 'react';
import { X, Key, BedDouble, Bath, Maximize2, Users, Folder } from 'lucide-react';
import { UnitItem, BuildingItem, LandlordItem } from '../types';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';

interface UnitDetailsModalProps {
  unit: UnitItem;
  buildings: BuildingItem[];
  landlords: LandlordItem[];
  onClose: () => void;
}

export default function UnitDetailsModal({
  unit: u,
  buildings,
  landlords,
  onClose
}: UnitDetailsModalProps) {
  const { formatPrice } = useGlobalSettings();

  const getSecureDocViewUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.includes('/api/admin/view-document')) return url;
    const token = localStorage.getItem('ahh_token') || '';
    return `${window.location.origin}/api/admin/view-document?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`;
  };

  const buildingName = buildings.find(b => b.id === u.buildingId)?.name || 'Unassigned Building';
  const buildingAddress = buildings.find(b => b.id === u.buildingId)?.address || '';
  const landlordName = landlords.find(l => l.id === u.landlordId)?.fullName || 'Individual owner';
  const landlordEmail = landlords.find(l => l.id === u.landlordId)?.email || '';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-955/65 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-805 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Modal sticky head */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-100 dark:border-zinc-850">
              <Key className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50 leading-tight">
                Unit {u.unitNumber} Details
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium">Unique ID: {u.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200 rounded-full transition-all border border-zinc-100 dark:border-zinc-855"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content body */}
        <div className="p-6 space-y-5 overflow-y-auto no-scrollbar text-xs">
          
          {/* 1. Category and Metadata Summary */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-955/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-widest">Building Location</span>
              <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{buildingName}</p>
              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 block truncate mt-0.5">{buildingAddress || 'No Address Logged'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-widest">Landlord Owner</span>
              <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{landlordName}</p>
              <span className="text-[10px] text-zinc-455 dark:text-zinc-500 block truncate mt-0.5">{landlordEmail || 'No Email Logged'}</span>
            </div>
          </div>

          {/* 2. Bento Attributes Grid */}
          <div>
            <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-400 mb-2">Specifications & Layout</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-zinc-50/55 dark:bg-zinc-955/35 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-1">
                <span className="text-zinc-450 dark:text-zinc-400 uppercase text-[8px] font-bold block">Bedrooms</span>
                <p className="font-extrabold text-sm text-zinc-800 dark:text-zinc-150 flex items-center gap-1">
                  <BedDouble className="w-4 h-4 text-zinc-400" /> {u.bedrooms}
                </p>
              </div>
              <div className="p-3 bg-zinc-50/55 dark:bg-zinc-955/35 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-1">
                <span className="text-zinc-450 dark:text-zinc-400 uppercase text-[8px] font-bold block">Bathrooms</span>
                <p className="font-extrabold text-sm text-zinc-800 dark:text-zinc-150 flex items-center gap-1">
                  <Bath className="w-4 h-4 text-zinc-400" /> {u.bathrooms}
                </p>
              </div>
              <div className="p-3 bg-zinc-50/55 dark:bg-zinc-955/35 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-1">
                <span className="text-zinc-455 dark:text-zinc-400 uppercase text-[8px] font-bold block">Physical Size</span>
                <p className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1">
                  <Maximize2 className="w-4 h-4 text-zinc-400" /> {u.size?.toLocaleString() || '0'} SqFt
                </p>
              </div>
              <div className="p-3 bg-zinc-50/55 dark:bg-zinc-955/35 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-1">
                <span className="text-zinc-455 dark:text-zinc-400 uppercase text-[8px] font-bold block">Capacity</span>
                <p className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1">
                  <Users className="w-4 h-4 text-zinc-400" /> {u.guestCapacity || 2} Pax
                </p>
              </div>
            </div>
          </div>

          {/* 3. Operational & Commercial Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payout & Fees */}
            <div className="p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 space-y-2">
              <h5 className="font-bold text-[9px] tracking-wider uppercase text-zinc-400">Billing & Commercials</h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-450">Base Monthly Rate:</span>
                  <span className="font-black text-zinc-850 dark:text-zinc-50">{u.price > 0 ? formatPrice(u.price) : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-455">Furnishing Style:</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{u.furnishing || 'Furnished'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-455">Commission Share:</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{u.mgmtCommission !== undefined ? u.mgmtCommission : 15}%</span>
                </div>
              </div>
            </div>

            {/* Utilities & Smart Access */}
            <div className="p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 space-y-2">
              <h5 className="font-bold text-[9px] tracking-wider uppercase text-zinc-400">Utilities & Accounts</h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-450">Premises DEWA:</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-350 font-bold">{u.dewaPremisesNumber || 'Not Logged'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-450">Internet Provider:</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{u.internetProvider || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-450">DTCM Permit Code:</span>
                  <span className="font-mono font-bold text-xs text-zinc-800 dark:text-zinc-200">{u.permitNumber || 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Secure Vault Attachments Viewer */}
          <div className="p-4 bg-zinc-950 text-white rounded-2xl space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-black text-[9px] uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-zinc-400" /> Registered Secure Documents
              </span>
              <span className="text-[8px] uppercase tracking-wider bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">2-Step Encrypted Link</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Title Deed */}
              <div className="p-3 bg-zinc-905 border border-zinc-855 rounded-xl flex flex-col justify-between gap-2.5">
                <div>
                  <span className="text-zinc-400 text-[8px] font-extrabold uppercase tracking-widest">TITLE DEED CERTIFICATE</span>
                  <p className="text-[10px] text-zinc-300 mt-0.5 font-medium truncate" title="Stored_Title_Deed.pdf">
                    {u.titleDeedUrl ? 'Stored_Title_Deed.pdf' : 'Not uploaded/found'}
                  </p>
                </div>
                {u.titleDeedUrl ? (
                  <a 
                    href={getSecureDocViewUrl(u.titleDeedUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1 transition-all"
                  >
                    <Maximize2 className="w-3 h-3" /> View Title Deed
                  </a>
                ) : (
                  <span className="text-[9px] text-zinc-550 italic block text-center py-1 bg-zinc-950 rounded-lg border border-zinc-850/50">Unavailable</span>
                )}
              </div>

              {/* DTCM Permit */}
              <div className="p-3 bg-zinc-905 border border-zinc-855 rounded-xl flex flex-col justify-between gap-2.5">
                <div>
                  <span className="text-zinc-400 text-[8px] font-extrabold uppercase tracking-widest">DTCM HOLIDAY HOME PERMIT</span>
                  <p className="text-[10px] text-zinc-300 mt-0.5 font-medium truncate" title="Stored_Permit_Doc.pdf">
                    {u.permitDocUrl ? 'Stored_Permit_Doc.pdf' : 'Not uploaded/found'}
                  </p>
                </div>
                {u.permitDocUrl ? (
                  <a 
                    href={getSecureDocViewUrl(u.permitDocUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1 transition-all"
                  >
                    <Maximize2 className="w-3 h-3" /> View Permit Doc
                  </a>
                ) : (
                  <span className="text-[9px] text-zinc-550 italic block text-center py-1 bg-zinc-950 rounded-lg border border-zinc-850/50">Unavailable</span>
                )}
              </div>
            </div>
          </div>

          {/* 5. Notes */}
          {u.notes && (
            <div className="space-y-1 bg-zinc-50/55 dark:bg-zinc-955/20 p-3.5 border border-zinc-100 dark:border-zinc-850 rounded-xl text-xs">
              <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-widest">Unit Description / Internal Notes</span>
              <p className="text-zinc-700 dark:text-zinc-300 italic whitespace-pre-wrap leading-relaxed">{u.notes}</p>
            </div>
          )}
        </div>

        {/* Modal sticky foot */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end bg-zinc-50 dark:bg-zinc-950/40">
          <button
            type="button"
            id="dismiss-unit-overview"
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 border border-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            Dismiss Overview
          </button>
        </div>
      </div>
    </div>
  );
}
