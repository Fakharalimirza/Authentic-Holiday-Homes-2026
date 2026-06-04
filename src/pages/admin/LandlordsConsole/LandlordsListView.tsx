import React from 'react';
import { User, Mail, Phone, FileText, CreditCard, Eye, Edit2, Trash2 } from 'lucide-react';

interface LandlordItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  identityNumber: string;
  identityDocumentUrl: string | null;
  nationality: string;
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  swiftCode: string;
  iban: string;
  bankBranch: string;
}

interface LandlordsListViewProps {
  landlords: LandlordItem[];
  onViewDetails: (landlord: LandlordItem) => void;
  onEdit: (landlord: LandlordItem) => void;
  onDelete: (landlord: LandlordItem) => void;
  getSecureDocViewUrl: (url: string | null | undefined) => string;
}

export default function LandlordsListView({
  landlords,
  onViewDetails,
  onEdit,
  onDelete,
  getSecureDocViewUrl
}: LandlordsListViewProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-4">Owner Name</th>
              <th className="p-4">Contact Channels</th>
              <th className="p-4">Nationality</th>
              <th className="p-4">Identity Number</th>
              <th className="p-4">Payout Method</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {landlords.map((land) => (
              <tr key={land.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 text-zinc-700 dark:text-zinc-300">
                <td className="p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-550 border border-zinc-100 dark:border-zinc-850">
                      <User className="w-4 h-4 text-zinc-550 dark:text-zinc-400" />
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{land.fullName}</span>
                  </div>
                </td>
                <td className="p-4 space-y-0.5">
                  <p className="flex items-center gap-1.5 text-zinc-850 dark:text-zinc-200">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{land.email}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-zinc-450 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{land.phone || 'Unavailable'}</span>
                  </p>
                </td>
                <td className="p-4">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-655 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                    {land.nationality || 'Unspecified'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] text-zinc-500">{land.identityNumber || 'Unspecified'}</span>
                    {land.identityDocumentUrl && (
                      <a 
                        href={getSecureDocViewUrl(land.identityDocumentUrl)} 
                        target="_blank" 
                        rel="noreferrer referrer"
                        className="inline-flex items-center gap-1 text-[9px] text-emerald-650 dark:text-emerald-400 hover:underline font-extrabold uppercase tracking-wider"
                      >
                        <FileText className="w-2.5 h-2.5" /> View Doc
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                    <div className="text-[11px]">
                      <p className="font-bold text-zinc-850 dark:text-zinc-200">{land.bankName || 'No linked bank accounts'}</p>
                      {land.bankAccountNumber && <p className="text-[9px] text-zinc-400 font-mono">No. {land.bankAccountNumber}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewDetails(land)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(land)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(land)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-855 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
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
